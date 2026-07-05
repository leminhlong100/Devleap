// Tiện ích dùng chung giữa các slice của store `user` — thuần, không đụng state.

export const dayKey = (week, day) => `${week}:${day}`
export const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

// Chuẩn hóa từ để sinh srsId khớp với `cardsFromTerms` (data/tools.js) mà không
// phải kéo chunk khóa học (course.js/courseIelts.js) nặng vào bundle của store —
// xem `data/searchIndex.js#normalize`, cùng logic, cố ý trùng lặp.
export const normalizeTerm = (str) =>
  (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// Hợp nhất 2 mảng thành tập hợp không trùng (giữ tiến độ từ cả 2 thiết bị).
export const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))

// Chọn ngày muộn hơn giữa 2 chuỗi 'YYYY-M-D' (null-safe).
export const laterDate = (a, b) => {
  if (!a) return b || null
  if (!b) return a
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b
}

// Khóa tuần ISO 8601 dạng "YYYY-Wnn" (Thứ 2 là đầu tuần) — khớp định dạng SQL
// `to_char(now(), 'IYYY-"W"IW')` dùng ở hàm `leaderboard_weekly()` (schema.sql),
// để so khớp "tuần hiện tại" giữa client và server. So sánh lexicographic đúng
// thứ tự thời gian nhờ pad 2 số cho tuần.
export const isoWeekKey = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dow = date.getUTCDay() || 7 // Chủ nhật (0) -> 7, để Thứ 2 = 1
  date.setUTCDate(date.getUTCDate() + 4 - dow) // dịch về Thứ 5 của tuần ISO
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
