import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('luồng chính: đăng nhập (mock) -> mở buổi -> đánh dấu hoàn thành -> tiến độ được lưu', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('toggleDay: hoàn thành cộng XP, lưu localStorage, bắn lesson_complete — bỏ đánh dấu thì không', async () => {
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: false, supabase: null }))
    const track = vi.fn()
    vi.doMock('@/composables/useAnalytics', () => ({ useAnalytics: () => ({ track }) }))

    const { useAuthStore } = await import('@/stores/auth')
    const { useUserStore } = await import('@/stores/user')

    // "Đăng nhập" giả lập — gán thẳng user vào auth store.
    useAuthStore().user = { id: 'u1', email: 'a@b.com', name: 'A', avatar: null, provider: 'email' }

    const user = useUserStore()
    expect(user.isDone('java', 1, 1)).toBe(false)

    // Mở buổi 1 tuần 1 rồi đánh dấu hoàn thành.
    user.toggleDay('java', 1, 1, 5)

    expect(user.isDone('java', 1, 1)).toBe(true)
    expect(user.xp).toBe(50)
    expect(track).toHaveBeenCalledWith('lesson_complete', { course: 'java', week: 1, day: 1 })

    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.completed.java).toContain('1:1')

    track.mockClear()
    user.toggleDay('java', 1, 1, 5) // bỏ đánh dấu
    expect(user.isDone('java', 1, 1)).toBe(false)
    expect(track).not.toHaveBeenCalled()
  })
})
