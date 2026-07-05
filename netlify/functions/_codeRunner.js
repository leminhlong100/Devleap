/**
 * Lõi CHẠY THẬT code Java — dùng chung cho Netlify Function `run-java.js`
 * (production) và dev proxy (xem vite.config.js). File bắt đầu bằng "_" nên
 * Netlify coi là module phụ trợ, KHÔNG deploy thành function riêng.
 *
 * Kế hoạch gốc (Bước 5.2, KE_HOACH_CAI_TIEN_WEBSITE.md) định dùng Piston API
 * (free, không cần key) — nhưng gọi thử thật lúc thực hiện bước này thì Piston
 * public API đã chuyển sang whitelist-only từ 2/2026 (trả thẳng lỗi "Public
 * Piston API is now whitelist only as of 2/15/2026"). Đã thử thêm Wandbox
 * (cũng free/không key) nhưng API đó LUÔN lưu file chính thành "prog.java" bất
 * kể tên class — sẽ phải regex-rewrite tên class public trong code người học
 * gõ, rủi ro vỡ code hợp lệ (vd code tạo `new Main()`). Chọn thay bằng
 * **Judge0 CE demo API** (`https://ce.judge0.com`) — cũng miễn phí, không cần
 * key, và xử lý đúng tên class Java bất kỳ (đã xác nhận bằng gọi thật: biên
 * dịch/chạy `public class Main`, lỗi biên dịch, lỗi runtime (chia 0), timeout
 * vòng lặp vô hạn đều trả đúng cấu trúc mong đợi).
 */

// base64_encoded=true: bắt buộc — đã xác nhận bằng gọi thật, `base64_encoded=false`
// từ chối thẳng (HTTP 400) mọi source chứa ký tự ngoài ASCII (code mẫu của khoá học
// có tiếng Việt/emoji, vd "Xin chào devleap! 🐱" trong data/tools.js#defaultCode).
const JUDGE0_ENDPOINT = 'https://ce.judge0.com/submissions?base64_encoded=true&wait=true'
const JAVA_LANGUAGE_ID = 91 // Java (JDK 17.0.6)
const CPU_TIME_LIMIT_S = 10 // đúng yêu cầu kế hoạch "timeout 10s"
const REQUEST_TIMEOUT_MS = 20000 // dư margin cho trần Netlify Function ~26s

/** Lỗi chạy code có `code` để client/hàm gọi phân loại (rate_limited/timeout/upstream/...). */
export class RunCodeError extends Error {
  constructor(message, code = 'upstream') {
    super(message)
    this.name = 'RunCodeError'
    this.code = code
  }
}

/** Dựng { status, body } chuẩn hoá từ lỗi để trả về client — cùng khuôn với _llm.js#errorResponse. */
export function errorResponse(e) {
  const code = e?.code || 'upstream'
  const status = code === 'rate_limited' ? 429 : code === 'timeout' ? 504 : code === 'bad_request' ? 400 : 502
  return { status, body: { error: { code, message: e?.message || 'Lỗi không xác định' } } }
}

// Giới hạn tần suất best-effort: mỗi INSTANCE function (còn "ấm") chỉ cho tối
// đa MAX_PER_WINDOW lượt chạy / IP trong WINDOW_MS. Netlify Function là
// serverless (instance có thể bị khởi tạo lại bất kỳ lúc nào) nên đây KHÔNG
// phải giới hạn tuyệt đối — chỉ chặn được việc bấm dồn dập trong lúc instance
// còn ấm, nhưng Judge0 CE demo là dịch vụ công khai DÙNG CHUNG cho mọi người
// nên vẫn đáng có để giảm rủi ro 1 người dùng làm cạn hạn ngạch chung.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 6
const hits = new Map() // ip -> mảng timestamp các lần gọi gần đây

function checkRateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    throw new RunCodeError('Chạy code hơi nhanh, đợi khoảng 1 phút rồi thử lại nhé.', 'rate_limited')
  }
  recent.push(now)
  hits.set(key, recent)
}

