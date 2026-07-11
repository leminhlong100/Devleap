<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * Tấm trượt từ đáy màn hình lên — dùng chung cho các popover/menu cần thay thế
 * bằng UI mobile-first (nghĩa từ trong chat, menu tốc độ shadowing…). Đóng bằng
 * bấm overlay, kéo tấm xuống quá nửa, hoặc phím Esc. Không cài lib.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const panelEl = ref(null)
let lastFocused = null

function close() {
  emit('update:modelValue', false)
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

// Khi mở: nghe Esc toàn cục & đưa focus vào tấm (a11y — bàn phím dùng được, trả
// focus về nơi cũ khi đóng). Khi đóng: gỡ listener.
watch(
  () => props.modelValue,
  (open) => {
    if (typeof window === 'undefined') return
    if (open) {
      lastFocused = document.activeElement
      window.addEventListener('keydown', onKeydown)
      nextTick(() => panelEl.value?.focus())
    } else {
      window.removeEventListener('keydown', onKeydown)
      lastFocused?.focus?.()
      lastFocused = null
    }
  },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
})

const dragging = ref(false)
const dragY = ref(0)
let startY = 0
const DRAG_CLOSE_THRESHOLD = 80

function onHandleDown(ev) {
  dragging.value = true
  startY = ev.clientY
  dragY.value = 0
  ev.target.setPointerCapture?.(ev.pointerId)
}
function onHandleMove(ev) {
  if (!dragging.value) return
  dragY.value = Math.max(0, ev.clientY - startY)
}
function onHandleUp() {
  if (!dragging.value) return
  dragging.value = false
  if (dragY.value > DRAG_CLOSE_THRESHOLD) close()
  dragY.value = 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bsheet-fade">
      <div v-if="modelValue" class="bsheet-overlay" @click.self="close">
        <div
          ref="panelEl"
          class="bsheet-panel"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          :style="{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragging ? 'none' : undefined }"
        >
          <div
            class="bsheet-handle-zone"
            @pointerdown="onHandleDown"
            @pointermove="onHandleMove"
            @pointerup="onHandleUp"
            @pointercancel="onHandleUp"
          >
            <div class="bsheet-handle"></div>
          </div>
          <div class="bsheet-body"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bsheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(20, 18, 35, 0.45);
  display: flex;
  align-items: flex-end;
}
.bsheet-panel {
  width: 100%;
  max-height: 80dvh;
  overflow-y: auto;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -14px 34px rgba(0, 0, 0, 0.22);
  padding-bottom: var(--safe-bottom);
}
.bsheet-panel:focus {
  outline: none;
}
.bsheet-handle-zone {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
  touch-action: none;
  cursor: grab;
}
.bsheet-handle {
  width: 40px;
  height: 5px;
  border-radius: 999px;
  background: var(--line);
}
.bsheet-body {
  padding: 4px 20px 20px;
}

.bsheet-fade-enter-active .bsheet-panel,
.bsheet-fade-leave-active .bsheet-panel {
  transition: transform 0.22s ease;
}
.bsheet-fade-enter-from .bsheet-panel,
.bsheet-fade-leave-to .bsheet-panel {
  transform: translateY(100%);
}
.bsheet-fade-enter-active,
.bsheet-fade-leave-active {
  transition: opacity 0.2s ease;
}
.bsheet-fade-enter-from,
.bsheet-fade-leave-to {
  opacity: 0;
}
</style>
