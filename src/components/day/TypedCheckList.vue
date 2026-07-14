<script setup>
/**
 * Danh sách bài GÕ ĐÁP ÁN — CHẤM NGAY tại chỗ. Dùng cho:
 *  - Listening: nghe (TTS) rồi gõ lại (listenMode) — vd nghe chữ cái, gõ chữ.
 *  - Homework dịch: đọc câu tiếng Việt, gõ câu tiếng Anh.
 *
 * Cơ chế theo yêu cầu: gõ → bấm "Kiểm tra" → nếu SAI mới hiện đáp án; khi học
 * viên GÕ LẠI thì ẩn đáp án đi (buộc tự nhớ); ĐÚNG thì khóa câu đó lại. Khi tất
 * cả câu đều đúng, phát 'done' và hiện huy hiệu "đã hoàn thành".
 */
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'

const props = defineProps({
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  intro: { type: String, default: '' },
  // [{ q?: prompt hiển thị, say?: chuỗi để TTS đọc, answer: string|string[], hint?: string }]
  items: { type: Array, default: () => [] },
  // Chế độ nghe: ẩn q, hiện nút 🔊 to để nghe rồi gõ lại.
  listenMode: { type: Boolean, default: false },
  doneLabel: { type: String, default: 'Đã hoàn thành' },
  // graded=false: phiếu làm bài CHỈ ĐỂ ĐIỀN (chưa có đáp án để chấm) — không nút
  // "Kiểm tra", không hiện đáp án. Dùng cho bài nghe bản ghi thật khi chưa có key.
  graded: { type: Boolean, default: true },
})
const emit = defineEmits(['done'])

const speakable = canSpeak()

// Chuẩn hóa để so đáp án: thường hóa, bỏ dấu câu, gộp khoảng trắng.
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
// Bản "lỏng": bỏ mạo từ a/an/the để chấp nhận khác biệt nhỏ khi dịch.
function normLoose(s) {
  return norm(s)
    .split(' ')
    .filter((w) => !['a', 'an', 'the'].includes(w))
    .join(' ')
}
function accepts(item) {
  const raw = Array.isArray(item.answer) ? item.answer : String(item.answer || '').split('/')
  return raw.map((a) => a.trim()).filter(Boolean)
}

const typed = ref([])
const status = ref([]) // null | 'ok' | 'wrong'
watch(
  () => props.items,
  (v) => {
    typed.value = v.map(() => '')
    status.value = v.map(() => null)
  },
  { immediate: true },
)

const okCount = computed(() => status.value.filter((s) => s === 'ok').length)
const filledCount = computed(() => typed.value.filter((t) => t && t.trim()).length)
const badgeCount = computed(() => (props.graded ? okCount.value : filledCount.value))
const allDone = computed(() => props.graded && props.items.length > 0 && okCount.value === props.items.length)
let emitted = false
watch(allDone, (v) => {
  if (v && !emitted) {
    emitted = true
    emit('done')
  }
})

function check(i) {
  const val = typed.value[i]
  if (!val || !val.trim()) return
  const acc = accepts(props.items[i])
  const t = norm(val)
  const tl = normLoose(val)
  const ok = acc.some((a) => norm(a) === t || normLoose(a) === tl)
  status.value[i] = ok ? 'ok' : 'wrong'
}
function onInput(i) {
  // Bắt đầu gõ lại sau khi sai -> ẩn đáp án, buộc tự nhớ.
  if (status.value[i] === 'wrong') status.value[i] = null
}
function say(i) {
  const s = props.items[i].say || props.items[i].answer
  if (speakable && s) speak(Array.isArray(s) ? s[0] : s)
}
function firstAnswer(i) {
  return accepts(props.items[i])[0] || ''
}
</script>

<template>
  <section class="step-card" :class="{ current: !allDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: allDone }">{{ eyebrow }}</div>
        <h2 class="step-title">{{ title }}</h2>
      </div>
      <span class="wt-badge" :class="{ ok: allDone }">{{ badgeCount }}/{{ items.length }}</span>
    </div>
    <p v-if="intro" class="quiz-intro">{{ intro }}</p>

    <slot />

    <ol class="tc-list">
      <li v-for="(it, i) in items" :key="i" class="tc-item" :class="status[i]">
        <div class="tc-prompt">
          <button v-if="listenMode || it.say" class="tc-say" @click="say(i)" :disabled="!speakable" aria-label="Nghe">
            🔊 <span v-if="listenMode">Nghe</span>
          </button>
          <span v-if="!listenMode && it.q" class="tc-q">{{ it.q }}</span>
          <span v-if="it.hint" class="tc-hint">({{ it.hint }})</span>
        </div>
        <div class="tc-row">
          <input
            v-model="typed[i]"
            class="tc-input"
            :class="[status[i], { filled: !graded && typed[i] && typed[i].trim() }]"
            :disabled="graded && status[i] === 'ok'"
            type="text"
            :placeholder="listenMode ? 'Gõ những gì bạn nghe…' : 'Gõ câu trả lời…'"
            @input="onInput(i)"
            @keyup.enter="graded && check(i)"
          />
          <template v-if="graded">
            <button v-if="status[i] !== 'ok'" class="tc-btn" @click="check(i)">Kiểm tra</button>
            <span v-else class="tc-ok">✓</span>
          </template>
        </div>
        <div v-if="graded && status[i] === 'wrong'" class="tc-answer">
          💡 Đáp án: <b @click="say(i)">{{ firstAnswer(i) }}</b> — gõ lại cho đúng nhé (đáp án sẽ ẩn khi bạn gõ).
        </div>
      </li>
    </ol>

    <div v-if="allDone" class="gate-line ok">✅ {{ doneLabel }}</div>
  </section>
</template>

<style scoped>
.tc-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.tc-item {
  border-bottom: 1px dashed var(--line);
  padding-bottom: 12px;
}
.tc-item:last-child {
  border-bottom: none;
}
.tc-prompt {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14.5px;
  color: var(--ink);
  margin-bottom: 8px;
}
.tc-q {
  font-weight: 600;
}
.tc-hint {
  color: #6c5ce7;
  font-weight: 700;
  font-size: 13px;
}
.tc-say {
  border: 1px solid rgba(108, 92, 231, 0.3);
  background: rgba(108, 92, 231, 0.08);
  color: #6c5ce7;
  font-weight: 700;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  min-height: 40px;
}
.tc-say:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tc-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.tc-input {
  flex: 1;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
  font-family: inherit;
  background: var(--surface);
  color: var(--ink);
  min-width: 0;
}
.tc-input.ok {
  border-color: #00d68f;
  background: rgba(0, 214, 143, 0.08);
}
.tc-input.wrong {
  border-color: #ff6b6b;
}
.tc-input.filled {
  border-color: rgba(108, 92, 231, 0.5);
  background: rgba(108, 92, 231, 0.05);
}
.tc-btn {
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 42px;
}
.tc-ok {
  color: #00966a;
  font-size: 20px;
  font-weight: 900;
  width: 42px;
  text-align: center;
}
.tc-answer {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--text-danger, #d1495b);
}
.tc-answer b {
  cursor: pointer;
  text-decoration: underline dotted;
}
</style>
