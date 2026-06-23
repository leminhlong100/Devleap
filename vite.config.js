import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { askLLM, buildSystemPrompt } from './netlify/functions/_llm.js'
import shadowingHandler from './netlify/functions/shadowing.js'

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

/**
 * Plugin dev: mô phỏng Netlify Function /.netlify/functions/shadowing trong
 * `vite dev`. Tái dùng chính handler của function (chạy được nhờ Request/Response
 * toàn cục của Node 18+). Đẩy GROQ_API_KEY từ .env.local vào process.env vì handler
 * đọc qua process.env.
 */
function shadowingDevPlugin(env) {
  return {
    name: 'shadowing-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      if (!process.env.GROQ_API_KEY && env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
      if (!process.env.GROQ_MODEL && env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL
      server.middlewares.use('/.netlify/functions/shadowing', (req, res) => {
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          try {
            const request = new Request('http://local/.netlify/functions/shadowing', {
              method: req.method,
              headers: { 'Content-Type': 'application/json' },
              body: req.method === 'GET' || req.method === 'HEAD' ? undefined : raw,
            })
            const response = await shadowingHandler(request)
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(await response.text())
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e?.message || 'Lỗi không xác định' }))
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
    plugins: [vue(), chatDevPlugin(env), shadowingDevPlugin(env)],
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
