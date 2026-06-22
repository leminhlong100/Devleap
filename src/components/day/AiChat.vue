<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { sendChat, translateToVi } from '@/lib/aiChat'
import { speak, canSpeak } from '@/lib/speak'
import { canListen, createRecognizer } from '@/lib/listen'
import { cardsFromTerms } from '@/data/tools'
import { useUserStore } from '@/stores/user'

/**
 * Khung trò chuyện với AI để luyện giao tiếp tiếng Anh theo bài học.
 * Gửi ngữ cảnh bài (chủ đề + từ vựng + ngữ pháp) để AI bám sát nội dung.
 * Có nghe (đọc câu trả lời) và nói (Speech-to-Text) để luyện cả 4 kỹ năng.
 */
const props = defineProps({
  // { title, week, weekTitle, vocab: string[], grammar: string[] }
  context: { type: Object, default: () => ({}) },
})

const router = useRouter()
const user = useUserStore()

const messages = ref([]) // { role:'user'|'assistant', text }
const input = ref('')
const loading = ref(false)
const error = ref('')
const autoSpeak = ref(true)
const listening = ref(false)
const scroller = ref(null)

// Chế độ "lưu từ": bật rồi chạm vào từ trong câu trả lời của AI để lưu vào
// danh sách cá nhân (học lại bằng Flashcard). Tắt mặc định để khỏi vướng khi đọc.
const saveMode = ref(false)
const savedToast = ref('') // thông báo thoáng qua sau khi lưu
const translatingKey = ref('') // câu đang được dịch (hiện trạng thái ⏳)
let toastTimer = null

const speakable = canSpeak()
const listenable = canListen()
let recognizer = null

const targetWords = computed(() => (props.context?.vocab || []).slice(0, 6))

// Lời mở đầu tĩnh (không tốn quota) — giới thiệu chủ đề & gợi ý từ cần dùng.
const opener = computed(() => {
  const topic = props.context?.title ? `**${props.context.title}**` : 'today’s topic'
  const words = targetWords.value.length ? ` Try to use: _${targetWords.value.join(', ')}_.` : ''
  return `Hi there! 👋 Let’s practise English about ${topic}. Tell me about your day or ask me anything to get started.${words}`
})

const renderedOpener = computed(() => marked.parse(opener.value))
const render = (text) => marked.parse(text || '')

async function scrollToEnd() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  error.value = ''
  messages.value.push({ role: 'user', text })
  input.value = ''
  loading.value = true
  scrollToEnd()

  try {
    const reply = await sendChat({ messages: messages.value, context: props.context })
    messages.value.push({ role: 'assistant', text: reply })
    if (autoSpeak.value) speak(reply)
  } catch (e) {
    error.value = e.message || 'Có lỗi xảy ra, thử lại nhé.'
  } finally {
    loading.value = false
    scrollToEnd()
  }
}

function replay(text) {
  speak(text)
}

// —— Lưu từ vựng từ câu trả lời của AI ——
function flashToast(msg) {
  savedToast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (savedToast.value = ''), 1800)
}

