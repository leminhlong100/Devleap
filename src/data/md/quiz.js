/**
 * Parser khối quiz trắc nghiệm dùng chung cho cả Java (weeks/) lẫn IELTS
 * (Base_English/). Format mỗi câu trong khoảng [start, end):
 *   1. Câu hỏi?            (mục danh sách có số)
 *      - [ ] Phương án sai
 *      - [x] Phương án đúng
 *      💡 Giải thích (tuỳ chọn, có thể dùng "> ").
 * Trả về [{q, opts[], correct, ex}], bỏ câu có < 2 phương án.
 */
export function parseQuiz(lines, start = 0, end = lines.length) {
  const quiz = []
  let cur = null
  for (let i = start; i < end; i++) {
    const t = lines[i].trim()
    if (!t) continue
    const om = /^[-*]\s*\[([ xX])\]\s+(.+)$/.exec(t) // option (kiểm tra trước)
    const qm = /^\d+\.\s+(.+)$/.exec(t) // câu hỏi (mục số)
    const em = /^(?:💡|>)\s*(.+)$/u.exec(t) // giải thích
    if (om && cur) {
      cur.opts.push(om[2].replace(/\*\*/g, '').trim())
      if (om[1].toLowerCase() === 'x') cur.correct = cur.opts.length - 1
    } else if (qm) {
      if (cur) quiz.push(cur)
      cur = { q: qm[1].replace(/\*\*/g, '').trim(), opts: [], correct: 0, ex: '' }
    } else if (em && cur) {
      const txt = em[1].replace(/\*\*/g, '').replace(/^Giải thích:?\s*/i, '').trim()
      cur.ex = cur.ex ? `${cur.ex} ${txt}` : txt
    }
  }
  if (cur) quiz.push(cur)
  return quiz.filter((q) => q.opts.length >= 2)
}
