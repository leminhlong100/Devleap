<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { translateWord } from '@/lib/aiChat'
import { cardsFromTerms } from '@/data/tools'
import { VOCAB_GLOSSARY } from '@/data/vocabGlossary'
import { useUserStore } from '@/stores/user'
import { PERSONAS } from '@/composables/useChatEngine'

/**
 * Render danh sách tin nhắn của AiChat.vue + tra/lưu từ khi chạm vào tin nhắn.
 * Các hành động cần gọi API (gợi ý, bí ý tưởng, dịch câu, lưu câu, đổi phong
 * cách) nhận qua props dạng hàm — logic thật nằm ở useChatEngine.js.
 */
const props = defineProps({
  messages: { type: Array, required: true },
  speakable: { type: Boolean, default: false },
  persona: { type: String, default: '' },
  savingSentence: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  showHint: { type: Function, required: true },
  showIdea: { type: Function, required: true },
  showTranslation: { type: Function, required: true },
  replay: { type: Function, required: true },
  useIdeaAsAnswer: { type: Function, required: true },
  saveSentence: { type: Function, required: true },
  changePersona: { type: Function, required: true },
  flashToast: { type: Function, required: true },
})

const user = useUserStore()

// —— Tra/lưu/đánh dấu sao TỪ tại chỗ ——
const pop = reactive({ open: false, word: '', vi: '', ipa: '', loading: false, x: 0, y: 0 })

const scroller = ref(null)
async function scrollToEnd() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}
watch(() => props.loading, (v) => { if (v) scrollToEnd() })
watch(() => props.messages.length, scrollToEnd)
// Đổi phiên (reset/roleplay/đổi bài) gán lại cả mảng messages -> đóng popover cũ.
watch(() => props.messages, () => { pop.open = false })

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
defineExpose({ closePop })

// Lưu từ trong popover vào danh sách flashcard (kèm nghĩa đã có).
function saveWordFromPop() {
  const w = pop.word.toLowerCase()
  if (user.isWordSaved(w)) {
    user.removeSavedWord(w)
    props.flashToast(`Đã bỏ “${w}”`)
    return
  }
  const card = cardsFromTerms([w], 'saved')[0]
  user.saveWord({ ...card, vi: card.vi || pop.vi, ipa: card.ipa || pop.ipa })
  props.flashToast(`✓ Đã lưu “${w}”`)
}
</script>

<template>
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
</template>

<style scoped>
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
  background: var(--surface-1);
  color: var(--ink-2);
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
  color: var(--purple);
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
[data-theme='dark'] .hint-box {
  background: var(--bg-warning);
  color: var(--text-warning);
}
.idea-box {
  background: #eef6ff;
  border: 1px solid #c9e0ff;
  color: #1c4f8a;
}
[data-theme='dark'] .idea-box {
  background: var(--bg-accent);
  color: var(--ink-2);
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
  background: var(--surface-1);
  border: 1px solid rgba(108, 92, 231, 0.15);
  color: var(--ink-2);
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
  background: var(--surface-1);
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
  color: var(--ink);
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
  color: var(--purple);
  background: var(--surface);
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
  color: var(--ink-2);
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
  color: var(--purple);
  margin-right: 5px;
}
.reco-text {
  color: var(--ink);
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
  background: var(--surface);
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
  color: var(--ink);
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
  background: var(--surface);
  color: var(--purple);
  border-radius: 9px;
  padding: 6px;
  cursor: pointer;
}
.wp-actions button:hover {
  background: #f5f3ff;
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
  background: var(--muted-2);
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

@media (max-width: 560px) {
  .bubble {
    max-width: 86%;
  }
}
</style>
