import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// auth store đọc isCloudEnabled/supabase ở đầu module -> mock qua vi.doMock +
// import động (giống tests/recordingSync.test.js).
describe('auth store — quên/đặt lại mật khẩu', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
  })

  function mockCloud({ resetPasswordForEmail, updateUser } = {}) {
    vi.doMock('@/lib/supabase', () => ({
      isCloudEnabled: true,
      supabase: {
        auth: {
          resetPasswordForEmail:
            resetPasswordForEmail || (() => Promise.resolve({ data: {}, error: null })),
          updateUser: updateUser || (() => Promise.resolve({ data: {}, error: null })),
        },
      },
    }))
  }

  function mockGuest() {
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: false, supabase: null }))
  }

  it('chế độ khách: sendPasswordReset báo chưa cấu hình', async () => {
    mockGuest()
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().sendPasswordReset('a@b.com')
    expect(res.error).toBe('Chưa cấu hình đăng nhập.')
  })

  it('email rỗng -> báo lỗi, không gọi Supabase', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ resetPasswordForEmail: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().sendPasswordReset('   ')
    expect(res.error).toMatch(/nhập email/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('gửi reset thành công với redirectTo /reset-password', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ resetPasswordForEmail: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().sendPasswordReset('  Me@Ex.com ')
    expect(res.error).toBeNull()
    expect(spy).toHaveBeenCalledTimes(1)
    const [email, opts] = spy.mock.calls[0]
    expect(email).toBe('Me@Ex.com') // đã trim
    expect(opts.redirectTo).toMatch(/\/reset-password$/)
  })

  it('lỗi rate limit -> thông báo tiếng Việt', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: { message: 'Email rate limit exceeded' } }))
    mockCloud({ resetPasswordForEmail: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().sendPasswordReset('a@b.com')
    expect(res.error).toMatch(/quá nhiều lần/i)
  })

  it('updatePassword: mật khẩu quá ngắn bị chặn trước khi gọi Supabase', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ updateUser: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().updatePassword('123')
    expect(res.error).toMatch(/quá ngắn/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('updatePassword thành công', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ updateUser: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().updatePassword('newpass123')
    expect(res.error).toBeNull()
    expect(spy).toHaveBeenCalledWith({ password: 'newpass123' })
  })
})
