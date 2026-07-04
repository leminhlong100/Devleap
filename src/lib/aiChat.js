import { AiCallError } from './aiError.js'

/**
 * Gọi backend chat AI (Netlify Function / dev proxy). Gửi lịch sử hội thoại +
 * ngữ cảnh bài học, nhận về câu trả lời của AI. API key nằm hoàn toàn ở server.
 */
const ENDPOINT = '/.netlify/functions/chat'

/**
 * Gọi backend chat. Tùy `mode`:
 *  - mặc định/'coach': trả về OBJECT có cấu trúc { evaluation, next }.
 *  - 'translate' | 'hint' | 'idea' | 'word': trả về string.
 * @param {{ messages?: Array<{role,text}>, context?: object, persona?: string, mode?: string }} args
 * @throws {AiCallError} luôn có `.code` (xem netlify/functions/_llm.js#errorResponse)
 *   để `friendlyAiError()` (src/lib/aiError.js) phân loại thông điệp hiển thị.
 */
export async function sendChat({ messages = [], context = {}, persona, mode }) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, persona, mode }),
    })
  } catch {
    throw new AiCallError('Không kết nối được máy chủ AI. Kiểm tra mạng hoặc cấu hình API.', 'network')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Format mới: { error: { code, message } }. Vẫn đỡ được format cũ (string) phòng lệch bản.
    const err = data.error
    const { code, message } =
      err && typeof err === 'object' ? err : { code: 'upstream', message: err || `Lỗi máy chủ (${res.status})` }
    throw new AiCallError(message, code)
  }
  return data.reply
}

/**
 * Một lượt COACH: vừa chấm câu vừa nói tiếp. Trả về { evaluation, next }.
 * @param {{ messages, context, persona }} args
 */
export async function coachTurn({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'coach' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * Một lượt SURPRISE ROLEPLAY: AI đóng vai tình huống bất ngờ (context.scenario),
 * chủ động đổi đề tài giữa chừng, vẫn vừa chấm câu vừa nói tiếp như coachTurn.
 * @param {{ messages, context, persona }} args  context nên có thêm `scenario`.
 */
export async function roleplayTurn({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'roleplay' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * Chấm LẠI câu cuối theo một persona khác (đổi phong cách lời phê tại chỗ).
 * @param {{ messages, context, persona }} args  messages kết thúc ở lượt user cần chấm.
 * @returns {Promise<object>} evaluation { corrected, cefr, feedback, recommended, recommendedVi }
 */
export async function reFeedback({ messages, context, persona }) {
  const reply = await sendChat({ messages, context, persona, mode: 'feedback' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply.evaluation || null
}

/**
 * Nhờ AI CHỮA bài tập viết (1 lần gọi, không cần lịch sử). Trả về review:
 * { cefr, score, summary, lines: [{ original, corrected, ok, note }] }.
 * @param {string} text  toàn bộ bài viết của người học (mỗi câu một dòng).
 * @param {object} context  ngữ cảnh bài học (title, week, vocab, grammar…).
 */
export async function correctWriting(text, context = {}) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(text || '').trim() }],
    context,
    mode: 'correct',
  })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply.review || null
}

/** Gợi ý CÁCH trả lời (tiếng Việt) cho một câu hỏi của AI. */
export async function getHint(question, context = {}) {
  return sendChat({ messages: [{ role: 'user', text: String(question || '') }], context, mode: 'hint' })
}

/** Một câu trả lời mẫu (tiếng Anh) khi người học bí ý tưởng. */
export async function getIdea(question, context = {}) {
  return sendChat({ messages: [{ role: 'user', text: String(question || '') }], context, mode: 'idea' })
}

/** Dịch nhanh một từ/cụm sang tiếng Việt (mặt sau flashcard / tra tại chỗ). */
export async function translateWord(word) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(word || '').trim() }],
    mode: 'word',
  })
  return String(reply || '').trim().replace(/^["“”']+|["“”']+$/g, '')
}

/**
 * Dịch một đoạn tiếng Anh sang tiếng Việt (chế độ 'translate'). Dùng khi lưu cả
 * câu để học flashcard, hoặc bấm "Dịch câu hỏi?".
 * @param {string} text
 * @returns {Promise<string>} bản dịch tiếng Việt
 */
export async function translateToVi(text) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(text || '').trim() }],
    mode: 'translate',
  })
  // Bỏ ngoặc kép bao quanh nếu model lỡ thêm vào.
  return String(reply || '').trim().replace(/^["“”']+|["“”']+$/g, '')
}
