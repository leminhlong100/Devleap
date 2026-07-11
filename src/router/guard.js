/**
 * Quyết định điều hướng thuần (không phụ thuộc router/store) cho `beforeEach`.
 * Tách ra để test được độc lập — router/index.js chỉ lo phần async (chờ auth
 * sẵn sàng) rồi gọi hàm này.
 *
 * Lưu ý: đây là lớp bảo vệ TRẢI NGHIỆM (UX). An toàn thật của khu quản trị nằm
 * ở Netlify Function `admin` (xác minh admin phía server) — xem
 * docs/KE_HOACH_TRANG_ADMIN.md mục 1.4.
 *
 * @param {{ meta?: object, fullPath?: string }} to  route đích
 * @param {{ cloudEnabled: boolean, isAuthed: boolean, isAdmin: boolean }} auth
 * @returns {true | { name: string, query?: object }} true = cho qua; object = chuyển hướng
 */
export function routeGuardDecision(to, auth) {
  const meta = to?.meta || {}
  if (!meta.requiresAuth && !meta.requiresAdmin) return true

  // Khu quản trị: bắt buộc có cloud + đăng nhập + là admin.
  if (meta.requiresAdmin) {
    if (!auth.cloudEnabled) return { name: 'home' }
    if (!auth.isAuthed) return { name: 'home', query: { login: 'required', redirect: to.fullPath } }
    return auth.isAdmin ? true : { name: 'home' }
  }

  // Chưa cấu hình Supabase → không thể đăng nhập, cho qua ở chế độ khách.
  if (!auth.cloudEnabled) return true
  if (auth.isAuthed) return true
  return { name: 'home', query: { login: 'required', redirect: to.fullPath } }
}

/**
 * Khóa (id trong data/courses.js) mà một route thuộc về — để lớp phủ site có thể
 * chặn vào khi admin tắt khóa đó. Trả null nếu route không gắn khóa nào.
 */
export function courseIdForRoute(to) {
  const name = to?.name
  if (!name) return null
  if (name === 'assessment') return to?.params?.course || null
  const map = {
    java: 'java',
    'java-day': 'java',
    'java-prep': 'java-prep',
    'java-mock': 'java-prep',
    ielts: 'ielts',
    'ielts-day': 'ielts',
    comm: 'comm',
    'comm-day': 'comm',
    'comm-summary': 'comm',
  }
  return map[name] || null
}
