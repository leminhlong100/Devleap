import { ref } from 'vue'

// Khoá localStorage PHẢI khớp với script chặn FOUC trong index.html.
const STORAGE_KEY = 'devleap:theme'

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

// index.html đã set data-theme trước khi Vue mount (tránh nháy sai theme) — đọc lại
// giá trị đó thay vì tính lại, để 2 nơi không bao giờ lệch nhau.
const initialTheme =
  (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) ||
  (systemPrefersDark() ? 'dark' : 'light')

const theme = ref(initialTheme)
let userChosen = typeof localStorage !== 'undefined' && !!localStorage.getItem(STORAGE_KEY)
let listenerAttached = false

function applyTheme(value) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', value)
  }
}

function attachSystemListener() {
  if (listenerAttached || typeof window === 'undefined' || !window.matchMedia) return
  listenerAttached = true
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e) => {
    if (userChosen) return
    theme.value = e.matches ? 'dark' : 'light'
    applyTheme(theme.value)
  }
  if (mql.addEventListener) mql.addEventListener('change', handler)
  else if (mql.addListener) mql.addListener(handler)
}

export function useTheme() {
  attachSystemListener()

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    userChosen = true
    applyTheme(theme.value)
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch (e) {
      // Riêng tư/quota đầy — theme vẫn áp dụng cho phiên hiện tại, chỉ không nhớ được.
    }
  }

  return { theme, toggleTheme }
}
