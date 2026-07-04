/**
 * Lõi đánh bóng phụ đề cho Shadowing — dùng chung cho Netlify Function
 * (netlify/functions/shadowing.js, chạy lúc người dùng dán URL) và script build
 * (scripts/curate-shadowing.mjs). Tên bắt đầu "_" nên Netlify coi là module phụ
 * trợ, KHÔNG deploy thành function riêng (giống _llm.js).
 *
 * GROQ_API_KEY luôn ở phía server — không lộ ra bundle client.
 */
import { tidyText } from '../../src/lib/shadowingSegment.js'
import { AiError, groqRequest } from './_llm.js'

/**
 * Nhờ AI thêm dấu câu / viết hoa / sửa lỗi chính tả nhận dạng cho TỪNG đoạn,
 * giữ NGUYÊN số đoạn & thứ tự để timestamp không lệch. Trả về mảng văn bản mới
 * (cùng độ dài). Ném lỗi nếu không dùng được (caller tự quyết fallback — xem
 * shadowing.js, vốn rơi về bản "heuristic" khi hàm này thất bại kể cả sau retry).
 *
 * @param {string[]} texts  các đoạn phụ đề đã gom (lowercase, ít/không dấu câu)
 * @param {string}   key    GROQ_API_KEY
 * @returns {Promise<string[]>}
 */
export async function polishSegments(texts, key) {
  const system = [
    'You clean up auto-generated English captions for a language-learning shadowing app.',
    'Input is a JSON object {"segments": string[]} — lowercase, no punctuation, possible misspellings.',
    'Return ONLY a JSON object {"segments": string[]} with the SAME number of items in the SAME order.',
    'For each segment: add proper capitalization and sentence punctuation, fix obvious speech-recognition spelling errors.',
    'Keep the original wording and meaning. Do NOT merge, split, add, or remove segments.',
  ].join('\n')
  const raw = await groqRequest(
    {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ segments: texts }) },
      ],
      temperature: 0.2,
      maxTokens: 6000,
      json: true,
    },
    key,
  )
  const out = JSON.parse(raw || '{}')?.segments
  if (!Array.isArray(out) || out.length !== texts.length) throw new AiError('số đoạn trả về không khớp', 'upstream')
  // Vẫn chạy tidyText để chắc chắn "I" hoa & khoảng trắng gọn.
  return out.map((t) => tidyText(t))
}
