/**
 * Đo TRÔI CHẢY cho khóa "Giao Tiếp Thực Chiến" (kế hoạch "Nói Tự Tin", Trục B).
 * Toàn bộ là hàm thuần (không phụ thuộc DOM) để test được và tái dùng ở
 * useChatEngine — số liệu lấy từ mốc thời gian mic của listen.js:
 *   - WPM (words per minute): nói KỊP tới đâu.
 *   - Độ trễ (latency): từ lúc mic bật đến khi bật ra tiếng đầu tiên — đo "dám nói ngay".
 * Không chấm đúng/sai, chỉ đo tốc độ & phản xạ để đưa số KHÁCH QUAN vào debrief.
 */

/** Đếm số từ trong một câu/đoạn (tách theo khoảng trắng, bỏ rỗng). */
export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * Words-per-minute từ số từ + số giây NÓI. Làm tròn số nguyên. Trả 0 khi thiếu
 * dữ liệu (giây ≤ 0) để nơi gọi tự bỏ mẫu nhiễu.
 */
export function computeWpm(words, seconds) {
  const w = Number(words) || 0
  const s = Number(seconds) || 0
  if (w <= 0 || s <= 0) return 0
  return Math.round(w / (s / 60))
}

/**
 * Đồng hồ trả lời theo THANG TRƯỢT theo tuần (chống người mới bị 10s dồn thành đơ):
 * Tuần 1–2 = 15s, Tuần 3–5 = 12s, Tuần 6–8 = 8s. Chỉ áp cho khóa comm; khóa khác
 * giữ 10s như cũ. Trả về số giây (đồng hồ có thể tắt hẳn ở tầng UI).
 * @param {number|string} week
 * @param {string} course  'comm' -> thang trượt; else 10s.
 */
export function answerSecondsForWeek(week, course = '') {
  if (course !== 'comm') return 10
  const w = Number(week) || 1
  if (w <= 2) return 15
  if (w <= 5) return 12
  return 8
}

/**
 * Trần WPM HỢP LÝ khi nói (kế hoạch cải tiến #7 — chống điểm ảo). Người bản ngữ
 * nói nhanh cỡ 150–160 WPM; một học viên A2 khó vượt ~200. Một lượt "nói" mà WPM
 * vọt trên trần này thường là transcript DÀI hơn thời gian nói thật (dán chữ, hoặc
 * STT nhả một cục dài dù chỉ bật tiếng chốc lát) -> đáng ngờ, không tính là "đã nói".
 */
export const SPOKEN_WPM_CEILING = 220

/** Lượt nói này có tốc độ bất thường (transcript không khớp thời gian nói) không? */
export function isSuspiciousWpm(wpm) {
  return Number(wpm) > SPOKEN_WPM_CEILING
}

/**
 * Đối chiếu số liệu nói với transcript để phát hiện "điểm ảo" (kế hoạch #7).
 * @param {Array<{wpm:number}>} samples  mẫu trôi chảy đã đo bằng mic trong buổi
 * @param {number} userTurns  tổng số lượt NGƯỜI HỌC đã gửi (cả gõ lẫn nói)
 * @returns {{userTurns:number, voiceTurns:number, suspiciousTurns:number}}
 *   voiceTurns = số lượt thực sự đo được bằng giọng; suspiciousTurns = số lượt WPM
 *   vượt trần (transcript lệch thời gian nói).
 */
export function fluencyIntegrity(samples = [], userTurns = 0) {
  const valid = (Array.isArray(samples) ? samples : []).filter((s) => s && Number(s.wpm) > 0)
  return {
    userTurns: Math.max(0, Number(userTurns) || 0),
    voiceTurns: valid.length,
    suspiciousTurns: valid.filter((s) => isSuspiciousWpm(s.wpm)).length,
  }
}

/**
 * Tổng hợp các mẫu trôi chảy trong 1 buổi -> { turns, avgWpm, avgLatency, bestWpm }.
 * mỗi mẫu = { wpm, latency } (latency giây, có thể null nếu không đo được).
 * Bỏ mẫu wpm ≤ 0 (nhiễu/không nói). Trả null khi không có mẫu hợp lệ.
 */
export function summarizeFluency(samples = []) {
  const valid = (Array.isArray(samples) ? samples : []).filter((s) => s && Number(s.wpm) > 0)
  if (!valid.length) return null
  const wpms = valid.map((s) => Number(s.wpm))
  const lats = valid
    .map((s) => s.latency)
    .filter((n) => n != null && Number.isFinite(Number(n)) && Number(n) >= 0)
    .map(Number)
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  return {
    turns: valid.length,
    avgWpm: avg(wpms),
    bestWpm: Math.max(...wpms),
    avgLatency: lats.length ? Math.round((lats.reduce((a, b) => a + b, 0) / lats.length) * 10) / 10 : null,
  }
}
