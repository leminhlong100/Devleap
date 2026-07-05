<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { correctWriting } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { requiredSentencesFor } from '@/lib/dayPlan'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

// Chỉ mount khi cha đã xác nhận `plan.writing && writingTask` (xem IeltsDayView.vue)
// nên trong component này `writingTask` luôn tồn tại.
const props = defineProps({ day: { type: Object, required: true } })
const user = useUserStore()
const { isOnline } = useOnlineStatus()

const writingTask = computed(() => props.day.writingTask)
const requiredSentences = computed(() => requiredSentencesFor(writingTask.value?.prompt))

const writingText = ref('')
// Nạp bản nháp đã lưu khi đổi buổi (component không remount khi điều hướng
// giữa các buổi trong cùng route `ielts-day`, nên phải watch `day` để nạp lại).
watch(
  () => props.day,
  (cur) => {
    if (cur) writingText.value = user.writingOf('ielts', cur.week, cur.n)?.text || ''
  },
  { immediate: true },
)
// Đếm câu đã viết: tách theo dòng / dấu kết câu, mỗi câu phải có ≥ 2 từ.
const writtenCount = computed(
  () =>
    writingText.value
      .split(/[\n.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2).length,
)
const writingMet = computed(() => writtenCount.value >= requiredSentences.value)
// `plan.writing && writingTask` (writingNeeded) luôn true trong ngữ cảnh component
// này tồn tại — nên rút gọn thành thẳng cờ "đã nộp" của store.
const writingDone = computed(() => user.writingDone('ielts', props.day.week, props.day.n))
const writingReview = computed(() => user.writingOf('ielts', props.day.week, props.day.n)?.review)
const reviewing = ref(false)
const reviewError = ref('')

function saveWritingDraft() {
  user.saveWriting('ielts', props.day.week, props.day.n, writingText.value, false)
}

// —— GIÀN GIÁO cho bài viết: người mới không phải viết từ con số 0 ——
const writingModel = computed(() => (props.day.grammarExamples || []).slice(0, 3))
const writingFrames = computed(() => (props.day.sentenceBank || []).slice(0, 6))
const LINK_WORDS = ['and', 'but', 'because', 'so', 'also', 'then']
function insertWriting(text) {
  const clean = String(text || '').replace(/[….]+\s*$/, '').trim()
  const cur = writingText.value
  writingText.value = !cur ? clean : cur.replace(/\s*$/, '') + '\n' + clean
  saveWritingDraft()
}
function appendWord(w) {
  writingText.value = (writingText.value.replace(/\s*$/, '') + ' ' + w + ' ').replace(/[ \t]+/g, ' ')
  saveWritingDraft()
}
// Nộp bài -> nhờ AI chữa từng câu; chữa xong mới tính là hoàn thành bài viết.
async function askAiCorrect() {
  if (!writingMet.value || reviewing.value || !isOnline.value) return
  reviewing.value = true
  reviewError.value = ''
  try {
    const review = await correctWriting(writingText.value, {
      title: props.day.title,
      week: props.day.week,
      weekTitle: props.day.weekTitle,
      grammar: props.day.grammar.map((g) => g.title),
      vocab: props.day.vocab.map((v) => v.term),
    })
    if (!review) throw new Error('AI chưa trả về kết quả. Thử lại nhé.')
    user.saveWriting('ielts', props.day.week, props.day.n, writingText.value, true, review)
  } catch (e) {
    reviewError.value = friendlyAiError(e).message
  } finally {
    reviewing.value = false
  }
}

// Gạch chân chủ ngữ (1 gạch) + động từ (2 gạch) trong câu AI đã sửa.
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function svHtml(l) {
  const text = l?.corrected || ''
  const marks = []
  for (const [field, cls] of [['subject', 'u-subj'], ['verb', 'u-verb']]) {
    const frag = (l?.[field] || '').trim()
    if (!frag) continue
    const start = text.indexOf(frag)
    if (start >= 0) marks.push({ start, end: start + frag.length, cls })
  }
  marks.sort((a, b) => a.start - b.start)
  const clean = []
  let lastEnd = -1
  for (const mk of marks) {
    if (mk.start >= lastEnd) {
      clean.push(mk)
      lastEnd = mk.end
    }
  }
  let out = ''
  let pos = 0
  for (const mk of clean) {
    out += escapeHtml(text.slice(pos, mk.start))
    out += `<span class="${mk.cls}">${escapeHtml(text.slice(mk.start, mk.end))}</span>`
    pos = mk.end
  }
  out += escapeHtml(text.slice(pos))
  return out
}
</script>

<template>
  <!-- BÀI TẬP VIẾT — làm ngay tại bài (bắt buộc nộp để qua buổi) -->
  <section class="step-card" :class="{ current: !writingDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: writingDone }">LÀM NGAY TẠI BÀI</div>
        <h2 class="step-title">✍️ Bài tập viết</h2>
      </div>
      <span class="wt-badge" :class="{ ok: writingDone }">{{ writingDone ? '✅ Đã nộp' : `${writtenCount}/${requiredSentences} câu` }}</span>
    </div>
    <p class="quiz-intro">{{ writingTask.prompt }}</p>

    <!-- GIÀN GIÁO — giúp người mới bắt đầu, không phải nghĩ từ con số 0 -->
    <div class="wt-scaffold">
      <div v-if="writingModel.length" class="wt-help">
        <div class="wt-help-label">📖 Viết giống mẫu này (bấm để chèn):</div>
        <ul class="wt-model">
          <li v-for="(m, i) in writingModel" :key="i" @click="insertWriting(m)">
            <span>{{ m }}</span><span class="wt-ins">+ chèn</span>
          </li>
        </ul>
      </div>
      <div v-if="writingFrames.length" class="wt-help">
        <div class="wt-help-label">💡 Bí ý? Bấm một khung câu rồi viết tiếp cho đúng với em:</div>
        <div class="wt-frames">
          <button v-for="(f, i) in writingFrames" :key="i" class="wt-frame" @click="insertWriting(f)">
            {{ f.replace(/[….]+\s*$/, '') }}…
          </button>
        </div>
      </div>
      <div class="wt-help">
        <div class="wt-help-label">🔗 Từ nối cho câu mượt hơn:</div>
        <div class="wt-frames">
          <button v-for="(w, i) in LINK_WORDS" :key="i" class="wt-link" @click="appendWord(w)">{{ w }}</button>
        </div>
      </div>
    </div>

    <textarea
      v-model="writingText"
      class="write-area"
      rows="8"
      placeholder="Bấm một câu mẫu hoặc khung câu ở trên để bắt đầu, rồi sửa cho đúng với em…"
      @change="saveWritingDraft"
    ></textarea>
    <div class="write-foot">
      <span class="write-count" :class="{ ok: writingMet }">✍️ {{ writtenCount }}/{{ requiredSentences }} câu</span>
      <button
        class="green-btn"
        :class="{ locked: !writingMet || reviewing || !isOnline }"
        :disabled="!writingMet || reviewing || !isOnline"
        :title="!isOnline && writingMet ? 'Cần có mạng để AI chữa bài' : undefined"
        @click="askAiCorrect"
      >
        {{ reviewing ? '🤖 AI đang chữa…' : !isOnline && writingMet ? '🔌 Cần có mạng' : writingDone ? '↻ Nhờ AI chữa lại' : writingMet ? '🤖 Nhờ AI chữa bài' : `Cần thêm ${Math.max(0, requiredSentences - writtenCount)} câu` }}
      </button>
    </div>
    <div v-if="reviewError" class="rev-error">⚠️ {{ reviewError }}</div>

    <!-- KẾT QUẢ AI CHỮA BÀI -->
    <div v-if="writingReview" class="review">
      <div class="rev-top">
        <span class="rev-cefr">{{ writingReview.cefr || '—' }}</span>
        <div class="rev-score-wrap">
          <div class="rev-score-bar"><div class="rev-score-fill" :style="{ width: (writingReview.score || 0) + '%' }"></div></div>
          <span class="rev-score-num">{{ writingReview.score ?? 0 }}/100</span>
        </div>
      </div>
      <p v-if="writingReview.summary" class="rev-summary">{{ writingReview.summary }}</p>
      <div class="rev-legend">Gạch chân: <span class="u-subj">chủ ngữ</span> · <span class="u-verb">động từ</span></div>
      <ul class="rev-lines">
        <li v-for="(l, i) in writingReview.lines || []" :key="i" class="rev-line" :class="{ ok: l.ok }">
          <div v-if="!l.ok && l.corrected !== l.original" class="rev-orig"><s>{{ l.original }}</s></div>
          <div class="rev-corr"><span class="rev-mark">{{ l.ok ? '✓' : '✕' }}</span><span v-html="svHtml(l)"></span></div>
          <div v-if="l.note" class="rev-note">💡 {{ l.note }}</div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.wt-scaffold {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--purple-soft);
  border: 1px solid rgba(108, 92, 231, 0.15);
  border-radius: 14px;
  padding: 16px;
}
.wt-help-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
  margin-bottom: 8px;
}
.wt-model {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wt-model li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.15s;
}
.wt-model li:hover {
  border-color: var(--purple);
}
.wt-ins {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  white-space: nowrap;
}
.wt-frames {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wt-frame,
.wt-link {
  border: 1px solid rgba(108, 92, 231, 0.3);
  background: var(--surface);
  color: var(--purple-deep);
  border-radius: 99px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.wt-frame:hover,
.wt-link:hover {
  background: var(--purple-soft);
}
.wt-link {
  border-color: rgba(0, 184, 217, 0.4);
  color: #0a7c93;
}
.wt-link:hover {
  background: rgba(0, 184, 217, 0.08);
}
.write-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.write-count {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--muted-2);
}
.write-count.ok {
  color: #00a86f;
}
.rev-error {
  margin-top: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: #e04848;
  background: rgba(255, 90, 90, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
}
.review {
  margin-top: 18px;
  border-top: 1px solid rgba(108, 92, 231, 0.1);
  padding-top: 18px;
}
.rev-top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.rev-cefr {
  background: var(--grad-purple);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 99px;
  flex: none;
}
.rev-score-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 160px;
}
.rev-score-bar {
  flex: 1;
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg);
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
  font-weight: 800;
  color: #00966a;
  flex: none;
}
.rev-summary {
  margin-top: 12px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
  background: var(--bg);
  border-left: 3px solid var(--purple);
  border-radius: 12px;
  padding: 12px 15px;
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
  border: 1px solid rgba(255, 107, 107, 0.25);
  background: rgba(255, 90, 90, 0.04);
  border-radius: 12px;
  padding: 11px 14px;
}
.rev-line.ok {
  border-color: rgba(0, 214, 143, 0.25);
  background: rgba(0, 214, 143, 0.05);
}
.rev-legend {
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.rev-orig {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--muted-3);
}
.rev-orig s {
  text-decoration-color: rgba(255, 107, 107, 0.6);
}
.rev-mark {
  font-weight: 900;
  color: #e04848;
  margin-right: 7px;
}
.rev-line.ok .rev-mark {
  color: #00a86f;
}
.rev-corr {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.7;
}
/* gạch chân: chủ ngữ 1 gạch, động từ 2 gạch */
.u-subj {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  text-decoration-color: var(--purple);
}
.u-verb {
  text-decoration: underline double;
  text-underline-offset: 3px;
  text-decoration-color: #00a86f;
}
.rev-note {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--slate);
}
</style>
