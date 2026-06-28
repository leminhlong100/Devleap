/**
 * BÀI TẬP NGỮ PHÁP BIÊN SOẠN THÊM — bổ sung cho phần auto-sinh từ markdown.
 *
 * Vì sao cần: một số điểm ngữ pháp (vd "Sentence Backbone") có ít bảng lỗi và
 * ít câu mẫu chứa "từ ngữ pháp an toàn" để khoét chỗ trống, nên auto chỉ ra 3–4
 * câu — cổng ≥70% gần như "được/trượt" theo một câu. File này thêm câu chất lượng
 * để mỗi buổi học mới có 6–10 câu, cổng mới thực sự có ý nghĩa.
 *
 * Khóa theo `${weekNum}` -> { '<tiêu đề điểm ngữ pháp khớp md>': [drill, ...] }.
 * Drill dùng đúng định dạng QuizTool:
 *   - cloze: { type:'cloze', q:'… _____ …', answer:[các đáp án chấp nhận], ex }
 *   - error: { type:'error', q:'câu sai', answer:['câu đúng'], ex }
 * Gộp ở courseIelts (dedup theo câu hỏi, cắt tối đa 10).
 */

export const ieltsGrammarExtra = {
  1: {
    'Sentence Backbone — Xương sống của câu': [
      { type: 'error', q: 'He happy today.', answer: ['He is happy today.'], ex: 'Câu cần động từ. Mô tả trạng thái dùng "be": He is happy today.' },
      { type: 'cloze', q: 'My sister _____ a doctor.', answer: ['is'], ex: 'Mô tả danh tính cần "be": My sister is a doctor.' },
      { type: 'error', q: 'In my school have a big library.', answer: ['There is a big library in my school.'], ex: 'Diễn đạt "có…" bằng "There is/are…", không dùng "have".' },
      { type: 'error', q: 'I like very much coffee.', answer: ['I like coffee very much.'], ex: 'Trật tự đúng: V + O + (very much): I like coffee very much.' },
    ],
    'Be — Động từ dễ bị bỏ quên nhất': [
      { type: 'cloze', q: 'The students _____ in the classroom now.', answer: ['are'], ex: 'Chủ ngữ số nhiều "The students" → are.' },
      { type: 'error', q: 'My mother a nurse.', answer: ['My mother is a nurse.'], ex: 'Thiếu "be": My mother is a nurse.' },
    ],
    'Do, Does và Did': [
      { type: 'cloze', q: '_____ your brother work in a bank?', answer: ['Does'], ex: 'Chủ ngữ số ít "your brother" → Does … work?' },
      { type: 'error', q: 'She do not like tea.', answer: ["She does not like tea.", "She doesn't like tea."], ex: 'Chủ ngữ số ít → does not / doesn’t.' },
    ],
  },
}

/** Lấy mảng bài tập biên soạn thêm cho một điểm ngữ pháp (theo tuần + tiêu đề). */
export function getGrammarExtra(weekNum, title) {
  return ieltsGrammarExtra[weekNum]?.[title] || []
}
