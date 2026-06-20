/**
 * Nội dung biên tập của trang chủ.
 * Tách riêng khỏi courses.js (vốn import dữ liệu MD đã parse khá nặng) để trang
 * chủ tải nhẹ — chỉ cần features/steps tĩnh, không kéo theo chunk khóa học.
 */
export const features = [
  { icon: '🗺️', bg: 'rgba(108,92,231,.12)', title: 'Lộ trình rõ ràng', desc: 'Biết chính xác hôm nay học gì. Mỗi tuần là một chặng, mở khóa dần như bản đồ game.' },
  { icon: '🔥', bg: 'rgba(255,176,32,.16)', title: 'Streak giữ lửa', desc: 'Học mỗi ngày để nuôi chuỗi streak, kiếm XP, lên level và sưu tầm huy hiệu.' },
  { icon: '🗣️', bg: 'rgba(0,214,143,.14)', title: 'Học đôi Anh ngữ', desc: 'Mỗi bài kèm từ vựng & thuật ngữ IT — vừa code giỏi vừa đọc tài liệu tiếng Anh tốt.' },
  { icon: '🛠️', bg: 'rgba(108,92,231,.12)', title: 'Công cụ thực hành', desc: 'Code playground, flashcard, quiz và mini-game ôn tập — luyện ngay trong trình duyệt.' },
]

export const steps = [
  { n: '1', title: 'Tiếng Anh trước', desc: 'Khởi động 10 từ vựng IT + 1 video ngắn để não vào guồng.' },
  { n: '2', title: 'Học & gõ tay code', desc: 'Đọc lý thuyết rồi tự gõ lại code mẫu — không copy, để nhớ lâu.' },
  { n: '3', title: 'Ôn bằng mini-game', desc: 'Làm quiz, lật flashcard, nhận XP và tick xong checkpoint của tuần.' },
]
