/**
 * Netlify Function (v2): proxy hội thoại AI luyện tiếng Anh.
 * Endpoint khi deploy: POST /.netlify/functions/chat
 *
 * Nhận { messages, context } từ client, gắn nội dung bài học vào system prompt,
 * gọi Gemini bằng GEMINI_API_KEY (env var trên Netlify — không lộ ra client),
 * trả về { reply }.
 */
import { runChat, errorResponse } from './_llm.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export default async (req) => {
  if (req.method !== 'POST')
    return json({ error: { code: 'bad_request', message: 'Method not allowed' } }, 405)

  try {
    const payload = await req.json()
    const key = process.env.GROQ_API_KEY
    if (!key) return json({ error: { code: 'config', message: 'Server chưa cấu hình GROQ_API_KEY.' } }, 500)

    const { reply } = await runChat(payload, key)
    return json({ reply })
  } catch (e) {
    const { status, body } = errorResponse(e)
    return json(body, status)
  }
}
