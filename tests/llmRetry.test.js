import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// groqRequest() (netlify/functions/_llm.js) là lõi retry/backoff/timeout dùng
// chung cho chat + polish shadowing (Bước 1.4 KE_HOACH_CAI_TIEN_WEBSITE.md).
// Mock `fetch` toàn cục + fake timers để không phải chờ backoff thật.
describe('netlify/functions/_llm.js — groqRequest retry/backoff + errorResponse', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function res(status, body, headers = {}) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (k) => headers[k.toLowerCase()] ?? null },
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }
  }
  const okBody = (text) => ({ choices: [{ message: { content: text } }] })

  it('thành công ngay lần đầu -> trả nội dung đã trim, chỉ gọi fetch 1 lần', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, okBody('  Hello  ')))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    await expect(groqRequest({ messages: [] }, 'key')).resolves.toBe('Hello')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('429 lần đầu (có Retry-After) rồi thành công -> retry đúng 1 lần', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(429, {}, { 'retry-after': '1' }))
      .mockResolvedValueOnce(res(200, okBody('ok')))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    const p = groqRequest({ messages: [] }, 'key')
    const assertion = expect(p).resolves.toBe('ok')
    await vi.advanceTimersByTimeAsync(1500)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('429 liên tục -> chỉ retry đúng 1 lần (2 lần gọi fetch) rồi ném AiError code rate_limited', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(res(429, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    const p = groqRequest({ messages: [] }, 'key')
    const assertion = expect(p).rejects.toMatchObject({ code: 'rate_limited' })
    await vi.advanceTimersByTimeAsync(5000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('401 -> không retry, ném ngay AiError code config', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(401, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    await expect(groqRequest({ messages: [] }, 'key')).rejects.toMatchObject({ code: 'config' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('400 -> không retry, ném AiError code bad_request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(400, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    await expect(groqRequest({ messages: [] }, 'key')).rejects.toMatchObject({ code: 'bad_request' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lỗi mạng (fetch reject) lần đầu rồi thành công -> retry, code network nếu vẫn lỗi', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    const p = groqRequest({ messages: [] }, 'key')
    const assertion = expect(p).rejects.toMatchObject({ code: 'network' })
    await vi.advanceTimersByTimeAsync(3000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('5xx liên tục -> retry 1 lần rồi ném code upstream', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(res(503, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    const p = groqRequest({ messages: [] }, 'key')
    const assertion = expect(p).rejects.toMatchObject({ code: 'upstream' })
    await vi.advanceTimersByTimeAsync(5000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('timeout (không phản hồi trong 18s) -> abort, retry 1 lần rồi ném code timeout', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
      (_url, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            const e = new Error('aborted')
            e.name = 'AbortError'
            reject(e)
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { groqRequest } = await import('../netlify/functions/_llm.js')
    const p = groqRequest({ messages: [] }, 'key')
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(45000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('errorResponse() ánh xạ code -> HTTP status chuẩn', async () => {
    const { errorResponse, AiError } = await import('../netlify/functions/_llm.js')
    expect(errorResponse(new AiError('a', 'rate_limited')).status).toBe(429)
    expect(errorResponse(new AiError('a', 'timeout')).status).toBe(504)
    expect(errorResponse(new AiError('a', 'bad_request')).status).toBe(400)
    expect(errorResponse(new AiError('a', 'config')).status).toBe(500)
    expect(errorResponse(new AiError('a', 'upstream')).status).toBe(502)
    expect(errorResponse(new Error('plain'))).toEqual({ status: 502, body: { error: { code: 'upstream', message: 'plain' } } })
  })
})
