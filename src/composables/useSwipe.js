import { ref } from 'vue'

// Tỉ lệ bề ngang phải kéo qua mới tính là "vuốt xong" (30% theo kế hoạch mobile PWA).
export const SWIPE_THRESHOLD_RATIO = 0.3

/**
 * Tính trạng thái vuốt ngang thuần túy (không đụng DOM) — tách riêng để test được
 * mà không cần giả lập PointerEvent.
 * @param {number} dx     Độ lệch ngang hiện tại tính bằng px (dương = sang phải).
 * @param {number} width  Bề ngang phần tử đang vuốt, dùng làm mốc 100%.
 */
export function swipeState(dx, width) {
  const w = width > 0 ? width : 1
  const progress = Math.max(-1, Math.min(1, dx / w))
  const ratio = Math.abs(progress)
  const direction = dx > 0 ? 'right' : dx < 0 ? 'left' : null
  return { progress, ratio, direction, committed: ratio >= SWIPE_THRESHOLD_RATIO }
}

/**
 * Vuốt ngang bằng Pointer Events (chuột + chạm, không cần thư viện). Gắn 4 handler
 * trả về vào phần tử cần vuốt; `onCommit(direction)` được gọi khi thả tay lúc đã
 * vượt ngưỡng `SWIPE_THRESHOLD_RATIO`. `enabled()` cho phép tắt vuốt theo điều kiện
 * (vd. Flashcard: chỉ vuốt được sau khi đã lật thẻ).
 */
export function useSwipe({ onCommit, enabled = () => true } = {}) {
  const dx = ref(0)
  const dragging = ref(false)
  const hasDragged = ref(false) // đã kéo đủ xa để coi là vuốt, không phải chạm để bấm
  const state = ref(swipeState(0, 1))
  let startX = 0
  let width = 1
  let pointerId = null

  function onPointerDown(e) {
    if (!enabled()) return
    // Bấm vào nút bên trong (chấm điểm, nghe phát âm, bỏ lưu...) thì không bắt
    // đầu vuốt/giữ pointer capture — nếu không, capture sẽ "nuốt" luôn click của
    // nút đó (mouseup/click bị chuyển hướng về phần tử giữ capture).
    if (e.target?.closest?.('button, a, input, select, textarea')) return
    startX = e.clientX
    width = e.currentTarget?.offsetWidth || 1
    pointerId = e.pointerId
    dragging.value = true
    hasDragged.value = false
    e.currentTarget?.setPointerCapture?.(pointerId)
  }

  function onPointerMove(e) {
    if (!dragging.value) return
    dx.value = e.clientX - startX
    if (Math.abs(dx.value) > 8) hasDragged.value = true
    state.value = swipeState(dx.value, width)
  }

  function endDrag() {
    if (!dragging.value) return
    dragging.value = false
    const s = state.value
    if (s.committed && s.direction) {
      // Bay hẳn ra khỏi màn hình thay vì bật lại giữa — gọi `reset()` (vd. khi
      // đổi sang thẻ kế) mới đưa vị trí về 0, cho cảm giác thẻ mới trượt vào.
      dx.value = s.direction === 'right' ? width * 1.3 : -width * 1.3
      onCommit?.(s.direction)
    } else {
      dx.value = 0
    }
    state.value = swipeState(0, width)
  }

  function reset() {
    dragging.value = false
    hasDragged.value = false
    dx.value = 0
    state.value = swipeState(0, width)
  }

  return {
    dx,
    dragging,
    hasDragged,
    state,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    reset,
  }
}
