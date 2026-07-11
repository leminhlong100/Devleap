import { sendChat } from './aiChat.js'

/**
 * Client wrapper cho khóa "Java Phỏng Vấn Cấp Tốc" — gọi backend chat AI qua
 * `sendChat` với 2 mode riêng (xem netlify/functions/_llm.js):
 *   - 'interview'       : mỗi lượt vừa chấm câu vừa hỏi câu kế -> { evaluation, next }.
 *   - 'interviewReport' : tổng kết cả buổi -> { overall, verdict, byTopic, ... }.
 * API key nằm hoàn toàn ở server.
 */

/**
 * Một lượt phỏng vấn: chấm câu trả lời gần nhất + hỏi câu kế.
 * @param {{ messages: Array<{role,text}>, context: object }} args
 *   context: { lang:'vi'|'en', topics:string[], level, count, askedCount, bankQuestion? }
 * @returns {Promise<{ evaluation: object|null, next: object|null }>}
 */
export async function interviewTurn({ messages, context }) {
  const reply = await sendChat({ messages, context, mode: 'interview' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}

/**
 * Tổng kết cả buổi phỏng vấn từ transcript.
 * @param {{ messages: Array<{role,text}>, context: object }} args
 * @returns {Promise<object>} { overall, verdict, byTopic[], strengths[], gaps[], advice[], summary }
 */
export async function interviewReport({ messages, context }) {
  const reply = await sendChat({ messages, context, mode: 'interviewReport' })
  if (!reply || typeof reply !== 'object') throw new Error('AI trả về định dạng không hợp lệ.')
  return reply
}
