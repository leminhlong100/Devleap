// Service worker viết tay (không dùng vite-plugin-pwa/workbox — đúng triết lý
// zero-dependency của repo). Chiến lược: KHÔNG precache bundle hash (không biết
// trước tên file build) — cache "theo kiểu đã dùng" (stale-while-revalidate) cho
// mọi GET cùng-gốc khi chúng thực sự được tải (JS/CSS route chunk, ảnh, audio,
// data tĩnh) + fallback trang '/' khi mất mạng lúc điều hướng (reload/gõ URL).
// Netlify Functions (AI) và Supabase (đăng nhập/đồng bộ) KHÔNG được cache — luôn
// cần mạng sống, để lỗi rơi đúng vào friendlyAiError()/luồng pending-sync có sẵn
// thay vì trả về dữ liệu cũ giả vờ thành công.
const CACHE_VERSION = 'devleap-v1'
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function shouldBypass(url) {
  return url.pathname.startsWith('/.netlify/functions/') || /supabase\.co$/.test(url.hostname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (shouldBypass(url)) return // để trình duyệt tự fetch — network-only, không can thiệp

  // Điều hướng (reload / gõ URL / mở tab mới): network trước, mất mạng thì trả
  // lại trang '/' đã precache (SPA — vue-router tự render đúng route từ URL).
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  // Còn lại (JS/CSS route chunk, ảnh, audio, data tĩnh…): trả bản cache ngay nếu
  // có (nhanh, chạy được offline), song song âm thầm tải bản mới để lần sau dùng.
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || networkFetch
    }),
  )
})
