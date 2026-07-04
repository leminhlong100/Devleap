/**
 * KẾ HOẠCH BUỔI — quyết định buổi học hiện những KHỐI nào, dựa trên checklist mà
 * tác giả đã thiết kế cho từng ngày trong file Markdown của tuần.
 *
 * Mục tiêu: hết "quá tải" (mỗi ngày nhồi đủ 12 khối) bằng cách bám đúng nhịp từng
 * ngày — vd Tuần 1 Ngày 1 chỉ ngữ pháp + viết + ghi âm; phòng từ vựng mở ở Ngày 2/4;
 * nghe/phát âm dồn vào "ngày nạp"… Mỗi cờ true = khối đó hiện trong buổi.
 *
 * Tách riêng (không nhúng trong .vue) để unit-test được phân bổ tải này.
 */

const ALL_ON = {
  grammar: true,
  vocab: true,
  flashcards: true,
  listening: true,
  pronunciation: true,
  sentenceBank: true,
  writing: true,
  aiChat: true,
  quiz: true,
  reading: true,
  mission: true,
  realTalk: true,
}

/**
 * @param {string[]} checklist  các mục "việc cần làm hôm nay" của ngày (đã parse).
 * @returns {object} cờ hiển thị cho từng khối.
 */
export function planFromChecklist(checklist = []) {
  if (!checklist.length) return { ...ALL_ON } // không có kế hoạch -> hiện đầy đủ (an toàn ngược)
  const txt = checklist.join(' • ').toLowerCase()
  const has = (re) => re.test(txt)
  const vocab = has(/phòng từ|từ mới|học từ|từ vựng\s*:/)
  return {
    grammar: has(/ngữ pháp/),
    vocab,
    flashcards: vocab || has(/flashcard|lật|nhớ nhanh/),
    listening: has(/shadowing|nghe[\s-]?chép|luyện nghe|nghe.{0,5}(chép|viết)/),
    pronunciation: has(/phát âm|âm cuối|shadowing/),
    sentenceBank: has(/đặt câu|nói|speaking|kho câu/),
    writing: has(/viết/),
    aiChat: has(/hội thoại|trò chuyện|giao tiếp|tự hỏi|nói\s*&|với ai|luyện nói/),
    quiz: has(/quiz/),
    reading: has(/bài đọc|đọc to|reading|script|khung mẫu|kịch bản/),
    mission: has(/🌍|mission\s*tuần/),
    realTalk: has(/🗣️|buổi nói người thật/),
  }
}
