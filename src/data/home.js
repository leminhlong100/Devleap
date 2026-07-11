/**
 * Nội dung biên tập của trang chủ.
 * Tách riêng khỏi courses.js (vốn import dữ liệu MD đã parse khá nặng) để trang
 * chủ tải nhẹ — chỉ cần features/steps tĩnh, không kéo theo chunk khóa học.
 */
export const features = [
  { icon: '🎭', bg: 'rgba(108,92,231,.12)', title: 'AI nhập vai luyện nói', desc: 'Nói chuyện với AI qua tình huống thật — công sở, phỏng vấn, kết bạn. Được nghe, nói và sửa lỗi ngay từng lượt.' },
  { icon: '🎤', bg: 'rgba(0,214,143,.14)', title: 'Chấm phát âm & shadowing', desc: 'Đọc to hoặc nói nhại theo video ngắn có transcript — app chấm từng câu và chỉ đúng chỗ cần sửa.' },
  { icon: '💻', bg: 'rgba(255,176,32,.16)', title: 'Code gõ tay + phỏng vấn', desc: 'Tự gõ lại code ngay trong trình duyệt và ôn hàng trăm câu phỏng vấn Java có AI chấm điểm, hỏi vặn.' },
  { icon: '🧠', bg: 'rgba(0,184,217,.14)', title: 'Ôn thông minh, nhớ lâu', desc: 'Từ vựng tự quay lại đúng lúc bạn sắp quên (thuật toán như Anki) — học ít mà nhớ sâu.' },
]

export const steps = [
  { n: '1', title: 'Tiếng Anh trước', desc: 'Khởi động 10 từ vựng IT + 1 video ngắn để não vào guồng.' },
  { n: '2', title: 'Học & gõ tay code', desc: 'Đọc lý thuyết rồi tự gõ lại code mẫu — không copy, để nhớ lâu.' },
  { n: '3', title: 'Ôn bằng mini-game', desc: 'Làm quiz, lật flashcard, nhận XP và tick xong checkpoint của tuần.' },
]
