/**
 * Đợt 1 — Quản lý tài khoản (docs/KE_HOACH_TRANG_ADMIN.md mục 2).
 *
 * Các action đặc quyền chạm dữ liệu NGƯỜI KHÁC (liệt kê tài khoản, xem chi tiết,
 * cấp/thu quyền admin, reset tiến độ, xóa tài khoản). Tách khỏi `admin.js` để:
 *   - `admin.js` chỉ còn lo định tuyến + xác thực (đã làm ở Đợt 0);
 *   - phần logic thuần (ghép danh sách, bóc tách chi tiết, chốt chặn an toàn)
 *     tách riêng, TEST được độc lập với Supabase (xem tests/adminActions.test.js).
 *
 * Mọi hàm ở đây nhận `service` = client service_role (bypass RLS) đã dựng sẵn ở
 * `_adminAuth.requireAdmin`. Hành động THAY ĐỔI đều ghi 1 dòng `admin_audit`.
 */
import { AdminAuthError, logAudit } from './_adminAuth.js'
import { computeStats } from './_adminStats.js'

// ————————————————————————————————————————————————————————————————
//  Phần thuần (không I/O) — dễ test
// ————————————————————————————————————————————————————————————————

/** Tên hiển thị ưu tiên: full_name > name > email. */
function displayName(u) {
  return u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || ''
}

const countKeys = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o).length : 0)

/**
 * Ghép `auth.users` × `progress` × `admins` thành danh sách gọn cho bảng UI.
 * @param {Array} authUsers   dòng từ auth.admin.listUsers
 * @param {Array} progressRows dòng bảng progress (user_id + vài cột)
 * @param {Array<string>} adminIds  user_id của các admin
 */
export function buildUserList(authUsers = [], progressRows = [], adminIds = []) {
  const byId = new Map((progressRows || []).map((r) => [r.user_id, r]))
  const adminSet = new Set(adminIds || [])
  return (authUsers || []).map((u) => {
    const p = byId.get(u.id) || {}
    const c = p.completed || {}
    const completedCount = (c.java?.length || 0) + (c.ielts?.length || 0) + (c.comm?.length || 0)
    return {
      id: u.id,
      email: u.email || '',
      name: displayName(u),
      createdAt: u.created_at || null,
      lastSignInAt: u.last_sign_in_at || null,
      lastStudyDate: p.last_study_date || null,
      xp: p.xp || 0,
      streak: p.streak || 0,
      badges: p.badges || 0,
      completedCount,
      isAdmin: adminSet.has(u.id),
    }
  })
}

/** Bóc tách 1 dòng progress thành số liệu dễ đọc cho panel chi tiết. */
export function buildUserDetail(user, progressRow, isAdmin) {
  const p = progressRow || {}
  const c = p.completed || {}
  return {
    id: user.id,
    email: user.email || '',
    name: displayName(user),
    createdAt: user.created_at || null,
    lastSignInAt: user.last_sign_in_at || null,
    isAdmin: !!isAdmin,
    hasProgress: !!progressRow,
    xp: p.xp || 0,
    weekXp: p.week_xp || 0,
    streak: p.streak || 0,
    badges: p.badges || 0,
    lastStudyDate: p.last_study_date || null,
    completed: {
      java: (c.java || []).length,
      ielts: (c.ielts || []).length,
      comm: (c.comm || []).length,
    },
    quizCount: countKeys(p.quiz_scores),
    savedWordsCount: countKeys(p.saved_words),
    srsCount: countKeys(p.srs),
    shadowingCount: countKeys(p.shadowing_scores),
    dictationCount: countKeys(p.dictation_scores),
    topicsCount: Array.isArray(p.topics) ? p.topics.length : 0,
    leaderboardOptIn: !!p.leaderboard_opt_in,
    leaderboardName: p.leaderboard_name || '',
  }
}

/** Lấy & kiểm tra userId hợp lệ từ payload; ném 400 nếu thiếu. */
export function requireUserId(payload) {
  const id = typeof payload?.userId === 'string' ? payload.userId.trim() : ''
  if (!id) throw new AdminAuthError('Thiếu userId.', 'bad_request', 400)
  return id
}

/**
 * Chốt chặn cấp/thu quyền admin:
 *  - Không cho tự thu quyền của CHÍNH MÌNH (tránh tự khóa mình ra ngoài).
 *  - Không cho hạ admin CUỐI CÙNG (hệ thống luôn còn ít nhất 1 admin).
 */
export function assertCanSetAdmin({ actorId, targetId, on, adminCount }) {
  if (!on && actorId === targetId)
    throw new AdminAuthError('Không thể tự thu quyền quản trị của chính mình.', 'bad_request', 400)
  if (!on && (adminCount || 0) <= 1)
    throw new AdminAuthError('Không thể hạ quyền admin cuối cùng của hệ thống.', 'bad_request', 400)
}

/** Chốt chặn xóa: không cho tự xóa tài khoản của chính mình. */
export function assertCanDelete({ actorId, targetId }) {
  if (actorId === targetId)
    throw new AdminAuthError('Không thể tự xóa tài khoản của chính mình.', 'bad_request', 400)
}

// ————————————————————————————————————————————————————————————————
//  Phần có I/O (gọi Supabase service)
// ————————————————————————————————————————————————————————————————

/** Liệt kê TẤT CẢ user (gộp phân trang của auth.admin.listUsers). */
export async function listAllAuthUsers(service) {
  const users = []
  const perPage = 200
  // Chặn trên 50 trang (10k user) — quá đủ cho quy mô cá nhân, tránh vòng lặp vô hạn.
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error) throw new AdminAuthError('Không liệt kê được người dùng.', 'upstream', 502)
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < perPage) break
  }
  return users
}

