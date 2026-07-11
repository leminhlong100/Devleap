/**
 * Xóa DỮ LIỆU TIẾN ĐỘ của người học khỏi localStorage khi đăng xuất, để không
 * rớt lại tiến độ của tài khoản vừa thoát cho người dùng/khách kế tiếp.
 *
 * CHỈ đụng tới các key tiến độ liệt kê dưới đây — các tùy chọn cấp app (theme,
 * haptic, nhắc học, lựa chọn track IELTS, cache IPA…) được GIỮ NGUYÊN vì chúng
 * không phải dữ liệu riêng của tài khoản.
 */

// Key cố định chứa dữ liệu tiến độ / dữ liệu riêng người học.
const PROGRESS_KEYS = [
  'devleap:user:v2', // tiến độ chính: XP, ngày hoàn thành, SRS, quiz, từ vựng đã lưu, bài viết, nhật ký nói…
  'devleap:owner:v1', // đánh dấu local đang thuộc tài khoản nào
  'devleap:convo:v1', // tùy chọn hội thoại AI theo từng người học
  'devleap:javaprep:v1', // kết quả phỏng vấn thử Java
  'devleap:pending-recording-uploads', // các bản ghi âm còn chờ upload
]

// Tiền tố của các key động (sổ lỗi ghi theo từng tuần/buổi: error-ledger-w{tuần}-d{buổi}).
const PROGRESS_PREFIXES = ['error-ledger-']

/** Xóa mọi key tiến độ (cố định + động theo tiền tố). An toàn nếu localStorage bị chặn. */
export function clearLocalProgress() {
  try {
    for (const k of PROGRESS_KEYS) localStorage.removeItem(k)
    // Gom key động trước rồi mới xóa (tránh lệch chỉ số khi vừa duyệt vừa xóa).
    const dynamic = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && PROGRESS_PREFIXES.some((p) => key.startsWith(p))) dynamic.push(key)
    }
    dynamic.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* localStorage có thể bị chặn — bỏ qua */
  }
}
