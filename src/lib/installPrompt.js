// Bước 3.1 — mời cài PWA đúng lúc, đúng người.
// Logic thuần (test được) tách khỏi phần đọc/ghi localStorage và sự kiện trình
// duyệt (`beforeinstallprompt`/`display-mode`), cùng pattern `src/lib/studyReminder.js`.

const DISMISS_KEY = 'devleap:install-dismissed-at'
const MIN_SESSIONS = 1
const SNOOZE_DAYS = 7
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000

/** Đủ điều kiện hiện thẻ mời cài chưa? Thuần — truyền `now` để test không phụ thuộc đồng hồ thật. */
export function eligibleToShowInstallCard({ totalSessions, dismissedAt, now }) {
  if (totalSessions < MIN_SESSIONS) return false
  if (!dismissedAt) return true
  return now - dismissedAt >= SNOOZE_MS
}

export function getDismissedAt() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    const n = raw === null ? null : Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** Ghi lại "Để sau" — không mời lại trong `SNOOZE_DAYS` ngày. */
export function markInstallDismissed(now) {
  try {
    localStorage.setItem(DISMISS_KEY, String(now))
  } catch {
    /* riêng tư/quota đầy — bỏ qua, chỉ mất lựa chọn giữa các phiên */
  }
}

/** Đang chạy standalone (đã cài) chưa — kể cả `navigator.standalone` riêng của iOS Safari. */
export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const mql = window.matchMedia?.('(display-mode: standalone)')
  return Boolean(mql?.matches || window.navigator?.standalone)
}

/** iOS Safari không có `beforeinstallprompt` — phải hướng dẫn tay (Chia sẻ → Thêm vào MH chính). */
export function isIosDevice(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  return /iphone|ipad|ipod/i.test(userAgent)
}
