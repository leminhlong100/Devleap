import { describe, it, expect, vi } from 'vitest'
import {
  buildUserList,
  buildUserDetail,
  requireUserId,
  requireCourseId,
  assertCanSetAdmin,
  assertCanDelete,
  actionListUsers,
  actionGetStats,
  actionSetAdmin,
  actionResetProgress,
  actionDeleteUser,
  actionListCourseAccess,
  actionGrantCourseAccess,
  actionRevokeCourseAccess,
} from '../netlify/functions/_adminActions.js'

/**
 * Đợt 1 — Quản lý tài khoản. Kiểm tra phần thuần (ghép/bóc tách) và — quan
 * trọng nhất — các CHỐT CHẶN an toàn: không tự thu quyền, không hạ admin cuối,
 * không tự xóa. Cùng vài action với service giả để chắc dòng chảy + audit.
 */

describe('buildUserList — ghép auth.users × progress × admins', () => {
  const authUsers = [
    { id: 'u1', email: 'a@x.com', created_at: '2026-01-01', user_metadata: { full_name: 'An' } },
    { id: 'u2', email: 'b@x.com', created_at: '2026-02-01', user_metadata: {} },
  ]
  const progressRows = [
    { user_id: 'u1', xp: 300, streak: 5, badges: 2, last_study_date: '2026-07-10', completed: { java: ['1:1', '1:2'], ielts: ['1:1'], comm: [] } },
  ]

  it('map đủ trường + đếm buổi + cờ admin', () => {
    const list = buildUserList(authUsers, progressRows, ['u2'])
    expect(list[0]).toMatchObject({ id: 'u1', name: 'An', xp: 300, completedCount: 3, isAdmin: false })
    expect(list[1]).toMatchObject({ id: 'u2', name: 'b@x.com', xp: 0, completedCount: 0, isAdmin: true })
  })

  it('user không có progress -> mọi số = 0', () => {
    const list = buildUserList([authUsers[1]], [], [])
    expect(list[0]).toMatchObject({ xp: 0, streak: 0, badges: 0, completedCount: 0 })
  })
})

describe('buildUserDetail — bóc tách 1 user', () => {
  const user = { id: 'u1', email: 'a@x.com', created_at: '2026-01-01', user_metadata: { name: 'An' } }

  it('đếm đúng các nhóm dữ liệu + hasProgress', () => {
    const row = {
      xp: 120,
      completed: { java: ['1:1'], ielts: [], comm: ['2:1', '2:2'] },
      quiz_scores: { 'week:1': {}, final: {} },
      saved_words: { hello: {}, world: {} },
      srs: { a: {} },
      topics: ['t1', 't2', 't3'],
      leaderboard_opt_in: true,
      leaderboard_name: 'Ẩn danh',
    }
    const d = buildUserDetail(user, row, true)
    expect(d).toMatchObject({
      name: 'An',
      isAdmin: true,
      hasProgress: true,
      xp: 120,
      completed: { java: 1, ielts: 0, comm: 2 },
      quizCount: 2,
      savedWordsCount: 2,
      srsCount: 1,
      topicsCount: 3,
      leaderboardOptIn: true,
      leaderboardName: 'Ẩn danh',
    })
  })

  it('không có progress -> hasProgress false, số = 0', () => {
    const d = buildUserDetail(user, null, false)
    expect(d.hasProgress).toBe(false)
    expect(d.xp).toBe(0)
    expect(d.completed).toEqual({ java: 0, ielts: 0, comm: 0 })
  })

  it('courseAccess: mặc định [] khi thiếu, giữ nguyên khi truyền vào', () => {
    expect(buildUserDetail(user, null, false).courseAccess).toEqual([])
    expect(buildUserDetail(user, null, false, ['comm', 'java']).courseAccess).toEqual(['comm', 'java'])
  })
})

describe('requireUserId', () => {
  it('trả userId đã trim', () => {
    expect(requireUserId({ userId: '  u1 ' })).toBe('u1')
  })
  it('thiếu -> 400 bad_request', () => {
    expect(() => requireUserId({})).toThrow(/Thiếu userId/)
    expect(() => requireUserId({ userId: '   ' })).toThrowError(expect.objectContaining({ status: 400 }))
  })
})

describe('requireCourseId', () => {
  it('trả courseId đã trim', () => {
    expect(requireCourseId({ courseId: ' comm ' })).toBe('comm')
  })
  it('thiếu -> 400 bad_request', () => {
    expect(() => requireCourseId({})).toThrow(/Thiếu courseId/)
    expect(() => requireCourseId({ courseId: '  ' })).toThrowError(expect.objectContaining({ status: 400 }))
  })
})

