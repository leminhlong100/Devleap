/**
 * Khai báo các module trong khu quản trị. Thêm module mới = thêm 1 phần tử ở đây
 * (và route con tương ứng trong src/router/index.js). Layout + dashboard tự cập nhật.
 *
 * `group` gom module theo nhóm chức năng (dùng cho tiêu đề nhóm ở trang chủ admin).
 */
export const adminModules = [
  {
    key: 'accounts',
    group: 'Người dùng',
    route: { name: 'admin-accounts' },
    icon: '🧑‍💼',
    title: 'Tài khoản',
    desc: 'Xem danh sách người học, tiến độ từng người, cấp/thu quyền admin, reset hoặc xóa tài khoản (có ghi nhật ký kiểm toán).',
  },
  {
    key: 'content',
    group: 'Nội dung',
    route: { name: 'admin-content' },
    icon: '📚',
    title: 'Nội dung',
    desc: 'Bật/tắt hiển thị khóa học, đăng banner thông báo (lưu ở DB, hiệu lực ngay) và xem cây nội dung tĩnh của các khóa.',
  },
  {
    key: 'moderation',
    group: 'Kiểm duyệt',
    route: { name: 'admin-moderation' },
    icon: '🛡️',
    title: 'Kiểm duyệt & phản hồi',
    desc: 'Cảm nhận độ khó theo tuần, nghe & kiểm duyệt ghi âm mốc, dọn tên hiển thị leaderboard phản cảm.',
  },
  {
    key: 'shadowing',
    group: 'Nội dung',
    route: { name: 'admin-shadowing' },
    icon: '🎧',
    title: 'Shadowing',
    desc: 'Thêm/sửa bài luyện shadowing từ link YouTube. Chọn cấp độ, sửa transcript rồi xuất bản cho người dùng.',
  },
]

/** Nhóm module theo `group` (giữ thứ tự xuất hiện đầu tiên của mỗi nhóm). */
export function groupedModules() {
  const groups = []
  const byName = new Map()
  for (const m of adminModules) {
    const name = m.group || 'Khác'
    let g = byName.get(name)
    if (!g) {
      g = { name, modules: [] }
      byName.set(name, g)
      groups.push(g)
    }
    g.modules.push(m)
  }
  return groups
}
