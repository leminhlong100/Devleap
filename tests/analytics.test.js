import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { sanitizeProps, buildEventRow, isOptedOut, setOptedOut } from '@/lib/analytics'

describe('sanitizeProps', () => {
  it('chỉ giữ string/number/boolean/null, bỏ object lồng nhau và hàm', () => {
    const out = sanitizeProps({
      course: 'java',
      week: 3,
      ok: true,
      empty: null,
      nested: { a: 1 },
      list: [1, 2],
      fn: () => {},
    })
    expect(out).toEqual({ course: 'java', week: 3, ok: true, empty: null })
  })

  it('trả về {} khi props không phải object', () => {
    expect(sanitizeProps(null)).toEqual({})
    expect(sanitizeProps(undefined)).toEqual({})
    expect(sanitizeProps('x')).toEqual({})
  })
})

describe('buildEventRow', () => {
  it('dựng đúng cột, cắt tên sự kiện quá dài, user_id null khi khách', () => {
    const now = new Date('2026-07-12T10:00:00Z')
    const row = buildEventRow('a'.repeat(100), { course: 'ielts' }, null, now)
    expect(row).toEqual({
      user_id: null,
      name: 'a'.repeat(64),
      props: { course: 'ielts' },
      created_at: '2026-07-12T10:00:00.000Z',
    })
  })
})

describe('isOptedOut / setOptedOut', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định chưa tắt', () => {
    expect(isOptedOut()).toBe(false)
  })

  it('bật/tắt và đọc lại đúng', () => {
    setOptedOut(true)
    expect(isOptedOut()).toBe(true)
    setOptedOut(false)
    expect(isOptedOut()).toBe(false)
  })
})

describe('useAnalytics().track', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('chế độ khách (Supabase chưa cấu hình): không insert', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }))
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: false, supabase: { from: () => ({ insert }) } }))
    const { useAnalytics } = await import('@/composables/useAnalytics')
    useAnalytics().track('page_view', { name: 'home' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('đã tắt analytics ở trang Hồ sơ: không insert', async () => {
    setOptedOut(true)
    const insert = vi.fn(() => Promise.resolve({ error: null }))
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: true, supabase: { from: () => ({ insert }) } }))
    const { useAnalytics } = await import('@/composables/useAnalytics')
    useAnalytics().track('page_view', { name: 'home' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('bật + đã cấu hình: insert đúng bảng events với user_id hiện tại', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }))
    const from = vi.fn(() => ({ insert }))
    vi.doMock('@/lib/supabase', () => ({ isCloudEnabled: true, supabase: { from } }))
    const { useAnalytics } = await import('@/composables/useAnalytics')
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore().user = { id: 'u1', email: 'a@b.com', name: 'A', avatar: null, provider: 'email' }

    useAnalytics().track('lesson_complete', { course: 'java', week: 1, day: 2 })

    expect(from).toHaveBeenCalledWith('events')
    expect(insert).toHaveBeenCalledTimes(1)
    const row = insert.mock.calls[0][0]
    expect(row.name).toBe('lesson_complete')
    expect(row.user_id).toBe('u1')
    expect(row.props).toEqual({ course: 'java', week: 1, day: 2 })
  })
})
