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
const TIMEOUT_MS = 2500

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

async function fetchWithTimeout(url) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null
  try {
    return await fetch(url, { signal: controller?.signal, headers: { Accept: 'application/json' } })
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Tra thẳng theo tên trang trùng từ. Trả undefined nếu không xác định được (lỗi/timeout,
// KHÔNG cache), '' nếu xác định là không có ảnh đáng tin (404 / đa nghĩa / không thumbnail).
async function fetchByTitle(term) {
  const title = wikiTitle(term)
  if (!title) return ''
  try {
    const res = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    if (!res.ok) return ''
    const data = await res.json()
    // Trang định hướng (nhiều nghĩa, vd "Stress") không có ảnh đáng tin -> coi như rỗng.
    return data?.type === 'disambiguation' ? '' : data?.thumbnail?.source || ''
  } catch {
    return undefined
  }
}

// Từ trừu tượng thường không trùng tên trang (vd "confidence" -> trang không có
// ảnh, "balance"/"stress" -> trang đa nghĩa). Dự phòng: tìm vài trang liên quan
// gần nhất qua Wikipedia search, lấy trang đầu tiên không đa nghĩa và có ảnh.
async function fetchBySearch(term) {
  try {
    const url =
      'https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query' +
      '&generator=search&gsrlimit=3&gsrsearch=' + encodeURIComponent(term) +
      '&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=400&ppprop=disambiguation'
    const res = await fetchWithTimeout(url)
    if (!res.ok) return ''
    const data = await res.json()
    const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0))
    const hit = pages.find((p) => !p.pageprops?.disambiguation && p.thumbnail?.source)
    return hit?.thumbnail?.source || ''
  } catch {
    return undefined
  }
}

/**
 * @param {string} term  từ tiếng Anh (vd "computer", "confidence")
 * @returns {Promise<string>} URL ảnh, hoặc '' nếu không có / lỗi / timeout.
 */
export async function fetchVocabImage(term) {
  if (!term) return ''
  const cached = readCache(term)
  if (cached !== undefined) return cached

  let url = await fetchByTitle(term)
  if (!url) {
    const fallback = await fetchBySearch(term)
    if (fallback !== undefined) url = fallback
    else if (url === undefined) return '' // cả 2 lượt đều lỗi/timeout -> không cache, thử lại lần sau
  }
  if (url === undefined) url = ''
  writeCache(term, url)
  return url
}
