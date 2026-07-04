/**
 * Tra ảnh minh họa cho một từ vựng qua Wikipedia REST API (thumbnail trang tóm
 * tắt tiếng Anh) — thay cho LoremFlickr cũ (ảnh stock ngẫu nhiên theo keyword,
 * hay sai nghĩa). Ảnh Wikipedia gắn với đúng khái niệm của từ khi có, và với từ
 * trừu tượng/không có ảnh thì trả '' để component tự lùi về emoji minh họa.
 *
 * Cùng 1 từ luôn tra ra cùng 1 kết quả nhờ cache localStorage (kể cả kết quả
 * "không có ảnh" — tránh dò lại Wikipedia mỗi lần mở app cho các từ trừu tượng).
 * Lỗi mạng/timeout KHÔNG được cache (tạm thời, có thể mạng ổn lại ở lần sau).
 */
const CACHE_PREFIX = 'devleap:vocab-img:v1:'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 ngày
const TIMEOUT_MS = 3000

function cacheKey(term) {
  return CACHE_PREFIX + String(term).trim().toLowerCase()
}

function readCache(term) {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(term)))
    if (!raw || typeof raw.ts !== 'number') return undefined
    if (Date.now() - raw.ts > TTL_MS) return undefined
    return raw.url || ''
  } catch {
    return undefined
  }
}

function writeCache(term, url) {
  try {
    localStorage.setItem(cacheKey(term), JSON.stringify({ url: url || '', ts: Date.now() }))
  } catch {
    /* ignore */
  }
}

// Wikipedia viết hoa chữ đầu tên trang tóm tắt tiếng Anh; khoảng trắng nối bằng "_".
function wikiTitle(term) {
  const t = String(term).trim()
  if (!t) return ''
  return (t[0].toUpperCase() + t.slice(1)).replace(/\s+/g, '_')
}

/**
 * @param {string} term  từ tiếng Anh (vd "computer", "confidence")
 * @returns {Promise<string>} URL ảnh, hoặc '' nếu không có / lỗi / timeout ~3s.
 */
export async function fetchVocabImage(term) {
  if (!term) return ''
  const cached = readCache(term)
  if (cached !== undefined) return cached

  const title = wikiTitle(term)
  if (!title) return ''
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      writeCache(term, '')
      return ''
    }
    const data = await res.json()
    // Trang định hướng (nhiều nghĩa, vd "Stress") không có ảnh đáng tin -> coi như rỗng.
    const url = data?.type === 'disambiguation' ? '' : data?.thumbnail?.source || ''
    writeCache(term, url)
    return url
  } catch {
    return ''
  } finally {
    if (timer) clearTimeout(timer)
  }
}
