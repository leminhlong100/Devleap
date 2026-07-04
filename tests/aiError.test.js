import { describe, it, expect } from 'vitest'
import { friendlyAiError, AiCallError } from '@/lib/aiError'

describe('friendlyAiError()', () => {
  it('AiCallError với code đã biết -> thông điệp thân thiện cố định, retryable=true', () => {
    const cases = [
      ['rate_limited', /bận|30 giây/],
      ['timeout', /lâu|chậm/],
      ['network', /kết nối|mạng/],
      ['upstream', /sự cố/],
      ['bad_request', /không hợp lệ/],
    ]
    for (const [code, re] of cases) {
      const { message, retryable } = friendlyAiError(new AiCallError('raw', code))
      expect(message).toMatch(re)
      expect(retryable).toBe(true)
    }
  })

  it('code config -> không retryable (lỗi cấu hình server, thử lại vô ích)', () => {
    const { retryable, message } = friendlyAiError(new AiCallError('raw', 'config'))
    expect(retryable).toBe(false)
    expect(message).toMatch(/cấu hình/)
  })

  it('không có code (Error thường) -> dùng nguyên message gốc', () => {
    const { message, retryable } = friendlyAiError(new Error('lỗi cụ thể abc'))
    expect(message).toBe('lỗi cụ thể abc')
    expect(retryable).toBe(true)
  })

  it('không có message lẫn code -> fallback chung chung', () => {
    expect(friendlyAiError(undefined).message).toBe('Có lỗi xảy ra, thử lại nhé.')
    expect(friendlyAiError({}).message).toBe('Có lỗi xảy ra, thử lại nhé.')
  })

  it('AiCallError giữ đúng .code và .message', () => {
    const e = new AiCallError('boom', 'rate_limited')
    expect(e.code).toBe('rate_limited')
    expect(e.message).toBe('boom')
    expect(e).toBeInstanceOf(Error)
  })
})
