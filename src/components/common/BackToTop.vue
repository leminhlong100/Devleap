<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

// Nút nổi "về đầu trang" — chỉ hiện khi đã cuộn xuống đủ xa.
const show = ref(false)

function onScroll() {
  show.value = window.scrollY > 400
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Transition name="btt">
    <button v-show="show" class="back-to-top" aria-label="Về đầu trang" title="Về đầu trang" @click="toTop">
      ↑
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 60;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple, linear-gradient(135deg, #6c5ce7, #a29bfe));
  box-shadow: 0 8px 24px rgba(108, 92, 231, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
@media (hover: hover) {
  .back-to-top:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(108, 92, 231, 0.5);
  }
}
.back-to-top:active {
  transform: scale(0.94);
  box-shadow: 0 6px 18px rgba(108, 92, 231, 0.45);
}

.btt-enter-active,
.btt-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.btt-enter-from,
.btt-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 460px) {
  .back-to-top {
    right: 16px;
    bottom: 16px;
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
}
</style>
