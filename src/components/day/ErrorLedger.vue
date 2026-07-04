<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  week: { type: [String, Number], required: true },
  day: { type: [String, Number], required: true },
  // Lỗi AI tự bắt được (từ bài viết / đặt câu đã chữa): [{ wrong, right, note }]
  autoErrors: { type: Array, default: () => [] },
})
const emit = defineEmits(['done'])

// —— Drill TỰ SỬA: mỗi lỗi là một bài tập, học viên phải tự gõ lại câu đúng ——
const drills = ref([])
watch(
  () => props.autoErrors,
  (errs) => {
    drills.value = (errs || []).map((e) => ({
      ...e,
      input: '',
      status: 'idle', // idle | wrong | correct | revealed
      tries: 0,
      showHint: false,
    }))
  },
  { immediate: true },
)

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function check(i) {
  const d = drills.value[i]
  if (!d.input.trim()) return
  if (norm(d.input) === norm(d.right)) {
    d.status = 'correct'
  } else {
    d.tries += 1
    d.status = 'wrong'
  }
}
function reveal(i) {
  const d = drills.value[i]
  d.input = d.right
  d.status = 'revealed'
}
function toggleHint(i) {
  drills.value[i].showHint = !drills.value[i].showHint
}

const resolved = computed(() => drills.value.filter((d) => d.status === 'correct' || d.status === 'revealed').length)
const selfFixed = computed(() => drills.value.filter((d) => d.status === 'correct').length)
const allResolved = computed(() => drills.value.length > 0 && resolved.value === drills.value.length)

watch(allResolved, (v) => {
  if (v) emit('done')
})

// —— Ghi chú thêm thủ công (lưu localStorage) ——
const manual = ref([])
function load() {
  try {
    const raw = localStorage.getItem(`error-ledger-w${props.week}-d${props.day}`)
    manual.value = raw ? JSON.parse(raw) : []
  } catch {
    manual.value = []
  }
}
function save() {
  try {
    localStorage.setItem(`error-ledger-w${props.week}-d${props.day}`, JSON.stringify(manual.value))
  } catch {}
}
watch([() => props.week, () => props.day], load, { immediate: true })
watch(manual, save, { deep: true })
function addManual() {
  manual.value.push({ wrong: '', right: '', note: '' })
}
function removeManual(i) {
  manual.value.splice(i, 1)
}
</script>

<template>
  <section class="step-card">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: allResolved }">SỔ LỖI · TỰ SỬA ĐỂ NHỚ</div>
        <h2 class="step-title">📓 Sửa lại lỗi của bạn</h2>
      </div>
      <span class="wt-badge" :class="{ ok: allResolved }">{{ resolved }}/{{ drills.length }} đã sửa</span>
    </div>
    <p class="quiz-intro">
      Đây là lỗi <b>thật</b> trong bài của bạn. Đừng chỉ đọc — hãy <b>tự gõ lại câu cho đúng</b>. Tự sửa thì mới nhớ và không lặp lại.
    </p>

    <!-- DRILL TỰ SỬA -->
    <div v-if="drills.length" class="el-drills">
      <div v-for="(d, i) in drills" :key="i" class="el-drill" :class="d.status">
        <div class="el-wrong"><span class="el-tag">Câu sai</span><s>{{ d.wrong }}</s></div>

        <div class="el-fix-row">
          <input
            v-model="d.input"
            class="el-fix-input"
            :class="d.status"
            :readonly="d.status === 'correct' || d.status === 'revealed'"
            placeholder="Gõ lại câu cho đúng…"
            @keydown.enter="check(i)"
          />
          <button
            v-if="d.status !== 'correct' && d.status !== 'revealed'"
            class="el-fix-btn"
            @click="check(i)"
          >
            Kiểm tra
          </button>
        </div>

        <!-- phản hồi -->
        <div v-if="d.status === 'correct'" class="el-fb ok">✅ Chính xác! Bạn đã tự sửa đúng.</div>
        <div v-else-if="d.status === 'revealed'" class="el-fb reveal">👀 Đáp án: <b>{{ d.right }}</b> — đọc lại và ghi nhớ nhé.</div>
        <div v-else-if="d.status === 'wrong'" class="el-fb wrong">
          ✕ Chưa đúng, thử lại.
          <button class="el-link-btn" @click="toggleHint(i)">{{ d.showHint ? 'Ẩn gợi ý' : '💡 Gợi ý' }}</button>
          <button v-if="d.tries >= 2" class="el-link-btn" @click="reveal(i)">Xem đáp án</button>
        </div>
        <div v-else-if="d.note" class="el-fb idle">
          <button class="el-link-btn" @click="toggleHint(i)">{{ d.showHint ? 'Ẩn gợi ý' : '💡 Gợi ý' }}</button>
        </div>
        <div v-if="d.showHint && d.note" class="el-hint">💡 {{ d.note }}</div>
      </div>
    </div>

    <div v-else class="el-empty">
      Chưa có lỗi nào. Hãy làm <b>Bài tập viết</b> và <b>Đặt câu</b> rồi nhờ AI chữa — lỗi của bạn sẽ tự về đây thành bài tập tự sửa.
    </div>

    <div v-if="drills.length && allResolved" class="el-summary">
      🎯 Bạn tự sửa đúng <b>{{ selfFixed }}/{{ drills.length }}</b> lỗi. Mai gặp lại dạng này, nhớ tránh nhé!
    </div>

    <!-- GHI CHÚ THÊM -->
    <div v-if="manual.length" class="el-manual">
      <div class="el-manual-head">✍️ Lỗi bạn tự ghi thêm:</div>
      <div v-for="(e, i) in manual" :key="'m' + i" class="el-row">
        <div class="el-fields">
          <input v-model="e.wrong" class="el-input" placeholder="❌ Câu sai…" @input="save" />
          <input v-model="e.right" class="el-input el-input-ok" placeholder="✅ Câu đúng…" @input="save" />
        </div>
        <button class="el-del" @click="removeManual(i)" aria-label="Xóa">✕</button>
      </div>
    </div>
    <button class="ghost-btn" @click="addManual">+ Tự ghi thêm lỗi</button>
  </section>
