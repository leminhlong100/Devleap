import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AiCallError } from '@/lib/aiError'

// sendChat() (src/lib/aiChat.js) là nơi client parse response lỗi từ
// /.netlify/functions/chat. Từ Bước 1.4, lỗi HTTP trả về dạng
// { error: { code, message } } (netlify/functions/_llm.js#errorResponse) —
// kiểm tra sendChat ném đúng AiCallError kèm .code, và vẫn đỡ được format
// string cũ phòng lệch bản.
describe('aiChat.js — sendChat() phân loại lỗi', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(status, body) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) })),
    )
  }

  it('lỗi dạng mới { error: { code, message } } -> AiCallError giữ đúng code + message', async () => {
    stubFetch(429, { error: { code: 'rate_limited', message: 'Đợi vài giây rồi thử lại.' } })
    const { sendChat } = await import('@/lib/aiChat')
    await expect(sendChat({ mode: 'word' })).rejects.toMatchObject({
      code: 'rate_limited',
      message: 'Đợi vài giây rồi thử lại.',
    })
  })

  it('lỗi dạng cũ (string) -> vẫn dùng được, code mặc định upstream', async () => {
    stubFetch(500, { error: 'Lỗi không xác định' })
    const { sendChat } = await import('@/lib/aiChat')
    await expect(sendChat({ mode: 'word' })).rejects.toMatchObject({ code: 'upstream', message: 'Lỗi không xác định' })
  })

  it('fetch ném lỗi mạng -> AiCallError code network', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    const { sendChat } = await import('@/lib/aiChat')
    const err = await sendChat({ mode: 'word' }).catch((e) => e)
    expect(err).toBeInstanceOf(AiCallError)
    expect(err.code).toBe('network')
  })

  it('thành công -> trả về data.reply', async () => {
    stubFetch(200, { reply: 'xin chào' })
    const { sendChat } = await import('@/lib/aiChat')
    await expect(sendChat({ mode: 'word' })).resolves.toBe('xin chào')
  })
})
