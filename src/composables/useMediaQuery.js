import { ref } from 'vue'

// Singleton theo query string, cùng pattern useOnlineStatus/useTheme — nhiều component
// dùng chung 1 listener thay vì mỗi component tự đăng ký matchMedia riêng.
const cache = new Map()

export function useMediaQuery(query) {
  if (cache.has(query)) return cache.get(query)

  const matches = ref(
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  )

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mql = window.matchMedia(query)
    const handler = (e) => {
      matches.value = e.matches
    }
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else if (mql.addListener) mql.addListener(handler)
  }

  const result = { matches }
  cache.set(query, result)
  return result
}

// Ngưỡng dùng chung cho toàn site: ≤720px = phone/phone lớn (xem base.css).
export function useIsMobile() {
  return useMediaQuery('(max-width: 720px)')
}
