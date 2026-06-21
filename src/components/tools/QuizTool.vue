<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'

// Hai chế độ:
//  - practice (mặc định): quiz nhanh theo từng ngày, +10 XP mỗi câu đúng.
//  - assessment: bài kiểm tra cuối tuần/cuối khóa — xáo câu, giới hạn số câu,
//    LƯU ĐIỂM qua store (thưởng & huy hiệu xử lý ở recordQuiz, không cộng/câu).
const props = defineProps({
  questions: { type: Array, default: null },
  mode: { type: String, default: 'practice' },
  course: { type: String, default: '' },
  scope: { type: String, default: '' }, // "week:N" | "final"
  passThreshold: { type: Number, default: 0.7 },
  limit: { type: Number, default: 0 }, // 0 = lấy hết
})

const user = useUserStore()
const isAssessment = computed(() => props.mode === 'assessment')

// Xáo trộn (Fisher–Yates) — chỉ dùng cho bài kiểm tra để mỗi lần làm khác nhau.
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Bộ câu cho lượt chơi hiện tại (cố định tới khi làm lại / đổi đề).
const playQs = ref([])
function buildQs() {
  let arr = props.questions || []
  if (isAssessment.value) {
    arr = shuffle(arr)
    if (props.limit > 0) arr = arr.slice(0, props.limit)
  }
  playQs.value = arr
}

const qs = computed(() => playQs.value)
const total = computed(() => qs.value.length)
const hasQuiz = computed(() => total.value > 0)

const index = ref(0)
const selected = ref(null)
const score = ref(0)
const done = ref(false)
// Lần này có phải lần ĐẦU đạt không (để hiện thưởng XP). Khai báo trước watch
// vì watch immediate gọi restart() ngay trong setup.
const justPassed = ref(false)

const current = computed(() => qs.value[index.value])

const answered = computed(() => selected.value !== null)
const isLast = computed(() => index.value + 1 >= total.value)
const progress = computed(() => Math.round(((index.value + (answered.value ? 1 : 0)) / total.value) * 100))

const pct = computed(() => (total.value ? Math.round((score.value / total.value) * 100) : 0))
const passed = computed(() => pct.value >= props.passThreshold * 100)
// Kết quả tốt nhất đã lưu (để khoe điểm cao nhất, đếm lần làm).
const best = computed(() => (isAssessment.value ? user.quizOf(props.course, props.scope) : null))

function select(i) {
  if (selected.value !== null) return
  selected.value = i
  if (i === current.value.correct) {
    score.value++
    if (!isAssessment.value) user.addXp(10) // bài kiểm tra thưởng theo kết quả cuối
  }
}
function optStyle(i) {
  if (selected.value === null) return { bg: '#fff', color: '#3a3a52', border: 'rgba(108,92,231,.16)', mark: String.fromCharCode(65 + i) }
  if (i === current.value.correct) return { bg: 'rgba(0,214,143,.1)', border: '#00D68F', color: '#00A86F', mark: '✓' }
  if (i === selected.value) return { bg: 'rgba(255,90,90,.08)', border: '#FF6B6B', color: '#E04848', mark: '✕' }
  return { bg: '#fff', color: '#a0a0b4', border: 'rgba(108,92,231,.08)', mark: String.fromCharCode(65 + i) }
}
function next() {
  if (isLast.value) {
    done.value = true
    if (isAssessment.value && total.value) {
      const wasPassed = best.value?.passed || false
      user.recordQuiz(props.course, props.scope, score.value, total.value, props.passThreshold)
      justPassed.value = !wasPassed && passed.value
    }
  } else {
    index.value++
    selected.value = null
  }
}
function restart() {
  buildQs()
  index.value = 0
  selected.value = null
  score.value = 0
  done.value = false
  justPassed.value = false
}

// Đổi bài học/đề -> dựng lại bộ câu & làm lại từ đầu. Đặt CUỐI script (sau khi
// mọi ref & restart đã khai báo) để watch immediate không chạm biến chưa khởi tạo.
watch(() => props.questions, restart, { immediate: true })
</script>

