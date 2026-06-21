/**
 * Sinh URL ảnh minh họa cho một từ vựng (giúp nhớ lâu nhờ hình ảnh).
 *
 * Dùng LoremFlickr — dịch vụ ảnh stock theo từ khóa, KHÔNG cần API key, hợp với
 * deploy tĩnh (Netlify). Mỗi từ "khóa" vào một ảnh cố định (tham số `lock` = băm
 * của từ) để lần học nào cũng thấy đúng một ảnh — ảnh ổn định làm điểm neo trí nhớ.
 *
 * Nếu ảnh không tải được (offline / dịch vụ lỗi), component tự lùi về emoji minh họa.
 */

// Băm chuỗi đơn giản, ổn định (không phụ thuộc Math.random) -> chọn ảnh cố định.
function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * @param {string} term  từ tiếng Anh (vd "computer", "stress")
 * @param {number} size  cạnh ảnh vuông (px)
 * @returns {string} URL ảnh, hoặc '' nếu không có từ
 */
export function vocabImageUrl(term, size = 400) {
  if (!term) return ''
  const t = String(term).trim().toLowerCase()
  // Chỉ giữ chữ cái + khoảng trắng, rồi nối nhiều từ bằng dấu phẩy (cú pháp keyword của LoremFlickr).
  const keywords = t
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(',')
  if (!keywords) return ''
  const lock = (hashCode(t) % 99999) + 1
  return `https://loremflickr.com/${size}/${size}/${encodeURIComponent(keywords)}?lock=${lock}`
}
