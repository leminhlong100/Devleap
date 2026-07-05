<script setup>
import { ref, computed, watch } from 'vue'
import { recognizeOnce, recognitionSupported } from '@/lib/speechRecognize'
import { correctWriting } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import SpeechSupportNote from '@/components/common/SpeechSupportNote.vue'

const props = defineProps({
  prompts: { type: Array, default: () => [] }, // câu mở đầu: "I usually…"
  context: { type: Object, default: () => ({}) }, // ngữ cảnh cho AI chữa
})
const emit = defineEmits(['done'])
const { isOnline } = useOnlineStatus()

// Lấy tối đa 8 câu mở đầu cho một buổi.
const starters = computed(() => props.prompts.filter(Boolean).slice(0, 8))
const recordable = recognitionSupported()

const answers = ref([])
watch(starters, (v) => (answers.value = v.map(() => '')), { immediate: true })

// Câu hoàn chỉnh = phần mở đầu (bỏ dấu …) + phần học viên viết.
function fullSentence(i) {
  const head = starters.value[i].replace(/[….]+\s*$/, '').trim()
  const tail = (answers.value[i] || '').trim()
  return tail ? `${head} ${tail}`.replace(/\s+/g, ' ').trim() : ''
}

const filledCount = computed(() => answers.value.filter((a) => a && a.trim().length >= 2).length)

const busyIndex = ref(-1)
const micError = ref('') // lỗi ghi âm gần nhất — KHÔNG phải lỗi AI (Web Speech API), nhưng vẫn phải báo, không nuốt im lặng
async function speakInto(i) {
  if (!recordable || busyIndex.value >= 0) return
  busyIndex.value = i
  micError.value = ''
  try {
    const { promise } = recognizeOnce({ lang: 'en-US' })
    const heard = await promise
    if (heard) answers.value[i] = heard
    else micError.value = 'Không nghe rõ, thử lại hoặc gõ tay nhé.'
  } catch {
    micError.value = 'Không dùng được mic lúc này (trình duyệt chặn quyền hoặc không hỗ trợ) — gõ tay nhé.'
  } finally {
    busyIndex.value = -1
  }
}

// —— Nhờ AI chữa toàn bộ câu đã viết ——
const reviewing = ref(false)
const review = ref(null)
const reviewError = ref('')

async function askAi() {
  const sentences = starters.value.map((_, i) => fullSentence(i)).filter(Boolean)
  if (sentences.length < 3 || reviewing.value || !isOnline.value) {
    reviewError.value = sentences.length < 3 ? 'Hoàn thành ít nhất 3 câu rồi nhờ AI chữa nhé.' : ''
    return
  }
  reviewing.value = true
  reviewError.value = ''
  try {
    const r = await correctWriting(sentences.join('\n'), props.context)
    if (!r) throw new Error('AI chưa trả về kết quả. Thử lại nhé.')
    review.value = r
    isDone.value = true
    emit('done')
  } catch (e) {
    reviewError.value = friendlyAiError(e).message
  } finally {
    reviewing.value = false
  }
}

const isDone = ref(false)
</script>

