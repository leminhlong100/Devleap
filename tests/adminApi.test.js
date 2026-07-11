import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Wrapper client `adminApi.js` — đọc `isCloudEnabled`/`supabase` ở đầu module
 * nên mock qua vi.doMock + import động (giống tests/recordingSync.test.js).
 */
describe('adminApi — cổng gọi function admin', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockSupabase({ cloudEnabled = true, token = 'access-tok' } = {}) {
    vi.doMock('@/lib/supabase', () => ({
      isCloudEnabled: cloudEnabled,
      supabase: {
        auth: {
          getSession: async () => ({
            data: { session: token ? { access_token: token } : null },
          }),
        },
      },
    }))
  }

  it('chế độ khách (chưa cấu hình Supabase) -> lỗi config, không fetch', async () => {
    mockSupabase({ cloudEnabled: false })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { callAdmin } = await import('@/lib/adminApi')
    await expect(callAdmin('ping')).rejects.toMatchObject({ code: 'config' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('chưa có phiên đăng nhập -> lỗi unauthorized, không fetch', async () => {
    mockSupabase({ cloudEnabled: true, token: null })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { callAdmin } = await import('@/lib/adminApi')
    await expect(callAdmin('ping')).rejects.toMatchObject({ code: 'unauthorized' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('thành công: đính kèm Bearer token + gửi action/payload, trả body', async () => {
    mockSupabase({ cloudEnabled: true, token: 'tok-123' })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, isAdmin: true, userId: 'u1' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { callAdmin } = await import('@/lib/adminApi')

    const body = await callAdmin('ping', { foo: 1 })
    expect(body).toEqual({ ok: true, isAdmin: true, userId: 'u1' })

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/.netlify/functions/admin')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer tok-123')
    expect(JSON.parse(opts.body)).toEqual({ action: 'ping', payload: { foo: 1 } })
  })

  it('server trả lỗi -> ném AdminApiError giữ đúng code + message', async () => {
    mockSupabase({ cloudEnabled: true, token: 'tok' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ error: { code: 'forbidden', message: 'Bạn không có quyền quản trị.' } }),
      })),
    )
    const { callAdmin } = await import('@/lib/adminApi')
    await expect(callAdmin('ping')).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Bạn không có quyền quản trị.',
    })
  })

  it('lỗi mạng (fetch throw) -> code network', async () => {
    mockSupabase({ cloudEnabled: true, token: 'tok' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    const { callAdmin } = await import('@/lib/adminApi')
    await expect(callAdmin('ping')).rejects.toMatchObject({ code: 'network' })
  })

  it('pingAdmin gọi action "ping"', async () => {
    mockSupabase({ cloudEnabled: true, token: 'tok' })
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
    vi.stubGlobal('fetch', fetchMock)
    const { pingAdmin } = await import('@/lib/adminApi')
    await pingAdmin()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).action).toBe('ping')
  })
})
