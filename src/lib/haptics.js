// Bước 4.1 — Haptic (phản hồi xúc giác) mức app qua navigator.vibrate.
// iOS Safari/standalone KHÔNG hỗ trợ vibrate → mọi lời gọi tự bỏ qua (silent
// fail), không cần feature-check ở nơi gọi. Tách phần QUYẾT ĐỊNH pattern (thuần,
// test được — cùng triết lý appBadge.js) khỏi phần gọi API trình duyệt.

const STORAGE_KEY = 'devleap:haptics'

/**
 * Pattern rung (ms) theo loại sự kiện. Thuần — test trực tiếp.
 *  - light: gõ nhẹ khi chấm đúng / lật-chấm thẻ.
 *  - success: rung nhẹ ngắt quãng khi hoàn thành buổi / lên streak.
 *  - error: rung kép khi trả lời sai.
 * Loại lạ → 0 (không rung).
 */
export function vibrationPattern(kind) {
  switch (kind) {
    case 'light':
      return 12
    case 'success':
      return [14, 45, 26]
    case 'error':
      return [22, 55, 22]
    default:
      return 0
  }
}

/** Người dùng có bật haptic không (mặc định BẬT; chỉ tắt khi lưu 'off'). */
export function isHapticEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Bật/tắt haptic, nhớ vào localStorage. */
export function setHapticEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Riêng tư/quota đầy — chỉ không nhớ được lựa chọn, không phải lỗi.
  }
}

/**
 * Rung theo loại sự kiện. Feature-detect + tôn trọng toggle của người dùng.
 * Trả về true nếu đã thực sự gọi API rung (để test), false nếu bị bỏ qua.
 */
export function haptic(kind) {
  try {
    if (!isHapticEnabled()) return false
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
    const pattern = vibrationPattern(kind)
    if (!pattern || (Array.isArray(pattern) && pattern.length === 0)) return false
    return navigator.vibrate(pattern) === true
  } catch {
    return false
  }
}

export const hapticLight = () => haptic('light')
export const hapticSuccess = () => haptic('success')
export const hapticError = () => haptic('error')
