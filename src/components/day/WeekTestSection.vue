<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  day: { type: Object, required: true },
  weekDoneCount: { type: Number, default: 0 },
  // Kết quả bài kiểm tra tuần (nếu đã làm) — tính ở IeltsDayView.vue vì khảo sát
  // cảm nhận cuối tuần cũng cần cùng dữ liệu này, tránh gọi store 2 nơi lệch nhau.
  weekTest: { type: Object, default: null },
})
const router = useRouter()

// Chỉ mở bài kiểm tra tuần khi đã hoàn thành tất cả các buổi trong tuần.
const weekComplete = computed(() => props.weekDoneCount >= props.day.totalDays)
function goWeekTest() {
  if (weekComplete.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${props.day.week}` } })
}
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
</style>
