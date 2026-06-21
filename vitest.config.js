import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Cấu hình test riêng (tách khỏi vite.config build) — vẫn dùng chung alias '@'
// để import như trong app. Fixtures parser đọc thẳng từ weeks/ & Base_English/.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
})
