import { ref } from 'vue'

// Singleton module-level, cùng pattern useTheme.js — mọi nơi gọi useOnlineStatus()
// đọc chung 1 trạng thái, chỉ đăng ký listener window 1 lần.
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
let listenersAttached = false

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
}

export function useOnlineStatus() {
  attachListeners()
  return { isOnline }
}
