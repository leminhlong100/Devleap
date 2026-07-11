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
