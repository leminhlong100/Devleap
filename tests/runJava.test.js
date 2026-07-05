import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RunCodeCallError } from '@/lib/runJava'

// runJavaCode() (src/lib/runJava.js) là nơi client gọi /.netlify/functions/run-java
// và parse lỗi dạng { error: { code, message } } — cùng khuôn với aiChat.js/sendChat()
// (tests/aiChatError.test.js). Dùng bởi CodePlayground.vue (Bước 5.2).
describe('runJava.js — runJavaCode() + friendlyRunError()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(status, body) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) })),
    )
  }

  it('thành công -> trả nguyên object { ok, stage, stdout, stderr }', async () => {
    stubFetch(200, { ok: true, stage: 'run', stdout: 'hi\n', stderr: '' })
    const { runJavaCode } = await import('@/lib/runJava')
    await expect(runJavaCode('code')).resolves.toEqual({ ok: true, stage: 'run', stdout: 'hi\n', stderr: '' })
  })

  it('lỗi { error: { code, message } } -> RunCodeCallError giữ đúng code + message', async () => {
    stubFetch(429, { error: { code: 'rate_limited', message: 'Đợi rồi thử lại.' } })
    const { runJavaCode } = await import('@/lib/runJava')
    await expect(runJavaCode('code')).rejects.toMatchObject({ code: 'rate_limited', message: 'Đợi rồi thử lại.' })
  })

  it('fetch ném lỗi mạng -> RunCodeCallError code network', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    const { runJavaCode } = await import('@/lib/runJava')
    const err = await runJavaCode('code').catch((e) => e)
    expect(err).toBeInstanceOf(RunCodeCallError)
    expect(err.code).toBe('network')
  })

  it('lỗi HTTP không có body { error } -> code mặc định upstream', async () => {
    stubFetch(500, {})
    const { runJavaCode } = await import('@/lib/runJava')
    await expect(runJavaCode('code')).rejects.toMatchObject({ code: 'upstream' })
  })

  it('friendlyRunError() trả câu tiếng Việt theo code, fallback message gốc nếu code lạ', async () => {
    const { friendlyRunError } = await import('@/lib/runJava')
    expect(friendlyRunError({ code: 'timeout' })).toMatch(/quá lâu/)
    expect(friendlyRunError({ code: 'bad_request' })).toMatch(/Chưa có code/)
    expect(friendlyRunError({ code: 'unknown_code', message: 'msg lạ' })).toBe('msg lạ')
    expect(friendlyRunError({})).toMatch(/Có lỗi xảy ra/)
  })
})