describe('assertCanSetAdmin — chốt chặn quyền', () => {
  it('cấp quyền thì luôn cho qua', () => {
    expect(() => assertCanSetAdmin({ actorId: 'a', targetId: 'b', on: true, adminCount: 1 })).not.toThrow()
  })
  it('không cho tự thu quyền của chính mình', () => {
    expect(() => assertCanSetAdmin({ actorId: 'a', targetId: 'a', on: false, adminCount: 3 })).toThrow(/chính mình/)
  })
  it('không cho hạ admin cuối cùng', () => {
    expect(() => assertCanSetAdmin({ actorId: 'a', targetId: 'b', on: false, adminCount: 1 })).toThrow(/cuối cùng/)
  })
  it('thu quyền người khác khi còn nhiều admin -> OK', () => {
    expect(() => assertCanSetAdmin({ actorId: 'a', targetId: 'b', on: false, adminCount: 2 })).not.toThrow()
  })
})

describe('assertCanDelete', () => {
  it('không cho tự xóa', () => {
    expect(() => assertCanDelete({ actorId: 'a', targetId: 'a' })).toThrow(/chính mình/)
  })
  it('xóa người khác -> OK', () => {
    expect(() => assertCanDelete({ actorId: 'a', targetId: 'b' })).not.toThrow()
  })
})

// —— Action với service giả ——

/** Builder query giả: mọi phương thức trả về chính nó / kết quả cấu hình. */
function fakeService(opts = {}) {
  const audits = []
  const from = vi.fn((table) => {
    if (table === 'admin_audit') {
      return { insert: vi.fn(async (row) => { audits.push(row); return { error: null } }) }
    }
    // progress / admins: hỗ trợ select/eq/maybeSingle/delete/upsert
    const q = {
      _table: table,
      select: vi.fn((_c, o) => {
        if (o?.head) return Promise.resolve({ count: opts.adminCount ?? 0, error: null })
        return q
      }),
      eq: vi.fn(() => q),
      maybeSingle: vi.fn(async () => ({ data: opts.progressRow ?? null, error: null })),
      delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      upsert: vi.fn(async () => ({ error: null })),
      then: undefined,
    }
    // Cho `select('...')` không head trả mảng khi await trực tiếp (listUsers).
    if (table === 'progress' || table === 'admins') {
      q.select = vi.fn((_c, o) => {
        if (o?.head) return Promise.resolve({ count: opts.adminCount ?? 0, error: null })
        const arrProm = Promise.resolve({ data: opts[`${table}Rows`] ?? [], error: null })
        // Cho phép .eq().maybeSingle() nối tiếp:
        arrProm.eq = () => ({ maybeSingle: async () => ({ data: opts.progressRow ?? null, error: null }) })
        return arrProm
      })
    }
    return q
  })
  return {
    from,
    _audits: audits,
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({ data: { users: opts.authUsers ?? [] }, error: null })),
        getUserById: vi.fn(async () => ({ data: { user: opts.authUser ?? null }, error: null })),
        deleteUser: vi.fn(async () => ({ error: null })),
      },
    },
    storage: {
      from: vi.fn(() => ({
        list: async () => ({ data: opts.recordings ?? [] }),
        remove: async () => ({ error: null }),
      })),
    },
  }
}

describe('actionListUsers — gộp 3 nguồn', () => {
  it('trả users + count', async () => {
    const service = fakeService({
      authUsers: [{ id: 'u1', email: 'a@x.com' }],
      progressRows: [{ user_id: 'u1', xp: 50, completed: { java: ['1:1'] } }],
      adminsRows: [{ user_id: 'u1' }],
    })
    const res = await actionListUsers(service)
    expect(res.count).toBe(1)
    expect(res.users[0]).toMatchObject({ id: 'u1', xp: 50, isAdmin: true, completedCount: 1 })
  })
})

describe('actionGetStats — đọc rồi tính số gộp', () => {
  it('trả { stats } với overview khớp dữ liệu', async () => {
    const service = fakeService({
      authUsers: [{ id: 'u1', created_at: '2020-01-01' }],
      progressRows: [{ xp: 70, last_study_date: null, completed: { java: ['1:1'] }, quiz_scores: {} }],
    })
    const { stats } = await actionGetStats(service)
    expect(stats.overview).toMatchObject({ totalUsers: 1, withProgress: 1, totalXp: 70, totalCompleted: 1 })
  })
})

describe('actionSetAdmin — cấp/thu + audit + chặn', () => {
  it('cấp quyền -> upsert + ghi audit', async () => {
    const service = fakeService({ adminCount: 2 })
    const res = await actionSetAdmin(service, { userId: 'admin1' }, { userId: 'u2', on: true })
    expect(res).toMatchObject({ ok: true, isAdmin: true })
    expect(service._audits[0]).toMatchObject({ action: 'setAdmin', target_id: 'u2', detail: { on: true } })
  })

  it('tự thu quyền -> ném lỗi, không ghi audit', async () => {
    const service = fakeService({ adminCount: 3 })
    await expect(actionSetAdmin(service, { userId: 'a' }, { userId: 'a', on: false })).rejects.toThrow(/chính mình/)
    expect(service._audits).toHaveLength(0)
  })

  it('hạ admin cuối -> ném lỗi', async () => {
    const service = fakeService({ adminCount: 1 })
    await expect(actionSetAdmin(service, { userId: 'a' }, { userId: 'b', on: false })).rejects.toThrow(/cuối cùng/)
  })
})

