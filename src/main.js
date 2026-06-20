import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

import './assets/styles/base.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Khôi phục tiến độ người học từ localStorage
useUserStore(pinia).hydrate()

app.mount('#app')