/** action `listUsers`: danh sách tài khoản + tiến độ tóm tắt + cờ admin. */
export async function actionListUsers(service) {
  const [authUsers, progressRes, adminsRes] = await Promise.all([
    listAllAuthUsers(service),
    service.from('progress').select('user_id, xp, streak, badges, last_study_date, completed'),
    service.from('admins').select('user_id'),
  ])
  if (progressRes.error) throw new AdminAuthError('Không đọc được tiến độ.', 'upstream', 502)
  if (adminsRes.error) throw new AdminAuthError('Không đọc được danh sách admin.', 'upstream', 502)
  const users = buildUserList(
    authUsers,
    progressRes.data || [],
    (adminsRes.data || []).map((r) => r.user_id),
  )
  return { users, count: users.length }
}

/**
 * action `getStats`: số liệu tổng hợp cho dashboard (Đợt 2). Đọc TẤT CẢ dòng
 * `progress` + danh sách user, tính bằng `computeStats` (thuần) rồi trả CHỈ số
 * gộp — không PII. Chỉ đọc, không ghi audit.
 */
export async function actionGetStats(service) {
  const [authUsers, progressRes] = await Promise.all([
    listAllAuthUsers(service),
    service.from('progress').select('xp, last_study_date, completed, quiz_scores'),
  ])
  if (progressRes.error) throw new AdminAuthError('Không đọc được tiến độ.', 'upstream', 502)
  return { stats: computeStats(progressRes.data || [], authUsers, Date.now()) }
}

/** action `getUserDetail`: toàn bộ tiến độ 1 user, bóc tách dễ đọc (chỉ đọc). */
export async function actionGetUserDetail(service, payload) {
  const userId = requireUserId(payload)
  const { data: userData, error: userErr } = await service.auth.admin.getUserById(userId)
  if (userErr || !userData?.user)
    throw new AdminAuthError('Không tìm thấy người dùng.', 'not_found', 404)
  const [progressRes, adminRes] = await Promise.all([
    service.from('progress').select('*').eq('user_id', userId).maybeSingle(),
    service.from('admins').select('user_id').eq('user_id', userId).maybeSingle(),
  ])
  if (progressRes.error) throw new AdminAuthError('Không đọc được tiến độ.', 'upstream', 502)
  return { user: buildUserDetail(userData.user, progressRes.data, !!adminRes.data) }
}

/** action `setAdmin`: cấp / thu quyền admin (có chốt chặn + audit). */
export async function actionSetAdmin(service, admin, payload) {
  const userId = requireUserId(payload)
  const on = !!payload.on
  const { count, error: cErr } = await service
    .from('admins')
    .select('user_id', { count: 'exact', head: true })
  if (cErr) throw new AdminAuthError('Không đếm được số admin.', 'upstream', 502)
  assertCanSetAdmin({ actorId: admin.userId, targetId: userId, on, adminCount: count || 0 })

  if (on) {
    const { error } = await service.from('admins').upsert({ user_id: userId }, { onConflict: 'user_id' })
    if (error) throw new AdminAuthError('Không cấp được quyền admin.', 'upstream', 502)
  } else {
    const { error } = await service.from('admins').delete().eq('user_id', userId)
    if (error) throw new AdminAuthError('Không thu được quyền admin.', 'upstream', 502)
  }
  await logAudit(service, { actorId: admin.userId, action: 'setAdmin', targetId: userId, detail: { on } })
  return { ok: true, userId, isAdmin: on }
}

/**
 * action `resetProgress`: xóa dòng progress (lần đăng nhập sau tự tạo lại mặc
 * định). Lưu snapshot cũ vào audit để có thể cứu khi cần.
 */
export async function actionResetProgress(service, admin, payload) {
  const userId = requireUserId(payload)
  const { data: old } = await service.from('progress').select('*').eq('user_id', userId).maybeSingle()
  const { error } = await service.from('progress').delete().eq('user_id', userId)
  if (error) throw new AdminAuthError('Không reset được tiến độ.', 'upstream', 502)
  await logAudit(service, {
    actorId: admin.userId,
    action: 'resetProgress',
    targetId: userId,
    detail: { snapshot: old || null },
  })
  return { ok: true, userId }
}

/** Xóa toàn bộ ghi âm mốc của user trong storage (best-effort). Trả số file đã xóa. */
async function deleteUserRecordings(service, userId) {
  try {
    const { data } = await service.storage.from('recordings').list(userId)
    const paths = (data || []).map((o) => `${userId}/${o.name}`)
    if (paths.length) await service.storage.from('recordings').remove(paths)
    return paths.length
  } catch {
    return 0
  }
}

/**
 * action `deleteUser`: xóa vĩnh viễn tài khoản + progress + ghi âm. Xóa auth user
 * vốn cascade sang `progress`/`admins` (FK on delete cascade), nhưng vẫn dọn
 * tường minh trước cho chắc. Có chốt chặn tự-xóa + audit (kèm snapshot cũ).
 */
export async function actionDeleteUser(service, admin, payload) {
  const userId = requireUserId(payload)
  assertCanDelete({ actorId: admin.userId, targetId: userId })
  const { data: old } = await service.from('progress').select('*').eq('user_id', userId).maybeSingle()
  const recordings = await deleteUserRecordings(service, userId)
  await service.from('progress').delete().eq('user_id', userId)
  await service.from('admins').delete().eq('user_id', userId)
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) throw new AdminAuthError('Không xóa được tài khoản.', 'upstream', 502)
  await logAudit(service, {
    actorId: admin.userId,
    action: 'deleteUser',
    targetId: userId,
    detail: { hadProgress: !!old, recordings, snapshot: old || null },
  })
  return { ok: true, userId }
}
