/**
 * Dữ liệu khóa IELTS nền tảng — nạp & parse từ Base_English/*.md lúc chạy.
 * Cấu trúc tuần xem ./md/parseIelts.js. "Ngày" IELTS là checklist; nội dung học
 * (grammar/vocab/lesson script) ở cấp tuần nên getIeltsDay ghép cả hai lại.
 */
import { parseIeltsWeek } from './md/parseIelts'
import { decorateVocab } from './md/vocab'
import { lookupVocab } from './vocabGlossary'
import { getIeltsInput } from './ieltsInput'
import { getGrammarExtra } from './ieltsGrammarExtra'

const rawFiles = import.meta.glob('../../Base_English/*.md', { query: '?raw', import: 'default', eager: true })

// Track A (Work & Life English, mặc định) thay Tuần 6–8 bằng bản "*_Work.md";
// Track B (IELTS Bridge) giữ nguyên các file gốc. Tuần 1–5 dùng chung cho cả hai track.
const baseRaw = {}
const workRaw = {}
for (const [path, mod] of Object.entries(rawFiles)) {
  if (/_Work\.md$/.test(path)) workRaw[path] = mod
  else baseRaw[path] = mod
}

const TRACK_KEY = 'devleap:ielts-track:v1'
/** Đọc track đã lưu (mặc định 'A' — Work & Life English). Đổi track cần tải lại trang. */
function readTrackPref() {
  try {
    return localStorage.getItem(TRACK_KEY) === 'B' ? 'B' : 'A'
  } catch {
    return 'A'
  }
}
export function setIeltsTrackPref(track) {
  try {
    localStorage.setItem(TRACK_KEY, track === 'B' ? 'B' : 'A')
  } catch {
    // localStorage không khả dụng (SSR/test) -> bỏ qua, track vẫn dùng mặc định
  }
}
export const ieltsTrack = readTrackPref()

const baseWeeksRaw = Object.values(baseRaw).map((raw) => parseIeltsWeek(raw)).filter((w) => w.num > 0)
const workWeeksRaw = Object.values(workRaw).map((raw) => parseIeltsWeek(raw)).filter((w) => w.num > 0)
const weeksCache = {}

/** Dựng danh sách tuần cho một track cụ thể ('A' | 'B'), có cache lại. */
export function getIeltsWeeksData(track) {
  const key = track === 'B' ? 'B' : 'A'
  if (weeksCache[key]) return weeksCache[key]
  const workNums = new Set(workWeeksRaw.map((w) => w.num))
  const weeks = (
    key === 'A' ? [...baseWeeksRaw.filter((w) => !workNums.has(w.num)), ...workWeeksRaw] : baseWeeksRaw
  )
    .map(mergeGrammarExtra)
    .sort((a, b) => a.num - b.num)
  weeksCache[key] = weeks
  return weeks
}

