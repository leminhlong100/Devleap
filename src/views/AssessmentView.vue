<script setup>
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import QuizTool from '@/components/tools/QuizTool.vue'
import { getQuizSet } from '@/data/quizSets'
import { computeJavaProgress, javaWeekStructure } from '@/data/course'
import { computeIeltsProgress } from '@/data/courseIelts'

// Bài kiểm tra cuối tuần/cuối khóa. Route: /courses/:course/test/:scope
//   scope = "week-3" hoặc "final".
const props = defineProps({ course: String, scope: String })
const router = useRouter()
const user = useUserStore()

const set = computed(() => getQuizSet(props.course, props.scope))

// Thi cuối khóa chỉ mở khi đã hoàn thành toàn bộ lộ trình. Chặn cả khi gõ thẳng URL.
const courseDone = computed(() =>
  props.course === 'ielts'
    ? computeIeltsProgress(user.completed.ielts, (n) => user.quizPassed('ielts', `week:${n}`)).allDone
    : computeJavaProgress(user.completed.java).allDone,
)
const finalLocked = computed(() => props.scope === 'final' && !courseDone.value)

// Bài kiểm tra tuần chỉ mở khi đã hoàn thành tất cả các ngày trong tuần đó.
const weekLocked = computed(() => {
  if (props.scope === 'final' || props.course !== 'java') return false
  const m = props.scope?.match(/^week-(\d+)$/)
  if (!m) return false
  const wk = javaWeekStructure.find((w) => w.num === Number(m[1]))
  if (!wk) return false
  const completed = user.completed.java || []
  return !wk.dayNums.every((d) => completed.includes(`${wk.num}:${d}`))
})

watchEffect(() => {
  if (finalLocked.value || weekLocked.value) {
    router.replace({ name: props.course === 'ielts' ? 'ielts' : 'java' })
  }
})
// Cuối khóa lấy nhiều câu hơn; tuần gọn lại để không quá dài.
const limit = computed(() => (props.scope === 'final' ? 20 : 12))
const courseRoute = computed(() => (props.course === 'ielts' ? 'ielts' : 'java'))
const courseLabel = computed(() => (props.course === 'ielts' ? 'IELTS' : 'Java'))
const best = computed(() => (set.value ? user.quizOf(props.course, set.value.scope) : null))
const askCount = computed(() => (set.value ? Math.min(limit.value, set.value.questions.length) : 0))
</script>

<template>
  <div class="container assess">
    <span class="back" @click="router.push({ name: courseRoute })">← Lộ trình {{ courseLabel }}</span>

    <template v-if="set && !finalLocked && !weekLocked">
      <!-- HEADER -->
      <div class="head-card">
        <div class="head-glow"></div>
        <div class="head-text">
          <div class="head-tags">
            <span class="pill">{{ scope === 'final' ? 'THI CUỐI KHÓA' : `KIỂM TRA TUẦN ${set.weekNum}` }}</span>
            <span class="date">{{ askCount }} câu · cần đạt 70%</span>
          </div>
          <h1 class="head-title">🎯 {{ set.title }}</h1>
          <p class="head-intro">{{ set.subtitle }}</p>
        </div>
        <div v-if="best" class="best-chip">
          <div class="best-pct">{{ best.pct }}%</div>
          <div class="best-meta">{{ best.passed ? '✅ Đã đạt' : 'điểm cao nhất' }} · {{ best.attempts }} lần</div>
        </div>
      </div>

      <!-- MỤC TIÊU TUẦN -->
      <div v-if="set.objectives.length" class="goals">
        <div class="goals-label">📌 Bài kiểm tra này bao quát:</div>
        <div class="goals-chips">
          <span v-for="(o, i) in set.objectives" :key="i" class="goal-chip">{{ o }}</span>
        </div>
      </div>

      <!-- BÀI KIỂM TRA -->
      <QuizTool
        :questions="set.questions"
        mode="assessment"
        :course="course"
        :scope="set.scope"
        :passThreshold="0.7"
        :limit="limit"
      />

      <!-- NGÀY ÔN BÙ — chỉ hiện khi chưa đạt và còn câu sai của lần làm gần nhất -->
      <div v-if="best && !best.passed && best.wrong?.length" class="remedial">
        <div class="remedial-head">
          <span class="remedial-emoji">🩹</span>
          <div>
            <h3>Ngày ôn bù trước khi học tiếp</h3>
            <p>Bạn đạt {{ best.pct }}% (cần 70%). Ôn lại {{ best.wrong.length }} câu sai dưới đây rồi làm lại bài kiểm tra.</p>
          </div>
        </div>
        <div v-for="(w, i) in best.wrong" :key="i" class="remedial-item">
          <div class="remedial-q">{{ i + 1 }}. {{ w.q }}</div>
          <div class="remedial-a">✅ Đáp án đúng: <b>{{ w.correct }}</b></div>
          <div v-if="w.ex" class="remedial-ex">💡 {{ w.ex }}</div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <h2>Chưa có bài kiểm tra</h2>
      <p>Không tìm thấy bộ câu hỏi cho mục này.</p>
      <button class="green-btn" @click="router.push({ name: courseRoute })">← Về lộ trình {{ courseLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.assess {
  padding: 26px 28px 70px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--purple);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.head-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #6c5ce7, #4b3bc4);
  border-radius: 28px;
  padding: 32px 36px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.head-glow {
  position: absolute;
  top: -60px;
  right: 120px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 214, 143, 0.3), transparent 70%);
}
.head-text {
  position: relative;
  max-width: 620px;
}
.head-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pill {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
}
.date {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12.5px;
  font-weight: 700;
}
.head-title {
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  margin: 14px 0 0;
  letter-spacing: -0.5px;
}
.head-intro {
  color: #d9d4f5;
  font-size: 15px;
  margin-top: 8px;
}
.best-chip {
  position: relative;
  text-align: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  padding: 16px 22px;
}
.best-pct {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
}
.best-meta {
  font-size: 12px;
  color: #d9d4f5;
  font-weight: 700;
  margin-top: 2px;
}
.goals {
  margin: 22px 0;
}
.goals-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--muted-2);
  margin-bottom: 10px;
}
.goals-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.goal-chip {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.16);
  border-radius: 99px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
}
.remedial {
  max-width: 680px;
  margin: 24px auto 0;
  background: var(--chip-warn-bg);
  border: 1px solid rgba(255, 176, 32, 0.3);
  border-radius: 20px;
  padding: 22px 26px;
}
.remedial-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.remedial-emoji {
  font-size: 26px;
}
.remedial-head h3 {
  font-size: 17px;
  font-weight: 800;
  color: var(--amber-ink, #a86a00);
}
.remedial-head p {
  font-size: 13.5px;
  color: var(--muted-2);
  margin-top: 4px;
}
.remedial-item {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(255, 176, 32, 0.3);
}
.remedial-q {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
}
.remedial-a {
  font-size: 13.5px;
  color: var(--text-success);
  margin-top: 6px;
}
.remedial-ex {
  font-size: 13px;
  color: var(--muted-2);
  margin-top: 4px;
}
.empty {
  text-align: center;
  padding: 80px 20px;
}
.empty h2 {
  font-size: 24px;
  font-weight: 800;
}
.empty p {
  color: var(--muted-2);
  margin-top: 8px;
}
.green-btn {
  margin-top: 20px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  padding: 13px 26px;
  border-radius: 14px;
  background: var(--grad-purple, linear-gradient(135deg, #6c5ce7, #4b3bc4));
}
@media (max-width: 600px) {
  .head-title {
    font-size: 24px;
  }
}
</style>
