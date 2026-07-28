/**
 * Tiện ích cho khối BÀI VIẾT của một buổi học.
 *
 * Trước đây file này còn chứa `planFromChecklist()` (quyết định buổi hiện những
 * khối nào) của khóa IELTS 8 tuần cũ; khóa đó đã bị gỡ nên chỉ còn phần dùng
 * chung bên dưới. Tách riêng (không nhúng trong .vue) để unit-test được.
 */

/**
 * Số câu bắt buộc rút ra từ đề bài viết (vd "Viết 10 câu" -> 10), kẹp 3..20.
 * Dùng ở WritingCoach.vue để chấm "đã viết đủ số câu chưa".
 */
export function requiredSentencesFor(prompt) {
  const m = /(\d+)\s*câu/i.exec(prompt || '')
  return m ? Math.min(Math.max(Number(m[1]), 3), 20) : 3
}
