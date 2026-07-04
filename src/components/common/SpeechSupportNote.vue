<script setup>
/**
 * Banner cảnh báo dùng chung khi trình duyệt thiếu một khả năng Web Speech API
 * (chủ yếu SpeechRecognition trên Safari/iOS). Cha tự quyết định `visible` theo
 * đúng tính năng đang thiếu (mic chấm điểm, mic ghi nhận, voice-first…) vì mỗi
 * màn đã tự tính sẵn cờ hỗ trợ riêng (recordable/listenable/canScore).
 */
defineProps({
  visible: { type: Boolean, default: true },
  text: {
    type: String,
    default:
      'Trình duyệt này chưa hỗ trợ chấm giọng nói — hãy dùng Chrome/Edge trên máy tính hoặc Android. Em vẫn luyện được bằng cách bên dưới.',
  },
})
</script>

<template>
  <p v-if="visible" class="quiz-intro speech-support-note">⚠️ {{ text }}</p>
</template>

<style scoped>
.speech-support-note {
  color: var(--text-warning);
  background: var(--bg-warning);
  border-radius: 10px;
  padding: 9px 13px;
}
</style>
