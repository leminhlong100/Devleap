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

/**
 * Dịch một đoạn tiếng Anh sang tiếng Việt (dùng chung endpoint chat, chế độ
 * 'translate' để AI chỉ trả về bản dịch). Dùng khi lưu cả câu để học flashcard.
 * @param {string} text
 * @returns {Promise<string>} bản dịch tiếng Việt
 */
export async function translateToVi(text) {
  const reply = await sendChat({
    messages: [{ role: 'user', text: String(text || '').trim() }],
    context: { mode: 'translate' },
  })
  // Bỏ ngoặc kép bao quanh nếu model lỡ thêm vào.
  return String(reply || '').trim().replace(/^["“”']+|["“”']+$/g, '')
}
