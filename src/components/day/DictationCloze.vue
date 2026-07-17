<script setup>
/**
 * Bài CHÉP CHÍNH TẢ dạng ĐIỀN CHỖ TRỐNG (IELTS Listening Dictation — khóa theo
 * sách). Nghe MỘT bản ghi audio rồi điền từ còn thiếu vào từng chỗ trống ngay
 * trong đoạn văn tiếng Anh. Đoạn EN chứa marker "(n)_____" cho mỗi ô; đoạn VI hiển
 * thị để đối chiếu. Chấm ngay: gõ sai -> hiện đáp án gợi ý; gõ lại -> ẩn đi (buộc
 * tự nhớ); đúng hết -> phát 'done' để mở cổng hoàn thành buổi.
 *
 * (Khác ListeningDictation.vue của khóa Giao Tiếp — đó là nghe-chép CẢ CÂU bằng
 * TTS/clip; đây là điền từ vào một đoạn văn dài theo bản ghi thật.)
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Dictation' },
  note: { type: String, default: '' }, // HTML đã render — hướng dẫn ngắn
  en: { type: String, default: '' }, // đoạn văn EN có "(n)_____"
  vi: { type: String, default: '' }, // đoạn văn VI đối chiếu
  answers: { type: Object, default: () => ({}) }, // { n: "từ đúng" }
})
const emit = defineEmits(['done'])

const BLANK_RE = /\((\d+)\)\s*_+/g

// Tách đoạn EN thành các paragraph -> mỗi paragraph là dãy token: text | blank.
const enBlocks = computed(() =>
  props.en
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((para) => {
      const tokens = []
      let last = 0
      let m
      BLANK_RE.lastIndex = 0
      while ((m = BLANK_RE.exec(para))) {
        if (m.index > last) tokens.push({ t: 'text', v: para.slice(last, m.index) })
        tokens.push({ t: 'blank', n: Number(m[1]) })
        last = m.index + m[0].length
      }
      if (last < para.length) tokens.push({ t: 'text', v: para.slice(last) })
      return tokens
    }),
)

// Đoạn VI: giữ marker "(n)", thay "_____" -> "___" cho gọn.
const viParas = computed(() =>
  props.vi
    .split(/\n{2,}/)
    .map((p) => p.trim().replace(/_+/g, '___'))
    .filter(Boolean),
)

const blankNums = computed(() => {
  const out = []
  for (const b of enBlocks.value) for (const t of b) if (t.t === 'blank') out.push(t.n)
  return out
})
const total = computed(() => blankNums.value.length)

const typed = ref({})
const status = ref({}) // { n: null | 'ok' | 'wrong' }
const checkedOnce = ref(false)
let emitted = false
watch(
  () => props.en,
  () => {
    const t = {}
    const s = {}
    for (const n of blankNums.value) {
      t[n] = ''
      s[n] = null
    }
    typed.value = t
    status.value = s
    checkedOnce.value = false
    emitted = false
  },
  { immediate: true },
)

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const okCount = computed(() => Object.values(status.value).filter((s) => s === 'ok').length)
const allDone = computed(() => total.value > 0 && okCount.value === total.value)
watch(allDone, (v) => {
  if (v && !emitted) {
    emitted = true
    emit('done')
  }
})

function checkAll() {
  checkedOnce.value = true
  for (const n of blankNums.value) {
    const val = typed.value[n]
    if (!val || !val.trim()) {
      if (status.value[n] !== 'ok') status.value[n] = null
      continue
    }
    status.value[n] = norm(val) === norm(props.answers[n]) ? 'ok' : 'wrong'
  }
}
function onInput(n) {
  if (status.value[n] === 'wrong') status.value[n] = null // gõ lại sau khi sai -> ẩn đáp án
}
function reveal() {
  for (const n of blankNums.value) {
    if (status.value[n] !== 'ok') {
      typed.value[n] = props.answers[n] || ''
      status.value[n] = 'ok'
    }
  }
  checkedOnce.value = true
}
</script>

<template>
  <section class="step-card" :class="{ current: !allDone }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: allDone }">LÀM NGAY · NGHE & ĐIỀN · BẮT BUỘC</div>
        <h2 class="step-title">🎧 {{ title }}</h2>
      </div>
      <span class="wt-badge" :class="{ ok: allDone }">{{ okCount }}/{{ total }}</span>
    </div>

    <div v-if="note" class="prose dict-note" v-html="note"></div>

    <slot />

    <!-- ĐOẠN VĂN EN — điền vào chỗ trống -->
    <div class="dict-passage">
      <p v-for="(block, bi) in enBlocks" :key="bi" class="dict-para">
        <template v-for="(tok, ti) in block" :key="ti">
          <span v-if="tok.t === 'text'">{{ tok.v }}</span>
          <span v-else class="dict-blank">
            <sup class="dict-num">{{ tok.n }}</sup>
            <input
              v-model="typed[tok.n]"
              class="dict-input"
              :class="status[tok.n]"
              :disabled="status[tok.n] === 'ok'"
              type="text"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              :placeholder="`(${tok.n})`"
              @input="onInput(tok.n)"
              @keyup.enter="checkAll"
            />
            <span v-if="status[tok.n] === 'ok'" class="dict-ok">✓</span>
            <span v-else-if="status[tok.n] === 'wrong'" class="dict-fix">→ {{ answers[tok.n] }}</span>
          </span>
        </template>
      </p>
    </div>

    <div class="dict-actions">
      <button class="dict-btn" @click="checkAll">Kiểm tra</button>
      <button class="dict-reveal" @click="reveal">Hiện đáp án</button>
    </div>
    <p v-if="checkedOnce && !allDone" class="dict-hint">
      Ô sai hiện đáp án gợi ý bên cạnh — gõ lại cho đúng thì đáp án ẩn đi. Điền đúng hết {{ total }} ô để hoàn thành.
    </p>

    <!-- BẢN DỊCH ĐỐI CHIẾU -->
    <details class="dict-vi">
      <summary>🇻🇳 Xem bản dịch tiếng Việt (đối chiếu)</summary>
      <p v-for="(p, i) in viParas" :key="i" class="dict-vi-para">{{ p }}</p>
    </details>

    <div v-if="allDone" class="gate-line ok">✅ Đã hoàn thành bài chép chính tả (Dictation).</div>
  </section>
</template>

<style scoped>
.dict-note {
  font-size: 14px;
  color: var(--slate);
  margin-bottom: 6px;
}
.dict-passage {
  margin-top: 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
}
.dict-para {
  font-size: 15.5px;
  line-height: 2.3;
  color: var(--ink);
  margin: 0;
}
.dict-para + .dict-para {
  margin-top: 12px;
}
.dict-blank {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
}
.dict-num {
  font-size: 10.5px;
  font-weight: 800;
  color: #6c5ce7;
}
.dict-input {
  width: 120px;
  border: none;
  border-bottom: 2px solid rgba(108, 92, 231, 0.45);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  padding: 2px 6px;
  border-radius: 6px 6px 0 0;
  outline: none;
}
.dict-input:focus {
  border-bottom-color: #6c5ce7;
  background: rgba(108, 92, 231, 0.06);
}
.dict-input.ok {
  border-bottom-color: #00d68f;
  background: rgba(0, 214, 143, 0.1);
  color: #00966a;
}
.dict-input.wrong {
  border-bottom-color: #ff6b6b;
  background: rgba(255, 90, 90, 0.08);
}
.dict-ok {
  color: #00966a;
  font-weight: 900;
}
.dict-fix {
  color: #e04848;
  font-weight: 800;
  font-size: 13.5px;
}
.dict-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.dict-btn {
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-weight: 800;
  font-size: 14.5px;
  padding: 11px 22px;
  border-radius: 12px;
  cursor: pointer;
  min-height: 44px;
}
.dict-reveal {
  border: 1px solid rgba(108, 92, 231, 0.3);
  background: rgba(108, 92, 231, 0.06);
  color: #6c5ce7;
  font-weight: 700;
  font-size: 14px;
  padding: 11px 18px;
  border-radius: 12px;
  cursor: pointer;
  min-height: 44px;
}
.dict-hint {
  margin-top: 10px;
  font-size: 13.5px;
  color: var(--muted);
}
.dict-vi {
  margin-top: 16px;
  border-top: 1px dashed var(--line);
  padding-top: 12px;
}
.dict-vi summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  color: #6c5ce7;
}
.dict-vi-para {
  font-size: 14px;
  line-height: 1.75;
  color: var(--slate);
  margin-top: 10px;
}
@media (max-width: 640px) {
  .dict-input {
    width: 96px;
  }
}
</style>
