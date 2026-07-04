// Tổng hợp dữ liệu cho trang "Tiến độ" (ProgressView.vue) — điểm viết theo
// buổi, phút nói theo tuần, tỉ lệ nhớ SRS. Hàm THUẦN (không đụng store/Vue)
// để test được; view chỉ gọi và render.

/** Parse chuỗi 'Y-M-D' (không đệm 0 — đúng định dạng `ymd()` trong stores/user.js) thành Date local. */
function parseYmd(s) {
  const [y, m, d] = String(s || '')
    .split('-')
    .map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Điểm viết theo TRÌNH TỰ BUỔI HỌC (tuần, ngày) — chỉ lấy bài đã được AI chữa
 * xong (done && review). Sắp theo tuần/ngày (đúng lộ trình học) thay vì theo
 * ngày nộp thật, để nộp bù/nộp lại không làm lệch trục thời gian của biểu đồ.
 * @param {object} writings  `state.writings` trong stores/user.js: { 'course:week:day': { done, review, at } }
 * @param {string} course
 * @returns {Array<{ key, week, day, at, score, cefr }>}
 */
export function writingSeries(writings = {}, course = 'ielts') {
  const prefix = `${course}:`
  const rows = []
  for (const [key, entry] of Object.entries(writings || {})) {
    if (!key.startsWith(prefix) || !entry?.done || !entry.review) continue
    const [weekStr, dayStr] = key.slice(prefix.length).split(':')
    const week = Number(weekStr)
    const day = Number(dayStr)
    if (!Number.isFinite(week) || !Number.isFinite(day)) continue
    const score = Number(entry.review.score)
    if (!Number.isFinite(score)) continue
    rows.push({ key, week, day, at: entry.at || null, score, cefr: entry.review.cefr || '' })
  }
  rows.sort((a, b) => a.week - b.week || a.day - b.day)
  return rows
}

/** Tóm tắt: bài mới nhất, bài đầu tiên, chênh lệch điểm (null nếu chưa đủ 2 bài). */
export function writingSummary(series = []) {
  if (!series.length) return { latest: null, first: null, delta: null, count: 0 }
  const first = series[0]
  const latest = series[series.length - 1]
  return { latest, first, delta: series.length >= 2 ? latest.score - first.score : null, count: series.length }
}

/** Ngày Thứ Hai của tuần chứa `date`, dạng 'YYYY-MM-DD' — dùng làm khoá gộp theo tuần. */
function weekStartISO(date) {
  const dow = date.getDay() // 0 = Chủ nhật .. 6 = Thứ Bảy
  const backToMonday = (dow + 6) % 7
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - backToMonday)
  const y = start.getFullYear()
  const m = String(start.getMonth() + 1).padStart(2, '0')
  const d = String(start.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Gộp `speakingLog` { 'Y-M-D': giây } thành phút nói theo TUẦN (mốc Thứ Hai),
 * sắp tăng dần theo thời gian.
 * @returns {Array<{ weekStart: string, minutes: number }>}
 */
export function speakingWeeklyMinutes(speakingLog = {}) {
  const byWeek = new Map()
  for (const [key, seconds] of Object.entries(speakingLog || {})) {
    const secs = Number(seconds)
    const date = parseYmd(key)
    if (!date || !secs) continue
    const wk = weekStartISO(date)
    byWeek.set(wk, (byWeek.get(wk) || 0) + secs)
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([weekStart, seconds]) => ({ weekStart, minutes: Math.round(seconds / 60) }))
}

/**
 * Tỉ lệ nhớ từ ước tính từ SRS: trong các thẻ ĐÃ THẬT SỰ được ôn ít nhất 1 lần
 * (last !== null hoặc đã từng quên — bỏ qua thẻ mới tự "gieo" chưa ai đụng tới,
 * xem seedSchedule() trong lib/srs.js), bao nhiêu % đang ở trạng thái "nhớ tốt"
 * (reps > 0 — lần ôn gần nhất KHÔNG phải "Quên"). Trả `null` nếu chưa đủ
 * `minCards` thẻ đã ôn thật — tránh hiện % dựa trên quá ít dữ liệu.
 * @returns {{ pct: number, total: number } | null}
 */
export function srsRetention(srs = {}, minCards = 5) {
  const reviewed = Object.values(srs || {}).filter((c) => c && (c.last || c.lapses > 0))
  if (reviewed.length < minCards) return null
  const remembered = reviewed.filter((c) => c.reps > 0).length
  return { pct: Math.round((remembered / reviewed.length) * 100), total: reviewed.length }
}
