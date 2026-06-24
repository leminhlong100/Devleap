/**
 * Dữ liệu khóa IELTS nền tảng — nạp & parse từ Base_English/*.md lúc chạy.
 * Cấu trúc tuần xem ./md/parseIelts.js. "Ngày" IELTS là checklist; nội dung học
 * (grammar/vocab/lesson script) ở cấp tuần nên getIeltsDay ghép cả hai lại.
 */
import { parseIeltsWeek } from './md/parseIelts'
import { decorateVocab } from './md/vocab'
import { lookupVocab } from './vocabGlossary'

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

/**
 * Trạng thái mỗi tuần (done/current/locked).
 * Một tuần coi là "done" (để mở tuần kế) khi ĐÃ XONG HẾT NGÀY **và** ĐÃ ĐẠT bài
 * kiểm tra tuần — đúng yêu cầu "pass hết mới qua tuần mới". `isWeekPassed` do view
 * truyền vào (đọc từ store); mặc định luôn true để tương thích ngược.
 */
export function computeIeltsStatuses(completed = [], isWeekPassed = () => true) {
  const map = {}
  let prevDone = true
  for (const wk of ieltsWeekStructure) {
    const done = isWeekDone(wk, completed) && isWeekPassed(wk.num)
    map[wk.num] = done ? 'done' : prevDone ? 'current' : 'locked'
    prevDone = done
  }
  return map
}

/** Dựng mảng tuần kèm trạng thái mở khóa theo tiến độ hiện tại. */
export function computeIeltsWeeks(completed = [], isWeekPassed = () => true) {
  const statuses = computeIeltsStatuses(completed, isWeekPassed)
  return ieltsWeekStructure.map((w) => ({ num: w.num, icon: w.icon, title: w.title, sub: w.sub, status: statuses[w.num] }))
}

