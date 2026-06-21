/**
 * Lõi gọi LLM cho chat luyện tiếng Anh — dùng chung cho Netlify Function
 * (production) và plugin Vite dev (xem vite.config.js). File bắt đầu bằng "_"
 * nên Netlify coi là module phụ trợ, KHÔNG deploy thành function riêng.
 *
 * Nhà cung cấp: Groq (API tương thích OpenAI), free tier rộng. API key luôn ở
 * phía server (env var / .env.local đọc trong Node), không lộ ra bundle client.
 */

// Model đổi được qua env GROQ_MODEL. Mặc định llama-3.3-70b: chất lượng tốt cho
// hội thoại; muốn nhanh/nhẹ hơn có thể dùng llama-3.1-8b-instant.
const MODEL = (typeof process !== 'undefined' && process.env?.GROQ_MODEL) || 'llama-3.3-70b-versatile'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

/** Dựng system prompt từ ngữ cảnh bài học để AI bám đúng chủ đề & từ vựng. */
export function buildSystemPrompt(context = {}) {
  const { title, week, weekTitle, vocab = [], grammar = [] } = context
  const vocabLine = vocab.length ? vocab.join(', ') : '(none specified)'
  const grammarLine = grammar.length ? grammar.join('; ') : '(general English)'
  const topic = title
    ? `Today's lesson topic: "${title}"${week ? ` (Week ${week}${weekTitle ? `: ${weekTitle}` : ''})` : ''}.`
    : ''

  return [
    'You are a friendly, patient English conversation tutor for a Vietnamese learner (around IELTS band 5–6.5).',
    topic,
    `Target vocabulary to practise: ${vocabLine}.`,
    `Grammar focus: ${grammarLine}.`,
    '',
    'Rules:',
    '- Always reply in English, simple and natural. Keep each reply short (2–4 sentences).',
    '- Naturally encourage the learner to use the target vocabulary.',
    '- Gently correct grammar/word mistakes: briefly show the corrected sentence, then keep chatting.',
    '- End every reply with ONE short follow-up question to keep the learner talking.',
    '- If the learner writes in Vietnamese, still reply in English; you may add a tiny Vietnamese hint in parentheses.',
    '- Stay on the lesson topic.',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Gửi lịch sử hội thoại tới Groq và trả về câu trả lời (string).
 * @param {{ key: string, system: string, messages: Array<{role:'user'|'assistant', text:string}> }} args
 */
export async function askLLM({ key, system, messages = [] }) {
  const chat = [
    { role: 'system', content: system },
    ...messages
      .filter((m) => m && m.text)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
  ]

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages: chat, temperature: 0.8, max_tokens: 400 }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 429)
      throw new Error('Đã chạm giới hạn tốc độ Groq (429). Đợi vài giây rồi thử lại.')
    if (res.status === 401)
      throw new Error('GROQ_API_KEY không hợp lệ. Kiểm tra lại key ở console.groq.com.')
    throw new Error(`Groq API ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content || ''
  if (!reply) throw new Error('Groq không trả về nội dung. Thử lại nhé.')
  return reply.trim()
}
