import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import chatHandler from './netlify/functions/chat.js'
import shadowingHandler from './netlify/functions/shadowing.js'
import runJavaHandler from './netlify/functions/run-java.js'

/**
 * Plugin dev dùng chung: mô phỏng một Netlify Function (v2, handler nhận
 * Request/Response chuẩn) ngay trong `vite dev`, để chạy bằng `npm run dev` mà
 * không cần Netlify CLI. Tái dùng ĐÚNG handler thật (không viết lại logic riêng)
 * nên format lỗi/thành công ở dev luôn khớp production. Đẩy các env var cần
 * thiết (đọc qua process.env phía handler) từ .env.local vào process.env.
 */
function netlifyFunctionDevPlugin(name, handler, env, extraEnvKeys = []) {
  return {
    name: `${name}-dev-proxy`,
    apply: 'serve',
    configureServer(server) {
      for (const k of ['GROQ_API_KEY', 'GROQ_MODEL', ...extraEnvKeys]) {
        if (!process.env[k] && env[k]) process.env[k] = env[k]
      }
      server.middlewares.use(`/.netlify/functions/${name}`, (req, res) => {
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          try {
            const request = new Request(`http://local/.netlify/functions/${name}`, {
              method: req.method,
              headers: { 'Content-Type': 'application/json' },
              body: req.method === 'GET' || req.method === 'HEAD' ? undefined : raw,
            })
            const response = await handler(request)
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(await response.text())
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: { code: 'upstream', message: e?.message || 'Lỗi không xác định' } }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // prefix '' = nạp cả biến không có tiền tố VITE_ (như GEMINI_API_KEY) cho dev plugin.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      netlifyFunctionDevPlugin('chat', chatHandler, env),
      netlifyFunctionDevPlugin('shadowing', shadowingHandler, env),
      netlifyFunctionDevPlugin('run-java', runJavaHandler, env),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  }
})
