<script setup>
/**
 * Bài tập ĐỌC HIỂU — chế độ ACTIVE RECALL (Day 2 trở đi).
 *
 * Khác sách in: đề KHÔNG đưa sẵn đoạn văn chứa đáp án + từ khóa nữa. Học viên phải
 * đọc CẢ bài đọc ở trên rồi tự tìm câu trả lời. Đoạn văn gợi ý & từ khóa trở thành
 * "phao" TỰ CHỌN — bấm mới hiện, và có bấm thì câu đó tính là "có dùng gợi ý"
 * (không còn là "tự lực"). Sau khi trả lời ĐÚNG mới hé lộ bằng chứng (đoạn văn +
 * câu trả lời mẫu) để đối chiếu.
 *
 * Chấm: gõ → "Kiểm tra" → SAI mới hiện đáp án ngắn; GÕ LẠI thì ẩn đáp án (buộc tự
 * nhớ); ĐÚNG thì khóa câu + hé lộ bằng chứng. Đúng hết → phát 'done' (cổng qua buổi).
 * So khớp khoan dung: bỏ dấu câu/hoa-thường + bản "lỏng" bỏ a/an/the.
 */
import { ref, computed, watch } from 'vue'
import { speak, canSpeak } from '@/lib/speak'
import { checkParaphrase } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const props = defineProps({
  // [{ n, title, question, questionVi, passage, passageVi, keywords[], answer[], model }]
  items: { type: Array, default: () => [] },
  eyebrow: { type: String, default: 'HOMEWORK · ĐỌC HIỂU · BẮT BUỘC' },
  title: { type: String, default: '📖 Đọc hiểu — tự tìm trong bài' },
  intro: { type: String, default: '' },
})
const emit = defineEmits(['done', 'mistake'])

const speakable = canSpeak()
const { isOnline } = useOnlineStatus()

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function normLoose(s) {
  return norm(s)
    .split(' ')
    .filter((w) => !['a', 'an', 'the'].includes(w))
    .join(' ')
}
function accepts(item) {
  return Array.isArray(item.answer) ? item.answer.map((a) => a.trim()).filter(Boolean) : []
}

const typed = ref([])
const status = ref([]) // null | 'ok' | 'wrong'
const showVi = ref([]) // hé lộ bản dịch của đoạn gợi ý
const showPassage = ref([]) // "phao" 1: đoạn văn chứa đáp án
const showKeys = ref([]) // "phao" 2: từ khóa gợi ý
const usedHint = ref([]) // đã bấm ít nhất một "phao" cho câu này
const aiChecking = ref([]) // đang nhờ AI kiểm tra nghĩa
const aiMsg = ref([]) // thông báo kết quả AI ('' | 'no')
watch(
  () => props.items,
  (v) => {
    typed.value = v.map(() => '')
    status.value = v.map(() => null)
    showVi.value = v.map(() => false)
    showPassage.value = v.map(() => false)
    showKeys.value = v.map(() => false)
    usedHint.value = v.map(() => false)
    aiChecking.value = v.map(() => false)
    aiMsg.value = v.map(() => '')
  },
  { immediate: true },
)

const okCount = computed(() => status.value.filter((s) => s === 'ok').length)
// Số câu làm đúng mà KHÔNG dùng phao — thước đo "tự lực" để tạo động lực đọc thật.
const soloCount = computed(
  () => props.items.filter((_, i) => status.value[i] === 'ok' && !usedHint.value[i]).length,
)
const allDone = computed(() => props.items.length > 0 && okCount.value === props.items.length)
let emitted = false
watch(allDone, (v) => {
  if (v && !emitted) {
    emitted = true
    emit('done')
  }
})

