import { ref } from 'vue'

// Singleton module-level, cùng pattern useOnlineStatus.js — 1 luồng theo dõi
// service worker cho toàn app, `UpdateToast` chỉ đọc lại state chung.
const updateAvailable = ref(false)
let registration = null
let reloading = false
let attached = false

function watchInstallingWorker(worker) {
  worker.addEventListener('statechange', () => {
    // "installed" + đã có controller nghĩa là đây là bản THAY THẾ 1 SW đang
    // chạy (không phải lần cài đầu tiên) — mới cần mời tải lại.
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      updateAvailable.value = true
    }
  })
}

/** Đăng ký service worker + toàn bộ luồng phát hiện bản mới. Gọi 1 lần từ `main.js`. */
export function registerServiceWorkerUpdates() {
  if (attached || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  attached = true

  navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      registration = reg
      // Đã có bản mới cài xong từ trước, đang chờ (tab mở lúc build mới xong deploy).
      if (reg.waiting && navigator.serviceWorker.controller) updateAvailable.value = true
      reg.addEventListener('updatefound', () => {
        if (reg.installing) watchInstallingWorker(reg.installing)
      })
    })
    .catch(() => {})

  // SW mới nhận quyền kiểm soát (sau khi trang gọi SKIP_WAITING) → JS đang chạy
  // đã lỗi thời, reload đúng 1 lần để lấy bản mới (cờ module chặn lặp).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  // Mở lại app từ background (chuyển tab/khóa màn hình) → chủ động hỏi có bản mới không.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration?.update().catch(() => {})
  })
}

export function useServiceWorkerUpdate() {
  function applyUpdate() {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }
  return { updateAvailable, applyUpdate }
}
