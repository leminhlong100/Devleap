import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// runJavaCode() (netlify/functions/_codeRunner.js) là lõi chạy thật code Java
// qua Judge0 CE (Bước 5.2 KE_HOACH_CAI_TIEN_WEBSITE.md). Mock `fetch` toàn cục
// + fake timers để không phải gọi mạng thật.
describe('netlify/functions/_codeRunner.js — runJavaCode + errorResponse', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function res(status, body) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }
  }

  // Judge0 CE trả stdout/stderr/compile_output dạng base64 (dùng base64_encoded=true
  // để tránh lỗi HTTP 400 với source chứa ký tự ngoài ASCII — đã xác nhận bằng gọi thật).
  const b64 = (s) => (s == null ? s : Buffer.from(s, 'utf8').toString('base64'))

  it('code trống -> ném RunCodeError code bad_request, không gọi mạng', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: '   ' })).rejects.toMatchObject({ code: 'bad_request' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('code quá dài (>20000 ký tự) -> bad_request, không gọi mạng', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'x'.repeat(20001) })).rejects.toMatchObject({ code: 'bad_request' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Accepted (status id 3) -> ok:true, stage run, trả đúng stdout/stderr', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      res(200, { stdout: b64('hi\n'), stderr: b64(''), status: { id: 3, description: 'Accepted' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'public class Main {}', ip: 'a1' })).resolves.toEqual({
      ok: true,
      stage: 'run',
      stdout: 'hi\n',
      stderr: '',
    })
  })

  it('Compilation Error (status id 6) -> ok:false, stage compile, dùng compile_output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      res(200, { compile_output: b64('error: x'), status: { id: 6, description: 'Compilation Error' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'broken', ip: 'a2' })).resolves.toEqual({
      ok: false,
      stage: 'compile',
      stdout: '',
      stderr: 'error: x',
    })
  })

  it('Time Limit Exceeded (status id 5) -> ok:false, stage run, thông điệp timeout', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { stdout: b64(''), status: { id: 5, description: 'Time Limit Exceeded' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    const out = await runJavaCode({ code: 'while(true){}', ip: 'a3' })
    expect(out.ok).toBe(false)
    expect(out.stage).toBe('run')
    expect(out.stderr).toMatch(/quá 10 giây/)
  })

  it('Runtime Error NZEC (status id 11) -> ok:false, dùng stderr thật của chương trình', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      res(200, { stdout: b64(''), stderr: b64('Exception in thread "main"...'), status: { id: 11, description: 'Runtime Error (NZEC)' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    const out = await runJavaCode({ code: 'int x = 1/0;', ip: 'a4' })
    expect(out.ok).toBe(false)
    expect(out.stderr).toBe('Exception in thread "main"...')
  })

  it('Runtime error không có stderr -> rơi về thông điệp mặc định theo statusId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { status: { id: 9, description: 'SIGFPE' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    const out = await runJavaCode({ code: 'x', ip: 'a5' })
    expect(out.stderr).toMatch(/SIGFPE|phép tính/)
  })

  it('HTTP 429 từ Judge0 -> RunCodeError code rate_limited', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(429, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'x', ip: 'a6' })).rejects.toMatchObject({ code: 'rate_limited' })
  })

  it('HTTP 5xx từ Judge0 -> RunCodeError code upstream', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(503, {}))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'x', ip: 'a7' })).rejects.toMatchObject({ code: 'upstream' })
  })

  it('lỗi mạng (fetch reject) -> RunCodeError code network', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('down'))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'x', ip: 'a8' })).rejects.toMatchObject({ code: 'network' })
  })

  it('timeout (không phản hồi trong 20s) -> abort, RunCodeError code timeout', async () => {
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
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    const p = runJavaCode({ code: 'x', ip: 'a9' })
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(21000)
    await assertion
  })

  it('phản hồi JSON không có status -> RunCodeError code upstream', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { stdout: 'oops' }))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    await expect(runJavaCode({ code: 'x', ip: 'a10' })).rejects.toMatchObject({ code: 'upstream' })
  })

  it('giới hạn tần suất: quá MAX_PER_WINDOW lượt/IP trong 60s -> rate_limited, không gọi thêm mạng', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { stdout: b64('ok'), status: { id: 3 } }))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    const ip = 'same-ip'
    for (let i = 0; i < 6; i++) {
      await expect(runJavaCode({ code: 'x', ip })).resolves.toMatchObject({ ok: true })
    }
    await expect(runJavaCode({ code: 'x', ip })).rejects.toMatchObject({ code: 'rate_limited' })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('giới hạn tần suất tính riêng theo IP -> IP khác không bị chặn', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { stdout: b64('ok'), status: { id: 3 } }))
    vi.stubGlobal('fetch', fetchMock)
    const { runJavaCode } = await import('../netlify/functions/_codeRunner.js')
    for (let i = 0; i < 6; i++) await runJavaCode({ code: 'x', ip: 'ip-a' })
    await expect(runJavaCode({ code: 'x', ip: 'ip-b' })).resolves.toMatchObject({ ok: true })
  })

  it('errorResponse() ánh xạ code -> HTTP status chuẩn', async () => {
    const { errorResponse, RunCodeError } = await import('../netlify/functions/_codeRunner.js')
    expect(errorResponse(new RunCodeError('a', 'rate_limited')).status).toBe(429)
    expect(errorResponse(new RunCodeError('a', 'timeout')).status).toBe(504)
    expect(errorResponse(new RunCodeError('a', 'bad_request')).status).toBe(400)
    expect(errorResponse(new RunCodeError('a', 'upstream')).status).toBe(502)
    expect(errorResponse(new Error('plain'))).toEqual({ status: 502, body: { error: { code: 'upstream', message: 'plain' } } })
  })
})