function revealPassage(i) {
  showPassage.value[i] = true
  usedHint.value[i] = true
}
function revealKeys(i) {
  showKeys.value[i] = true
  usedHint.value[i] = true
}
function check(i) {
  const val = typed.value[i]
  if (!val || !val.trim()) return
  const acc = accepts(props.items[i])
  const t = norm(val)
  const tl = normLoose(val)
  const ok = acc.some((a) => norm(a) === t || normLoose(a) === tl)
  status.value[i] = ok ? 'ok' : 'wrong'
  // Trả lời đúng → hé lộ luôn đoạn văn bằng chứng để đối chiếu (không tính là dùng phao).
  if (ok) showPassage.value[i] = true
  // Trả lời sai → ghi vào "sổ lỗi" để ôn ngắt quãng ở các buổi sau.
  else emit('mistake', { n: props.items[i]?.n || i + 1, q: props.items[i]?.question || '', answer: firstAnswer(i) })
}
function onInput(i) {
  if (status.value[i] === 'wrong') status.value[i] = null
  aiMsg.value[i] = ''
}
// Nhờ AI xem câu trả lời có CÙNG NGHĨA với đáp án không (chấp nhận paraphrase).
async function aiCheck(i) {
  if (aiChecking.value[i] || !isOnline.value) return
  const val = typed.value[i]
  if (!val || !val.trim()) return
  aiChecking.value[i] = true
  aiMsg.value[i] = ''
  try {
    const expected = firstAnswer(i) || props.items[i]?.model || ''
    const ok = await checkParaphrase(expected, val)
    if (ok) {
      status.value[i] = 'ok'
      showPassage.value[i] = true
    } else {
      aiMsg.value[i] = 'no'
    }
  } catch (e) {
    aiMsg.value[i] = friendlyAiError(e).message
  } finally {
    aiChecking.value[i] = false
  }
}
function readAloud(i) {
  const p = props.items[i]
  if (speakable && p?.passage) speak(p.passage, 0.9)
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
      <span class="wt-badge" :class="{ ok: allDone }">{{ okCount }}/{{ items.length }}</span>
    </div>
    <p class="quiz-intro">
      {{ intro || 'Đọc kỹ bài đọc ở trên, rồi tự tìm câu trả lời — đừng vội bấm phao. Bí quá mới mở “đoạn gợi ý” hoặc “từ khóa”. Sai sẽ hiện đáp án; gõ lại thì ẩn đi. Làm đúng hết để hoàn thành buổi.' }}
    </p>
    <div class="rh-solo" :class="{ perfect: allDone && soloCount === items.length }">
      🏅 Tự lực: <b>{{ soloCount }}/{{ items.length }}</b>
      <span class="rh-solo-hint">(làm đúng mà không mở phao)</span>
    </div>

    <ol class="rh-list">
      <li v-for="(it, i) in items" :key="i" class="rh-item" :class="status[i]">
        <div class="rh-top">
          <span class="rh-badge">Bài tập {{ it.n || i + 1 }}</span>
          <span v-if="it.title" class="rh-topic">{{ it.title }}</span>
          <span v-if="status[i] === 'ok'" class="rh-tag" :class="usedHint[i] ? 'hint' : 'solo'">
            {{ usedHint[i] ? '✓ có phao' : '🏅 tự lực' }}
          </span>
        </div>

        <div class="rh-q">
          <span class="rh-q-en">{{ it.question }}</span>
          <span v-if="it.questionVi" class="rh-q-vi">{{ it.questionVi }}</span>
        </div>

        <!-- PHAO (tự chọn) — chỉ hiện khi bấm; bấm là câu tính "có phao" -->
        <div v-if="status[i] !== 'ok'" class="rh-hints">
          <button v-if="it.passage && !showPassage[i]" class="rh-hint-btn" @click="revealPassage(i)">
            🔍 Xem đoạn gợi ý
          </button>
          <button v-if="it.keywords && it.keywords.length && !showKeys[i]" class="rh-hint-btn" @click="revealKeys(i)">
            🔑 Xem từ khóa
          </button>
        </div>

        <article v-if="showPassage[i] && it.passage" class="rh-passage">
          <p class="rh-passage-en">{{ it.passage }}</p>
          <button
            v-if="speakable"
            class="rh-listen"
            @click="readAloud(i)"
            aria-label="Nghe đọc đoạn văn"
          >
            🔊 Nghe đọc
          </button>
          <button v-if="it.passageVi" class="rh-vi-toggle" @click="showVi[i] = !showVi[i]">
            {{ showVi[i] ? 'Ẩn bản dịch' : 'Xem bản dịch' }}
          </button>
          <p v-if="showVi[i] && it.passageVi" class="rh-passage-vi">{{ it.passageVi }}</p>
        </article>

        <div v-if="showKeys[i] && it.keywords && it.keywords.length" class="rh-keys">
          <span class="rh-keys-label">🔑 Từ khóa gợi ý:</span>
          <span v-for="(k, ki) in it.keywords" :key="ki" class="rh-key">{{ k }}</span>
        </div>

        <div class="rh-row">
          <input
            v-model="typed[i]"
            class="rh-input"
            :class="status[i]"
            :disabled="status[i] === 'ok'"
            type="text"
            placeholder="Gõ cụm từ trả lời chính…"
            @input="onInput(i)"
            @keyup.enter="check(i)"
          />
          <button v-if="status[i] !== 'ok'" class="rh-btn" @click="check(i)">Kiểm tra</button>
          <span v-else class="rh-ok">✓</span>
        </div>

        <div v-if="status[i] === 'wrong'" class="rh-answer">
          💡 Đáp án: <b>{{ firstAnswer(i) }}</b> — gõ lại cho đúng nhé (đáp án sẽ ẩn khi bạn gõ).
          <div class="rh-ai">
            <button
              v-if="isOnline && !aiChecking[i]"
              class="rh-ai-btn"
              type="button"
              @click="aiCheck(i)"
            >
              🤖 Câu của tôi cùng nghĩa mà? Nhờ AI kiểm tra
            </button>
            <span v-else-if="aiChecking[i]" class="rh-ai-loading">🤖 AI đang kiểm tra…</span>
            <span v-if="aiMsg[i] === 'no'" class="rh-ai-no">AI: chưa cùng nghĩa với đáp án — thử diễn đạt lại nhé.</span>
            <span v-else-if="aiMsg[i]" class="rh-ai-no">⚠️ {{ aiMsg[i] }}</span>
          </div>
        </div>
        <div v-if="status[i] === 'ok' && it.model" class="rh-model">
          ✓ Câu trả lời mẫu: <b>{{ it.model }}</b>
        </div>
      </li>
    </ol>

    <div v-if="allDone" class="gate-line ok">
      {{ soloCount === items.length ? '🏅 Xuất sắc — đúng hết mà không cần phao!' : '✅ Đã hoàn thành bài đọc hiểu — dùng từ khóa chính xác!' }}
    </div>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.rh-solo {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-2);
}
.rh-solo b {
  color: #00966a;
  font-weight: 900;
}
.rh-solo.perfect b {
  color: #f5a623;
}
.rh-solo-hint {
  font-weight: 600;
  color: var(--muted-3);
  font-size: 12px;
}
.rh-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.rh-item {
  border-top: 1px dashed var(--line);
  padding-top: 18px;
}
.rh-item:first-child {
  border-top: none;
  padding-top: 6px;
}
.rh-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rh-badge {
  background: #1e1e2e;
  color: #fff;
  font-weight: 800;
  font-size: 11.5px;
  letter-spacing: 0.5px;
  padding: 4px 11px;
  border-radius: 8px;
}
.rh-topic {
  font-weight: 800;
  font-size: 14.5px;
  color: var(--ink);
}
.rh-tag {
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 99px;
}
.rh-tag.solo {
  background: rgba(245, 166, 35, 0.14);
  color: #b5730b;
}
.rh-tag.hint {
  background: rgba(108, 92, 231, 0.1);
  color: #6c5ce7;
}
.rh-q {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.rh-q-en {
  font-weight: 800;
  font-size: 15.5px;
  color: var(--ink);
}
.rh-q-vi {
  font-size: 13.5px;
  color: var(--muted);
}
.rh-hints {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rh-hint-btn {
  border: 1px dashed rgba(108, 92, 231, 0.45);
  background: var(--surface);
  color: #6c5ce7;
  border-radius: 99px;
  padding: 7px 14px;
  min-height: 40px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.rh-hint-btn:active {
  background: rgba(108, 92, 231, 0.08);
}
.rh-passage {
  margin-top: 12px;
  background: var(--bg);
  border: 1px solid rgba(0, 214, 143, 0.18);
  border-left: 3px solid var(--green);
  border-radius: 14px;
  padding: 14px 16px;
}
.rh-passage-en {
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
}
.rh-passage-vi {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 214, 143, 0.25);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--muted);
}
.rh-listen,
.rh-vi-toggle {
  margin-top: 10px;
  margin-right: 8px;
  border: 1px solid rgba(0, 214, 143, 0.35);
  background: var(--surface);
  color: #00966a;
  border-radius: 99px;
  padding: 6px 14px;
  min-height: 40px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.rh-vi-toggle {
  border-color: rgba(108, 92, 231, 0.35);
  color: #6c5ce7;
}
.rh-keys {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.rh-keys-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.rh-key {
  background: rgba(108, 92, 231, 0.08);
  border: 1px solid rgba(108, 92, 231, 0.18);
  color: #6c5ce7;
  font-size: 12.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
}
.rh-row {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.rh-input {
  flex: 1;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 11px 13px;
  font-size: 15px;
  font-family: inherit;
  background: var(--surface);
  color: var(--ink);
  min-width: 0;
}
.rh-input.ok {
  border-color: #00d68f;
  background: rgba(0, 214, 143, 0.08);
}
.rh-input.wrong {
  border-color: #ff6b6b;
}
.rh-btn {
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  padding: 11px 16px;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
}
.rh-ok {
  color: #00966a;
  font-size: 20px;
  font-weight: 900;
  width: 44px;
  text-align: center;
}
.rh-answer {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--text-danger, #d1495b);
}
.rh-ai {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.rh-ai-btn {
  border: 1px dashed rgba(108, 92, 231, 0.5);
  background: var(--surface);
  color: #6c5ce7;
  border-radius: 99px;
  padding: 6px 13px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
}
.rh-ai-loading {
  font-size: 12.5px;
  font-weight: 700;
  color: #6c5ce7;
}
.rh-ai-no {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted-2);
}
.rh-model {
  margin-top: 8px;
  font-size: 13.5px;
  color: #00966a;
}
.rh-answer b,
.rh-model b {
  font-weight: 800;
}
</style>
