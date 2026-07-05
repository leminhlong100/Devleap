<script setup>
/**
 * Banner toàn site khi mất mạng — hiện ở App.vue, không cần cha truyền prop
 * (khác SpeechSupportNote — trạng thái online là 1 nguồn duy nhất cho cả app).
 */
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
</script>

<template>
  <div v-if="!isOnline" class="offline-banner">
    🔌 Đang offline — bài học đã xem vẫn mở được, AI và đồng bộ tạm dừng tới khi có mạng lại.
  </div>
</template>

<style scoped>
.offline-banner {
  background: var(--bg-warning);
  color: var(--text-warning);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 8px 14px;
}
</style>
