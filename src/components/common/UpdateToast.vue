<script setup>
/**
 * Banner toàn site khi có bản build mới đang chờ (SW ở trạng thái "waiting") —
 * cùng vị trí/kiểu với OfflineBanner, đặt ngay dưới header trong App.vue.
 */
import { useServiceWorkerUpdate } from '@/composables/useServiceWorkerUpdate'

const { updateAvailable, applyUpdate } = useServiceWorkerUpdate()
</script>

<template>
  <div v-if="updateAvailable" class="update-toast">
    <span>✨ Có bản cập nhật mới</span>
    <button class="update-btn" @click="applyUpdate">Tải lại</button>
  </div>
</template>

<style scoped>
.update-toast {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  background: var(--grad-purple, linear-gradient(135deg, #6c5ce7, #a29bfe));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 8px 14px;
}
.update-btn {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  padding: 6px 18px;
  min-height: 44px;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 0.15s, background 0.15s;
}
@media (hover: hover) {
  .update-btn:hover {
    background: rgba(255, 255, 255, 0.35);
  }
}
.update-btn:active {
  transform: scale(0.94);
}
</style>
