<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  current: { type: Number, default: 0 }, // vị trí đang cuộn tới (1-based) trong agenda
  total: { type: Number, default: 0 },
})

// Đánh dấu để BackToTop (nút nổi toàn site) biết cần nhường chỗ — nó nằm ngoài
// cây component này nên không truyền prop được, xem rule .has-mcb-bar trong base.css.
onMounted(() => document.body.classList.add('has-mcb-bar'))
onUnmounted(() => document.body.classList.remove('has-mcb-bar'))
</script>

<template>
  <div class="mcb-bar">
    <span v-if="total" class="mcb-progress">Mục {{ current }}/{{ total }}</span>
    <div class="mcb-actions"><slot /></div>
  </div>
</template>

<style scoped>
.mcb-bar {
  display: none;
}
@media (max-width: 720px) {
  .mcb-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(72px + var(--safe-bottom));
    z-index: 45;
    padding: 10px var(--space-page-x);
    background: var(--surface);
    border-top: 1px solid var(--line);
    backdrop-filter: blur(14px);
  }
  .mcb-progress {
    flex: 1;
    font-size: 12px;
    font-weight: 800;
    color: var(--muted-2);
    white-space: nowrap;
  }
  .mcb-actions {
    display: flex;
    gap: 8px;
    flex: none;
    max-width: 100%;
  }
  .mcb-actions :deep(button) {
    white-space: nowrap;
  }
}
</style>
