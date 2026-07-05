import { describe, it, expect } from 'vitest'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

describe('useOnlineStatus', () => {
  it('cập nhật isOnline theo sự kiện online/offline của window', () => {
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(true) // happy-dom mặc định navigator.onLine = true

    window.dispatchEvent(new Event('offline'))
    expect(isOnline.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(isOnline.value).toBe(true)
  })

  it('nhiều lần gọi cùng dùng chung 1 state (singleton), không đăng ký trùng listener', () => {
    const a = useOnlineStatus()
    const b = useOnlineStatus()
    expect(a.isOnline).toBe(b.isOnline)

    window.dispatchEvent(new Event('offline'))
    expect(a.isOnline.value).toBe(false)
    expect(b.isOnline.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(a.isOnline.value).toBe(true)
  })
})
