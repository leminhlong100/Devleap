import { ref } from 'vue'

// Singleton module-level, cùng pattern useOnlineStatus.js — bàn phím ảo Android/iOS thu hẹp
// visualViewport mà không đổi window.innerHeight; dùng độ chênh đó để suy ra bàn phím đang mở.
const isKeyboardOpen = ref(false)
let listenersAttached = false

// Chênh > 150px mới coi là bàn phím (loại trừ rung lắc nhỏ do thanh địa chỉ mobile co giãn).
const KEYBOARD_THRESHOLD = 150

function computeKeyboardOpen() {
  if (typeof window === 'undefined' || !window.visualViewport) return
  const shrink = window.innerHeight - window.visualViewport.height
  isKeyboardOpen.value = shrink > KEYBOARD_THRESHOLD
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined' || !window.visualViewport) return
  listenersAttached = true
  window.visualViewport.addEventListener('resize', computeKeyboardOpen)
  computeKeyboardOpen()
}

export function useKeyboardOpen() {
  attachListeners()
  return { isKeyboardOpen }
}
