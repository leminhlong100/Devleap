<script setup>
/**
 * Bài tập ĐỌC HIỂU (Day 2 trở đi).
 *
 * Mỗi bài đưa sẵn đoạn văn (+ từ khóa gợi ý) chứa đáp án ngay tại câu hỏi — không
 * ẩn đi, vì không phải buổi nào cũng có một "bài đọc chung" ở trên để tự tìm (Day 2
 * là 5 đoạn văn độc lập, không có bài đọc chung). Học viên đọc đoạn văn của câu đó
 * rồi gõ câu trả lời ngắn.
 *
 * Chấm: gõ → "Kiểm tra" → SAI mới hiện đáp án ngắn; GÕ LẠI thì ẩn đáp án (buộc tự
 * nhớ); ĐÚNG thì khóa câu + hé lộ câu trả lời mẫu. Đúng hết → phát 'done' (cổng qua
 * buổi). So khớp khoan dung: bỏ dấu câu/hoa-thường + bản "lỏng" bỏ a/an/the.
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
  title: { type: String, default: '📖 Đọc hiểu' },
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
const showVi = ref([]) // hé lộ bản dịch của đoạn văn
const aiChecking = ref([]) // đang nhờ AI kiểm tra nghĩa
const aiMsg = ref([]) // thông báo kết quả AI ('' | 'no')
watch(
  () => props.items,
  (v) => {
    typed.value = v.map(() => '')
    status.value = v.map(() => null)
    showVi.value = v.map(() => false)
    aiChecking.value = v.map(() => false)
    aiMsg.value = v.map(() => '')
  },
  { immediate: true },
)

const okCount = computed(() => status.value.filter((s) => s === 'ok').length)
const allDone = computed(() => props.items.length > 0 && okCount.value === props.items.length)
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
  // Trả lời sai → ghi vào "sổ lỗi" để ôn ngắt quãng ở các buổi sau.
  if (!ok) emit('mistake', { n: props.items[i]?.n || i + 1, q: props.items[i]?.question || '', answer: firstAnswer(i) })
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
      {{ intro || 'Đọc đoạn văn của mỗi câu rồi gõ cụm từ trả lời chính vào ô. Sai sẽ hiện đáp án; gõ lại thì ẩn đi. Làm đúng hết để hoàn thành buổi.' }}
    </p>

    <ol class="rh-list">
      <li v-for="(it, i) in items" :key="i" class="rh-item" :class="status[i]">
        <div class="rh-top">
          <span class="rh-badge">Bài tập {{ it.n || i + 1 }}</span>
          <span v-if="it.title" class="rh-topic">{{ it.title }}</span>
        </div>

        <div class="rh-q">
          <span class="rh-q-en">{{ it.question }}</span>
          <span v-if="it.questionVi" class="rh-q-vi">{{ it.questionVi }}</span>
        </div>

        <article v-if="it.passage" class="rh-passage">
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

        <div v-if="it.keywords && it.keywords.length" class="rh-keys">
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

    <div v-if="allDone" class="gate-line ok">✅ Đã hoàn thành bài đọc hiểu!</div>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
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