describe('actionResetProgress — xóa + audit snapshot', () => {
  it('ghi audit kèm snapshot cũ', async () => {
    const service = fakeService({ progressRow: { user_id: 'u2', xp: 999 } })
    const res = await actionResetProgress(service, { userId: 'a' }, { userId: 'u2' })
    expect(res).toMatchObject({ ok: true, userId: 'u2' })
    expect(service._audits[0]).toMatchObject({ action: 'resetProgress', target_id: 'u2' })
    expect(service._audits[0].detail.snapshot).toMatchObject({ xp: 999 })
  })
})

describe('actionDeleteUser — chặn tự xóa + audit', () => {
  it('tự xóa -> ném lỗi, không gọi deleteUser', async () => {
    const service = fakeService()
    await expect(actionDeleteUser(service, { userId: 'a' }, { userId: 'a' })).rejects.toThrow(/chính mình/)
    expect(service.auth.admin.deleteUser).not.toHaveBeenCalled()
  })

  it('xóa người khác -> gọi deleteUser + audit', async () => {
    const service = fakeService({ progressRow: { user_id: 'u2', xp: 10 }, recordings: [{ name: 'r1.webm' }] })
    const res = await actionDeleteUser(service, { userId: 'a' }, { userId: 'u2' })
    expect(res).toMatchObject({ ok: true, userId: 'u2' })
    expect(service.auth.admin.deleteUser).toHaveBeenCalledWith('u2')
    expect(service._audits[0]).toMatchObject({ action: 'deleteUser', target_id: 'u2', detail: { recordings: 1 } })
  })
})

// —— Đợt 5: Quyền vào khóa "giới hạn" (course_access) ——

/** Fake service riêng cho course_access: hỗ trợ select().eq / upsert / delete().match. */
function courseAccessFake(opts = {}) {
  const audits = []
  const calls = { upsert: [], match: [] }
  const from = (table) => {
    if (table === 'admin_audit') {
      return { insert: async (row) => { audits.push(row); return { error: null } } }
    }
    if (table === 'course_access') {
      return {
        select: () => ({ eq: async () => ({ data: opts.rows ?? [], error: opts.selectError ?? null }) }),
        upsert: async (row) => { calls.upsert.push(row); return { error: opts.upsertError ?? null } },
        delete: () => ({ match: async (m) => { calls.match.push(m); return { error: opts.deleteError ?? null } } }),
      }
    }
    return {}
  }
  return {
    from,
    _audits: audits,
    _calls: calls,
    auth: { admin: { listUsers: async () => ({ data: { users: opts.authUsers ?? [] }, error: null }) } },
  }
}

describe('actionListCourseAccess — ghép course_access × auth.users', () => {
  it('trả đúng người được cấp + email/tên/grantedAt', async () => {
    const service = courseAccessFake({
      rows: [{ user_id: 'u1', granted_at: '2026-07-01' }],
      authUsers: [
        { id: 'u1', email: 'a@x.com', user_metadata: { full_name: 'An' } },
        { id: 'u2', email: 'b@x.com' },
      ],
    })
    const res = await actionListCourseAccess(service, { courseId: 'comm' })
    expect(res).toMatchObject({ courseId: 'comm', count: 1 })
    expect(res.users[0]).toMatchObject({ id: 'u1', email: 'a@x.com', name: 'An', grantedAt: '2026-07-01' })
  })

  it('thiếu courseId -> ném lỗi 400', async () => {
    await expect(actionListCourseAccess(courseAccessFake(), {})).rejects.toThrow(/Thiếu courseId/)
  })
})

describe('actionGrantCourseAccess — upsert + audit', () => {
  it('cấp quyền -> upsert đúng cặp + ghi audit', async () => {
    const service = courseAccessFake()
    const res = await actionGrantCourseAccess(service, { userId: 'admin1' }, { userId: 'u2', courseId: 'comm' })
    expect(res).toMatchObject({ ok: true, userId: 'u2', courseId: 'comm' })
    expect(service._calls.upsert[0]).toMatchObject({ user_id: 'u2', course_id: 'comm' })
    expect(service._audits[0]).toMatchObject({ action: 'grantCourseAccess', target_id: 'u2', detail: { courseId: 'comm' } })
  })

  it('thiếu userId -> ném lỗi, không upsert', async () => {
    const service = courseAccessFake()
    await expect(actionGrantCourseAccess(service, { userId: 'a' }, { courseId: 'comm' })).rejects.toThrow(/Thiếu userId/)
    expect(service._calls.upsert).toHaveLength(0)
  })
})

describe('actionRevokeCourseAccess — delete + audit', () => {
  it('thu quyền -> match đúng cặp + ghi audit', async () => {
    const service = courseAccessFake()
    const res = await actionRevokeCourseAccess(service, { userId: 'admin1' }, { userId: 'u2', courseId: 'comm' })
    expect(res).toMatchObject({ ok: true, userId: 'u2', courseId: 'comm' })
    expect(service._calls.match[0]).toMatchObject({ user_id: 'u2', course_id: 'comm' })
    expect(service._audits[0]).toMatchObject({ action: 'revokeCourseAccess', target_id: 'u2', detail: { courseId: 'comm' } })
  })
})