</template>

<style scoped>
.el-drills {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.el-drill {
  border: 1px solid var(--line, rgba(108, 92, 231, 0.1));
  border-radius: 12px;
  padding: 13px 15px;
  background: var(--surface);
}
.el-drill.correct {
  border-color: rgba(0, 214, 143, 0.4);
  background: rgba(0, 214, 143, 0.04);
}
.el-drill.revealed {
  border-color: rgba(255, 176, 32, 0.4);
  background: rgba(255, 176, 32, 0.05);
}
.el-wrong {
  font-size: 14px;
  color: var(--text-danger);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.el-tag {
  font-size: 11px;
  font-weight: 800;
  background: rgba(255, 107, 107, 0.12);
  color: var(--text-danger);
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.el-fix-row {
  display: flex;
  gap: 8px;
}
.el-fix-input {
  flex: 1;
  border: 1.5px solid var(--line, rgba(108, 92, 231, 0.15));
  border-radius: 9px;
  padding: 9px 12px;
  font-size: 14.5px;
  font-family: inherit;
  color: var(--ink, #1e1e2e);
  background: var(--surface);
  outline: none;
}
.el-fix-input:focus {
  border-color: var(--purple, #6c5ce7);
}
.el-fix-input.correct {
  border-color: rgba(0, 214, 143, 0.5);
  color: var(--text-success);
  font-weight: 600;
}
.el-fix-input.wrong {
  border-color: rgba(255, 107, 107, 0.5);
}
.el-fix-btn {
  border: none;
  background: var(--purple, #6c5ce7);
  color: #fff;
  border-radius: 9px;
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.el-fix-btn:hover {
  background: var(--purple-deep, #4b3bc4);
}
.el-fb {
  margin-top: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.el-fb.ok {
  color: var(--text-success);
  font-weight: 600;
}
.el-fb.wrong {
  color: var(--text-danger);
}
.el-fb.reveal {
  color: var(--text-warning);
}
.el-link-btn {
  border: none;
  background: none;
  color: var(--purple, #6c5ce7);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.el-hint {
  margin-top: 7px;
  font-size: 13px;
  color: var(--muted, #76768e);
  background: var(--purple-soft, #f2f0ff);
  border-radius: 9px;
  padding: 8px 12px;
}
.el-empty {
  margin-top: 14px;
  font-size: 13.5px;
  color: var(--muted, #76768e);
  background: var(--bg-muted);
  border-radius: 12px;
  padding: 14px 16px;
  line-height: 1.6;
}
.el-summary {
  margin-top: 14px;
  font-size: 14px;
  color: var(--text-success);
  background: rgba(0, 214, 143, 0.08);
  border-radius: 12px;
  padding: 12px 15px;
}
.el-manual {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.el-manual-head {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted, #76768e);
}
.el-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.el-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.el-input {
  border: 1px solid var(--line, #e3e3ee);
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 13.5px;
  background: var(--surface);
  color: var(--ink, #1e1e2e);
  outline: none;
  font-family: inherit;
}
.el-input:focus {
  border-color: var(--purple, #6c5ce7);
}
.el-input-ok {
  border-color: rgba(0, 214, 143, 0.35);
}
.el-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted-3, #b6b6c6);
  font-size: 14px;
  padding: 6px;
}
.el-del:hover {
  color: var(--text-danger);
}
</style>
