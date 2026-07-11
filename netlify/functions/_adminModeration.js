/**
 * Đợt 4 — Kiểm duyệt & phản hồi (docs/KE_HOACH_TRANG_ADMIN.md mục 5).
 *
 * Phần THUẦN (tổng hợp phản hồi độ khó, bóc tên file ghi âm, dựng danh sách
 * leaderboard) tách để test; phần I/O gọi Supabase service (đọc phản hồi, tạo
 * signed URL nghe ghi âm, xóa ghi âm, xóa tên leaderboard phản cảm). Hành động
 * THAY ĐỔI đều ghi `admin_audit`.
 */
import { AdminAuthError, logAudit } from './_adminAuth.js'

const COURSES = ['java', 'ielts', 'comm']
const RATINGS = ['easy', 'ok', 'hard', 'skipped']

// Nhãn mốc ghi âm khóa Giao Tiếp (khớp COMM_MILESTONES ở src/data/milestones.js).
const COMM_MILESTONE_TAG = { '1:1': 'Đầu khóa', '4:7': 'Giữa khóa', '8:7': 'Cuối khóa' }
const COURSE_LABEL = { java: 'Java', ielts: 'IELTS', comm: 'Giao tiếp' }

// ————————————————————————— Phần thuần —————————————————————————

/**
 * Tổng hợp cảm nhận độ khó cuối tuần theo khóa × tuần.
 * @param {Array} progressRows  dòng có cột `week_feedback` = { "course:week": { rating } }
 * @returns {{ [course]: Array<{week, easy, ok, hard, skipped, total, hardPct}> }}
 */
export function computeFeedbackStats(progressRows = []) {
  // course -> week -> { easy, ok, hard, skipped }
  const acc = {}
  for (const p of progressRows || []) {
    const fb = p.week_feedback || {}
    for (const [key, v] of Object.entries(fb)) {
      const idx = key.indexOf(':')
      if (idx < 0) continue
      const course = key.slice(0, idx)
      const week = Number(key.slice(idx + 1))
      const rating = v?.rating
      if (!COURSES.includes(course) || !Number.isFinite(week) || !RATINGS.includes(rating)) continue
      const byWeek = (acc[course] ||= {})
      const cell = (byWeek[week] ||= { easy: 0, ok: 0, hard: 0, skipped: 0 })
      cell[rating] += 1
    }
  }
  const out = {}
  for (const course of COURSES) {
    const byWeek = acc[course] || {}
    out[course] = Object.keys(byWeek)
      .map(Number)
      .sort((a, b) => a - b)
      .map((week) => {
        const c = byWeek[week]
        // "total" chỉ tính lượt có đánh giá thật (bỏ skipped) cho tỉ lệ khó.
        const rated = c.easy + c.ok + c.hard
        return {
          week,
          easy: c.easy,
          ok: c.ok,
          hard: c.hard,
          skipped: c.skipped,
          total: rated,
          hardPct: rated ? Math.round((c.hard / rated) * 100) : 0,
        }
      })
  }
  return out
}

/** Bóc metadata từ 1 file ghi âm `{userId}/{recId đã escape}.webm`. */
export function parseRecordingName(userId, fileName) {
  const base = String(fileName).replace(/\.webm$/i, '')
  const recId = base.replace(/_/g, ':') // đảo escape ':' -> '_' của recordingSync
  const [course, w, d] = recId.split(':')
  const week = Number(w)
  const day = Number(d)
  const wd = Number.isFinite(week) && Number.isFinite(day) ? `${week}:${day}` : ''
  const tag = course === 'comm' ? COMM_MILESTONE_TAG[wd] || '' : ''
  const label =
    Number.isFinite(week) && Number.isFinite(day)
      ? `${COURSE_LABEL[course] || course} · Tuần ${week} · Buổi ${day}${tag ? ` · ${tag}` : ''}`
      : recId
  return { path: `${userId}/${fileName}`, userId, recId, course: course || '', week, day, tag, label }
}

/** Danh sách người tham gia leaderboard (opt-in) kèm email từ auth.users. */
export function buildLeaderboardList(progressRows = [], authUsers = []) {
  const emailById = new Map((authUsers || []).map((u) => [u.id, u.email || '']))
  return (progressRows || [])
    .filter((p) => p.leaderboard_opt_in)
    .map((p) => ({
      id: p.user_id,
      email: emailById.get(p.user_id) || '',
      displayName: (p.leaderboard_name || '').trim(),
      weekXp: p.week_xp || 0,
    }))
    .sort((a, b) => (b.weekXp || 0) - (a.weekXp || 0))
}

