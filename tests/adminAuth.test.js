import { describe, it, expect, vi } from 'vitest'
import {
  bearerToken,
  verifyAdminToken,
  logAudit,
  AdminAuthError,
} from '../netlify/functions/_adminAuth.js'

/**
 * Nền bảo mật admin (Đợt 0). Tập trung vào ràng buộc quan trọng nhất:
 * `_adminAuth` phải TỪ CHỐI token thường (user hợp lệ nhưng không phải admin)
 * và token sai/thiếu — không được tin cờ client.
 */

/** Client service giả lập: điều khiển kết quả getUser + tra bảng admins. */
function fakeService({ user = null, userErr = null, adminRow = null, adminErr = null } = {}) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: userErr })) },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: adminRow, error: adminErr }) }),
      }),
      insert: vi.fn(async () => ({ error: null })),
    })),
  }
}

describe('bearerToken — bóc access token từ header Authorization', () => {
  const reqWith = (headers) => new Request('http://local/admin', { headers })

  it('lấy đúng token sau "Bearer "', () => {
    expect(bearerToken(reqWith({ Authorization: 'Bearer abc.def.ghi' }))).toBe('abc.def.ghi')
  })

  it('không phân biệt hoa thường ở "bearer"', () => {
    expect(bearerToken(reqWith({ Authorization: 'bearer tok123' }))).toBe('tok123')
  })

  it('trả rỗng khi thiếu header hoặc sai định dạng', () => {
    expect(bearerToken(reqWith({}))).toBe('')
    expect(bearerToken(reqWith({ Authorization: 'Basic xxx' }))).toBe('')
  })
})

describe('verifyAdminToken — chỉ cho qua đúng admin', () => {
  it('thiếu token -> 401 unauthorized (không gọi Supabase)', async () => {
    const service = fakeService()
    await expect(verifyAdminToken('', service)).rejects.toMatchObject({
      name: 'AdminAuthError',
      code: 'unauthorized',
      status: 401,
    })
    expect(service.auth.getUser).not.toHaveBeenCalled()
  })

  it('token sai/hết hạn (getUser lỗi) -> 401 unauthorized', async () => {
    const service = fakeService({ userErr: { message: 'bad jwt' } })
    await expect(verifyAdminToken('tok', service)).rejects.toMatchObject({
      code: 'unauthorized',
      status: 401,
    })
  })

  it('user hợp lệ nhưng KHÔNG có trong bảng admins -> 403 forbidden', async () => {
    const service = fakeService({ user: { id: 'u1', email: 'u1@x.com' }, adminRow: null })
    await expect(verifyAdminToken('tok', service)).rejects.toMatchObject({
      code: 'forbidden',
      status: 403,
    })
  })

  it('lỗi khi tra bảng admins -> 502 upstream', async () => {
    const service = fakeService({ user: { id: 'u1' }, adminErr: { message: 'db down' } })
    await expect(verifyAdminToken('tok', service)).rejects.toMatchObject({
      code: 'upstream',
      status: 502,
    })
  })

  it('admin thật -> trả { userId, email }', async () => {
    const service = fakeService({
      user: { id: 'admin-1', email: 'a@x.com' },
      adminRow: { user_id: 'admin-1' },
    })
    await expect(verifyAdminToken('tok', service)).resolves.toEqual({
      userId: 'admin-1',
      email: 'a@x.com',
    })
  })
})

describe('logAudit — ghi nhật ký best-effort', () => {
  it('gọi insert với đúng shape', async () => {
    const insert = vi.fn(async () => ({ error: null }))
    const service = { from: vi.fn(() => ({ insert })) }
    await logAudit(service, { actorId: 'a1', action: 'setAdmin', targetId: 'u2', detail: { on: true } })
    expect(service.from).toHaveBeenCalledWith('admin_audit')
    expect(insert).toHaveBeenCalledWith({
      actor_id: 'a1',
      action: 'setAdmin',
      target_id: 'u2',
      detail: { on: true },
    })
  })

  it('nuốt lỗi ghi audit (không ném) để không chặn hành động chính', async () => {
    const service = {
      from: vi.fn(() => ({
        insert: async () => {
          throw new Error('audit table missing')
        },
      })),
    }
    await expect(
      logAudit(service, { actorId: 'a1', action: 'x' }),
    ).resolves.toBeUndefined()
  })
})

describe('AdminAuthError — mặc định forbidden/403', () => {
  it('giữ code + status truyền vào', () => {
    const e = new AdminAuthError('nope', 'config', 500)
    expect(e.code).toBe('config')
    expect(e.status).toBe(500)
    expect(e.name).toBe('AdminAuthError')
  })
})
