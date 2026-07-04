/**
 * Chuẩn hoá lỗi khi gọi AI (Groq qua netlify/functions) thành 1 thông điệp thân
 * thiện tiếng Việt, dùng chung cho mọi màn có gọi AI (chat, chữa viết, sentence
 * bank, dán URL shadowing…) thay vì mỗi nơi tự viết câu fallback riêng.
 * `code` khớp với các mã `netlify/functions/_llm.js#errorResponse` trả về.
 */

/** Lỗi gọi AI phía client — luôn có `.code` để friendlyAiError() phân loại. */
export class AiCallError extends Error {
  constructor(message, code = 'upstream') {
    super(message)
    this.name = 'AiCallError'
    this.code = code
  }
}

const FRIENDLY_BY_CODE = {
  rate_limited: 'AI đang bận (quá tải), đợi khoảng 30 giây rồi bấm "Thử lại" nhé.',
  timeout: 'AI phản hồi hơi lâu, có thể do mạng chậm. Bấm "Thử lại" nhé.',
  network: 'Không kết nối được máy chủ AI. Kiểm tra mạng rồi bấm "Thử lại".',
  upstream: 'AI đang gặp sự cố, thử lại sau ít phút nhé.',
  config: 'Máy chủ AI chưa được cấu hình đúng. Báo cho quản trị viên nhé.',
  bad_request: 'Yêu cầu không hợp lệ. Thử lại nhé.',
}

/**
 * @param {Error & { code?: string }} err  lỗi ném từ sendChat()/aiChat.js (có `.code`)
 *   hoặc lỗi thường (Error) — khi đó dùng nguyên `err.message`.
 * @returns {{ message: string, retryable: boolean }}
 */
export function friendlyAiError(err) {
  const code = err?.code
  const message = FRIENDLY_BY_CODE[code] || err?.message || 'Có lỗi xảy ra, thử lại nhé.'
  const retryable = code !== 'config'
  return { message, retryable }
}
