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