/** Kiểm tra path ghi âm hợp lệ: đúng dạng "{folder}/{name}.webm", không leo thư mục. */
export function assertValidRecordingPath(path) {
  if (typeof path !== 'string' || !/^[^/]+\/[^/]+\.webm$/.test(path) || path.includes('..'))
    throw new AdminAuthError('Đường dẫn ghi âm không hợp lệ.', 'bad_request', 400)
  return path
}

// ————————————————————————— Phần I/O —————————————————————————

/** action `getFeedbackStats`: tổng hợp cảm nhận độ khó theo khóa × tuần. */
export async function actionGetFeedbackStats(service) {
  const { data, error } = await service.from('progress').select('week_feedback')
  if (error) throw new AdminAuthError('Không đọc được phản hồi.', 'upstream', 502)
  return { feedback: computeFeedbackStats(data || []) }
}

const RECORDINGS_BUCKET = 'recordings'
const SIGNED_TTL = 3600 // 1 giờ — admin nghe ngay sau khi liệt kê

/** Liệt kê mọi ghi âm (mọi user) + tạo signed URL để nghe. Giới hạn để tránh quá tải. */
export async function actionListRecordings(service, payload = {}) {
  const limit = Math.min(Math.max(Number(payload.limit) || 100, 1), 500)
  const store = service.storage.from(RECORDINGS_BUCKET)
  const { data: folders, error } = await store.list('', { limit: 1000 })
  if (error) throw new AdminAuthError('Không liệt kê được ghi âm.', 'upstream', 502)

  const items = []
  for (const f of folders || []) {
    if (f.id) continue // chỉ duyệt thư mục (id === null); bỏ file lạ ở gốc
    const { data: files } = await store.list(f.name, { limit: 1000 })
    for (const file of files || []) {
      if (!file.name.endsWith('.webm')) continue
      const meta = parseRecordingName(f.name, file.name)
      items.push({ ...meta, createdAt: file.created_at || file.updated_at || null, size: file.metadata?.size ?? null })
      if (items.length >= limit) break
    }
    if (items.length >= limit) break
  }

  // Tạo signed URL hàng loạt (bỏ qua nếu lỗi từng cái).
  const paths = items.map((i) => i.path)
  if (paths.length) {
    const { data: signed } = await store.createSignedUrls(paths, SIGNED_TTL)
    const urlByPath = new Map((signed || []).map((s) => [s.path, s.signedUrl]))
    for (const it of items) it.url = urlByPath.get(it.path) || null
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return { recordings: items, count: items.length }
}

/** action `deleteRecording`: xóa 1 file ghi âm (audit). */
export async function actionDeleteRecording(service, admin, payload) {
  const path = assertValidRecordingPath(payload?.path)
  const { error } = await service.storage.from(RECORDINGS_BUCKET).remove([path])
  if (error) throw new AdminAuthError('Không xóa được ghi âm.', 'upstream', 502)
  await logAudit(service, { actorId: admin.userId, action: 'deleteRecording', targetId: null, detail: { path } })
  return { ok: true, path }
}

/** action `listLeaderboard`: người tham gia leaderboard + tên hiển thị. */
export async function actionListLeaderboard(service) {
  const [{ data, error }, authUsers] = await Promise.all([
    service.from('progress').select('user_id, leaderboard_opt_in, leaderboard_name, week_xp'),
    listUsersForEmails(service),
  ])
  if (error) throw new AdminAuthError('Không đọc được leaderboard.', 'upstream', 502)
  return { entries: buildLeaderboardList(data || [], authUsers) }
}

/** action `clearLeaderboardName`: xóa tên hiển thị phản cảm (giữ opt-in). */
export async function actionClearLeaderboardName(service, admin, payload) {
  const userId = typeof payload?.userId === 'string' ? payload.userId.trim() : ''
  if (!userId) throw new AdminAuthError('Thiếu userId.', 'bad_request', 400)
  const { error } = await service.from('progress').update({ leaderboard_name: '' }).eq('user_id', userId)
  if (error) throw new AdminAuthError('Không xóa được tên hiển thị.', 'upstream', 502)
  await logAudit(service, { actorId: admin.userId, action: 'clearLeaderboardName', targetId: userId, detail: {} })
  return { ok: true, userId }
}

/** Lấy danh sách user tối thiểu (id+email) để gắn email cho leaderboard. */
async function listUsersForEmails(service) {
  try {
    const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
    return data?.users || []
  } catch {
    return []
  }
}
