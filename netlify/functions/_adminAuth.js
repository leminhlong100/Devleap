/**
 * Nền bảo mật của khu quản trị (Đợt 0 — docs/KE_HOACH_TRANG_ADMIN.md).
 *
 * File bắt đầu bằng "_" nên Netlify coi là module phụ trợ, KHÔNG deploy thành
 * function riêng — nó là helper dùng chung cho `admin.js` (và sau này mọi
 * function đặc quyền khác).
 *
 * Nguyên tắc cốt lõi: **KHÔNG tin cờ `isAdmin` phía client.** Mọi request chạm
 * dữ liệu người khác đều phải:
 *   1) Gửi kèm `Authorization: Bearer <access_token>` (token phiên Supabase).
 *   2) Server tự `getUser(token)` để ra userId thật.
 *   3) Server tự kiểm tra userId có trong bảng `admins` bằng SERVICE ROLE KEY
 *      (bypass RLS) — chỉ khi hợp lệ mới thực thi hành động.
 *
 * Service role key CHỈ tồn tại ở env phía server (Netlify), không bao giờ lộ ra
 * bundle client.
 */
import { createClient } from '@supabase/supabase-js'

/** Lỗi xác thực/ủy quyền admin, kèm `code` + `status` HTTP để trả về client. */
export class AdminAuthError extends Error {
  constructor(message, code = 'forbidden', status = 403) {
    super(message)
    this.name = 'AdminAuthError'
    this.code = code
    this.status = status
  }
}

/**
 * URL + service role key lấy từ env. Chấp nhận cả tên có tiền tố VITE_ để chạy
 * được ở dev (vite plugin nạp cả biến VITE_ vào process.env — xem vite.config).
 */
export function serviceConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, key }
}

/** Tạo client Supabase quyền `service_role` (bypass RLS). CHỈ dùng phía server. */
export function getServiceClient() {
  const { url, key } = serviceConfig()
  if (!url || !key)
    throw new AdminAuthError(
      'Server chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.',
      'config',
      500,
    )
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Bóc access token từ header `Authorization: Bearer <token>` (rỗng nếu không có). */
export function bearerToken(req) {
  const h = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m ? m[1].trim() : ''
}

/**
 * Xác minh người gọi là admin. Tách khỏi `requireAdmin` để test được: nhận
 * `token` + `service` client (có thể là fake trong test).
 * @returns {Promise<{ userId: string, email: string }>}
 * @throws {AdminAuthError} thiếu token (401) / token sai (401) / không phải admin (403).
 */
export async function verifyAdminToken(token, service) {
  if (!token) throw new AdminAuthError('Thiếu access token.', 'unauthorized', 401)

  const { data, error } = await service.auth.getUser(token)
  const user = data?.user
  if (error || !user) throw new AdminAuthError('Token không hợp lệ hoặc đã hết hạn.', 'unauthorized', 401)

  const { data: row, error: adminErr } = await service
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (adminErr) throw new AdminAuthError('Không kiểm tra được quyền admin.', 'upstream', 502)
  if (!row) throw new AdminAuthError('Bạn không có quyền quản trị.', 'forbidden', 403)

  return { userId: user.id, email: user.email || '' }
}

/**
 * Cổng dùng trong function: dựng service client từ env rồi xác minh admin từ
 * `req`. Trả kèm `service` để action tái dùng đúng client đã có (đỡ tạo lại).
 * @returns {Promise<{ userId: string, email: string, service: object }>}
 */
export async function requireAdmin(req) {
  const service = getServiceClient()
  const admin = await verifyAdminToken(bearerToken(req), service)
  return { ...admin, service }
}

/**
 * Ghi 1 dòng nhật ký kiểm toán cho MỌI hành động thay đổi (grant admin, reset,
 * delete…). Best-effort: nếu ghi lỗi cũng KHÔNG chặn hành động chính, chỉ nuốt
 * lỗi (bảng audit lỗi không được làm hỏng thao tác quản trị).
 */
export async function logAudit(service, { actorId, action, targetId = null, detail = {} }) {
  try {
    await service.from('admin_audit').insert({
      actor_id: actorId,
      action,
      target_id: targetId,
      detail,
    })
  } catch {
    /* best-effort — bỏ qua lỗi ghi audit */
  }
}
