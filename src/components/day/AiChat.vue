<script setup>
import { ref, computed, reactive, nextTick, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { coachTurn, reFeedback, getHint, getIdea, translateWord, translateToVi } from '@/lib/aiChat'
import { speak, canSpeak } from '@/lib/speak'
import { canListen, createRecognizer } from '@/lib/listen'
import { cardsFromTerms } from '@/data/tools'
import { VOCAB_GLOSSARY } from '@/data/vocabGlossary'
import { useUserStore } from '@/stores/user'

/**
 * Khung "Trò chuyện với AI" — coach hội thoại tiếng Anh theo bài học.
 * Mỗi lượt người học gửi đi, AI vừa CHẤM câu (sửa lỗi + điểm CEFR + lời phê theo
 * phong cách hài hước) vừa NÓI TIẾP (kèm gợi ý từ nên dùng). Có nghe/nói, tra từ
 * tại chỗ, lưu/đánh dấu sao từ, và chọn phong cách lời phê.
 */
const props = defineProps({
  // { title, week, weekTitle, vocab: string[], grammar: string[] }
  context: { type: Object, default: () => ({}) },
})

const router = useRouter()
const user = useUserStore()

// —— Danh sách phong cách lời phê (khớp PERSONAS ở backend _llm.js) ——
const PERSONAS = [
  { key: 'cotnha', label: '😜 Cợt nhả', desc: 'Hài hước, trêu nhẹ' },
  { key: 'chuiboi', label: '🔥 Chửi bới', desc: 'Cà khịa cho vui' },
  { key: 'gaubong', label: '🧸 Gấu bông', desc: 'Ấm áp, động viên' },
  { key: 'nghiemtuc', label: '🎓 Nghiêm túc', desc: 'Giáo viên thẳng thắn' },
]
// —— Trạng thái phiên ——
const messages = ref([]) // xem mô hình bên dưới
const input = ref('')
const loading = ref(false)
const error = ref('')
const autoSpeak = ref(true)
const listening = ref(false)
const scroller = ref(null)
const savedToast = ref('')
let toastTimer = null

// Phong cách lời phê — nhớ lần chọn gần nhất (lưu local).
const persona = ref(user.convoPrefs.persona || 'cotnha')
function setPersona(key) {
  persona.value = key
  user.setConvoPrefs({ persona: key })
}

const speakable = canSpeak()
const listenable = canListen()
let recognizer = null

// Bộ từ của bài (để gợi ý người học dùng trong câu trả lời).
const vocab = computed(() => (props.context?.vocab || []).filter(Boolean))

// Ngữ cảnh gửi lên backend.
const chatContext = computed(() => ({
  title: props.context?.title,
  week: props.context?.week,
  weekTitle: props.context?.weekTitle,
  grammar: props.context?.grammar || [],
  vocab: vocab.value,
  exam: props.context?.exam || 'none',
  suggestWords: true,
}))

// Câu mở đầu tĩnh (không tốn quota).
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
  closePop()
}
onMounted(initSession)

async function scrollToEnd() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

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
  const userEntry = reactive({ role: 'user', text, evaluation: null, persona: persona.value, evaluating: true })
  messages.value.push(userEntry)
  input.value = ''
  loading.value = true
  scrollToEnd()

  try {
    const { evaluation, next } = await coachTurn({
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
  } catch (e) {
    userEntry.evaluating = false
    error.value = e.message || 'Có lỗi xảy ra, thử lại nhé.'
  } finally {
    loading.value = false
    scrollToEnd()
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
    flashToast('⚠️ Không chấm lại được, thử lại nhé')
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
  } catch {
    m.ui.hint = 'Không lấy được gợi ý, thử lại nhé.'
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
  } catch {
    m.ui.idea = 'Không lấy được ý tưởng, thử lại nhé.'
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
  } catch {
    m.ui.vi = 'Không dịch được, thử lại nhé.'
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

// —— Tra/lưu/đánh dấu sao TỪ tại chỗ ——
const pop = reactive({ open: false, word: '', vi: '', ipa: '', loading: false, x: 0, y: 0 })

// Tách văn bản thành token: số lẻ là "từ" bấm được.
function tokenize(text) {
  return (text || '')
    .split(/([A-Za-z][A-Za-z'’-]*)/)
    .map((t, i) => ({ t, word: i % 2 === 1 && t.length >= 2 }))
}

async function tapWord(word, ev) {
  const w = String(word).trim()
  if (!w || w.length < 2) return
  pop.open = true
  pop.word = w
  pop.x = Math.min(ev.clientX, window.innerWidth - 230)
  pop.y = ev.clientY + 14
  const g = VOCAB_GLOSSARY[w.toLowerCase()]
  if (g) {
    pop.vi = g.vi || ''
    pop.ipa = g.ipa || ''
    pop.loading = false
    return
  }
  pop.vi = ''
  pop.ipa = ''
  pop.loading = true
  try {
    pop.vi = await translateWord(w)
  } catch {
    pop.vi = '(không dịch được)'
  } finally {
    pop.loading = false
  }
}
function closePop() {
  pop.open = false
}

function flashToast(msg) {
  savedToast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (savedToast.value = ''), 1800)
}

// Lưu từ trong popover vào danh sách flashcard (kèm nghĩa đã có).
function saveWordFromPop() {
  const w = pop.word.toLowerCase()
  if (user.isWordSaved(w)) {
    user.removeSavedWord(w)
    flashToast(`Đã bỏ “${w}”`)
    return
  }
  const card = cardsFromTerms([w], 'saved')[0]
  user.saveWord({ ...card, vi: card.vi || pop.vi, ipa: card.ipa || pop.ipa })
  flashToast(`✓ Đã lưu “${w}”`)
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

function openSavedDeck() {
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'saved' } })
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
      if (finalText) send()
    },
  })
  if (!recognizer) return
  error.value = ''
  listening.value = true
  recognizer.start()
}

