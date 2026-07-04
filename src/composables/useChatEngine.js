import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { coachTurn, roleplayTurn, reFeedback, getHint, getIdea, translateToVi } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { speak, canSpeak } from '@/lib/speak'
import { canListen, createRecognizer } from '@/lib/listen'
import { cardsFromTerms } from '@/data/tools'
import { useUserStore } from '@/stores/user'

// —— Danh sách phong cách lời phê (khớp PERSONAS ở backend _llm.js) ——
export const PERSONAS = [
  { key: 'cotnha', label: '😜 Cợt nhả', desc: 'Lầy lội, cà khịa hết cỡ' },
  { key: 'chuiboi', label: '🔥 Chửi bới', desc: 'Chửi yêu, drama hết nấc' },
  { key: 'gaubong', label: '🧸 Gấu bông', desc: 'Ấm áp, động viên' },
  { key: 'nghiemtuc', label: '🎓 Nghiêm túc', desc: 'Giáo viên thẳng thắn' },
]

// —— "Tình huống bất ngờ" (Surprise mode) — mở khóa từ Tuần 4 ——
// AI đóng vai 1 kịch bản ngẫu nhiên, chủ động đổi đề tài giữa chừng, người học
// không biết trước câu hỏi kế tiếp (xem netlify/functions/_llm.js buildRoleplayPrompt).
const ROLEPLAY_UNLOCK_WEEK = 4
const SCENARIOS = [
  {
    key: 'customer',
    label: '😠 Khách hàng khó tính',
    brief: 'You are a demanding, impatient customer complaining about a product or service the learner is helping with. Stay in character.',
  },
  {
    key: 'stranger',
    label: '🏃 Người hỏi đường vội',
    brief: 'You are a stranger in a hurry asking the learner for directions or quick help, then suddenly need something different than what you first asked.',
  },
  {
    key: 'coworker',
    label: '🧐 Đồng nghiệp hỏi vặn',
    brief: 'You are a skeptical coworker checking on the status of a work task, pushing back with follow-up questions and doubts.',
  },
  {
    key: 'interviewer',
    label: '🎙️ Người phỏng vấn',
    brief: 'You are a job interviewer asking the learner unexpected follow-up questions about their experience and skills.',
  },
]

const ANSWER_SECONDS = 10

/**
 * Toàn bộ state phiên chat + gọi API/lịch sử/retry — tách khỏi AiChat.vue để
 * component chỉ còn lo layout. ChatMessages.vue tự quản lý việc tra/lưu từ khi
 * bấm vào tin nhắn; ChatComposer.vue chỉ lo ô nhập/mic. Cả hai nhận state cần
 * thiết qua props từ AiChat.vue (nơi gọi hàm này).
 */