/** Judge0 trả field null khi rỗng — base64 decode an toàn cả với null. */
function b64decode(s) {
  return s ? Buffer.from(s, 'base64').toString('utf8') : ''
}

// https://ce.judge0.com/ -- id trạng thái khi KHÔNG phải "Accepted"/"Compilation Error"/
// "Time Limit Exceeded" (đã xử lý riêng bên dưới) — chủ yếu lỗi runtime tín hiệu OS.
const STATUS_MESSAGE = {
  4: 'Sai kết quả mong đợi.',
  7: 'Chương trình bị dừng đột ngột (lỗi bộ nhớ - SIGSEGV).',
  8: 'Chương trình bị dừng đột ngột (SIGXFSZ).',
  9: 'Chương trình bị dừng đột ngột (lỗi phép tính - SIGFPE).',
  10: 'Chương trình bị dừng đột ngột (SIGABRT).',
  12: 'Chương trình bị dừng đột ngột.',
  13: 'Lỗi nội bộ máy chủ chấm bài, thử lại sau nhé.',
  14: 'Định dạng thực thi không hợp lệ.',
}

/**
 * Biên dịch + chạy 1 file Java qua Judge0 CE. Trả về kết quả đã phân loại —
 * KHÔNG ném lỗi cho các trường hợp "chạy được nhưng có lỗi trong code người
 * học" (biên dịch lỗi/exception/timeout) — những trường hợp đó là dữ liệu bình
 * thường để hiển thị cho người học, không phải lỗi hạ tầng.
 * @param {{ code: string, ip?: string }} args
 * @returns {Promise<{ ok: boolean, stage: 'compile'|'run', stdout: string, stderr: string }>}
 */
export async function runJavaCode({ code, ip } = {}) {
  const source = String(code || '')
  if (!source.trim()) throw new RunCodeError('Chưa có code để chạy.', 'bad_request')
  if (source.length > 20000) throw new RunCodeError('Code quá dài (giới hạn 20.000 ký tự).', 'bad_request')

  checkRateLimit(ip)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(JUDGE0_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: Buffer.from(source, 'utf8').toString('base64'),
        language_id: JAVA_LANGUAGE_ID,
        cpu_time_limit: CPU_TIME_LIMIT_S,
      }),
      signal: controller.signal,
    })
  } catch (e) {
    throw e?.name === 'AbortError'
      ? new RunCodeError('Chạy code quá lâu, thử lại nhé.', 'timeout')
      : new RunCodeError('Không kết nối được máy chủ chạy code.', 'network')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 429)
    throw new RunCodeError('Máy chủ chạy code công khai đang quá tải. Đợi vài phút rồi thử lại.', 'rate_limited')
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new RunCodeError(`Máy chủ chạy code lỗi (${res.status}). ${detail.slice(0, 200)}`, 'upstream')
  }

  const data = await res.json().catch(() => null)
  if (!data || !data.status) throw new RunCodeError('Phản hồi không hợp lệ từ máy chủ chạy code.', 'upstream')

  const statusId = data.status.id
  const stdout = b64decode(data.stdout)
  const stderr = b64decode(data.stderr)
  if (statusId === 6) {
    return { ok: false, stage: 'compile', stdout: '', stderr: b64decode(data.compile_output) || 'Lỗi biên dịch.' }
  }
  if (statusId === 5) {
    return {
      ok: false,
      stage: 'run',
      stdout,
      stderr: 'Chương trình chạy quá 10 giây (timeout) — kiểm tra vòng lặp vô hạn.',
    }
  }
  if (statusId === 3) {
    return { ok: true, stage: 'run', stdout, stderr }
  }
  // Các trạng thái lỗi runtime còn lại (NZEC/SIGSEGV/...).
  return {
    ok: false,
    stage: 'run',
    stdout,
    stderr: stderr || STATUS_MESSAGE[statusId] || data.message || data.status.description || 'Chương trình chạy lỗi.',
  }
}
