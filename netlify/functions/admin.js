/**
 * Netlify Function (v2): CỔNG ĐẶC QUYỀN DUY NHẤT của khu quản trị.
 * Endpoint khi deploy: POST /.netlify/functions/admin
 *
 * Mọi thao tác chạm dữ liệu người khác (liệt kê tài khoản, reset/xóa, cấp quyền,
 * signed URL ghi âm…) đều đi qua ĐÂY, sau khi tự xác minh người gọi là admin
 * bằng service role key (xem _adminAuth.js). Client KHÔNG bao giờ giữ service key.
 *
 * Body: { action: string, payload?: object }. Mỗi đợt của kế hoạch thêm 1 case
 * vào `handleAction`. Đợt 0 mới có action thử `ping`.
 *
 * Env cần ở Netlify: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { requireAdmin, AdminAuthError } from './_adminAuth.js'
import {
  actionListUsers,
  actionGetStats,
  actionGetUserDetail,
  actionSetAdmin,
  actionResetProgress,
  actionDeleteUser,
} from './_adminActions.js'
import {
  actionGetFeedbackStats,
  actionListRecordings,
  actionDeleteRecording,
  actionListLeaderboard,
  actionClearLeaderboardName,
} from './_adminModeration.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Chuẩn hóa lỗi -> { status, body } (giống errorResponse của _llm.js). */
function fail(e) {
  if (e instanceof AdminAuthError)
    return { status: e.status, body: { error: { code: e.code, message: e.message } } }
  return { status: 500, body: { error: { code: 'upstream', message: e?.message || 'Lỗi không xác định' } } }
}

export default async (req) => {
  if (req.method !== 'POST')
    return json({ error: { code: 'bad_request', message: 'Method not allowed' } }, 405)

  let action, payload
  try {
    const body = await req.json()
    action = body?.action
    payload = body?.payload || {}
  } catch {
    return json({ error: { code: 'bad_request', message: 'Body không hợp lệ.' } }, 400)
  }

  // Xác minh admin TRƯỚC khi làm bất cứ gì — mọi lỗi ở đây trả 401/403/500 rõ ràng.
  let admin
  try {
    admin = await requireAdmin(req)
  } catch (e) {
    const { status, body } = fail(e)
    return json(body, status)
  }

  try {
    const result = await handleAction(action, payload, admin)
    return json(result)
  } catch (e) {
    const { status, body } = fail(e)
    return json(body, status)
  }
}

/**
 * Bộ định tuyến action. Mỗi đợt kế hoạch thêm 1 case ở đây (list/detail/setAdmin/
 * reset/delete…), tái dùng `admin.service` (client service role) + `logAudit`.
 * @param {string} action
 * @param {object} payload
 * @param {{ userId, email, service }} admin
 */
async function handleAction(action, payload, admin) {
  switch (action) {
    // Action thử của Đợt 0: xác nhận cổng hoạt động + người gọi đúng là admin.
    case 'ping':
      return { ok: true, isAdmin: true, userId: admin.userId, email: admin.email }

    // Đợt 2 — Dashboard & thống kê.
    case 'getStats':
      return actionGetStats(admin.service)

    // Đợt 1 — Quản lý tài khoản.
    case 'listUsers':
      return actionListUsers(admin.service)
    case 'getUserDetail':
      return actionGetUserDetail(admin.service, payload)
    case 'setAdmin':
      return actionSetAdmin(admin.service, admin, payload)
    case 'resetProgress':
      return actionResetProgress(admin.service, admin, payload)
    case 'deleteUser':
      return actionDeleteUser(admin.service, admin, payload)

    // Đợt 4 — Kiểm duyệt & phản hồi.
    case 'getFeedbackStats':
      return actionGetFeedbackStats(admin.service)
    case 'listRecordings':
      return actionListRecordings(admin.service, payload)
    case 'deleteRecording':
      return actionDeleteRecording(admin.service, admin, payload)
    case 'listLeaderboard':
      return actionListLeaderboard(admin.service)
    case 'clearLeaderboardName':
      return actionClearLeaderboardName(admin.service, admin, payload)

    default:
      throw new AdminAuthError(`Hành động không hỗ trợ: ${action}`, 'bad_request', 400)
  }
}