/** Tóm tắt tiến độ IELTS: số tuần xong, % theo ngày, tuần hiện tại & buổi học tiếp theo. */
export function computeIeltsProgress(completed = [], isWeekPassed = () => true) {
  const statuses = computeIeltsStatuses(completed, isWeekPassed)
  const doneWeeks = ieltsWeekStructure.filter((w) => statuses[w.num] === 'done').length
  const cur = ieltsWeekStructure.find((w) => statuses[w.num] === 'current')
  let next
  if (cur) {
    // Còn ngày chưa xong -> tới ngày đó; đã xong hết ngày nhưng chưa đạt bài kiểm tra
    // tuần -> đưa về ngày CUỐI (nơi có thẻ "tổng hợp + bài kiểm tra tuần").
    const firstUndone = cur.dayNums.find((d) => !completed.includes(`${cur.num}:${d}`))
    next = { week: cur.num, day: firstUndone ?? cur.dayNums[cur.dayNums.length - 1] }
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

/**
 * Khoảng [start, end) của buổi thứ `dayIdx` khi chia đều `total` mục cho `totalDays`
 * buổi — `extra` buổi đầu nhận thêm 1 mục khi chia không hết.
 */
function chunkRange(total, totalDays, dayIdx) {
  if (!totalDays) return [0, total]
  const base = Math.floor(total / totalDays)
  const extra = total % totalDays
  const start = dayIdx * base + Math.min(dayIdx, extra)
  const take = base + (dayIdx < extra ? 1 : 0)
  return [start, start + take]
}

/** Chọn `n` mồi nhử tất định từ `pool`, bỏ qua `correct`. */
function pickDistractors(pool, correct, n, seed) {
  const others = pool.filter((m) => m !== correct)
  const picked = []
  for (let k = 0; k < others.length && picked.length < n; k++) {
    const cand = others[(seed * n + k) % others.length]
    if (!picked.includes(cand)) picked.push(cand)
  }
  return picked
}

/**
 * Sinh quiz trắc nghiệm cho một buổi từ chính từ vựng buổi đó — vì mỗi buổi học
 * từ khác nhau nên quiz cũng khác nhau (không lặp lại theo ngày). Trộn xoay vòng
 * 3 dạng để luyện sâu: (0) từ → nghĩa, (1) nghĩa → từ, (2) điền từ vào câu.
 * `dayWords` = từ của buổi (mới + ôn); `weekWords` = cả tuần (kho mồi nhử).
 * Mọi lựa chọn đều tất định (xoay vòng theo chỉ số câu) để quiz ổn định.
 */
function buildDayVocabQuiz(dayWords, weekWords) {
  const entries = weekWords.map((w) => ({ w, g: lookupVocab(w) })).filter((x) => x.g && x.g.vi)
  const meaningPool = [...new Set(entries.map((x) => x.g.vi))]
  const wordPool = [...new Set(entries.map((x) => x.w))]
  const out = []
  dayWords.forEach((term, qi) => {
    const g = lookupVocab(term)
    if (!g || !g.vi) return
    const hasBlank = (g.ex || '').includes('{w}')
    // Giải thích: câu ví dụ đã điền từ + nghĩa câu (nếu có).
    const example = g.ex ? g.ex.replace('{w}', term) + (g.exVi ? ` — ${g.exVi}` : '') : `“${term}” = ${g.vi}`
    const pos = qi % 4 // vị trí đáp án đúng xoay vòng cho đỡ đoán mò
    let type = qi % 3
    if (type === 2 && !hasBlank) type = qi % 2 // không có câu ví dụ -> đổi dạng khác

    let q, options, correct
    if (type === 0) {
      // Từ → nghĩa (mồi nhử là nghĩa các từ khác)
      const distract = pickDistractors(meaningPool, g.vi, 3, qi)
      if (distract.length < 3) return
      options = [...distract]
      options.splice(pos, 0, g.vi)
      q = `Từ “${term}” nghĩa là gì?`
      correct = g.vi
    } else if (type === 1) {
      // Nghĩa → từ (mồi nhử là từ tiếng Anh khác)
      const distract = pickDistractors(wordPool, term, 3, qi)
      if (distract.length < 3) return
      options = [...distract]
      options.splice(pos, 0, term)
      q = `“${g.vi}” là từ tiếng Anh nào?`
      correct = term
    } else {
      // Điền từ vào câu (mồi nhử là từ tiếng Anh khác)
      const distract = pickDistractors(wordPool, term, 3, qi)
      if (distract.length < 3) return
      options = [...distract]
      options.splice(pos, 0, term)
      q = `Điền từ thích hợp: “${g.ex.replace('{w}', '_____')}”`
      correct = term
    }
    out.push({ q, opts: options, correct: options.indexOf(correct), ex: example })
  })
  return out
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

  // —— Ngữ pháp theo NGÀY: MỖI NGÀY ĐỀU CÓ VIỆC HỌC (không ngày nào trống) ——
  //  - Ngày 1..n: học MỘT điểm ngữ pháp mới (n = số điểm trong tuần).
  //  - Ngày giữa (đã hết điểm mới, chưa phải cuối): ÔN xoay vòng một điểm/ngày
  //    (idx % n) — mỗi ngày ôn một điểm khác nhau + viết áp dụng điểm đó.
  //  - Ngày CUỐI: TỔNG HỢP cả tuần + viết bài dùng tất cả các điểm.
  // Nhờ vậy ngày nào cũng có bài tập (luyện + viết) để bắt buộc học.
  const G = week.grammar
  const n = G.length
  const totalDaysG = week.days.length
  const isLastDay = idx === totalDaysG - 1
  const isNewGrammarDay = idx < n && !isLastDay

  let dayGrammar
  let grammarMode
  let focusPoint // điểm ngữ pháp trọng tâm của ngày (null khi ngày tổng hợp)
  if (isNewGrammarDay) {
    focusPoint = G[idx]
    dayGrammar = [{ ...focusPoint, isReview: false }]
    grammarMode = 'new'
  } else if (isLastDay) {
    focusPoint = null
    dayGrammar = G.map((g) => ({ ...g, isReview: true }))
    grammarMode = 'final'
  } else {
    focusPoint = n ? G[idx % n] : null
    dayGrammar = focusPoint ? [{ ...focusPoint, isReview: true }] : []
    grammarMode = 'review'
  }

  // Bài tập luyện của ngày: ngày tổng hợp lấy của cả tuần, còn lại lấy của điểm trọng tâm.
  const grammarDrills = (grammarMode === 'final' ? G.flatMap((g) => g.drills || []) : focusPoint?.drills || []).slice(0, 12)

  // Bài tập VIẾT — NGÀY NÀO CŨNG CÓ (việc cần làm tại bài):
  let writingTask = null
  if (grammarMode === 'new' && focusPoint?.writing) {
    writingTask = { title: focusPoint.title, prompt: focusPoint.writing }
  } else if (grammarMode === 'review' && focusPoint) {
    writingTask = {
      title: focusPoint.title,
      prompt: `Viết 6 câu áp dụng điểm ngữ pháp “${focusPoint.title}”. Mỗi câu một dòng.`,
    }
  } else if (grammarMode === 'final' && n) {
    const titles = G.map((g) => g.title).join('; ')
    writingTask = {
      title: 'Tổng hợp tuần',
      prompt: `Viết 8 câu về ${week.title || 'chủ đề tuần này'}, vận dụng các điểm ngữ pháp đã học: ${titles}. Mỗi câu một dòng.`,
    }
  }

  // Từ vựng theo cửa sổ trượt: mỗi buổi học phần MỚI của tuần + ôn lại phần buổi
  // trước, để các ngày khác nhau nhưng vẫn nhắc lại cho nhớ. Câu mẫu & cụm từ lấy
  // theo chính chủ đề chứa từ mới hôm nay (chất liệu để nói thật, không chỉ từ đơn).
  const totalDays = week.days.length
  const flatWords = week.vocabThemes.flatMap((t, ti) => t.words.map((w) => ({ w, ti })))
  const [s, e] = chunkRange(flatWords.length, totalDays, idx)
  const newSlice = flatWords.slice(s, e)
  const [ps, pe] = idx > 0 ? chunkRange(flatWords.length, totalDays, idx - 1) : [0, 0]
  const reviewSlice = flatWords.slice(ps, pe)
  const themeIdxs = [...new Set(newSlice.map((x) => x.ti))]
  const phrases = themeIdxs.flatMap((ti) => week.vocabThemes[ti].phrases || [])
  const sentences = themeIdxs.flatMap((ti) => week.vocabThemes[ti].sentences || [])
  // Quiz buổi: trắc nghiệm nghĩa của chính từ vựng buổi này (mới + ôn) -> khác nhau mỗi ngày.
  const dayQuiz = buildDayVocabQuiz(
    [...newSlice, ...reviewSlice].map((x) => x.w),
    flatWords.map((x) => x.w),
  )

  return {
    n: day.n,
    title,
    subtitle: week.subtitle,
    rhythm,
    checklist: day.checklist,
    grammar: dayGrammar, // ngữ pháp theo ngày (mới hoặc ôn tổng hợp)
    grammarMode, // 'new' | 'review' | 'final'
    grammarDrills, // bài tập ngữ pháp của riêng ngày này (dùng để khóa tiến độ)
    writingTask, // bài tập viết làm ngay tại bài (null nếu ngày ôn / điểm không có)
    vocab: decorateVocab(newSlice.map((x) => x.w)),
    reviewVocab: decorateVocab(reviewSlice.map((x) => x.w)),
    phrases,
    sentences,
    lessonScript: week.lessonScripts[idx] || null,
    skills: week.skills, // bài giảng & khung mẫu của tuần (bài đọc, script nghe, khung Speaking/Writing…)
    quizHtml: week.quizHtml,
    // Tự luyện cuối tuần (Part A/B/C + đáp án) — chỉ hiện ở BUỔI CUỐI để ôn trước bài kiểm tra tuần.
    weekPracticeHtml: isLastDay ? week.weekPracticeHtml : '',
    quiz: dayQuiz, // quiz trắc nghiệm từ vựng riêng từng buổi (khác nhau mỗi ngày)
    // ngữ cảnh tuần để điều hướng
    week: week.num,
    weekTitle: week.title,
    totalDays: week.days.length,
    prevDay: idx > 0 ? week.days[idx - 1].n : null,
    nextDay: idx < week.days.length - 1 ? week.days[idx + 1].n : null,
    days: week.days.map((d) => ({ n: d.n })),
  }
}
