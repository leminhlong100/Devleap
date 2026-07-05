<script setup>
import { computed, ref } from 'vue'
import QuizTool from '@/components/tools/QuizTool.vue'
import { speak, canSpeak } from '@/lib/speak'

const props = defineProps({
  reading: { type: Object, required: true }, // { title, subtitle, text, questions }
})

const questions = computed(() => props.reading?.questions || [])
const speakable = canSpeak()
const speaking = ref(false)

// Đọc to cả đoạn (tốc độ chậm dễ theo dõi) — hỗ trợ thêm cho người mới.
function readAloud() {
  if (!speakable || !props.reading?.text) return
  speaking.value = true
  speak(props.reading.text, 0.85)
  // không có callback chuẩn -> reset cờ sau một nhịp để nút trở lại bình thường
  setTimeout(() => (speaking.value = false), 1200)
}
</script>

<template>
  <section v-if="reading && reading.text" class="step-card">
    <div class="step-head">
      <div>
        <div class="eyebrow">ĐỌC HIỂU · INPUT THẬT</div>
        <h2 class="step-title">📖 Bài đọc: {{ reading.title }}</h2>
      </div>
      <span class="wt-badge">{{ questions.length }} câu hỏi</span>
    </div>
    <p class="quiz-intro">
      {{ reading.subtitle || 'Đọc kỹ đoạn dưới đây rồi trả lời câu hỏi.' }}
      <button v-if="speakable" class="rc-listen" :disabled="speaking" @click="readAloud">🔊 Nghe đọc</button>
    </p>

    <article class="rc-passage">{{ reading.text }}</article>

    <div class="rc-quiz">
      <div class="rc-quiz-label">❓ Trả lời câu hỏi đọc hiểu</div>
      <QuizTool :questions="questions" mode="practice" embedded />
    </div>
  </section>
</template>

<style scoped>
.step-card {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 22px;
  padding: 26px var(--space-page-x);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
}
.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--muted-2);
}
.step-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin-top: 5px;
}
.wt-badge {
  background: rgba(0, 150, 106, 0.1);
  color: var(--text-success);
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.quiz-intro {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rc-listen {
  border: 1px solid rgba(0, 214, 143, 0.35);
  background: var(--surface);
  color: var(--text-success);
  border-radius: 99px;
  padding: 5px 13px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.rc-listen:hover {
  background: #e6fbf2;
}
.rc-listen:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rc-passage {
  margin-top: 16px;
  background: var(--bg);
  border: 1px solid rgba(0, 214, 143, 0.18);
  border-left: 3px solid var(--green);
  border-radius: 14px;
  padding: 18px 20px;
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink);
}
.rc-quiz {
  margin-top: 20px;
  background: var(--bg);
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 18px 20px;
}
.rc-quiz-label {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 14px;
}
</style>
