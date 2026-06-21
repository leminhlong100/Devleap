import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { askLLM, buildSystemPrompt } from './netlify/functions/_llm.js'

/**
 * Plugin dev: mô phỏng Netlify Function /.netlify/functions/chat ngay trong
 * `vite dev`, để chạy chat AI bằng `npm run dev` mà không cần Netlify CLI.
 * Key đọc từ .env.local phía Node — không lọt vào bundle client.
 */
function chatDevPlugin(env) {
  return {
    name: 'chat-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/chat', (req, res) => {
        const send = (body, status = 200) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return send({ error: 'Method not allowed' }, 405)

        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          try {
            const { messages, context } = JSON.parse(raw || '{}')
            const key = env.GROQ_API_KEY
            if (!key) return send({ error: 'Thiếu GROQ_API_KEY trong .env.local' }, 500)
            const reply = await askLLM({ key, system: buildSystemPrompt(context), messages })
            send({ reply })
          } catch (e) {
            send({ error: e?.message || 'Lỗi không xác định' }, 500)
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
    plugins: [vue(), chatDevPlugin(env)],
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