// Chuẩn hóa câu hỏi để so trùng khi gộp bài tập (bỏ dấu câu, gộp khoảng trắng).
const drillKey = (q) => String(q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Gộp bài tập biên soạn thêm (ieltsGrammarExtra) vào mỗi điểm ngữ pháp — để buổi
 * học mới có đủ 6–10 câu (cổng ≥70% mới có ý nghĩa). Dedup theo câu hỏi, cắt ≤10.
 */
function mergeGrammarExtra(week) {
  for (const g of week.grammar || []) {
    const extra = getGrammarExtra(week.num, g.title)
    if (!extra.length) continue
    const seen = new Set((g.drills || []).map((d) => drillKey(d.q)))
    for (const d of extra) {
      const k = drillKey(d.q)
      if (seen.has(k)) continue
      seen.add(k)
      g.drills.push(d)
    }
    g.drills = g.drills.slice(0, 10)
  }
  return week
}

export const ieltsWeeksData = getIeltsWeeksData(ieltsTrack)

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
 * `seed` = dịch dạng câu/mồi nhử theo BUỔI: từ trùng giữa các ngày (do cửa sổ ôn
 * chồng lấn) sẽ không hỏi y hệt — buổi này hỏi "từ→nghĩa", buổi sau "điền vào câu"…
 * Mọi lựa chọn vẫn tất định (xoay vòng theo chỉ số + seed) để quiz ổn định.
 */
function buildDayVocabQuiz(dayWords, weekWords, seed = 0) {
  const entries = weekWords.map((w) => ({ w, g: lookupVocab(w) })).filter((x) => x.g && x.g.vi)
  const meaningPool = [...new Set(entries.map((x) => x.g.vi))]
  const wordPool = [...new Set(entries.map((x) => x.w))]
  const out = []
  dayWords.forEach((term, qi) => {
    const g = lookupVocab(term)
    if (!g || !g.vi) return
    const k = qi + seed // chỉ số xoay vòng đã dịch theo buổi
    const hasBlank = (g.ex || '').includes('{w}')
    // Giải thích: câu ví dụ đã điền từ + nghĩa câu (nếu có).
    const example = g.ex ? g.ex.replace('{w}', term) + (g.exVi ? ` — ${g.exVi}` : '') : `“${term}” = ${g.vi}`
    const pos = k % 4 // vị trí đáp án đúng xoay vòng cho đỡ đoán mò
    let type = k % 4
    if ((type === 2 || type === 3) && !hasBlank) type = k % 2 // cần câu ví dụ -> lùi về dạng từ/nghĩa

    if (type === 3) {
      // GÕ từ vào câu (nhập chữ) — đổi tay-bấm sang tay-gõ để chống nhàm; QuizTool dạng cloze.
      out.push({
        type: 'cloze',
        q: `Gõ từ đúng vào chỗ trống: “${g.ex.replace('{w}', '_____')}”`,
        answer: [term],
        ex: example,
      })
      return
    }

    let q, options, correct
    if (type === 0) {
      // Từ → nghĩa (mồi nhử là nghĩa các từ khác)
      const distract = pickDistractors(meaningPool, g.vi, 3, k)
      if (distract.length < 3) return
      options = [...distract]
      options.splice(pos, 0, g.vi)
      q = `Từ “${term}” nghĩa là gì?`
      correct = g.vi
    } else if (type === 1) {
      // Nghĩa → từ (mồi nhử là từ tiếng Anh khác)
      const distract = pickDistractors(wordPool, term, 3, k)
      if (distract.length < 3) return
      options = [...distract]
      options.splice(pos, 0, term)
      q = `“${g.vi}” là từ tiếng Anh nào?`
      correct = term
    } else {
      // Điền từ vào câu (mồi nhử là từ tiếng Anh khác)
      const distract = pickDistractors(wordPool, term, 3, k)
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

/**
 * Sinh bài "SẮP XẾP CÂU" từ các câu ĐÚNG của buổi — đổi vị giác luyện tập (chạm từng
 * từ về đúng thứ tự thay vì bấm trắc nghiệm). Chỉ lấy câu 4–12 từ cho vừa sức; xáo
 * TẤT ĐỊNH theo `seed` (xoay vòng) để bài ổn định giữa các lần mở, và luôn KHÁC thứ
 * tự gốc. QuizTool render dạng `order` (tokens + answer).
 */
function buildSentenceOrderQuiz(sentences, seed = 0, max = 3) {
  const clean = [
    ...new Set((sentences || []).map((s) => String(s || '').trim().replace(/\s+/g, ' '))),
  ].filter((s) => {
    const n = s.split(' ').length
    return n >= 4 && n <= 12
  })
  if (!clean.length) return []
  const out = []
  for (let i = 0; i < clean.length && out.length < max; i++) {
    const s = clean[(seed + i) % clean.length]
    const words = s.replace(/[.]+$/, '').split(' ')
    const rot = 1 + ((seed + i) % Math.max(1, words.length - 1)) // xoay -> đảo thứ tự
    const tokens = [...words.slice(rot), ...words.slice(0, rot)]
    if (tokens.join(' ') === words.join(' ') && words.length > 1) {
      ;[tokens[0], tokens[1]] = [tokens[1], tokens[0]] // chẳng may trùng -> hoán 2 từ đầu
    }
    out.push({
      type: 'order',
      q: 'Sắp xếp các từ thành câu đúng:',
      tokens,
      answer: [words.join(' '), s],
      ex: `Câu đúng: “${s}”`,
    })
  }
  return out
}

/**
 * Sinh QUIZ TỰ LUYỆN CUỐI TUẦN — bài ôn TỔNG HỢP cả tuần, KHÁC các quiz từng ngày:
 *  - Ngữ pháp: gom bài "điền chỗ trống / sửa câu" của TẤT CẢ điểm ngữ pháp trong tuần.
 *  - Từ vựng: sinh trắc nghiệm trên TOÀN BỘ từ của tuần (các ngày chỉ lấy ~8 từ/buổi),
 *    nên thứ tự/ dạng câu/ mồi nhử khác với mọi buổi đã học.
 * Đan xen ngữ pháp ↔ từ vựng cho đa dạng; cắt còn tối đa 16 câu cho vừa sức ôn.
 * Tất định (không random) để bài ổn định giữa các lần mở.
 */
export function buildWeekQuiz(week) {
  const flatWords = (week.vocabThemes || []).flatMap((t) => t.words)
  const grammarQs = (week.grammar || []).flatMap((g) => g.drills || [])
  const vocabQs = buildDayVocabQuiz(flatWords, flatWords, 5) // seed lệch -> dạng câu khác các buổi
  const mixed = []
  const maxLen = Math.max(grammarQs.length, vocabQs.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < grammarQs.length) mixed.push(grammarQs[i])
    if (i < vocabQs.length) mixed.push(vocabQs[i])
  }
  return mixed.slice(0, 16)
}

// -------------------- Gán ngữ pháp THEO KẾ HOẠCH NGÀY --------------------
// Chuẩn hóa tiếng Việt: bỏ dấu, hạ thường, bỏ ký tự lạ -> để so khớp tiêu đề ngày
// (vd "Past simple") với mục ngữ pháp (vd "Past Simple — Kể chuyện đã xong").
function normVi(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Từ khóa quá chung -> không dùng để so khớp (tránh khớp nhầm).
const GRAMMAR_STOP = new Set([
  'cua', 'va', 'cac', 'mot', 'cho', 'khi', 'the', 'voi', 'hay', 'bi', 'de', 'nhat',
  'mo', 'ta', 'lam', 'bai', 'tap', 'doc', 'to', 'ghi', 'am', 'on', 'sua', 'loi',
  'cau', 'nhung', 'gi', 'co', 'khong', 'theo', 'ngu', 'phap', 'diem', 'buoi',
])
function grammarTokens(title) {
  return [...new Set(normVi(title).split(' '))].filter((t) => t.length >= 2 && !GRAMMAR_STOP.has(t))
}

/**
 * Quyết định mỗi NGÀY dạy điểm ngữ pháp nào — KHỚP tiêu đề/checklist ngày với mục
 * ngữ pháp, KHÔNG gán theo vị trí. Sửa cảnh "tiêu đề một đằng, nội dung một nẻo"
 * khi thứ tự mục ngữ pháp ≠ thứ tự dạy (vd Tuần 4) hoặc tuần có ít điểm hơn số ngày.
 * Trả về mảng theo từng ngày: { mode: 'new'|'review'|'final', focusIdx: number|null }.
 */
export function assignWeekGrammar(week) {
  const G = week.grammar || []
  const days = week.days || []
  const n = G.length
  const D = days.length
  // Mặc định: ngày cuối tổng hợp, còn lại ôn xoay vòng (giữ tương thích khi không khớp).
  const out = days.map((_, i) => ({ mode: i === D - 1 ? 'final' : 'review', focusIdx: n ? i % n : null }))
  if (!n || !D) return out

  // Văn bản nhận diện của mỗi ngày = nhiệm vụ chính (nhịp học) + checklist.
  const dayText = days.map((d, i) => normVi([week.rhythm?.[i]?.task, ...(d.checklist || [])].join(' ')))

  // Tìm NGÀY DẠY tốt nhất cho từng điểm ngữ pháp (điểm số = số từ khóa khớp).
  // Chỉ cần ≥ 1 từ khóa đặc trưng (vd "future", "comparative") là đủ tin cậy.
  const used = new Array(D).fill(false)
  const introDay = {} // focusIdx -> dayIdx
  for (let gi = 0; gi < n; gi++) {
    const toks = grammarTokens(G[gi].title)
    let best = -1
    let bestScore = 0
    for (let di = 0; di < D; di++) {
      if (used[di] || di === D - 1) continue // ngày cuối luôn để tổng hợp
      const sc = toks.reduce((a, t) => a + (dayText[di].includes(t) ? 1 : 0), 0)
      if (sc > bestScore) {
        bestScore = sc
        best = di
      }
    }
    if (best >= 0) {
      used[best] = true
      introDay[gi] = best
    }
  }

  // Điểm chưa khớp được (vd tiêu đề tiếng Anh "Questions" vs ngày "Câu hỏi") ->
  // rải vào ngày (không phải ngày cuối) còn trống, theo thứ tự, để không điểm nào bị bỏ.
  for (let gi = 0; gi < n; gi++) {
    if (introDay[gi] !== undefined) continue
    const slot = used.findIndex((u, di) => !u && di !== D - 1)
    if (slot >= 0) {
      used[slot] = true
      introDay[gi] = slot
    }
  }

  // Ngày khớp = 'new'; ngày cuối = 'final'; còn lại = 'review' xoay vòng QUA CÁC ĐIỂM
  // ĐÃ ĐƯỢC DẠY (không ôn điểm chưa từng học).
  const introOrder = Object.keys(introDay).map(Number).sort((a, b) => introDay[a] - introDay[b])
  const dayToPoint = {}
  for (const gi of Object.keys(introDay)) dayToPoint[introDay[gi]] = Number(gi)
  let rev = 0
  return days.map((_, i) => {
    if (i === D - 1) return { mode: 'final', focusIdx: null }
    if (dayToPoint[i] !== undefined) return { mode: 'new', focusIdx: dayToPoint[i] }
    const f = introOrder.length ? introOrder[rev++ % introOrder.length] : null
    return { mode: 'review', focusIdx: f }
  })
}

// Bản đồ mặc định (chưa có tiến độ) — dùng cho re-export.
export const ieltsWeeks = computeIeltsWeeks([])

export function getIeltsWeek(num, weeksData = ieltsWeeksData) {
  return weeksData.find((w) => w.num === Number(num)) || null
}

/** Chi tiết một ngày IELTS = checklist của ngày + ngữ cảnh tuần (grammar/vocab). */
export function getIeltsDay(weekNum, dayNum, weeksData = ieltsWeeksData) {
  const week = getIeltsWeek(weekNum, weeksData)
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

  // Gán ngữ pháp theo KẾ HOẠCH NGÀY (khớp tiêu đề/checklist với mục ngữ pháp),
  // tính một lần cho cả tuần rồi cache lại trên đối tượng tuần.
  const gplan = (week._grammarPlan || (week._grammarPlan = assignWeekGrammar(week)))
  const slot = gplan[idx] || { mode: isLastDay ? 'final' : 'review', focusIdx: null }

  let dayGrammar
  const grammarMode = slot.mode
  let focusPoint = slot.focusIdx != null ? G[slot.focusIdx] : null // điểm trọng tâm (null khi tổng hợp)
  if (grammarMode === 'new') {
    dayGrammar = [{ ...focusPoint, isReview: false }]
  } else if (grammarMode === 'final') {
    focusPoint = null
    dayGrammar = G.map((g) => ({ ...g, isReview: true }))
  } else {
    dayGrammar = focusPoint ? [{ ...focusPoint, isReview: true }] : []
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

  // —— Từ vựng theo CỬA SỔ TRƯỢT ~8 từ/buổi ——
  // Nghiên cứu ESL: 8–10 từ/giờ học là mức nhớ tốt cho người mới. Thay vì chia 20
  // từ cho 7 buổi (chỉ ~3 từ/buổi, quá ít), ta trượt một cửa sổ PER_DAY từ qua cả
  // tuần: mỗi buổi ~8 từ, các buổi liền nhau chồng lấn vài từ -> chính là ÔN TẬP
  // ngắt quãng tự nhiên. Câu mẫu & cụm từ lấy theo chủ đề có trong cửa sổ.
  const PER_DAY = 8
  const totalDays = week.days.length
  const flatWords = week.vocabThemes.flatMap((t, ti) => t.words.map((w) => ({ w, ti })))
  const total = flatWords.length
  const span = Math.max(0, total - PER_DAY)
  const step = totalDays > 1 ? span / (totalDays - 1) : 0
  const start = Math.min(Math.round(idx * step), span)
  const windowSlice = flatWords.slice(start, start + PER_DAY)
  // Buổi trước đã thấy từ nào -> đánh dấu phần chồng lấn là "ôn lại".
  const prevStart = idx > 0 ? Math.min(Math.round((idx - 1) * step), span) : -1
  const prevWords = prevStart >= 0 ? new Set(flatWords.slice(prevStart, prevStart + PER_DAY).map((x) => x.w)) : new Set()
  const newSlice = windowSlice.filter((x) => !prevWords.has(x.w))
  const reviewSlice = windowSlice.filter((x) => prevWords.has(x.w))
  const themeIdxs = [...new Set(windowSlice.map((x) => x.ti))]
  const phrases = themeIdxs.flatMap((ti) => week.vocabThemes[ti].phrases || [])
  const sentences = themeIdxs.flatMap((ti) => week.vocabThemes[ti].sentences || [])
  // Quiz buổi: trắc nghiệm nghĩa của TẤT CẢ từ trong cửa sổ -> ~8 câu, khác nhau mỗi ngày.
  const dayQuiz = buildDayVocabQuiz(
    windowSlice.map((x) => x.w),
    flatWords.map((x) => x.w),
    idx, // dịch dạng câu theo buổi -> từ trùng (do ôn chồng lấn) không hỏi y hệt
  )

  // —— Câu mẫu để LUYỆN NGHE / PHÁT ÂM của ngày ——
  // Ngày học điểm mới/ôn: lấy câu đúng của điểm trọng tâm; ngày tổng hợp: gom cả tuần.
  const grammarExamples = (grammarMode === 'final' ? G.flatMap((g) => g.examples || []) : focusPoint?.examples || []).slice(0, 8)

  // —— Bài "sắp xếp câu" của buổi: lấy từ các câu ĐÚNG (ngữ pháp + câu nối từ vựng) ——
  // Trộn vào quiz ôn nhanh để mỗi buổi xoay vòng nhiều DẠNG (chọn nghĩa · gõ từ · xếp câu).
  const orderQuiz = buildSentenceOrderQuiz([...grammarExamples, ...sentences], idx, 3)

  // —— Kho ĐẶT CÂU (Production): chia "100 câu mở đầu" đều cho các buổi -> mỗi buổi
  // ~14 câu khác nhau, không buổi nào trùng, kích hoạt toàn bộ kho luyện tập. ——
  const bank = week.sentenceBank || []
  const [bs, be] = chunkRange(bank.length, totalDays, idx)
  const sentenceBank = bank.slice(bs, be)

  // —— NGUỒN NHẬP THẬT của buổi: bài đọc ngắn + bài nghe (tên/số) kèm câu hỏi.
  // Curate ở data/ieltsInput.js (markdown tuần không có bài đọc/nghe đúng nghĩa).
  const input = getIeltsInput(week.num, day.n)

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
    grammarExamples, // câu đúng của ngày -> luyện nghe & phát âm
    reading: input?.reading || null, // bài đọc hiểu ngắn của buổi (null nếu chưa có)
    listening: input?.listening || null, // bài nghe (tên/số) của buổi (null nếu chưa có)
    sentenceBank, // câu mở đầu để đặt câu (Production)
    lessonScript: week.lessonScripts[idx] || null,
    skills: week.skills, // bài giảng & khung mẫu của tuần (bài đọc, script nghe, khung Speaking/Writing…)
    quizHtml: week.quizHtml,
    // Tự luyện cuối tuần — chỉ hiện ở BUỔI CUỐI để ôn trước bài kiểm tra tuần.
    // Quiz TỔNG HỢP mới (ngữ pháp + từ vựng cả tuần), khác mọi quiz từng ngày.
    weekPracticeQuiz: isLastDay ? buildWeekQuiz(week) : [],
    quiz: [...dayQuiz, ...orderQuiz], // ôn nhanh: trộn chọn nghĩa · gõ từ · sắp xếp câu (khác nhau mỗi buổi)
    // ngữ cảnh tuần để điều hướng
    week: week.num,
    weekTitle: week.title,
    milestone: week.milestone || '', // mốc kiểm tra thật của tuần (thay nhãn "Band 6.5")
    totalDays: week.days.length,
    prevDay: idx > 0 ? week.days[idx - 1].n : null,
    nextDay: idx < week.days.length - 1 ? week.days[idx + 1].n : null,
    days: week.days.map((d) => ({ n: d.n })),
  }
}