<template>
  <section v-if="starters.length" class="step-card" :class="{ current: !isDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: isDone }">ĐẶT CÂU · NÓI/VIẾT THẬT</div>
        <h2 class="step-title">✍️ Hoàn thành câu về bản thân</h2>
      </div>
      <span class="wt-badge" :class="{ ok: filledCount >= 3 }">{{ filledCount }}/{{ starters.length }}</span>
    </div>
    <p class="quiz-intro">
      Viết tiếp mỗi câu cho ĐÚNG VỚI EM (gõ hoặc bấm 🎤 để nói). Xong bấm <b>Nhờ AI chữa</b> để được sửa từng câu + chấm trình độ.
    </p>
    <SpeechSupportNote
      :visible="!recordable"
      text="Trình duyệt chưa hỗ trợ nói-thành-chữ — không sao, cứ gõ tay vào ô bên dưới."
    />

    <div class="sb-list">
      <div v-for="(s, i) in starters" :key="i" class="sb-row">
        <div class="sb-num">{{ i + 1 }}</div>
        <div class="sb-head">{{ s.replace(/[….]+\s*$/, '') }}…</div>
        <div class="sb-input-wrap">
          <input v-model="answers[i]" class="sb-input" placeholder="…viết tiếp cho đúng với em" />
          <button
            v-if="recordable"
            class="sb-mic"
            :class="{ rec: busyIndex === i }"
            @click="speakInto(i)"
            :disabled="busyIndex >= 0 && busyIndex !== i"
            aria-label="Nói để điền"
          >
            {{ busyIndex === i ? '●' : '🎤' }}
          </button>
        </div>
      </div>
    </div>
    <p v-if="micError" class="mic-err">🎤 {{ micError }}</p>

    <div class="sb-foot">
      <button
        class="green-btn"
        :class="{ locked: filledCount < 3 || reviewing || !isOnline }"
        :disabled="filledCount < 3 || reviewing || !isOnline"
        :title="!isOnline && filledCount >= 3 ? 'Cần có mạng để AI chữa câu' : undefined"
        @click="askAi"
      >
        {{ reviewing ? '🤖 AI đang chữa…' : !isOnline && filledCount >= 3 ? '🔌 Cần có mạng' : review ? '↻ Nhờ AI chữa lại' : filledCount >= 3 ? '🤖 Nhờ AI chữa câu' : `Cần thêm ${3 - filledCount} câu` }}
      </button>
    </div>
    <div v-if="reviewError" class="rev-error">⚠️ {{ reviewError }}</div>

    <!-- KẾT QUẢ AI CHỮA -->
    <div v-if="review" class="review">
      <div class="rev-top">
        <span class="rev-cefr">{{ review.cefr || '—' }}</span>
        <div class="rev-score-wrap">
          <div class="rev-score-bar"><div class="rev-score-fill" :style="{ width: (review.score || 0) + '%' }"></div></div>
          <span class="rev-score-num">{{ review.score ?? 0 }}/100</span>
        </div>
      </div>
      <p v-if="review.summary" class="rev-summary">{{ review.summary }}</p>
      <ul class="rev-lines">
        <li v-for="(l, i) in review.lines || []" :key="i" class="rev-line" :class="{ ok: l.ok }">
          <div v-if="!l.ok && l.corrected !== l.original" class="rev-orig"><s>{{ l.original }}</s></div>
          <div class="rev-corr"><span class="rev-mark">{{ l.ok ? '✓' : '✕' }}</span>{{ l.corrected }}</div>
          <div v-if="l.note" class="rev-note">💡 {{ l.note }}</div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.sb-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.sb-row {
  display: grid;
  grid-template-columns: 20px auto 1fr;
  align-items: center;
  gap: 10px;
}
.sb-num {
  font-size: 12px;
  color: var(--text-muted);
}
.sb-head {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}
.sb-input-wrap {
  display: flex;
  gap: 6px;
}
.sb-input {
  flex: 1;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 16px;
  background: var(--surface-2);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
}
.sb-input:focus {
  border-color: var(--border-accent);
}
.sb-mic {
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  border-radius: 8px;
  padding: 0 11px;
  font-size: 14px;
  cursor: pointer;
}
.sb-mic.rec {
  background: var(--bg-danger);
  border-color: var(--border-danger);
  color: var(--text-danger);
}
@media (max-width: 560px) {
  .sb-row {
    grid-template-columns: 20px 1fr;
  }
  .sb-head {
    white-space: normal;
  }
  .sb-input-wrap {
    grid-column: 1 / -1;
  }
}

.mic-err {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--text-danger);
}

/* —— Kết quả AI chữa (style cục bộ vì component scoped riêng) —— */
.rev-error {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-danger);
  background: var(--bg-danger);
  border-radius: 10px;
  padding: 10px 14px;
}
.review {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
.rev-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rev-cefr {
  background: var(--fill-accent, #2f6df6);
  color: #fff;
  font-weight: 500;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 99px;
  flex: none;
}
.rev-score-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rev-score-bar {
  flex: 1;
  height: 8px;
  border-radius: 99px;
  background: var(--surface-1);
  overflow: hidden;
}
.rev-score-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #00d68f, #00a86f);
  transition: width 0.4s;
}
.rev-score-num {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.rev-summary {
  margin: 12px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.rev-lines {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rev-line {
  border: 1px solid var(--border-danger);
  background: var(--bg-danger);
  border-radius: 12px;
  padding: 11px 14px;
}
.rev-line.ok {
  border-color: var(--border-success);
  background: var(--bg-success);
}
.rev-orig {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.rev-mark {
  font-weight: 700;
  margin-right: 6px;
  color: var(--text-danger);
}
.rev-line.ok .rev-mark {
  color: var(--text-success);
}
.rev-corr {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
}
.rev-note {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