// Gỡ ký hiệu markdown (** _ ` #) để hiển thị sạch trong chế độ chọn từ.
function stripMd(text) {
  return (text || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^[#>]+\s*/gm, '')
}

// Tách một đoạn thành token: mỗi từ tiếng Anh là token bấm được (word=true);
// dấu câu/khoảng trắng giữ nguyên để câu vẫn đọc được.
function tokenize(text) {
  // split giữ lại nhóm bắt được -> chỉ số lẻ là "từ", chẵn là phần ngăn cách.
  return (text || '')
    .split(/([A-Za-z][A-Za-z'’-]*)/)
    .map((t, i) => ({ t, word: i % 2 === 1 && t.length >= 2 }))
}

// Tách câu trả lời của AI thành từng CÂU (kèm token từng từ) để vừa chọn từ,
// vừa lưu cả câu. Mỗi câu có nút "💾 Lưu câu" riêng.
function pickSentences(text) {
  const plain = stripMd(text)
  return plain
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => ({ text: s, key: i + ':' + s.slice(0, 24), tokens: tokenize(s) }))
}

// Chọn/bỏ chọn một từ: chưa lưu -> lưu (kèm câu ngữ cảnh); đã lưu -> bỏ.
// Từ có trong kho (glossary) dùng nghĩa sẵn (kèm IPA/ví dụ); từ chưa có nghĩa
// thì nhờ AI dịch sang tiếng Việt để mặt sau flashcard luôn có nghĩa.
async function toggleWord(word, fullText) {
  const w = String(word).trim().toLowerCase()
  if (!w || w.length < 2) return
  if (user.isWordSaved(w)) {
    user.removeSavedWord(w)
    flashToast(`Đã bỏ “${w}”`)
    return
  }
  const card = cardsFromTerms([w], 'saved')[0]
  const context = sentenceFor(w, fullText)
  let vi = card.vi
  if (!vi) {
    if (translatingKey.value) return // đang dịch mục khác -> bỏ qua
    translatingKey.value = w
    try {
      vi = await translateToVi(w)
    } catch {
      vi = '' // dịch lỗi vẫn lưu, mặt sau để trống
    } finally {
      translatingKey.value = ''
    }
  }
  user.saveWord(context ? { ...card, vi, context } : { ...card, vi })
  flashToast(`✓ Đã lưu “${w}”`)
}

// Lưu/bỏ cả câu: khi lưu sẽ nhờ AI dịch sang tiếng Việt làm mặt sau flashcard.
async function toggleSentence(sentence) {
  const s = String(sentence).trim()
  if (!s) return
  if (user.isWordSaved(s)) {
    user.removeSavedWord(s)
    flashToast('Đã bỏ câu')
    return
  }
  if (translatingKey.value) return // đang dịch câu khác -> bỏ qua
  translatingKey.value = s
  try {
    const vi = await translateToVi(s)
    const base = cardsFromTerms([s], 'saved')[0]
    user.saveWord({ ...base, vi, cat: 'Câu', kind: 'sentence' })
    flashToast('✓ Đã lưu câu')
  } catch {
    flashToast('⚠️ Không dịch được, thử lại nhé')
  } finally {
    translatingKey.value = ''
  }
}

// Trích câu chứa từ trong đoạn văn bản (để hiện ngữ cảnh trên flashcard).
function sentenceFor(word, text) {
  const plain = (text || '').replace(/[*_`#>]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  const sentences = plain.split(/(?<=[.!?])\s+/)
  const hit = sentences.find((s) => new RegExp(`\\b${word}\\b`, 'i').test(s))
  return (hit || '').slice(0, 160)
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
      if (finalText) send() // nói xong tự gửi
    },
  })
  if (!recognizer) return
  error.value = ''
  listening.value = true
  recognizer.start()
}

function reset() {
  messages.value = []
  input.value = ''
  error.value = ''
}

// Đổi bài học thì làm mới hội thoại.
watch(
  () => props.context?.title,
  () => reset(),
)
</script>

<template>
  <section class="step-card ai-chat">
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
          @click="autoSpeak = !autoSpeak"
        >
          {{ autoSpeak ? '🔊 Đọc' : '🔇 Đọc' }}
        </button>
        <button
          class="tool-toggle"
          :class="{ on: saveMode }"
          :title="saveMode ? 'Đang bật: chạm vào từ để lưu' : 'Bật chế độ lưu từ vựng'"
          @click="saveMode = !saveMode"
        >
          📌 Lưu từ
        </button>
        <button v-if="messages.length" class="tool-toggle" title="Xóa hội thoại" @click="reset">↺ Mới</button>
      </div>
    </div>

    <p v-if="saveMode" class="hint hint-save">
      📌 Đang bật <b>chế độ chọn</b> — bấm <b>từ</b> để lưu từ, hoặc bấm <b>💾 Lưu câu</b> để lưu cả câu (tự dịch sang tiếng Việt). Bấm lần nữa để bỏ.
    </p>
    <p v-else class="hint">Nhắn tin hoặc bấm 🎤 để nói tiếng Anh — AI sẽ trả lời, sửa lỗi nhẹ và hỏi lại để bạn luyện nói.</p>

    <button v-if="user.savedCount" class="saved-pill" @click="openSavedDeck">
      📚 {{ user.savedCount }} từ đã lưu — học bằng Flashcard →
    </button>

    <div ref="scroller" class="chat-log">
      <!-- lời mở đầu -->
      <div class="msg ai">
        <div class="avatar">🤖</div>
        <div class="bubble" v-html="renderedOpener"></div>
      </div>

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role === 'user' ? 'me' : 'ai'">
        <div class="avatar">{{ m.role === 'user' ? '🧑' : '🤖' }}</div>
        <div class="bubble">
          <!-- Chế độ chọn: mỗi từ là một chip bấm để lưu; mỗi câu có nút lưu cả câu -->
          <div v-if="m.role === 'assistant' && saveMode" class="prose-pick">
            <div v-for="sen in pickSentences(m.text)" :key="sen.key" class="pick-sentence">
              <template v-for="(tok, ti) in sen.tokens" :key="ti">
                <button
                  v-if="tok.word"
                  class="wordchip"
                  :class="{ saved: user.isWordSaved(tok.t), busy: translatingKey === tok.t.toLowerCase() }"
                  :title="user.isWordSaved(tok.t) ? 'Bấm để bỏ lưu' : 'Bấm để lưu từ này'"
                  @click="toggleWord(tok.t, sen.text)"
                >{{ tok.t }}</button><span v-else>{{ tok.t }}</span>
              </template>
              <button
                class="sentchip"
                :class="{ saved: user.isWordSaved(sen.text), busy: translatingKey === sen.text }"
                :disabled="translatingKey === sen.text"
                :title="user.isWordSaved(sen.text) ? 'Bấm để bỏ lưu câu' : 'Lưu cả câu (kèm bản dịch)'"
                @click="toggleSentence(sen.text)"
              >{{ translatingKey === sen.text ? '⏳ Đang dịch…' : user.isWordSaved(sen.text) ? '✓ Đã lưu câu' : '💾 Lưu câu' }}</button>
            </div>
          </div>
          <div v-else-if="m.role === 'assistant'" class="prose-mini" v-html="render(m.text)"></div>
          <template v-else>{{ m.text }}</template>
          <button
            v-if="m.role === 'assistant' && speakable"
            class="speak-mini"
            title="Nghe lại"
            @click="replay(m.text)"
          >
            🔊
          </button>
        </div>
      </div>

      <div v-if="loading" class="msg ai">
        <div class="avatar">🤖</div>
        <div class="bubble typing"><span></span><span></span><span></span></div>
      </div>
    </div>

    <p v-if="error" class="chat-error">⚠️ {{ error }}</p>

    <Transition name="toast">
      <div v-if="savedToast" class="save-toast">{{ savedToast }}</div>
    </Transition>

    <form class="composer" @submit.prevent="send">
      <button
        v-if="listenable"
        type="button"
        class="mic-btn"
        :class="{ live: listening }"
        :title="listening ? 'Đang nghe… bấm để dừng' : 'Bấm để nói'"
        @click="toggleMic"
      >
        {{ listening ? '⏹️' : '🎤' }}
      </button>
      <input
        v-model="input"
        type="text"
        class="composer-input"
        :placeholder="listening ? 'Đang nghe bạn nói…' : 'Nhập câu tiếng Anh của bạn…'"
        :disabled="loading"
      />
      <button type="submit" class="send-btn" :disabled="loading || !input.trim()">Gửi →</button>
    </form>
  </section>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  position: relative;
  /* Nền card tự chứa: ở DayView lớp .step-card (scoped) đã tạo nền, nhưng khi
     dùng trong tab Công cụ không có .step-card nên tự khai báo ở đây cho đồng nhất. */
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
.hint {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.hint-save {
  color: #00805a;
  background: #e6fbf2;
  border: 1px solid rgba(0, 214, 143, 0.25);
  padding: 9px 13px;
  border-radius: 12px;
}
.hint-save b {
  color: #00805a;
}

/* Lối tắt sang Flashcard cho các từ đã lưu */
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
  transition: transform 0.12s, box-shadow 0.15s;
}
.saved-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(108, 92, 231, 0.22);
}

/* Chế độ chọn: mỗi câu một dòng, mỗi từ là chip bấm được */
.prose-pick {
  word-break: break-word;
}
.pick-sentence {
  line-height: 2.1;
  margin-bottom: 6px;
}
.pick-sentence:last-child {
  margin-bottom: 0;
}
/* Nút lưu cả câu (đứng cuối mỗi câu) */
.sentchip {
  display: inline-block;
  margin-left: 6px;
  vertical-align: middle;
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  color: #6c5ce7;
  background: rgba(108, 92, 231, 0.1);
  border: 1px solid rgba(108, 92, 231, 0.28);
  border-radius: 999px;
  padding: 3px 10px;
  transition: all 0.12s;
}
.sentchip:hover {
  background: rgba(108, 92, 231, 0.18);
}
.sentchip.saved {
  background: #6c5ce7;
  border-color: transparent;
  color: #fff;
}
.sentchip.busy {
  opacity: 0.7;
  cursor: progress;
}
.wordchip {
  font: inherit;
  color: inherit;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 6px;
  border-bottom: 1.5px dashed rgba(0, 168, 111, 0.55);
  transition: background 0.12s, color 0.12s;
}
.wordchip:hover {
  background: rgba(0, 214, 143, 0.16);
}
.wordchip.saved {
  background: #00a86f;
  color: #fff;
  font-weight: 700;
  border-bottom-color: transparent;
}
.wordchip.busy {
  opacity: 0.55;
  cursor: progress;
}

/* Toast xác nhận lưu từ */
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
  z-index: 5;
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

.chat-log {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
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
  max-width: 78%;
  font-size: 14.5px;
  line-height: 1.6;
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
.prose-mini :deep(p) {
  margin: 0 0 6px;
}
.prose-mini :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-mini :deep(strong) {
  color: #00805a;
}
.prose-mini :deep(em) {
  color: #6c5ce7;
  font-style: normal;
  font-weight: 600;
}
.prose-mini :deep(ul),
.prose-mini :deep(ol) {
  margin: 6px 0;
  padding-left: 18px;
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
  0%,
  80%,
  100% {
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
  0%,
  100% {
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
}
</style>
