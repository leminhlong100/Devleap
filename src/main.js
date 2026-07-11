import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { useAuthStore } from './stores/auth'
import { useSiteConfigStore } from './stores/siteConfig'
import { registerServiceWorkerUpdates } from './composables/useServiceWorkerUpdate'

import './assets/styles/base.css'

const app = createApp(App)
const pinia = createPinia()

// Bắt lỗi cuối cùng ở cấp app: những lỗi lọt qua AppErrorBoundary (vd lỗi trong
// watcher/handler bất đồng bộ) vẫn được log lại thay vì làm treo âm thầm. Báo
// cáo mềm — không ném tiếp để không làm sập app.
app.config.errorHandler = (err, _instance, info) => {
  console.error('[app.errorHandler]', info, err)
}

app.use(pinia)
app.use(router)

// Khôi phục tiến độ từ localStorage (tức thì, chạy được cả khi offline/chưa đăng nhập)
useUserStore(pinia).hydrate()
// Kiểm tra phiên đăng nhập & bật đồng bộ cloud nếu đã cấu hình Supabase.
useAuthStore(pinia).init()
// Nạp cấu hình site (bật/tắt khóa, banner) — không chặn render; giữ mặc định nếu lỗi.
useSiteConfigStore(pinia).load()

app.mount('#app')

// Chỉ đăng ký ở production build — dev server (Vite HMR) không cần và service
// worker sẽ chỉ gây nhiễu cache trong lúc code đang đổi liên tục.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', registerServiceWorkerUpdates)
}
