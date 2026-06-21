/**
 * Gọi backend chat AI (Netlify Function / dev proxy). Gửi lịch sử hội thoại +
 * ngữ cảnh bài học, nhận về câu trả lời của AI. API key nằm hoàn toàn ở server.
 */
const ENDPOINT = '/.netlify/functions/chat'

/**
 * @param {{ messages: Array<{role:'user'|'assistant', text:string}>, context?: object }} args
 * @returns {Promise<string>} câu trả lời của AI
 */
export async function sendChat({ messages, context }) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ AI. Kiểm tra mạng hoặc cấu hình API.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Lỗi máy chủ (${res.status})`)
  return data.reply
}
