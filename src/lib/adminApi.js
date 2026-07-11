import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Wrapper client cho cổng đặc quyền admin (netlify/functions/admin).
 *
 * Tự đính kèm access token của phiên hiện tại vào header Authorization; SERVER
 * mới là nơi xác minh quyền admin thật (không tin cờ `isAdmin` phía client).
 * Chuẩn hóa lỗi thành `AdminApiError` có `.code` (giống lib/aiError.js) để UI
 * hiển thị thông điệp thân thiện.
 */
const ENDPOINT = '/.netlify/functions/admin'

/** Lỗi gọi cổng admin — luôn có `.code` khớp với _adminAuth.js / _llm.js. */
export class AdminApiError extends Error {
  constructor(message, code = 'upstream') {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
  }
}

/**
 * Gọi 1 action ở cổng admin. Ném `AdminApiError` khi chưa cấu hình cloud, chưa
 * đăng nhập, hoặc server trả lỗi.
 * @param {string} action  vd 'ping', 'listUsers', 'setAdmin'…
 * @param {object} payload  dữ liệu kèm theo action
 * @returns {Promise<object>} body JSON server trả về khi thành công
 */
export async function callAdmin(action, payload = {}) {
  if (!isCloudEnabled) throw new AdminApiError('Chưa cấu hình Supabase.', 'config')

  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new AdminApiError('Bạn cần đăng nhập lại.', 'unauthorized')

  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, payload }),
    })
  } catch {
    throw new AdminApiError('Không kết nối được máy chủ.', 'network')
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = body.error
    const { code, message } =
      err && typeof err === 'object'
        ? err
        : { code: 'upstream', message: err || `Lỗi máy chủ (${res.status})` }
    throw new AdminApiError(message, code)
  }
  return body
}

/** Action thử của Đợt 0: kiểm tra cổng admin hoạt động + quyền hợp lệ. */
export function pingAdmin() {
  return callAdmin('ping')
}

// ——————————————————————— Đợt 4: Kiểm duyệt & phản hồi ———————————————————————

/** Tổng hợp cảm nhận độ khó cuối tuần theo khóa × tuần → { feedback }. */
export function getFeedbackStats() {
  return callAdmin('getFeedbackStats')
}

/** Liệt kê ghi âm mốc (mọi user) kèm signed URL để nghe → { recordings, count }. */
export function listRecordings(limit) {
  return callAdmin('listRecordings', { limit })
}

/** Xóa 1 ghi âm theo path "{userId}/{file}.webm". */
export function deleteRecording(path) {
  return callAdmin('deleteRecording', { path })
}

/** Danh sách người tham gia leaderboard + tên hiển thị → { entries }. */
export function listLeaderboard() {
  return callAdmin('listLeaderboard')
}

/** Xóa tên hiển thị leaderboard phản cảm (giữ opt-in). */
export function clearLeaderboardName(userId) {
  return callAdmin('clearLeaderboardName', { userId })
}

// ——————————————————————— Đợt 2: Dashboard & thống kê ———————————————————————

/** Số liệu tổng hợp cho dashboard (overview/funnels/quizzes/content) → { stats }. */
export function getStats() {
  return callAdmin('getStats')
}

// ——————————————————————— Đợt 1: Quản lý tài khoản ———————————————————————

/** Danh sách tài khoản + tiến độ tóm tắt + cờ admin → { users, count }. */
export function listUsers() {
  return callAdmin('listUsers')
}

/** Chi tiết tiến độ 1 user (chỉ đọc) → { user }. */
export function getUserDetail(userId) {
  return callAdmin('getUserDetail', { userId })
}

/** Cấp (`on=true`) / thu (`on=false`) quyền admin. */
export function setAdmin(userId, on) {
  return callAdmin('setAdmin', { userId, on: !!on })
}

/** Reset tiến độ (xóa dòng progress; audit giữ snapshot cũ để cứu). */
export function resetProgress(userId) {
  return callAdmin('resetProgress', { userId })
}

/** Xóa vĩnh viễn tài khoản + tiến độ + ghi âm. */
export function deleteUser(userId) {
  return callAdmin('deleteUser', { userId })
}

// ——————————————————————— Đợt 5: Quyền vào khóa "giới hạn" ———————————————————————

/** Danh sách người được cấp quyền vào 1 khóa 'restricted' → { courseId, users, count }. */
export function listCourseAccess(courseId) {
  return callAdmin('listCourseAccess', { courseId })
}

/** Cấp cho 1 user quyền vào 1 khóa 'restricted'. */
export function grantCourseAccess(userId, courseId) {
  return callAdmin('grantCourseAccess', { userId, courseId })
}

/** Thu quyền vào 1 khóa 'restricted' của 1 user. */
export function revokeCourseAccess(userId, courseId) {
  return callAdmin('revokeCourseAccess', { userId, courseId })
}
