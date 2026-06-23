/**
 * Tách videoId từ URL/chuỗi người dùng dán vào. Hỗ trợ các dạng phổ biến:
 *   https://www.youtube.com/watch?v=ID&t=...   youtu.be/ID   /shorts/ID
 *   /embed/ID   /live/ID   hoặc dán thẳng 11 ký tự ID.
 * Trả về videoId (11 ký tự) hoặc null nếu không nhận ra.
 */
export function parseVideoId(input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  const isId = (s) => /^[\w-]{11}$/.test(s)
  if (isId(raw)) return raw
  let u
  try {
    u = new URL(raw.includes('://') ? raw : 'https://' + raw)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return isId(id) ? id : null
  }
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const v = u.searchParams.get('v')
    if (v && isId(v)) return v
    const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/)
    if (m) return m[1]
  }
  return null
}

/**
 * Nạp YouTube IFrame Player API một lần và chia sẻ cho mọi component.
 * Trả về Promise resolve khi `window.YT` sẵn sàng tạo player.
 */
let apiPromise = null

export function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    // YouTube gọi hàm toàn cục này khi API tải xong.
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve(window.YT)
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
  return apiPromise
}
