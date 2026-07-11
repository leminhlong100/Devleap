import { ref, computed, reactive, watch, onMounted } from 'vue'
import { coachTurn, roleplayTurn, debriefTurn, reFeedback, getHint, getIdea, translateToVi } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { speak, canSpeak } from '@/lib/speak'
import { canListen, createRecognizer } from '@/lib/listen'
import { cardsFromTerms } from '@/data/tools'
import { countWords, computeWpm, summarizeFluency } from '@/lib/fluencyStats'
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

// Chủ đề mặc định gom "cụm nâng cấp" lưu ở debrief -> học lại qua Flashcard (SRS).
const COMM_SAVE_TOPIC = 'Giao tiếp thực chiến'
// Debrief chỉ gửi tối đa số lượt cuối này lên backend (roleplay dài -> tiết kiệm quota).
const DEBRIEF_MAX_TURNS = 24

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


  // Phong cách lời phê — nhớ lần chọn gần nhất (lưu local). Khóa comm dùng persona
  // RIÊNG (mặc định 'gaubong' — ấm áp, hạ lo âu; kế hoạch "Nói Tự Tin" Trục D),
  // tách khỏi persona khóa Nền Tảng để không "lây" giọng roast qua người mới ngại nói.
  const commInit = !!props.context?.fixedScenario
  const persona = ref(commInit ? user.convoPrefs.commPersona || 'gaubong' : user.convoPrefs.persona || 'cotnha')
  function savePersonaPref(key) {
    user.setConvoPrefs(commInit ? { commPersona: key } : { persona: key })
  }
  function setPersona(key) {
    persona.value = key
    savePersonaPref(key)
  }

  const speakable = canSpeak()
  const listenable = canListen()
  let recognizer = null
  let micStartedAt = 0 // mốc thời gian mic bật — đo số giây đã NÓI để tính streak nói
  let micFirstSpeechAt = 0 // mốc bật ra tiếng đầu tiên — đo độ trễ phản hồi (latency)

  // Khóa comm nhận diện qua fixedScenario -> bật thang đồng hồ trượt + đo trôi chảy.
  const isComm = computed(() => !!props.context?.fixedScenario)
  // "Communicate now, correct later" (Trục D): mặc định BẬT cho comm -> AI KHÔNG
  // soi từng câu (evaluation: null), chỉ đối thoại; dồn toàn bộ chấm-sửa vào debrief
  // cuối buổi. Người học giữ được dòng chảy + bớt lo âu. Tắt được để "vừa nói vừa soi".
  const deferCorrection = ref(commInit)
  function toggleDeferCorrection() {
    deferCorrection.value = !deferCorrection.value
  }
  // —— Trôi chảy (Trục B): gom WPM + độ trễ mỗi lượt nói bằng mic ——
  const fluencySamples = ref([]) // [{ wpm, latency }]
  const fluency = computed(() => summarizeFluency(fluencySamples.value))

  // Bộ từ của bài (để gợi ý người học dùng trong câu trả lời).
  const vocab = computed(() => (props.context?.vocab || []).filter(Boolean))

  // —— Tình huống bất ngờ (Surprise mode) ——
  // Khóa "Giao Tiếp Thực Chiến" truyền vào một KỊCH BẢN CỐ ĐỊNH của buổi
  // (context.fixedScenario = { key, label, brief, twist… }): roleplay là trục mỗi
  // buổi nên mở khóa ngay từ buổi 1 (không đợi Tuần 4) và tự vào vai đúng kịch bản
  // thay vì bốc ngẫu nhiên. Khóa IELTS không truyền -> giữ nguyên Surprise mode cũ.
  const fixedScenario = computed(() => props.context?.fixedScenario || null)
  const unlockedRoleplay = computed(
    () => !!fixedScenario.value || Number(props.context?.week || 0) >= ROLEPLAY_UNLOCK_WEEK,
  )
  const roleplayOn = ref(false)
  const currentScenario = ref(null)

  // —— Debrief cuối buổi (khóa comm): tổng kết theo rubric -> lưu chiến lợi phẩm ——
  const debrief = ref(null) // { score, rubric[], errors[], upgrades[], summary }
  const debriefLoading = ref(false)
  const debriefError = ref('')
  // Số lượt người học đã nói — cần ≥ 2 lượt mới cho tổng kết (kẻo chấm khi chưa có gì).
  const userTurnCount = computed(() => messages.value.filter((m) => m.role === 'user').length)
  // Chỉ hiện nút "Kết thúc & nhận xét" cho buổi có kịch bản CỐ ĐỊNH (khóa comm).
  const debriefAvailable = computed(() => !!fixedScenario.value && roleplayOn.value && userTurnCount.value >= 2)

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
    // Bỏ soi từng lượt khi đang nhập vai comm -> AI trả evaluation: null (chấm ở debrief).
    deferCorrection: roleplayOn.value && deferCorrection.value,
    // Số phát âm khách quan của buổi (nếu có) -> debrief nhận xét "độ dễ hiểu".
    pronScore: props.context?.pronScore,
    confusions: props.context?.confusions,
    // Số trôi chảy khách quan của buổi (nếu đã nói bằng mic) -> debrief nhận xét fluency.
    wpm: fluency.value?.avgWpm,
    latency: fluency.value?.avgLatency,
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
    // Ưu tiên kịch bản CỐ ĐỊNH của buổi (khóa comm); nếu không có thì giữ cũ (random).
    currentScenario.value =
      fixedScenario.value || currentScenario.value || SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
    messages.value = []
    input.value = ''
    error.value = ''
    retry.value = null
    debrief.value = null
    debriefError.value = ''
    fluencySamples.value = []
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

  // Buổi khóa comm có kịch bản cố định -> vào thẳng roleplay (roleplay là trục buổi).
  // Buổi thường -> câu mở đầu tĩnh như cũ.
  function startSession() {
    if (fixedScenario.value) {
      roleplayOn.value = true
      startRoleplaySession()
    } else {
      initSession()
    }
  }

  onMounted(startSession)

  // Lịch sử gọn để gửi backend: assistant -> message, user -> text.
  function historyFor(upto = messages.value.length) {
    return messages.value.slice(0, upto).map((m) =>
      m.role === 'assistant' ? { role: 'assistant', text: m.message } : { role: 'user', text: m.text },
    )
  }

  async function send() {
    const text = input.value.trim()
    if (!text || loading.value) return
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
      // Chế độ "chỉ trò chuyện" (comm): AI đáp lại đúng ý = tín hiệu GIAO TIẾP THÀNH
      // CÔNG. Gắn cờ để hiện chip 🟢 "được hiểu" (khen giao tiếp, không khẳng định ngữ pháp).
      userEntry.understood = isComm.value && roleplayOn.value && deferCorrection.value && !userEntry.evaluation
      const aiEntry = {
        role: 'assistant',
        message: next?.message || '…',
        suggestedWords: Array.isArray(next?.suggestedWords) ? next.suggestedWords.slice(0, 3) : [],
        ui: reactive({}),
      }
      messages.value.push(aiEntry)
      if (autoSpeak.value) speak(aiEntry.message)
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
    savePersonaPref(key)
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
      user.saveWord({ ...base, vi, cat: 'Câu', kind: 'sentence', topic: user.convoPrefs.activeSaveTopic })
      flashToast('✓ Đã lưu câu')
    } catch {
      flashToast('⚠️ Không dịch được, thử lại nhé')
    } finally {
      savingSentence.value = ''
    }
  }

  // —— Kết thúc buổi & nhận nhận xét (debrief) ——
  // Gửi transcript + rubric của tình huống lên backend, nhận tổng kết. KHÔNG tự
  // lưu vào store ở đây — component (CommDayView) nghe qua watch(debrief) rồi ghi
  // 3 lỗi vào sổ lỗi + điểm rubric của buổi Boss, để engine giữ vai trò thuần.
  async function runDebrief() {
    if (debriefLoading.value || userTurnCount.value < 2) return
    debriefLoading.value = true
    debriefError.value = ''
    try {
      const history = historyFor()
      const trimmed = history.length > DEBRIEF_MAX_TURNS ? history.slice(-DEBRIEF_MAX_TURNS) : history
      const result = await debriefTurn({
        messages: trimmed,
        context: { ...chatContext.value, rubric: fixedScenario.value?.rubric || [] },
        persona: persona.value,
      })
      // Đính kèm số khách quan của buổi để component lưu vào Tổng kết (Trục E).
      debrief.value = {
        ...normalizeDebrief(result),
        wpm: fluency.value?.avgWpm ?? null,
        pron: Number.isFinite(Number(props.context?.pronScore)) ? Number(props.context.pronScore) : null,
      }
    } catch (e) {
      debriefError.value = friendlyAiError(e).message
    } finally {
      debriefLoading.value = false
    }
  }

  // Chuẩn hóa payload debrief để component không phải phòng thủ từng field.
  function normalizeDebrief(r) {
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
    return {
      score: clamp(r?.score),
      rubric: Array.isArray(r?.rubric)
        ? r.rubric.map((x) => ({ criterion: String(x?.criterion || '').trim(), met: !!x?.met })).filter((x) => x.criterion)
        : [],
      errors: Array.isArray(r?.errors)
        ? r.errors
            .map((x) => ({ wrong: String(x?.wrong || '').trim(), right: String(x?.right || '').trim(), note: String(x?.note || '').trim() }))
            .filter((x) => x.wrong && x.right)
            .slice(0, 3)
        : [],
      upgrades: Array.isArray(r?.upgrades)
        ? r.upgrades.map((x) => ({ en: String(x?.en || '').trim(), vi: String(x?.vi || '').trim() })).filter((x) => x.en).slice(0, 3)
        : [],
      intelligibility: String(r?.intelligibility || '').trim(),
      fluency: String(r?.fluency || '').trim(),
      confidenceTip: String(r?.confidenceTip || '').trim(),
      summary: String(r?.summary || '').trim(),
    }
  }

  // Lưu MỘT "cụm nâng cấp" (đã có sẵn nghĩa VI từ debrief -> không cần dịch lại) vào
  // danh sách từ đã lưu, gom vào chủ đề comm để học lại qua Flashcard (SRS).
  function saveUpgrade(en, vi) {
    const s = String(en || '').trim()
    if (!s) return
    if (user.isWordSaved(s)) {
      user.removeSavedWord(s)
      flashToast('Đã bỏ cụm')
      return
    }
    user.createTopic(COMM_SAVE_TOPIC) // idempotent — bỏ qua nếu đã có
    const base = cardsFromTerms([s], 'saved')[0]
    user.saveWord({ ...base, vi: String(vi || '').trim(), cat: 'Câu', kind: 'sentence', topic: COMM_SAVE_TOPIC })
    flashToast('✓ Đã lưu vào ôn tập')
  }

  function toggleMic() {
    if (!listenable) return
    if (listening.value) {
      recognizer?.stop()
      return
    }
    recognizer = createRecognizer({
      lang: 'en-US',
      onResult: ({ final, interim }) => {
        // Mốc bật ra tiếng đầu tiên (để đo độ trễ phản hồi) — chỉ ghi 1 lần/lượt.
        if (!micFirstSpeechAt && (final || interim)) micFirstSpeechAt = Date.now()
        input.value = final || interim
      },
      onError: (err) => {
        error.value =
          err === 'not-allowed'
            ? 'Trình duyệt chưa cho phép dùng micro. Hãy bật quyền micro rồi thử lại.'
            : `Không nghe được (${err}).`
        listening.value = false
      },
      onEnd: (finalText) => {
        listening.value = false
        const now = Date.now()
        if (micStartedAt) user.logSpeakingSeconds((now - micStartedAt) / 1000)
        // Ghi 1 mẫu trôi chảy: WPM = số từ / số giây NÓI (từ lúc bật tiếng đến khi
        // dừng); độ trễ = từ lúc mic bật đến khi bật tiếng. Bỏ mẫu quá ngắn (nhiễu).
        if (isComm.value && micFirstSpeechAt) {
          const words = countWords(finalText)
          const speakSec = (now - micFirstSpeechAt) / 1000
          const wpm = computeWpm(words, speakSec)
          if (words >= 3 && speakSec >= 1 && wpm > 0) {
            fluencySamples.value.push({ wpm, latency: (micFirstSpeechAt - micStartedAt) / 1000 })
          }
        }
        micStartedAt = 0
        micFirstSpeechAt = 0
        if (finalText) send()
      },
    })
    if (!recognizer) return
    error.value = ''
    listening.value = true
    micStartedAt = Date.now()
    micFirstSpeechAt = 0
    recognizer.start()
  }

  function reset() {
    if (roleplayOn.value) {
      startRoleplaySession()
    } else {
      initSession()
    }
  }

  // Đổi bài học thì làm mới phiên. Buổi comm: nạp lại kịch bản CỐ ĐỊNH của buổi mới
  // (currentScenario=null -> startRoleplaySession lấy fixedScenario mới). Buổi thường:
  // tắt Surprise mode và hiện câu mở đầu tĩnh như cũ.
  watch(
    () => props.context?.title,
    () => {
      roleplayOn.value = false
      currentScenario.value = null
      startSession()
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
    fluency,
    persona,
    setPersona,
    speakable,
    listenable,
    unlockedRoleplay,
    roleplayOn,
    currentScenario,
    deferCorrection,
    toggleDeferCorrection,
    debrief,
    debriefLoading,
    debriefError,
    debriefAvailable,
    runDebrief,
    saveUpgrade,
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
    reset,
  }
}
