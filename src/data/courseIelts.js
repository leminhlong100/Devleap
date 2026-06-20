/**
 * Dữ liệu khóa IELTS nền tảng — nạp & parse từ Base_English/*.md lúc chạy.
 * Cấu trúc tuần xem ./md/parseIelts.js. "Ngày" IELTS là checklist; nội dung học
 * (grammar/vocab/lesson script) ở cấp tuần nên getIeltsDay ghép cả hai lại.
 */
import { parseIeltsWeek } from './md/parseIelts'
import { decorateVocab } from './md/vocab'

const rawFiles = import.meta.glob('../../Base_English/*.md', { query: '?raw', import: 'default', eager: true })

export const ieltsWeeksData = Object.values(rawFiles)
  .map((raw) => parseIeltsWeek(raw))
  .filter((w) => w.num > 0)
  .sort((a, b) => a.num - b.num)

export const ieltsTotals = {
  weeks: ieltsWeeksData.length,
  lessons: ieltsWeeksData.reduce((sum, w) => sum + w.days.length, 0),
}

// MD IELTS không có emoji ở tiêu đề tuần — giữ icon biên tập theo kỹ năng.
const ICONS = ['🧭', '🎧', '📖', '✍️', '📝', '🗣️', '💬', '🎯']

// -------------------- Cấu trúc tuần (để suy ra tiến độ) --------------------
export const ieltsWeekStructure = ieltsWeeksData.map((w, i) => ({
  num: w.num,
  icon: ICONS[i % ICONS.length],
  title: w.title,
  sub: w.subtitle || `${w.days.length} ngày học`,
  dayNums: w.days.map((d) => d.n),
}))

const isWeekDone = (wk, completed) => wk.dayNums.every((d) => completed.includes(`${wk.num}:${d}`))

/** Trạng thái mỗi tuần (done/current/locked) từ danh sách ngày đã hoàn thành. */
export function computeIeltsStatuses(completed = []) {
  const map = {}
  let prevDone = true
  for (const wk of ieltsWeekStructure) {
    const done = isWeekDone(wk, completed)
    map[wk.num] = done ? 'done' : prevDone ? 'current' : 'locked'
    prevDone = done
  }
  return map
}

/** Dựng mảng tuần kèm trạng thái mở khóa theo tiến độ hiện tại. */
export function computeIeltsWeeks(completed = []) {
  const statuses = computeIeltsStatuses(completed)
  return ieltsWeekStructure.map((w) => ({ num: w.num, icon: w.icon, title: w.title, sub: w.sub, status: statuses[w.num] }))
}

/** Tóm tắt tiến độ IELTS: số tuần xong, % theo ngày, tuần hiện tại & buổi học tiếp theo. */
export function computeIeltsProgress(completed = []) {
  const statuses = computeIeltsStatuses(completed)
  const doneWeeks = ieltsWeekStructure.filter((w) => statuses[w.num] === 'done').length
  const cur = ieltsWeekStructure.find((w) => statuses[w.num] === 'current')
  let next
  if (cur) {
    const firstUndone = cur.dayNums.find((d) => !completed.includes(`${cur.num}:${d}`))
    next = { week: cur.num, day: firstUndone ?? cur.dayNums[0] }
  } else {
    const last = ieltsWeekStructure[ieltsWeekStructure.length - 1]
    next = { week: last.num, day: last.dayNums[0] }
  }
  const totalDays = ieltsWeekStructure.reduce((s, w) => s + w.dayNums.length, 0)
  return {
    doneWeeks,
    totalWeeks: ieltsWeekStructure.length,
    currentWeek: cur ? cur.num : ieltsWeekStructure.length,
    continue: next,
    allDone: !cur,
    doneDays: completed.length,
    totalDays,
    pct: totalDays ? Math.round((completed.length / totalDays) * 100) : 0,
  }
}

// Bản đồ mặc định (chưa có tiến độ) — dùng cho re-export.
export const ieltsWeeks = computeIeltsWeeks([])

export function getIeltsWeek(num) {
  return ieltsWeeksData.find((w) => w.num === Number(num)) || null
}

/** Chi tiết một ngày IELTS = checklist của ngày + ngữ cảnh tuần (grammar/vocab). */
export function getIeltsDay(weekNum, dayNum) {
  const week = getIeltsWeek(weekNum)
  if (!week) return null
  const idx = week.days.findIndex((d) => d.n === Number(dayNum))
  const day = idx >= 0 ? week.days[idx] : week.days[0]
  if (!day) return null

  const rhythm = week.rhythm[idx] || null
  const title = rhythm?.task?.replace(/\s*\.?\s*$/, '') || `Buổi học ${day.n}`
  const words = week.vocabThemes.flatMap((t) => t.words).slice(0, 12)

  return {
    n: day.n,
    title,
    subtitle: week.subtitle,
    rhythm,
    checklist: day.checklist,
    grammar: week.grammar,
    vocab: decorateVocab(words),
    lessonScript: week.lessonScripts[idx] || null,
    quizHtml: week.quizHtml,
    quiz: week.weekQuiz || [], // quiz trắc nghiệm cấp tuần (dùng chung cho mọi buổi)
    // ngữ cảnh tuần để điều hướng
    week: week.num,
    weekTitle: week.title,
    totalDays: week.days.length,
    prevDay: idx > 0 ? week.days[idx - 1].n : null,
    nextDay: idx < week.days.length - 1 ? week.days[idx + 1].n : null,
    days: week.days.map((d) => ({ n: d.n })),
  }
}
