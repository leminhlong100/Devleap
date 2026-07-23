<script setup>
/**
 * "Ôn lại lỗi cũ" — ôn ngắt quãng XUYÊN BUỔI. Lấy các câu tới hạn trong sổ lỗi
 * (store: dueMistakes) rồi cho ôn lại từng câu (gõ đáp án, chấm khoan dung). Đúng
 * → lên box (giãn cách xa hơn); sai → về box 0. Hiện ở ĐẦU buổi để nhớ lại trước
 * khi học nội dung mới. Không có câu tới hạn thì không hiện gì.
 */
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'

const user = useUserStore()

// Chốt danh sách ôn lúc mở (không đổi giữa chừng khi box/due cập nhật).
const session = ref(user.dueMistakes(12))
const idx = ref(0)
const typed = ref('')
const status = ref(null) // null | 'ok' | 'wrong'
const reviewedOk = ref(0)

const current = computed(() => session.value[idx.value])
const total = computed(() => session.value.length)
const finished = computed(() => idx.value >= total.value)

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(a|an|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function check() {
  if (!current.value || status.value === 'ok') return
  const ok = norm(typed.value) === norm(current.value.answer) && !!typed.value.trim()
  status.value = ok ? 'ok' : 'wrong'
  user.reviewMistake(current.value.id, ok)
  if (ok) reviewedOk.value++
}
function next() {
  idx.value++
  typed.value = ''
  status.value = null
}
function onInput() {
  if (status.value === 'wrong') status.value = null
}
</script>

<template>
  <section v-if="total" class="step-card review-card">
    <div class="step-head">
      <div>
        <div class="eyebrow">ÔN NGẮT QUÃNG · CHỐNG QUÊN</div>
        <h2 class="step-title">🔁 Ôn lại lỗi cũ</h2>
      </div>
      <span class="wt-badge" :class="{ ok: finished }">{{ finished ? '✅ Xong' : `${idx}/${total}` }}</span>
    </div>

    <template v-if="!finished && current">
      <p class="quiz-intro">Nhớ lại {{ total }} câu bạn từng làm sai ở các buổi trước. Gõ đáp án rồi kiểm tra.</p>
      <div class="mr-q">
        <span v-if="current.kind" class="mr-kind">{{ current.kind }}</span>
        <p class="mr-prompt">{{ current.q }}</p>
      </div>
      <div class="mr-row">
        <input
          v-model="typed"
          class="mr-input"
          :class="status"
          type="text"
          placeholder="Gõ đáp án…"
          :disabled="status === 'ok'"
          @input="onInput"
          @keyup.enter="status === 'ok' ? next() : check()"
        />
        <button v-if="status !== 'ok'" class="mr-btn" @click="check">Kiểm tra</button>
        <button v-else class="mr-btn ok" @click="next">{{ idx + 1 >= total ? 'Xong' : 'Câu tiếp' }} →</button>
      </div>
      <div v-if="status === 'wrong'" class="mr-answer">
        💡 Đáp án: <b>{{ current.answer }}</b>
        <button class="mr-next-link" @click="next">{{ idx + 1 >= total ? 'Xong' : 'Câu tiếp' }} →</button>
      </div>
    </template>

    <div v-else class="mr-done">
      ✅ Đã ôn xong — đúng <b>{{ reviewedOk }}/{{ total }}</b> câu. Câu đúng sẽ giãn cách ôn lại xa hơn.
    </div>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.review-card {
  border-left: 3px solid #ffb020;
}
.mr-q {
  margin-top: 12px;
}
.mr-kind {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b5730b;
  background: rgba(255, 176, 32, 0.14);
  border-radius: 99px;
  padding: 2px 9px;
  margin-bottom: 6px;
}
.mr-prompt {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
}
.mr-row {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.mr-input {
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
.mr-input.ok {
  border-color: #00d68f;
  background: rgba(0, 214, 143, 0.08);
}
.mr-input.wrong {
  border-color: #ff6b6b;
}
.mr-btn {
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
.mr-btn.ok {
  background: #00a86f;
}
.mr-answer {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--text-danger, #d1495b);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.mr-answer b {
  font-weight: 800;
}
.mr-next-link {
  border: none;
  background: none;
  color: #6c5ce7;
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;
}
.mr-done {
  margin-top: 12px;
  font-size: 14px;
  color: #00966a;
  font-weight: 600;
}
</style>
