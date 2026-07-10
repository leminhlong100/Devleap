import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import chatHandler from './netlify/functions/chat.js'
import shadowingHandler from './netlify/functions/shadowing.js'
import runJavaHandler from './netlify/functions/run-java.js'

/**
 * `public/sw.js` chứa placeholder `__BUILD_ID__` thay vì version cố định — sau
 * khi Vite copy nguyên `public/` sang `outDir` (bước có sẵn của Vite, chạy
 * trước `closeBundle`), plugin này ghi đè `dist/sw.js` với 1 build id thật
 * (timestamp) để mỗi lần build ra 1 `CACHE_VERSION` khác nhau — nhờ đó
 * `UpdateToast` phát hiện được bản mới qua `registration.updatefound`.
 */
function swBuildIdPlugin() {
  let outDir = 'dist'
  return {
    name: 'sw-build-id',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js')
      if (!fs.existsSync(swPath)) return
      const buildId = String(Date.now())
      const content = fs.readFileSync(swPath, 'utf-8').replaceAll('__BUILD_ID__', buildId)
      fs.writeFileSync(swPath, content)
    },
  }
}

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
      swBuildIdPlugin(),
      netlifyFunctionDevPlugin('chat', chatHandler, env),
      netlifyFunctionDevPlugin('shadowing', shadowingHandler, env),
      netlifyFunctionDevPlugin('run-java', runJavaHandler, env),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Bước 4.3 — tách chunk để không còn 1 file entry khổng lồ: thư viện
          // (vue/pinia/router) và dữ liệu khóa học nặng (markdown tuần + IELTS
          // input) nằm chunk riêng, cache độc lập với mã app qua mỗi lần deploy.
          // CodeMirror đã tự tách theo route (CodeEditor lazy) nên không đụng tới.
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/@codemirror/') || id.includes('/codemirror/') || id.includes('/@lezer/')) return
              if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('/pinia/') || id.includes('/vue-router/')) {
                return 'vue-vendor'
              }
              return 'vendor'
            }
            // Nội dung khóa học (chuỗi markdown thô nhúng qua import.meta.glob) —
            // phần nặng nhất; tách khỏi mã app để đổi bài không phải tải lại app.
            if (id.includes('/weeks/') || id.includes('/Base_English/')) return 'course-content'
            if (id.includes('/src/data/')) return 'course-data'
          },
        },
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  }
})
