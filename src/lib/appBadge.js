// Bước 3.4 — Badging API: chấm số từ đến hạn ôn lên icon app khi đã cài PWA.
// Logic quyết định số badge tách thuần (test được) khỏi phần gọi API trình
// duyệt; mọi lời gọi API đều feature-detect + nuốt lỗi vì phần lớn trình
// duyệt/thiết bị (đặc biệt iOS ngoài standalone) không hỗ trợ.

/**
 * Số hiển thị trên badge suy từ số từ đến hạn — luôn là số nguyên không âm.
 * Trả về 0 nghĩa là "không có gì để nhắc" → xóa badge. Thuần, test trực tiếp.
 */
export function badgeCount(dueTodayCount) {
  const n = Math.floor(Number(dueTodayCount))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Đặt badge số trên icon app. Trả về đã gọi được API hay chưa (để test). */
export function setAppBadge(n) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.setAppBadge !== 'function') return false
    const r = navigator.setAppBadge(n)
    if (r && typeof r.catch === 'function') r.catch(() => {})
    return true
  } catch {
    return false
  }
}

/** Xóa badge trên icon app. Trả về đã gọi được API hay chưa. */
export function clearAppBadge() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.clearAppBadge !== 'function') return false
    const r = navigator.clearAppBadge()
    if (r && typeof r.catch === 'function') r.catch(() => {})
    return true
  } catch {
    return false
  }
}

/**
 * Đồng bộ badge theo số từ đến hạn: >0 thì đặt số, =0 thì xóa. Gọi lúc mở app
 * và mỗi khi `dueTodayCount` đổi (watch ở `App.vue`). Trả về số đã dùng.
 */
export function updateAppBadge(dueTodayCount) {
  const n = badgeCount(dueTodayCount)
  if (n > 0) setAppBadge(n)
  else clearAppBadge()
  return n
}
