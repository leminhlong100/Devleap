import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { useAuthStore } from './stores/auth'

import './assets/styles/base.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Khôi phục tiến độ từ localStorage (tức thì, chạy được cả khi offline/chưa đăng nhập)
useUserStore(pinia).hydrate()
// Kiểm tra phiên đăng nhập & bật đồng bộ cloud nếu đã cấu hình Supabase.
useAuthStore(pinia).init()

app.mount('#app')

// Chỉ đăng ký ở production build — dev server (Vite HMR) không cần và service
// worker sẽ chỉ gây nhiễu cache trong lúc code đang đổi liên tục.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
