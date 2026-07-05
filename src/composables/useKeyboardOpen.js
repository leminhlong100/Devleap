import { ref } from 'vue'

// Singleton module-level, cùng pattern useOnlineStatus.js — bàn phím ảo Android/iOS thu hẹp
// visualViewport mà không đổi window.innerHeight; dùng độ chênh đó để suy ra bàn phím đang mở.
const isKeyboardOpen = ref(false)
// Số px viewport bị bàn phím che (= độ chênh visualViewport), 0 khi bàn phím đóng.
// Dùng để dán các thanh dính đáy (vd. composer chat) ngay sát mép bàn phím thay vì
// bị bàn phím che mất — vì bàn phím chỉ thu hẹp visualViewport, không đổi
// window.innerHeight, nên phần tử `position: fixed/sticky` theo layout viewport sẽ
// nằm khuất phía sau bàn phím nếu không cộng thêm khoảng chênh này.
const keyboardInset = ref(0)
let listenersAttached = false

// Chênh > 150px mới coi là bàn phím (loại trừ rung lắc nhỏ do thanh địa chỉ mobile co giãn).
const KEYBOARD_THRESHOLD = 150

function computeKeyboardOpen() {
  if (typeof window === 'undefined' || !window.visualViewport) return
  const shrink = window.innerHeight - window.visualViewport.height
  isKeyboardOpen.value = shrink > KEYBOARD_THRESHOLD
  keyboardInset.value = isKeyboardOpen.value ? Math.round(shrink) : 0
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined' || !window.visualViewport) return
  listenersAttached = true
  window.visualViewport.addEventListener('resize', computeKeyboardOpen)
  computeKeyboardOpen()
}

export function useKeyboardOpen() {
  attachListeners()
  return { isKeyboardOpen, keyboardInset }
}
