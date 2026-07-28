/**
 * Ước lượng BAND IELTS thô từ điểm các hoạt động đã chấm trong khóa (theo sách).
 * KHÔNG phải band thi thật — chỉ để học viên thấy tiến bộ & biết kỹ năng yếu nhất.
 *
 * Nguồn điểm (đều là % 0..100):
 *  - Nghe:  quiz scope `day:<n>:listen`
 *  - Đọc:   quiz scope `day:<n>:reading`
 *  - Viết:  writingOf('ielts', week, n).review.score
 *  - Nói:   writingOf('ielts-speak', week, n).review.score
 *  - NP&TV: quiz `gday:<week>:<n>` (ngữ pháp) + `vday:<week>:<n>` (từ vựng)
 *
 * Tách khỏi store để test thuần: truyền vào accessor { quizOf, writingOf }.
 */

/** % (0..100) -> band (3.5..9, làm tròn 0.5). Ánh xạ tuyến tính thô, đơn điệu. */
export function pctToBand(pct) {
  const b = 3.5 + (Math.max(0, Math.min(100, pct)) / 100) * 5
  return Math.round(b * 2) / 2
}

const SKILLS = [
  { key: 'listening', label: 'Nghe', icon: '🎧' },
  { key: 'reading', label: 'Đọc', icon: '📖' },
  { key: 'writing', label: 'Viết', icon: '✍️' },
  { key: 'speaking', label: 'Nói', icon: '🗣️' },
  { key: 'grammar', label: 'Ngữ pháp & từ vựng', icon: '📝' },
]

function avg(nums) {
  const xs = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

/**
 * @param {{ quizOf:Function, writingOf:Function }} acc  accessor điểm (store hoặc giả lập).
 * @param {number[]} dayNums  các buổi CÓ nội dung (để dò điểm theo buổi).
 * @param {number} week       "tuần" khóa (mặc định 1 — khóa sách dùng week=1).
 */
export function estimateIeltsBand(acc, dayNums = [], week = 1) {
  const quizPct = (scope) => {
    const q = acc.quizOf?.('ielts', scope)
    return q && typeof q.pct === 'number' ? q.pct : null
  }
  const reviewScore = (course, n) => {
    const w = acc.writingOf?.(course, week, n)
    return w?.review && typeof w.review.score === 'number' ? w.review.score : null
  }

  const collect = {
    listening: dayNums.map((n) => quizPct(`day:${n}:listen`)),
    reading: dayNums.map((n) => quizPct(`day:${n}:reading`)),
    writing: dayNums.map((n) => reviewScore('ielts', n)),
    speaking: dayNums.map((n) => reviewScore('ielts-speak', n)),
    grammar: dayNums.flatMap((n) => [quizPct(`gday:${week}:${n}`), quizPct(`vday:${week}:${n}`)]),
  }

  const skills = SKILLS.map((s) => {
    const pct = avg(collect[s.key])
    return { ...s, pct, has: pct !== null, band: pct !== null ? pctToBand(pct) : null }
  })

  // Band tổng = trung bình % các kỹ năng CÓ dữ liệu (không tính kỹ năng chưa làm).
  const overallPct = avg(skills.map((s) => s.pct))
  // Kỹ năng yếu nhất chỉ xét trong 4 kỹ năng cốt lõi (không tính NP&TV).
  const core = skills.filter((s) => s.has && s.key !== 'grammar')
  const weakest = core.length ? core.reduce((lo, s) => (s.pct < lo.pct ? s : lo)) : null

  return {
    hasData: overallPct !== null,
    overall: overallPct !== null ? pctToBand(overallPct) : null,
    overallPct: overallPct !== null ? Math.round(overallPct) : null,
    skills,
    weakest,
  }
}
