import { ref } from 'vue'

// Bước 4.1 — Hướng chuyển trang trên mobile: đi sâu (Home → Course → Day) trượt
// vào từ phải, quay lại trượt ngược. Xác định hướng bằng ĐỘ SÂU path (số đoạn
// khác rỗng) — không cần gắn meta.depth cho từng route. Singleton (cùng pattern
// useOnlineStatus/useMediaQuery): router set, App.vue đọc.

const direction = ref('none') // 'forward' | 'back' | 'none'

/** Số đoạn path khác rỗng: '/' → 0, '/courses' → 1, '/courses/ielts/week/2/day/3' → 6. Thuần, test được. */
export function pathDepth(path) {
  return (path || '').split('/').filter(Boolean).length
}

/** Suy hướng từ độ sâu 2 path. Thuần, test được. */
export function directionFor(toPath, fromPath) {
  const dt = pathDepth(toPath)
  const df = pathDepth(fromPath)
  if (dt > df) return 'forward'
  if (dt < df) return 'back'
  return 'none'
}

/** Router gọi trong afterEach (chỉ chạy khi điều hướng đã xác nhận). */
export function setRouteDirection(to, from) {
  direction.value = directionFor(to.path, from.path)
}

export function useRouteTransition() {
  return { direction }
}
