/**
 * Migrate các clip shadowing tĩnh (src/data/shadowing/clips/*.json) lên Supabase.
 *
 *   node scripts/migrate-shadowing-to-supabase.mjs
 *
 * Chạy 1 LẦN ở máy cá nhân. Dùng SERVICE ROLE KEY (bỏ qua RLS) nên TUYỆT ĐỐI
 * không commit key, không đưa lên client. Đọc cấu hình từ env hoặc .env.local:
 *   VITE_SUPABASE_URL=...            (đã có sẵn cho client)
 *   SUPABASE_SERVICE_ROLE_KEY=...    (Supabase Dashboard → Settings → API → service_role)
 *
 * Idempotent: upsert theo video_id nên chạy lại sẽ ghi đè, không nhân bản.
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIPS_DIR = join(__dirname, '..', 'src', 'data', 'shadowing', 'clips')

/** Đọc biến từ env, fallback .env.local (script chạy ngoài Vite). */
async function loadEnv(name) {
  if (process.env[name]) return process.env[name].trim()
  try {
    const env = await readFile(join(__dirname, '..', '.env.local'), 'utf8')
    const m = env.match(new RegExp('^\\s*' + name + '\\s*=\\s*(.+)\\s*$', 'm'))
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null
  } catch {
    return null
  }
}

async function main() {
  const url = await loadEnv('VITE_SUPABASE_URL')
  const serviceKey = await loadEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    console.error(
      'Thiếu cấu hình. Cần VITE_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY ' +
        '(trong env hoặc .env.local).',
    )
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const files = (await readdir(CLIPS_DIR)).filter((f) => f.endsWith('.json'))
  if (!files.length) {
    console.log('Không có clip tĩnh nào để migrate.')
    return
  }

  const rows = []
  for (const file of files) {
    const clip = JSON.parse(await readFile(join(CLIPS_DIR, file), 'utf8'))
    // sentences tĩnh là mảng phẳng -> bọc thành { ai, original } để khớp dữ liệu mới.
    const arr = Array.isArray(clip.sentences) ? clip.sentences : []
    const sentences = Array.isArray(clip.sentences)
      ? { ai: arr, original: arr }
      : clip.sentences
    rows.push({
      video_id: clip.videoId,
      title: clip.title,
      level: clip.level || 'A1-A2',
      topic: clip.topic || null,
      lang: clip.lang || 'en',
      sentences,
      sentence_count: arr.length || sentences?.ai?.length || 0,
    })
  }

  const { error } = await supabase
    .from('shadowing_clips')
    .upsert(rows, { onConflict: 'video_id' })
  if (error) {
    console.error('Upsert thất bại:', error.message)
    process.exit(1)
  }
  console.log(`✓ Đã migrate ${rows.length} clip lên Supabase:`)
  rows.forEach((r) => console.log(`  - ${r.video_id}  (${r.level})  ${r.title}`))
}

main()