<template>
  <div class="quiz">
    <!-- CHƯA CÓ QUIZ THEO BÀI -->
    <div v-if="!hasQuiz" class="result empty-quiz">
      <div class="trophy">📝</div>
      <h2>Quiz đi theo từng bài học</h2>
      <p>Mở một ngày học rồi bấm <b>❓ Mở quiz</b> để làm bộ câu hỏi của bài đó.</p>
      <p class="hint-sub">Bài học này chưa có quiz, hoặc bạn đang mở Quiz ngoài ngữ cảnh bài học.</p>
    </div>

    <!-- DONE · bài kiểm tra (lưu điểm + đạt/chưa đạt) -->
    <div v-else-if="done && isAssessment" class="result">
      <div class="trophy">{{ passed ? '🎓' : '📊' }}</div>
      <h2>{{ passed ? 'Đạt bài kiểm tra!' : 'Chưa đạt — thử lại nhé' }}</h2>
      <p>Đúng <b>{{ score }}/{{ total }}</b> câu · <b>{{ pct }}%</b></p>
      <div class="verdict" :class="{ ok: passed }">
        {{ passed ? `✅ Vượt ngưỡng ${Math.round(passThreshold * 100)}%` : `Cần ${Math.round(passThreshold * 100)}% để đạt` }}
      </div>
      <div v-if="justPassed" class="xp-badge">+{{ 100 }} XP · +1 huy hiệu 🎉</div>
      <p v-if="best" class="best-line">Điểm cao nhất: <b>{{ best.pct }}%</b> · đã làm {{ best.attempts }} lần</p>
      <div><button class="restart" @click="restart">↺ Làm lại</button></div>
    </div>

    <!-- DONE · quiz luyện tập theo ngày -->
    <div v-else-if="done" class="result">
      <div class="trophy">🏆</div>
      <h2>Hoàn thành quiz!</h2>
      <p>Bạn trả lời đúng <b>{{ score }}/{{ total }}</b> câu</p>
      <div class="xp-badge">+{{ score * 10 }} XP 🎉</div>
      <div><button class="restart" @click="restart">↺ Làm lại</button></div>
    </div>

    <!-- ACTIVE -->
    <template v-else>
      <div class="top">
        <span class="qno">Câu {{ index + 1 }}/{{ total }}</span>
        <span class="qscore">⭐ {{ score }} đúng</span>
      </div>
      <div class="track"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <h2 class="question">{{ current.q }}</h2>
      <div class="options">
        <div
          v-for="(o, i) in current.opts"
          :key="i"
          class="option"
          :style="{ background: optStyle(i).bg, color: optStyle(i).color, borderColor: optStyle(i).border }"
          @click="select(i)"
        >
          <span class="mark">{{ optStyle(i).mark }}</span>
          {{ o }}
        </div>
      </div>
      <div v-if="answered" class="explain-row">
        <div class="explain">💡 {{ current.ex }}</div>
        <button class="next" @click="next">{{ isLast ? 'Xem kết quả' : 'Câu tiếp' }} →</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.quiz {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
  max-width: 680px;
  margin: 0 auto;
}
.result {
  text-align: center;
  padding: 24px 0;
}
.trophy {
  font-size: 64px;
}
.result h2 {
  font-size: 28px;
  font-weight: 800;
  margin-top: 10px;
  letter-spacing: -0.5px;
}
.result p {
  font-size: 16px;
  color: #7a7a92;
  margin-top: 8px;
}
.result p b {
  color: #00c281;
}
.empty-quiz .hint-sub {
  font-size: 13.5px;
  color: var(--muted-2);
  margin-top: 6px;
}
.verdict {
  display: inline-block;
  margin-top: 14px;
  padding: 8px 18px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 800;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #e04848;
}
.verdict.ok {
  background: rgba(0, 214, 143, 0.12);
  border-color: rgba(0, 214, 143, 0.4);
  color: #00a86f;
}
.best-line {
  font-size: 13.5px;
  color: var(--muted-2);
  margin-top: 14px;
}
.xp-badge {
  display: inline-block;
  margin-top: 18px;
  background: linear-gradient(135deg, #fff3dd, #ffe8c2);
  border: 1px solid rgba(255, 176, 32, 0.3);
  color: var(--amber-ink);
  font-weight: 800;
  padding: 11px 22px;
  border-radius: 99px;
  font-size: 16px;
}
.restart {
  margin-top: 26px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 14px 30px;
  border-radius: 14px;
  background: var(--grad-purple);
  transition: transform 0.18s;
}
.restart:hover {
  transform: translateY(-2px);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.qno {
  font-size: 13px;
  font-weight: 800;
  color: var(--purple);
}
.qscore {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-2);
}
.track {
  height: 7px;
  border-radius: 99px;
  background: #ececf5;
  margin-bottom: 24px;
}
.fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand);
  transition: width 0.3s;
}
.question {
  font-size: 21px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.3px;
}
.options {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}
.option {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 18px;
  border-radius: 15px;
  border: 1.5px solid;
  font-size: 15.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: rgba(108, 92, 231, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex: none;
}
.explain-row {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.explain {
  flex: 1;
  min-width: 240px;
  background: var(--bg);
  border-left: 3px solid var(--purple);
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 14px;
  line-height: 1.55;
  color: #3a3a52;
}
.next {
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 14px 26px;
  border-radius: 14px;
  background: var(--grad-purple);
  white-space: nowrap;
  transition: transform 0.18s;
}
.next:hover {
  transform: translateY(-2px);
}
</style>
