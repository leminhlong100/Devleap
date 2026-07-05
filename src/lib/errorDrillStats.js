/**
 * Gom lỗi THẬT của người học trong một tuần — bài viết đã được AI chữa, lỗi tự
 * ghi thêm trong Sổ lỗi (ErrorLedger.vue, lưu localStorage riêng từng buổi), và
 * câu quiz làm sai (bài kiểm tra tuần + 2 cổng ngày ngữ pháp/từ vựng) — để làm
 * đầu vào cho AI sinh bài tập cá nhân hóa (Bước 5.4 KE_HOACH_CAI_TIEN_WEBSITE.md).
 * Hàm thuần (trừ đọc localStorage, có thể tiêm hàm đọc riêng để test), không đụng
 * store/Vue — dễ test độc lập.
 */

const MAX_ERRORS = 15
const MAX_DRILL_QUESTIONS = 5

function pushUnique(list, seen, item) {
  const wrong = String(item?.wrong || '').trim()
  const right = String(item?.right || '').trim()
  if (!wrong || !right) return
  const key = `${wrong.toLowerCase()}|${right.toLowerCase()}`
  if (seen.has(key)) return
  seen.add(key)
  list.push({ wrong, right, note: item?.note || '' })
}

/** Lỗi từ bài viết đã được AI chữa trong tuần (mọi buổi, không chỉ buổi hôm nay). */
export function writingErrorsOfWeek(writings = {}, course, week) {
  const out = []
  const seen = new Set()
  const prefix = `${course}:${week}:`
  for (const [key, entry] of Object.entries(writings || {})) {
    if (!key.startsWith(prefix)) continue
    const lines = entry?.review?.lines || []
    for (const l of lines) {
      if (!l.ok && l.corrected && l.corrected !== l.original) {
        pushUnique(out, seen, { wrong: l.original, right: l.corrected, note: l.note })
      }
    }
  }
  return out
}

function defaultReadManualDay(week, day) {
  try {
    const raw = localStorage.getItem(`error-ledger-w${week}-d${day}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Lỗi tự ghi thêm trong Sổ lỗi của mọi buổi trong tuần (localStorage per-buổi). */
export function manualErrorsOfWeek(week, totalDays, readManualDay = defaultReadManualDay) {
  const out = []
  const seen = new Set()
  for (let day = 1; day <= (totalDays || 0); day++) {
    const items = readManualDay(week, day) || []
    for (const e of items) pushUnique(out, seen, e)
  }
  return out
}

/** Câu quiz làm sai trong tuần: bài kiểm tra tuần + 2 cổng ngày (ngữ pháp/từ vựng). */
export function quizErrorsOfWeek(quizScores = {}, course, week) {
  const out = []
  const seen = new Set()
  const weekKey = `${course}:week:${week}`
  const gdayPrefix = `${course}:gday:${week}:`
  const vdayPrefix = `${course}:vday:${week}:`
  for (const [key, entry] of Object.entries(quizScores || {})) {
    if (key !== weekKey && !key.startsWith(gdayPrefix) && !key.startsWith(vdayPrefix)) continue
    for (const w of entry?.wrong || []) {
      pushUnique(out, seen, { wrong: w?.q, right: w?.correct, note: w?.ex })
    }
  }
  return out
}

/**
 * Gom cả 3 nguồn lỗi của một tuần, khử trùng lặp, giới hạn tối đa
 * {@link MAX_ERRORS} mục (tránh prompt AI quá dài).
 * @param {{writings?, quizScores?, course: string, week: number|string, totalDays?: number, readManualDay?: Function}} args
 * @returns {Array<{wrong: string, right: string, note: string}>}
 */
export function collectWeekErrors({ writings, quizScores, course, week, totalDays, readManualDay } = {}) {
  const out = []
  const seen = new Set()
  for (const e of writingErrorsOfWeek(writings, course, week)) pushUnique(out, seen, e)
  for (const e of quizErrorsOfWeek(quizScores, course, week)) pushUnique(out, seen, e)
  for (const e of manualErrorsOfWeek(week, totalDays, readManualDay)) pushUnique(out, seen, e)
  return out.slice(0, MAX_ERRORS)
}

/**
 * Lọc câu bài tập AI trả về đúng khuôn QuizTool (cloze/error): bỏ mục hỏng
 * (thiếu q/answer hợp lệ), cắt tối đa {@link MAX_DRILL_QUESTIONS} câu.
 */
export function sanitizeDrillQuestions(list) {
  const out = []
  for (const q of Array.isArray(list) ? list : []) {
    if (!q || (q.type !== 'cloze' && q.type !== 'error')) continue
    if (typeof q.q !== 'string' || !q.q.trim()) continue
    const answer = Array.isArray(q.answer) ? q.answer.filter((a) => typeof a === 'string' && a.trim()) : []
    if (!answer.length) continue
    out.push({ type: q.type, q: q.q.trim(), answer, ex: typeof q.ex === 'string' ? q.ex : '' })
    if (out.length >= MAX_DRILL_QUESTIONS) break
  }
  return out
}