export function useChatEngine(props) {
  const user = useUserStore()

  // —— Trạng thái phiên ——
  const messages = ref([])
  const input = ref('')
  const loading = ref(false)
  const error = ref('')
  const retry = ref(null) // hàm thử lại lượt vừa lỗi, null khi không có gì để thử lại
  const autoSpeak = ref(true)
  const listening = ref(false)
  const savedToast = ref('')
  let toastTimer = null

  // —— Voice-first: mặc định tự bật mic sau mỗi lượt AI, đếm ngược 10s để ép phản
  // xạ (không kịp soạn câu trước trong đầu). Gõ chữ vẫn dùng được — chỉ là fallback.
  const voiceFirst = ref(true)
  const answerTimer = ref(0)
  let answerTimerId = null

  function clearAnswerTimer() {
    if (answerTimerId) {
      clearInterval(answerTimerId)
      answerTimerId = null
    }
    answerTimer.value = 0
  }

  // Phong cách lời phê — nhớ lần chọn gần nhất (lưu local).
  const persona = ref(user.convoPrefs.persona || 'cotnha')
  function setPersona(key) {
    persona.value = key
    user.setConvoPrefs({ persona: key })
  }

  const speakable = canSpeak()
  const listenable = canListen()
  let recognizer = null
  let micStartedAt = 0 // mốc thời gian mic bật — đo số giây đã NÓI để tính streak nói

  // Bộ từ của bài (để gợi ý người học dùng trong câu trả lời).
  const vocab = computed(() => (props.context?.vocab || []).filter(Boolean))

  // —— Tình huống bất ngờ (Surprise mode) ——
  const unlockedRoleplay = computed(() => Number(props.context?.week || 0) >= ROLEPLAY_UNLOCK_WEEK)
  const roleplayOn = ref(false)
  const currentScenario = ref(null)

  // Ngữ cảnh gửi lên backend.
  const chatContext = computed(() => ({
    title: props.context?.title,
    week: props.context?.week,
    weekTitle: props.context?.weekTitle,
    grammar: props.context?.grammar || [],
    vocab: vocab.value,
    exam: props.context?.exam || 'none',
    suggestWords: true,
    scenario: roleplayOn.value ? currentScenario.value?.brief : undefined,
  }))

  // Câu mở đầu tĩnh (không tốn quota) — chỉ dùng cho chế độ luyện thường.
  const opener = computed(() => {
    const topic = props.context?.title ? props.context.title : 'today’s topic'
    return `Hi there! 👋 Let's practise English about ${topic}. Tell me about your day or ask me anything to get started.`
  })

  // Vào chat ngay: hiện câu mở đầu + gợi ý vài từ của bài (không còn màn thiết lập).
  function initSession() {
    messages.value = [
      { role: 'assistant', message: opener.value, suggestedWords: vocab.value.slice(0, 3), ui: reactive({}) },
    ]
    input.value = ''
    error.value = ''
  }

  // Surprise mode: KHÔNG hiện câu mở đầu tĩnh — để AI tự mở màn trong vai diễn
  // (gọi ngay 1 lượt roleplay với lịch sử rỗng, giống quy tắc "evaluation: null"
  // của coach khi người học chưa viết gì).
  async function startRoleplaySession() {
    currentScenario.value = currentScenario.value || SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
    messages.value = []
    input.value = ''
    error.value = ''
    retry.value = null
    loading.value = true
    try {
      const { next } = await roleplayTurn({ messages: [], context: chatContext.value, persona: persona.value })
      messages.value.push({
        role: 'assistant',
        message: next?.message || '…',
        suggestedWords: Array.isArray(next?.suggestedWords) ? next.suggestedWords.slice(0, 3) : [],
        ui: reactive({}),
      })
      if (autoSpeak.value) speak(next?.message || '')
      maybeAutoListen()
    } catch (e) {
      error.value = friendlyAiError(e).message
      retry.value = () => {
        roleplayOn.value = true
        startRoleplaySession()
      }
      roleplayOn.value = false
    } finally {
      loading.value = false
    }
  }

  function toggleRoleplay() {
    if (!unlockedRoleplay.value) return
    roleplayOn.value = !roleplayOn.value
    if (roleplayOn.value) startRoleplaySession()
    else initSession()
  }

  onMounted(initSession)
  onUnmounted(clearAnswerTimer)

  // Lịch sử gọn để gửi backend: assistant -> message, user -> text.
  function historyFor(upto = messages.value.length) {
    return messages.value.slice(0, upto).map((m) =>
      m.role === 'assistant' ? { role: 'assistant', text: m.message } : { role: 'user', text: m.text },
    )
  }

  async function send() {
    const text = input.value.trim()
    if (!text || loading.value) return
    clearAnswerTimer()
    error.value = ''
    retry.value = null
    const userEntry = reactive({ role: 'user', text, evaluation: null, persona: persona.value, evaluating: true })
    messages.value.push(userEntry)
    input.value = ''
    await sendTurn(userEntry)
  }

  // Tách riêng để "Thử lại" gọi lại đúng lượt vừa lỗi mà KHÔNG đẩy thêm bong bóng
  // chat mới hay mất câu người học vừa gõ (câu đã nằm sẵn trong userEntry).
  async function sendTurn(userEntry) {
    loading.value = true
    try {
      const turn = roleplayOn.value ? roleplayTurn : coachTurn
      const { evaluation, next } = await turn({
        messages: historyFor(),
        context: chatContext.value,
        persona: persona.value,
      })
      userEntry.evaluation = evaluation || null
      userEntry.evaluating = false
      const aiEntry = {
        role: 'assistant',
        message: next?.message || '…',
        suggestedWords: Array.isArray(next?.suggestedWords) ? next.suggestedWords.slice(0, 3) : [],
        ui: reactive({}),
      }
      messages.value.push(aiEntry)
      if (autoSpeak.value) speak(aiEntry.message)
      maybeAutoListen()
      error.value = ''
      retry.value = null
    } catch (e) {
      userEntry.evaluating = false
      error.value = friendlyAiError(e).message
      retry.value = () => sendTurn(userEntry)
    } finally {
      loading.value = false
    }
  }

  // —— Đổi phong cách lời phê & chấm lại tại chỗ ——
  async function changePersona(userEntry, key) {
    if (userEntry.reEvaluating || userEntry.persona === key) {
      persona.value = key
      user.setConvoPrefs({ persona: key })
      return
    }
    persona.value = key
    user.setConvoPrefs({ persona: key })
    const idx = messages.value.indexOf(userEntry)
    if (idx === -1) return
    userEntry.reEvaluating = true
    try {
      const evaluation = await reFeedback({
        messages: historyFor(idx + 1),
        context: chatContext.value,
        persona: key,
      })
      if (evaluation) userEntry.evaluation = evaluation
      userEntry.persona = key
    } catch (e) {
      flashToast('⚠️ ' + friendlyAiError(e).message)
    } finally {
      userEntry.reEvaluating = false
    }
  }

  // —— Nút trợ giúp dưới mỗi lượt của AI ——
  async function showHint(m) {
    if (m.ui.hint || m.ui.hintLoading) {
      m.ui.showHint = !m.ui.showHint
      return
    }
    m.ui.hintLoading = true
    try {
      m.ui.hint = await getHint(m.message, chatContext.value)
      m.ui.showHint = true
    } catch (e) {
      m.ui.hint = friendlyAiError(e).message
      m.ui.showHint = true
    } finally {
      m.ui.hintLoading = false
    }
  }
  async function showIdea(m) {
    if (m.ui.idea || m.ui.ideaLoading) {
      m.ui.showIdea = !m.ui.showIdea
      return
    }
    m.ui.ideaLoading = true
    try {
      m.ui.idea = await getIdea(m.message, chatContext.value)
      m.ui.showIdea = true
    } catch (e) {
      m.ui.idea = friendlyAiError(e).message
      m.ui.showIdea = true
    } finally {
      m.ui.ideaLoading = false
    }
  }
  async function showTranslation(m) {
    if (m.ui.vi || m.ui.viLoading) {
      m.ui.showVi = !m.ui.showVi
      return
    }
    m.ui.viLoading = true
    try {
      m.ui.vi = await translateToVi(m.message)
      m.ui.showVi = true
    } catch (e) {
      m.ui.vi = friendlyAiError(e).message
      m.ui.showVi = true
    } finally {
      m.ui.viLoading = false
    }
  }

  function replay(text) {
    speak(text)
  }

  function useIdeaAsAnswer(text) {
    input.value = text
  }

  function flashToast(msg) {
    savedToast.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (savedToast.value = ''), 1800)
  }

  // Lưu cả câu (dịch sang tiếng Việt làm mặt sau flashcard).
  const savingSentence = ref('')
  async function saveSentence(text) {
    const s = String(text || '').trim()
    if (!s) return
    if (user.isWordSaved(s)) {
      user.removeSavedWord(s)
      flashToast('Đã bỏ câu')
      return
    }
    if (savingSentence.value) return
    savingSentence.value = s
    try {
      const vi = await translateToVi(s)
      const base = cardsFromTerms([s], 'saved')[0]
      user.saveWord({ ...base, vi, cat: 'Câu', kind: 'sentence' })
      flashToast('✓ Đã lưu câu')
    } catch {
      flashToast('⚠️ Không dịch được, thử lại nhé')
    } finally {
      savingSentence.value = ''
    }
  }

  function toggleMic() {
    if (!listenable) return
    if (listening.value) {
      clearAnswerTimer()
      recognizer?.stop()
      return
    }
    recognizer = createRecognizer({
      lang: 'en-US',
      onResult: ({ final, interim }) => {
        input.value = final || interim
      },
      onError: (err) => {
        clearAnswerTimer()
        error.value =
          err === 'not-allowed'
            ? 'Trình duyệt chưa cho phép dùng micro. Hãy bật quyền micro rồi thử lại.'
            : `Không nghe được (${err}).`
        listening.value = false
      },
      onEnd: (finalText) => {
        clearAnswerTimer()
        listening.value = false
        if (micStartedAt) user.logSpeakingSeconds((Date.now() - micStartedAt) / 1000)
        micStartedAt = 0
        if (finalText) send()
      },
    })
    if (!recognizer) return
    error.value = ''
    listening.value = true
    micStartedAt = Date.now()
    recognizer.start()
  }

  // Sau mỗi lượt AI, tự bật mic + đếm ngược 10s (voice-first). Người học vẫn có
  // thể tắt mic giữa chừng hoặc gõ chữ — đây chỉ là mặc định để ép phản xạ nói ngay.
  function maybeAutoListen() {
    if (!voiceFirst.value || !listenable || listening.value) return
    toggleMic()
    if (!listening.value) return
    answerTimer.value = ANSWER_SECONDS
    answerTimerId = setInterval(() => {
      answerTimer.value -= 1
      if (answerTimer.value <= 0) {
        clearAnswerTimer()
        if (listening.value) recognizer?.stop()
      }
    }, 1000)
  }

  function toggleVoiceFirst() {
    voiceFirst.value = !voiceFirst.value
    if (!voiceFirst.value) {
      clearAnswerTimer()
      if (listening.value) recognizer?.stop()
    }
  }

  function reset() {
    if (roleplayOn.value) {
      startRoleplaySession()
    } else {
      initSession()
      maybeAutoListen()
    }
  }

  // Đổi bài học thì làm mới phiên (tắt luôn Surprise mode — kịch bản cũ không còn hợp).
  watch(
    () => props.context?.title,
    () => {
      roleplayOn.value = false
      currentScenario.value = null
      initSession()
    },
  )

  return {
    messages,
    input,
    loading,
    error,
    retry,
    autoSpeak,
    listening,
    savedToast,
    voiceFirst,
    answerTimer,
    persona,
    setPersona,
    speakable,
    listenable,
    unlockedRoleplay,
    roleplayOn,
    currentScenario,
    toggleRoleplay,
    send,
    changePersona,
    showHint,
    showIdea,
    showTranslation,
    replay,
    useIdeaAsAnswer,
    flashToast,
    savingSentence,
    saveSentence,
    toggleMic,
    toggleVoiceFirst,
    reset,
  }
}
