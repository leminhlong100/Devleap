import { describe, it, expect } from 'vitest'
import { urlBase64ToUint8Array, subscriptionToRow } from '@/lib/webPush'

describe('urlBase64ToUint8Array', () => {
  it('giải mã đúng độ dài khóa VAPID public (65 byte, P-256 uncompressed point)', () => {
    const sample =
      'BOU5yhm5WNueQch0xJS7fGetTSikuz46UUGUq7ju665yUZDQgO1rnF-FZ4oT28MQ9vPj6MV1FUD2HVjG0QMEZ5E'
    const bytes = urlBase64ToUint8Array(sample)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(0x04) // uncompressed EC point luôn bắt đầu bằng 0x04
  })

  it('xử lý được chuỗi không cần padding lẫn cần padding', () => {
    expect(urlBase64ToUint8Array('YQ').length).toBe(1) // 'a' -> thiếu padding
    expect(urlBase64ToUint8Array('YWI').length).toBe(2) // 'ab'
  })
})

describe('subscriptionToRow', () => {
  it('map PushSubscription -> dòng lưu Supabase đúng cột', () => {
    const fakeSub = {
      toJSON: () => ({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'P256DH_KEY', auth: 'AUTH_KEY' },
      }),
    }
    const now = new Date('2026-07-12T10:00:00Z')
    const row = subscriptionToRow(fakeSub, 'user-1', 20, now)
    expect(row).toEqual({
      user_id: 'user-1',
      endpoint: 'https://push.example/abc',
      p256dh: 'P256DH_KEY',
      auth_key: 'AUTH_KEY',
      preferred_hour: 20,
      updated_at: '2026-07-12T10:00:00.000Z',
    })
  })
})
