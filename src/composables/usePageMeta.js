// Bước 3.2 — SEO/share theo route: đặt document.title + meta description/OG/Twitter
// theo route đang xem, thay cho tiêu đề tĩnh duy nhất trong index.html. Route khai
// `meta.title`/`meta.description` (xem router/index.js); thiếu thì dùng mặc định.
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const SITE_NAME = 'Devleap'
const DEFAULT_TITLE = 'Devleap — Nền tảng học lập trình & tiếng Anh'
const DEFAULT_DESCRIPTION =
  'Devleap — Học lập trình & tiếng Anh như chơi một game. Lộ trình rõ ràng, công cụ thực hành, streak giữ lửa.'

function setMeta(selector, attr, content) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, content)
}

/** Gọi 1 lần ở App.vue — tự cập nhật mỗi khi route đổi. */
export function usePageMeta() {
  const route = useRoute()

  watch(
    () => route.fullPath,
    () => {
      const title = route.meta?.title ? `${route.meta.title} · ${SITE_NAME}` : DEFAULT_TITLE
      const description = route.meta?.description || DEFAULT_DESCRIPTION
      const url = window.location.origin + route.fullPath

      document.title = title
      setMeta('meta[name="description"]', 'content', description)
      setMeta('meta[property="og:title"]', 'content', title)
      setMeta('meta[property="og:description"]', 'content', description)
      setMeta('meta[property="og:url"]', 'content', url)
      setMeta('meta[name="twitter:title"]', 'content', title)
      setMeta('meta[name="twitter:description"]', 'content', description)
    },
    { immediate: true },
  )
}
