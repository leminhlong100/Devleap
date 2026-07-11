/**
 * "Nhịp câu" (sentence stress) cho bài Shadowing chấm nhịp (kế hoạch "Nói Tự
 * Tin", Đợt A #3). Tiếng Anh nói theo NHỊP TRỌNG ÂM: từ mang nghĩa (danh/động/
 * tính/trạng từ) được NHẤN thành "nhịp", từ chức năng (mạo từ, giới từ, đại từ,
 * trợ động từ…) bị nuốt/rút gọn. Người Việt hay đọc đều tăm tắp -> nghe "máy" và
 * khó hiểu. Mô hình mẫu ở đây đánh dấu đâu là nhịp nhấn để người học bắt chước.
 *
 * Thuần văn bản (không audio) nên test được và làm "mẫu" cho tự-chấm; không dùng
 * LLM (Groq text-only, không nghe được trọng âm).
 */

// Từ chức năng phổ biến — thường KHÔNG nhấn trong câu nói tự nhiên. Không cần
// tuyệt đối đầy đủ: mục tiêu là gợi đúng ~80% nhịp để người học cảm được tiết tấu.
const FUNCTION_WORDS = new Set([
  // mạo từ & lượng từ
  'a', 'an', 'the', 'some', 'any',
  // đại từ
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
  // trợ động từ & to be / have (khi làm trợ)
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  // giới từ & liên từ
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as', 'into', 'onto',
  'and', 'or', 'but', 'so', 'if', 'than', 'then',
  // linh tinh chức năng
  'not', "n't", 'there', "'s", "'re", "'ll", "'ve", "'d", "'m",
])

/** Chuẩn hóa 1 từ để tra function-word (thường hóa, bỏ dấu câu ngoài rìa). */
function norm(w) {
  return String(w).toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '')
}

/**
 * Đánh dấu nhịp cho một câu. WH-word (what/where/how…) và từ phủ định VẪN được
 * nhấn (mang nghĩa/nhấn mạnh), nên loại khỏi "nuốt". Từ ≤ 2 ký tự và thuộc danh
 * sách chức năng -> không nhấn.
 *
 * @param {string} sentence
 * @returns {{words: Array<{word:string, stressed:boolean}>, beats:number}}
 */
export function beatPattern(sentence) {
  const raw = String(sentence || '').trim()
  if (!raw) return { words: [], beats: 0 }
  const tokens = raw.split(/\s+/)
  const words = tokens.map((tok) => {
    const n = norm(tok)
    // Từ có nghĩa hỏi (WH) vẫn nhấn — chúng là "nội dung" của câu hỏi.
    const isWh = /^(what|where|when|why|who|whom|whose|which|how)$/.test(n)
    const stressed = !!n && (isWh || !FUNCTION_WORDS.has(n))
    return { word: tok, stressed }
  })
  // Bảo hiểm: câu toàn từ chức năng (hiếm) -> nhấn từ dài nhất để vẫn có ≥1 nhịp.
  if (!words.some((w) => w.stressed) && words.length) {
    let idx = 0
    for (let i = 1; i < words.length; i++) if (norm(words[i].word).length > norm(words[idx].word).length) idx = i
    words[idx].stressed = true
  }
  return { words, beats: words.filter((w) => w.stressed).length }
}

/** Số nhịp nhấn của một câu (tiện dụng cho hiển thị "câu này có N nhịp"). */
export function beatCount(sentence) {
  return beatPattern(sentence).beats
}