function reset() {
  initSession()
}

// Đổi bài học thì làm mới phiên.
watch(
  () => props.context?.title,
  () => reset(),
)
</script>

<template>
  <section class="step-card ai-chat" @click="closePop">
    <div class="step-head">
      <div>
        <div class="eyebrow">LUYỆN GIAO TIẾP</div>
        <h2 class="step-title">💬 Trò chuyện với AI</h2>
      </div>
      <div class="head-tools">
        <button
          v-if="speakable"
          class="tool-toggle"
          :class="{ on: autoSpeak }"
          :title="autoSpeak ? 'Đang tự đọc câu trả lời' : 'Tự đọc câu trả lời: tắt'"
          @click.stop="autoSpeak = !autoSpeak"
        >
          {{ autoSpeak ? '🔊 Đọc' : '🔇 Đọc' }}
        </button>
        <button class="tool-toggle" title="Bắt đầu lại từ đầu" @click.stop="reset">↺ Mới</button>
      </div>
    </div>

    <!-- Thanh chọn phong cách lời phê (đổi được bất cứ lúc nào) -->
    <div class="persona-bar">
      <span class="persona-bar-label">Phong cách AI:</span>
      <button
        v-for="p in PERSONAS"
        :key="p.key"
        class="pchip"
        :class="{ on: persona === p.key }"
        :title="p.desc"
        @click.stop="setPersona(p.key)"
      >{{ p.label }}</button>
    </div>

    <!-- ———————————— HỘI THOẠI ———————————— -->
    <button v-if="user.savedCount" class="saved-pill" @click.stop="openSavedDeck">
        📚 {{ user.savedCount }} từ đã lưu — học bằng Flashcard →
      </button>
      <p class="hint">Chạm vào <b>từ</b> để tra nghĩa / lưu. Bấm 🎤 để nói.</p>

      <div ref="scroller" class="chat-log">
        <template v-for="(m, i) in messages" :key="i">
          <!-- Lượt của AI -->
          <div v-if="m.role === 'assistant'" class="msg ai">
            <div class="avatar">🤖</div>
            <div class="bubble">
              <div class="prose-words">
                <template v-for="(tok, ti) in tokenize(m.message)" :key="ti">
                  <button
                    v-if="tok.word"
                    class="wordchip"
                    :class="{ saved: user.isWordSaved(tok.t) }"
                    @click.stop="tapWord(tok.t, $event)"
                  >{{ tok.t }}</button><span v-else>{{ tok.t }}</span>
                </template>
                <button v-if="speakable" class="speak-mini" title="Nghe lại" @click.stop="replay(m.message)">🔊</button>
              </div>

              <!-- Gợi ý từ nên dùng -->
              <div v-if="m.suggestedWords && m.suggestedWords.length" class="suggest">
                <span class="suggest-label">Hãy thử dùng các từ:</span>
                <span v-for="w in m.suggestedWords" :key="w" class="suggest-chip">{{ w }}</span>
              </div>

              <!-- Nút trợ giúp -->
              <div class="turn-actions">
                <button class="ta" @click.stop="showHint(m)">{{ m.ui.hintLoading ? '⏳' : '💡' }} Xem gợi ý</button>
                <button class="ta" @click.stop="showIdea(m)">{{ m.ui.ideaLoading ? '⏳' : '🤔' }} Bí ý tưởng?</button>
                <button class="ta" @click.stop="showTranslation(m)">{{ m.ui.viLoading ? '⏳' : '🌐' }} Dịch câu hỏi?</button>
                <button class="ta" :class="{ saved: user.isWordSaved(m.message) }" :disabled="savingSentence === m.message" @click.stop="saveSentence(m.message)">
                  {{ savingSentence === m.message ? '⏳' : user.isWordSaved(m.message) ? '✓' : '💾' }} Lưu câu
                </button>
              </div>
              <p v-if="m.ui.showHint" class="aux hint-box">💡 {{ m.ui.hint }}</p>
              <div v-if="m.ui.showIdea" class="aux idea-box">
                🤔 <i>{{ m.ui.idea }}</i>
                <button class="use-idea" @click.stop="useIdeaAsAnswer(m.ui.idea)">Dùng câu này →</button>
              </div>
              <p v-if="m.ui.showVi" class="aux vi-box">🌐 {{ m.ui.vi }}</p>
            </div>
          </div>

          <!-- Lượt của người học + thẻ đánh giá -->
          <div v-else class="user-turn">
            <div class="msg me">
              <div class="avatar">🧑</div>
              <div class="bubble">{{ m.text }}</div>
            </div>

            <div v-if="m.evaluating" class="eval-card loading">⏳ Đang chấm câu…</div>

            <div v-else-if="m.evaluation" class="eval-card">
              <div class="eval-row">
                <span class="eval-tag ok">✅ Câu đúng</span>
                <span class="eval-corrected">{{ m.evaluation.corrected }}</span>
              </div>
              <div class="eval-row score-row">
                <span class="eval-tag score">🎯 {{ m.evaluation.cefr }}</span>
                <div class="persona-pills">
                  <button
                    v-for="p in PERSONAS"
                    :key="p.key"
                    class="ppill"
                    :class="{ on: (m.persona || persona) === p.key }"
                    :disabled="m.reEvaluating"
                    :title="p.desc"
                    @click.stop="changePersona(m, p.key)"
                  >{{ p.label }}</button>
                </div>
              </div>
              <ul class="eval-feedback" :class="{ dim: m.reEvaluating }">
                <li v-for="(line, fi) in m.evaluation.feedback" :key="fi">{{ line }}</li>
              </ul>
              <div class="eval-reco">
                <span class="reco-label">💡 Gợi ý trả lời:</span>
                <span class="reco-text">{{ m.evaluation.recommended }}</span>
                <button v-if="speakable" class="speak-mini" title="Nghe" @click.stop="replay(m.evaluation.recommended)">🔊</button>
                <div v-if="m.evaluation.recommendedVi" class="reco-vi">{{ m.evaluation.recommendedVi }}</div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="loading" class="msg ai">
          <div class="avatar">🤖</div>
          <div class="bubble typing"><span></span><span></span><span></span></div>
        </div>
      </div>

      <p v-if="error" class="chat-error">⚠️ {{ error }}</p>

      <form class="composer" @submit.prevent="send">
        <button
          v-if="listenable"
          type="button"
          class="mic-btn"
          :class="{ live: listening }"
          :title="listening ? 'Đang nghe… bấm để dừng' : 'Bấm để nói'"
          @click.stop="toggleMic"
        >
          {{ listening ? '⏹️' : '🎤' }}
        </button>
        <input
          v-model="input"
          type="text"
          class="composer-input"
          :placeholder="listening ? 'Đang nghe bạn nói…' : 'Nhập câu tiếng Anh của bạn…'"
          :disabled="loading"
          @click.stop
        />
        <button type="submit" class="send-btn" :disabled="loading || !input.trim()">Gửi →</button>
      </form>

    <!-- Popover tra từ -->
    <div v-if="pop.open" class="word-pop" :style="{ left: pop.x + 'px', top: pop.y + 'px' }" @click.stop>
      <div class="wp-head">
        <b>{{ pop.word }}</b>
        <span v-if="pop.ipa" class="wp-ipa">{{ pop.ipa }}</span>
      </div>
      <div class="wp-vi">{{ pop.loading ? 'Đang dịch…' : pop.vi || '(chưa có nghĩa)' }}</div>
      <div class="wp-actions">
        <button @click.stop="saveWordFromPop">{{ user.isWordSaved(pop.word) ? '✓ Đã lưu' : '💾 Lưu từ' }}</button>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="savedToast" class="save-toast">{{ savedToast }}</div>
    </Transition>
  </section>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  position: relative;
  background: #fff;
  border-radius: 22px;
  padding: 26px 28px;
  border: 1px solid rgba(108, 92, 231, 0.1);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.head-tools {
  display: flex;
  gap: 8px;
  flex: none;
}
.tool-toggle {
  border: 1px solid rgba(0, 214, 143, 0.3);
  background: #fff;
  color: #00966a;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-toggle:hover {
  background: #e6fbf2;
}
.tool-toggle.on {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  border-color: transparent;
  color: #fff;
}

