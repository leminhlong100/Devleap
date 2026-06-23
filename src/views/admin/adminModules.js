/**
 * Khai báo các module trong khu quản trị. Thêm module mới = thêm 1 phần tử ở đây
 * (và route con tương ứng trong src/router/index.js). Layout + dashboard tự cập nhật.
 */
export const adminModules = [
  {
    key: 'shadowing',
    route: { name: 'admin-shadowing' },
    icon: '🎧',
    title: 'Shadowing',
    desc: 'Thêm/sửa bài luyện shadowing từ link YouTube. Chọn cấp độ, sửa transcript rồi xuất bản cho người dùng.',
  },
]
