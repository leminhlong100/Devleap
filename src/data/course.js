/**
 * Dữ liệu khóa Java — nạp & parse từ weeks/*.md lúc chạy (build-time qua Vite).
 *
 * `import.meta.glob(..., { query: '?raw', eager: true })` nhúng nội dung text của
 * mọi file tuần vào bundle, parser biến chúng thành object có cấu trúc. Tiến độ
 * (done/current/locked) là trạng thái người dùng nên giữ ở config riêng — sau này
 * chuyển sang store.
 */
import { parseWeek } from './md/parseWeek'
import { decorateVocab } from './md/vocab'

const rawFiles = import.meta.glob('../../weeks/*.md', { query: '?raw', import: 'default', eager: true })

// Parse tất cả & sắp theo số tuần.
export const javaWeeksData = Object.values(rawFiles)
  .map((raw) => parseWeek(raw))
  .filter((w) => w.num > 0)
  .sort((a, b) => a.num - b.num)

export const javaTotals = {
  weeks: javaWeeksData.length,
  lessons: javaWeeksData.reduce((sum, w) => sum + w.days.length, 0),
}

// -------------------- Cấu trúc tuần (để suy ra tiến độ) --------------------
// Tiến độ thật do người dùng tạo ra (store), nên trạng thái tuần được TÍNH từ
// danh sách ngày đã hoàn thành thay vì hard-code.
export const javaWeekStructure = javaWeeksData.map((w) => ({
  num: w.num,
  icon: w.emoji,
  title: w.title,
  sub: `${w.dateRange} · ${w.days.length} ngày`,
  dayNums: w.days.map((d) => d.n),
}))

const isWeekDone = (wk, completed) => wk.dayNums.every((d) => completed.includes(`${wk.num}:${d}`))

/**
 * Trạng thái mỗi tuần từ danh sách ngày đã hoàn thành:
 *   done    — đã xong mọi ngày
 *   current — tuần đầu tiên chưa xong nhưng đã được mở khóa (tuần trước đã done)
 *   locked  — tuần trước chưa xong
 */
export function computeJavaStatuses(completed = []) {
  const map = {}
  let prevDone = true // tuần 1 luôn mở khóa
  for (const wk of javaWeekStructure) {
    const done = isWeekDone(wk, completed)
    map[wk.num] = done ? 'done' : prevDone ? 'current' : 'locked'
    prevDone = done
  }
  return map
}

// -------------------- Bản đồ tuần (thẻ trên ConquestMap) --------------------
/** Dựng mảng tuần kèm trạng thái mở khóa theo tiến độ hiện tại. */
export function computeJavaWeeks(completed = []) {
  const statuses = computeJavaStatuses(completed)
  return javaWeekStructure.map((w) => ({ num: w.num, icon: w.icon, title: w.title, sub: w.sub, status: statuses[w.num] }))
}

/** Tóm tắt tiến độ: số tuần xong, % theo ngày, tuần hiện tại & ngày học tiếp theo. */
export function computeJavaProgress(completed = []) {
  const statuses = computeJavaStatuses(completed)
  const doneWeeks = javaWeekStructure.filter((w) => statuses[w.num] === 'done').length
  const cur = javaWeekStructure.find((w) => statuses[w.num] === 'current')
  let next
  if (cur) {
    const firstUndone = cur.dayNums.find((d) => !completed.includes(`${cur.num}:${d}`))
    next = { week: cur.num, day: firstUndone ?? cur.dayNums[0] }
  } else {
    const last = javaWeekStructure[javaWeekStructure.length - 1]
    next = { week: last.num, day: last.dayNums[0] }
  }
  const totalDays = javaWeekStructure.reduce((s, w) => s + w.dayNums.length, 0)
  return {
    doneWeeks,
    totalWeeks: javaWeekStructure.length,
    currentWeek: cur ? cur.num : javaWeekStructure.length,
    continue: next,
    allDone: !cur,
    doneDays: completed.length,
    totalDays,
    pct: totalDays ? Math.round((completed.length / totalDays) * 100) : 0,
  }
}

// Bản đồ mặc định (chưa có tiến độ) — dùng cho re-export & tính tổng.
export const javaWeeks = computeJavaWeeks([])

// -------------------- Truy vấn --------------------
export function getJavaWeek(num) {
  return javaWeeksData.find((w) => w.num === Number(num)) || null
}

/** Trả về chi tiết một ngày + ngữ cảnh tuần để điều hướng. */
export function getJavaDay(weekNum, dayNum) {
  const week = getJavaWeek(weekNum)
  if (!week) return null
  const idx = week.days.findIndex((d) => d.n === Number(dayNum))
  const day = idx >= 0 ? week.days[idx] : week.days[0]
  if (!day) return null
  return {
    ...day,
    vocab: decorateVocab(day.vocab),
    week: week.num,
    weekTitle: week.title,
    weekEmoji: week.emoji,
    totalDays: week.days.length,
    prevDay: idx > 0 ? week.days[idx - 1].n : null,
    nextDay: idx < week.days.length - 1 ? week.days[idx + 1].n : null,
    days: week.days.map((d) => ({ n: d.n, title: d.title, mode: d.mode })),
  }
}
