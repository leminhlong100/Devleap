/**
 * Tra phiên âm IPA cho từng từ tiếng Anh (dùng cho Shadowing — hiện IPA dưới câu
 * đang phát). Nguồn: dictionaryapi.dev (miễn phí, không cần key, hỗ trợ CORS).
 *
 * Phủ phần lớn từ thông dụng nhưng KHÔNG 100% — từ không tra được trả ''.
 * Cache 2 lớp để khỏi gọi lại: Map trong bộ nhớ + localStorage.
 */

const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const LS_PREFIX = 'ipa:'
const mem = new Map() // word -> ipa ('' = đã tra, không có)

/** Chuẩn hóa từ để tra: bỏ dấu câu/nháy hai đầu, lowercase. */
export function normalizeWord(word) {
  return String(word || '')
    .toLowerCase()
    .replace(/^[^a-z']+|[^a-z']+$/g, '') // bỏ ký tự không phải chữ ở hai đầu (giữ ' giữa từ)
    .trim()
}

function readCache(word) {
  if (mem.has(word)) return mem.get(word)
  try {
    const v = localStorage.getItem(LS_PREFIX + word)
    if (v !== null) {
      mem.set(word, v)
      return v
    }
  } catch {
    /* localStorage có thể bị chặn — bỏ qua */
  }
  return undefined
}

function writeCache(word, ipa) {
  mem.set(word, ipa)
  try {
    localStorage.setItem(LS_PREFIX + word, ipa)
  } catch {
    /* hết chỗ / bị chặn — bỏ qua */
  }
}

/** Lấy chuỗi IPA đầu tiên từ payload dictionaryapi.dev. */
function pickIpa(data) {
  if (!Array.isArray(data)) return ''
  for (const entry of data) {
    if (entry?.phonetic) return entry.phonetic
    for (const p of entry?.phonetics || []) {
      if (p?.text) return p.text
    }
  }
  return ''
}

/**
 * Tra IPA một từ. Trả '' nếu không có. Có cache nên gọi lại rất rẻ.
 * @returns {Promise<string>}
 */
export async function fetchWordIpa(rawWord) {
  const word = normalizeWord(rawWord)
  if (!word) return ''
  const cached = readCache(word)
  if (cached !== undefined) return cached
  try {
    const res = await fetch(API + encodeURIComponent(word))
    const ipa = res.ok ? pickIpa(await res.json()) : ''
    writeCache(word, ipa)
    return ipa
  } catch {
    return '' // lỗi mạng: không cache để lần sau thử lại
  }
}

/**
 * Tra IPA cho cả câu (mảng từ). Trả về mảng cùng độ dài: { word, ipa } theo đúng
 * thứ tự đầu vào. Dedupe để mỗi từ chỉ gọi mạng một lần.
 * @param {string[]} words
 * @returns {Promise<Array<{word:string, ipa:string}>>}
 */
export async function fetchSentenceIpa(words) {
  const list = Array.isArray(words) ? words : []
  const uniq = [...new Set(list.map(normalizeWord).filter(Boolean))]
  const map = new Map()
  await Promise.all(uniq.map(async (w) => map.set(w, await fetchWordIpa(w))))
  return list.map((w) => ({ word: w, ipa: map.get(normalizeWord(w)) || '' }))
}