/* —— Thanh chọn phong cách lời phê —— */
.persona-bar {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.persona-bar-label {
  font-size: 12.5px;
  font-weight: 800;
  color: #3a3a52;
  margin-right: 2px;
}
.pchip {
  font-size: 12.5px;
  font-weight: 700;
  color: #6c5ce7;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.25);
  border-radius: 999px;
  padding: 5px 11px;
  cursor: pointer;
  transition: all 0.13s;
}
.pchip:hover {
  background: #f5f3ff;
}
.pchip.on {
  background: #6c5ce7;
  border-color: transparent;
  color: #fff;
}

/* —— Lối tắt & gợi ý —— */
.saved-pill {
  align-self: flex-start;
  margin-top: 12px;
  cursor: pointer;
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: linear-gradient(135deg, #f5f3ff, #eef6ff);
  color: var(--purple);
  font-size: 13px;
  font-weight: 800;
  padding: 9px 14px;
  border-radius: 11px;
}
.hint {
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 10px;
}

/* —— Log hội thoại —— */
.chat-log {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 460px;
  overflow-y: auto;
  padding: 6px 4px 2px;
}
.msg {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.msg.me {
  flex-direction: row-reverse;
}
.avatar {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 17px;
  background: #e6fbf2;
}
.msg.me .avatar {
  background: #ede9fe;
}
.bubble {
  position: relative;
  max-width: 82%;
  font-size: 14.5px;
  line-height: 1.7;
  padding: 11px 15px;
  border-radius: 16px;
  background: #f3f4f8;
  color: #3a3a52;
  word-wrap: break-word;
}
.msg.me .bubble {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  color: #fff;
  border-bottom-right-radius: 5px;
}
.msg.ai .bubble {
  border-bottom-left-radius: 5px;
}
.wordchip {
  font: inherit;
  color: inherit;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0 1px;
  border-radius: 5px;
  border-bottom: 1.5px dotted rgba(108, 92, 231, 0.4);
  transition: background 0.12s;
}
.wordchip:hover {
  background: rgba(108, 92, 231, 0.16);
}
.wordchip.saved {
  background: rgba(0, 168, 111, 0.16);
  border-bottom-color: transparent;
}
.wordchip.starred {
  background: rgba(255, 193, 7, 0.25);
  border-bottom-color: transparent;
}
.speak-mini {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  margin-left: 4px;
  opacity: 0.6;
  padding: 0;
}
.speak-mini:hover {
  opacity: 1;
}

/* Gợi ý từ */
.suggest {
  margin-top: 9px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.suggest-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.suggest-chip {
  font-size: 12.5px;
  font-weight: 700;
  color: #00805a;
  background: #e6fbf2;
  border: 1px solid rgba(0, 214, 143, 0.3);
  border-radius: 999px;
  padding: 2px 10px;
}

/* Nút trợ giúp dưới lượt AI */
.turn-actions {
  margin-top: 9px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ta {
  font-size: 12px;
  font-weight: 700;
  color: #6c5ce7;
  background: rgba(108, 92, 231, 0.08);
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.ta:hover {
  background: rgba(108, 92, 231, 0.16);
}
.ta.saved {
  background: #6c5ce7;
  border-color: transparent;
  color: #fff;
}
.aux {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.6;
  border-radius: 10px;
  padding: 9px 12px;
}
.hint-box {
  background: #fff8e6;
  border: 1px solid #ffe2a8;
  color: #8a6d1b;
}
.idea-box {
  background: #eef6ff;
  border: 1px solid #c9e0ff;
  color: #1c4f8a;
}
.use-idea {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  background: #1c4f8a;
  color: #fff;
  border-radius: 8px;
  padding: 3px 9px;
  cursor: pointer;
}
.vi-box {
  background: #f3f4f8;
  border: 1px solid rgba(108, 92, 231, 0.15);
  color: #3a3a52;
}

/* Thẻ đánh giá */
.user-turn {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.eval-card {
  align-self: flex-end;
  max-width: 88%;
  background: #fbfbfe;
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 16px;
  padding: 13px 15px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: 0 6px 16px rgba(108, 92, 231, 0.06);
}
.eval-card.loading {
  color: var(--muted);
  font-size: 13.5px;
}
.eval-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}
.eval-tag {
  flex: none;
  font-size: 11.5px;
  font-weight: 800;
  border-radius: 999px;
  padding: 2px 9px;
}
.eval-tag.ok {
  background: #e6fbf2;
  color: #00805a;
}
.eval-tag.score {
  background: #ede9fe;
  color: #6c5ce7;
}
.eval-corrected {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f33;
}
.score-row {
  justify-content: space-between;
  align-items: center;
}
.persona-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ppill {
  font-size: 11px;
  font-weight: 700;
  color: #6c5ce7;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.25);
  border-radius: 999px;
  padding: 2px 8px;
  cursor: pointer;
}
.ppill.on {
  background: #6c5ce7;
  border-color: transparent;
  color: #fff;
}
.ppill:disabled {
  opacity: 0.5;
  cursor: progress;
}
.eval-feedback {
  margin: 0;
  padding-left: 18px;
  font-size: 13.8px;
  line-height: 1.7;
  color: #3a3a52;
}
.eval-feedback.dim {
  opacity: 0.5;
}
.eval-reco {
  background: #f5f3ff;
  border-radius: 11px;
  padding: 9px 12px;
  font-size: 13.8px;
  line-height: 1.6;
}
.reco-label {
  font-weight: 800;
  color: #6c5ce7;
  margin-right: 5px;
}
.reco-text {
  color: #1f1f33;
  font-weight: 600;
}
.reco-vi {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12.8px;
}

/* Popover tra từ */
.word-pop {
  position: fixed;
  z-index: 30;
  width: 210px;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.18);
  padding: 11px 13px;
}
.wp-head {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.wp-head b {
  font-size: 15px;
  color: #1f1f33;
}
.wp-ipa {
  font-size: 12px;
  color: var(--muted);
}
.wp-vi {
  margin-top: 4px;
  font-size: 14px;
  color: #00805a;
  font-weight: 600;
}
.wp-actions {
  margin-top: 9px;
  display: flex;
  gap: 7px;
}
.wp-actions button {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(108, 92, 231, 0.25);
  background: #fff;
  color: #6c5ce7;
  border-radius: 9px;
  padding: 6px;
  cursor: pointer;
}
.wp-actions button:hover {
  background: #f5f3ff;
}

/* Toast */
.save-toast {
  position: absolute;
  left: 50%;
  bottom: 78px;
  transform: translateX(-50%);
  background: #2d2d44;
  color: #fff;
  font-size: 13.5px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 999px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  z-index: 25;
  white-space: nowrap;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

/* typing indicator */
.typing {
  display: flex;
  gap: 4px;
  align-items: center;
}
.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b5b8c5;
  animation: blink 1.2s infinite ease-in-out both;
}
.typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%, 80%, 100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.chat-error {
  margin-top: 12px;
  background: #fff3f3;
  border: 1px solid #ffd5d5;
  color: #c0392b;
  font-size: 13.5px;
  padding: 10px 14px;
  border-radius: 12px;
}

.composer {
  margin-top: 16px;
  display: flex;
  gap: 9px;
  align-items: center;
}
.mic-btn {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(0, 214, 143, 0.3);
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
}
.mic-btn:hover {
  background: #e6fbf2;
}
.mic-btn.live {
  background: #ffe5e5;
  border-color: #ff6b6b;
  animation: pulse 1.1s infinite;
}
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 107, 107, 0);
  }
}
.composer-input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 14px;
  padding: 13px 16px;
  font-size: 14.5px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.composer-input:focus {
  border-color: var(--green);
}
.send-btn {
  flex: none;
  border: none;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 800;
  color: #fff;
  padding: 13px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
  box-shadow: 0 10px 22px rgba(0, 214, 143, 0.28);
  transition: transform 0.15s;
}
.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 560px) {
  .bubble {
    max-width: 86%;
  }
  .persona-grid {
    grid-template-columns: 1fr;
  }
}
</style>
