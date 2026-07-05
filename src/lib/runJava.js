/**
 * Gọi Netlify Function `run-java` để CHẠY THẬT code Java (Judge0 CE) — dùng
 * bởi `src/components/tools/CodePlayground.vue` thay cho mô phỏng bằng regex
 * trước đây (Bước 5.2, KE_HOACH_CAI_TIEN_WEBSITE.md).
 */

/** Lỗi gọi chạy code phía client — luôn có `.code` để friendlyRunError() phân loại. */
export class RunCodeCallError extends Error {
  constructor(message, code = 'upstream') {
    super(message)
    this.name = 'RunCodeCallError'
    this.code = code
  }
}

const ENDPOINT = '/.netlify/functions/run-java'

const FRIENDLY_BY_CODE = {
  rate_limited: 'Chạy code hơi nhanh, đợi khoảng 1 phút rồi thử lại nhé.',
  timeout: 'Chạy code quá lâu (giới hạn 10 giây) — kiểm tra vòng lặp vô hạn.',
  network: 'Không kết nối được máy chủ chạy code. Kiểm tra mạng rồi thử lại.',
  upstream: 'Máy chủ chạy code đang gặp sự cố, thử lại sau ít phút nhé.',
  bad_request: 'Chưa có code để chạy, hoặc code quá dài.',
}

/**
 * @param {string} code
 * @returns {Promise<{ ok: boolean, stage: 'compile'|'run', stdout: string, stderr: string }>}
 * @throws {RunCodeCallError}
 */
export async function runJavaCode(code) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch {
    throw new RunCodeCallError('Không kết nối được máy chủ chạy code.', 'network')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data.error
    const { code: c, message } =
      err && typeof err === 'object' ? err : { code: 'upstream', message: err || `Lỗi máy chủ (${res.status})` }
    throw new RunCodeCallError(message, c)
  }
  return data
}

/** @param {Error & { code?: string }} err */
export function friendlyRunError(err) {
  return FRIENDLY_BY_CODE[err?.code] || err?.message || 'Có lỗi xảy ra khi chạy code, thử lại nhé.'
}
