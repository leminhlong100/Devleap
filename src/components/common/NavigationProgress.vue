<script setup>
/**
 * Thanh tiến trình mảnh ở đỉnh trang khi chuyển route (kiểu NProgress). Hiện
 * ngay lúc bấm để người dùng biết app đang tải chunk/xác thực, không tưởng lag.
 * Trạng thái đến từ useNavProgress (router điều khiển) — xem App.vue & router.
 */
import { useNavProgress } from '@/composables/useNavProgress'

const { visible, finishing } = useNavProgress()
</script>

<template>
  <div
    v-if="visible"
    class="nav-progress"
    :class="{ done: finishing }"
    role="progressbar"
    aria-label="Đang tải trang"
  ></div>
</template>

<style scoped>
.nav-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: var(--grad-brand);
  box-shadow: 0 0 8px rgba(108, 92, 231, 0.6);
  z-index: 9999;
  border-radius: 0 3px 3px 0;
  /* Chảy dần tới ~90% để thể hiện "đang tải" kể cả khi mạng/CPU chậm */
  animation: nav-trickle 8s cubic-bezier(0.1, 0.6, 0.2, 1) forwards;
}

/* Tải xong: nhảy tới 100% rồi mờ dần */
.nav-progress.done {
  width: 100%;
  opacity: 0;
  animation: none;
  transition: width 0.18s ease, opacity 0.28s ease 0.16s;
}

@keyframes nav-trickle {
  0% { width: 0; }
  25% { width: 42%; }
  55% { width: 66%; }
  80% { width: 82%; }
  100% { width: 90%; }
}

@media (prefers-reduced-motion: reduce) {
  .nav-progress {
    animation-duration: 0.01s;
    width: 90%;
  }
}
</style>
