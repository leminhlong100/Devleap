<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import QuizTool from '@/components/tools/QuizTool.vue'
import { generateErrorDrill } from '@/lib/aiChat'
import { friendlyAiError } from '@/lib/aiError'
import { collectWeekErrors, sanitizeDrillQuestions } from '@/lib/errorDrillStats'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const props = defineProps({
  day: { type: Object, required: true },
  weekDoneCount: { type: Number, default: 0 },
  // Kết quả bài kiểm tra tuần (nếu đã làm) — tính ở IeltsDayView.vue vì khảo sát
  // cảm nhận cuối tuần cũng cần cùng dữ liệu này, tránh gọi store 2 nơi lệch nhau.
  weekTest: { type: Object, default: null },
})
const router = useRouter()
const user = useUserStore()
const { isOnline } = useOnlineStatus()

// Chỉ mở bài kiểm tra tuần khi đã hoàn thành tất cả các buổi trong tuần.
const weekComplete = computed(() => props.weekDoneCount >= props.day.totalDays)
function goWeekTest() {
  if (weekComplete.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${props.day.week}` } })
}

// —— TRỢ LÝ ÔN SỔ LỖI (Bước 5.4): gom lỗi thật của tuần -> AI sinh 5 bài tập ——
const drillQuestions = ref([])
const drillLoading = ref(false)
const drillError = ref('')
const drillStarted = computed(() => drillQuestions.value.length > 0)

async function startErrorDrill() {
  if (drillLoading.value || !isOnline.value) return
  drillLoading.value = true
  drillError.value = ''
  try {
    const errors = collectWeekErrors({
      writings: user.writings,
      quizScores: user.quizScores,
      course: 'ielts',
      week: props.day.week,
      totalDays: props.day.totalDays,
    })
    const raw = await generateErrorDrill(errors, {
      title: props.day.weekTitle || props.day.title,
      week: props.day.week,
      grammar: (props.day.grammar || []).map((g) => g.title),
    })
    const questions = sanitizeDrillQuestions(raw)
    if (!questions.length) throw new Error('AI chưa trả về bài tập hợp lệ. Thử lại nhé.')
    drillQuestions.value = questions
  } catch (e) {
    drillError.value = friendlyAiError(e).message
  } finally {
    drillLoading.value = false
  }
}

// Đổi tuần (điều hướng buổi khác trong cùng route) -> dọn bộ bài tập cũ.
watch(() => props.day.week, () => {
  drillQuestions.value = []
  drillError.value = ''
})
</script>

<template>
  <!-- BÀI KIỂM TRA TUẦN (lưu điểm) -->
  <section class="step-card week-test">
    <div class="step-head">
      <div>
        <div class="eyebrow">KIỂM TRA CUỐI TUẦN</div>
        <h2 class="step-title">🎯 Bài kiểm tra Tuần {{ day.week }}</h2>
      </div>
      <span v-if="weekTest" class="wt-badge" :class="{ ok: weekTest.passed }">
        {{ weekTest.passed ? '✅ Đã đạt' : 'Cao nhất' }} {{ weekTest.pct }}%
      </span>
    </div>
    <p class="quiz-intro">Đạt từ 70% để nhận <b>+100 XP</b> và huy hiệu. Điểm được lưu lại.</p>
    <button class="green-btn" :class="{ locked: !weekComplete }" :disabled="!weekComplete" @click="goWeekTest">
      {{ weekComplete ? `🎯 ${weekTest ? 'Làm lại bài kiểm tra' : 'Làm bài kiểm tra tuần'} →` : '🔒 Làm bài kiểm tra tuần' }}
    </button>
    <p v-if="!weekComplete" class="wt-lock-hint">
      Hoàn thành cả {{ day.totalDays }} buổi trong tuần để mở khóa ({{ weekDoneCount }}/{{ day.totalDays }} buổi)
    </p>
  </section>

  <!-- TRỢ LÝ ÔN SỔ LỖI: sinh bài tập cá nhân hóa từ lỗi thật của tuần này -->
  <section v-if="weekComplete" class="step-card drill-card">
    <div class="step-head">
      <div>
        <div class="eyebrow">TRỢ LÝ ÔN SỔ LỖI</div>
        <h2 class="step-title">🩺 Bài tập từ lỗi của em</h2>
      </div>
    </div>
    <template v-if="!drillStarted">
      <p class="quiz-intro">
        AI gom lỗi thật trong bài viết, sổ lỗi và câu quiz sai của tuần này, rồi soạn 5 bài tập luyện lại đúng chỗ em còn yếu.
      </p>
      <button
        class="green-btn"
        :class="{ locked: drillLoading || !isOnline }"
        :disabled="drillLoading || !isOnline"
        :title="!isOnline ? 'Cần có mạng để AI soạn bài tập' : undefined"
        @click="startErrorDrill"
      >
        {{ drillLoading ? '🤖 AI đang soạn bài…' : !isOnline ? '🔌 Cần có mạng' : '🩺 Bài tập từ lỗi của em' }}
      </button>
      <p v-if="drillError" class="drill-error">⚠️ {{ drillError }}</p>
    </template>
    <template v-else>
      <QuizTool :questions="drillQuestions" mode="practice" embedded />
      <button class="ghost-btn drill-retry" :disabled="drillLoading" @click="startErrorDrill">
        {{ drillLoading ? '🤖 AI đang soạn bài…' : '🔄 Soạn bộ khác' }}
      </button>
    </template>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.week-test {
  border: 1.5px solid rgba(0, 214, 143, 0.25);
}
.wt-lock-hint {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
  margin-top: 10px;
}
.drill-card {
  border: 1.5px solid rgba(108, 92, 231, 0.2);
}
.drill-error {
  margin-top: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-danger);
  background: var(--bg-danger);
  border-radius: 12px;
  padding: 10px 14px;
}
.drill-retry {
  margin-top: 16px;
}
</style>
