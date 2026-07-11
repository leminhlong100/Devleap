import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('auth store — đổi tên hiển thị (trang Hồ sơ)', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
  })

  function mockCloud({ updateUser } = {}) {
    vi.doMock('@/lib/supabase', () => ({
      isCloudEnabled: true,
      supabase: {
        auth: {
          updateUser: updateUser || (() => Promise.resolve({ data: {}, error: null })),
        },
      },
    }))
  }

  function mockGuest() {
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: false, supabase: null }))
  }

  it('chế độ khách: báo chưa cấu hình', async () => {
    mockGuest()
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().updateDisplayName('Long')
    expect(res.error).toBe('Chưa cấu hình đăng nhập.')
  })

  it('tên rỗng -> báo lỗi, không gọi Supabase', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ updateUser: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const res = await useAuthStore().updateDisplayName('   ')
    expect(res.error).toMatch(/nhập tên/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('đổi tên thành công -> cập nhật user_metadata + state tại chỗ', async () => {
    const spy = vi.fn(() => Promise.resolve({ error: null }))
    mockCloud({ updateUser: spy })
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    auth.user = { id: '1', email: 'a@b.com', name: 'Cũ', avatar: null, provider: 'email' }
    const res = await auth.updateDisplayName('  Tên Mới  ')
    expect(res.error).toBeNull()
    expect(spy).toHaveBeenCalledWith({ data: { full_name: 'Tên Mới' } })
    expect(auth.user.name).toBe('Tên Mới')
  })
})
