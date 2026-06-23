/**
 * Lấy transcript YouTube -> gộp câu -> ghi dữ liệu shadowing tĩnh vào repo.
 *
 *   node scripts/curate-shadowing.mjs            # curate toàn bộ CATALOG
 *   node scripts/curate-shadowing.mjs <videoId>  # thêm/làm mới 1 video
 *
 * Chạy ở MÁY CÁ NHÂN (IP nhà) để né việc YouTube chặn IP datacenter — kết quả là
 * file JSON tĩnh, commit vào git nên web không cần gọi YouTube lúc chạy.
 */
import { writeFile, readFile, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { YoutubeTranscript } from 'youtube-transcript'
import { groupIntoSentences, splitIntoSentences } from '../src/lib/shadowingSegment.js'
import { polishSegments } from '../netlify/functions/_shadowing.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data', 'shadowing')
const CLIPS_DIR = join(DATA_DIR, 'clips')

/** Lấy GROQ_API_KEY từ env hoặc .env.local (script chạy ngoài Vite nên tự đọc). */
async function loadGroqKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY.trim()
  try {
    const env = await readFile(join(__dirname, '..', '.env.local'), 'utf8')
    const m = env.match(/^\s*GROQ_API_KEY\s*=\s*(.+)\s*$/m)
    const v = m && m[1].trim().replace(/^["']|["']$/g, '')
    return v || null
  } catch {
    return null
  }
}

// Catalog các video đã xác minh có phụ đề (xem scripts/verify-shadowing.mjs).
const CATALOG = [
  { videoId: 'GpYsomFl6Bs', level: 'A1-A2', title: 'Shadowing Technique — Hướng dẫn nhập môn', topic: 'Cách luyện shadowing' },
]

async function curateOne(meta, groqKey) {
  const raw = await YoutubeTranscript.fetchTranscript(meta.videoId, { lang: 'en' })
  let sentences = groupIntoSentences(raw)
  let polished = 'heuristic'
  // Đánh bóng bằng AI nếu có key — lỗi gì cũng giữ bản heuristic an toàn.
  if (groqKey) {
    try {
      const cleaned = await polishSegments(sentences.map((s) => s.text), groqKey)
      sentences.forEach((s, i) => (s.text = cleaned[i]))
      polished = 'AI (Groq)'
    } catch (e) {
      console.log(`    (bỏ qua đánh bóng AI: ${e.message})`)
    }
  }
  // Tái ngắt theo CÂU TRỌN VẸN (.?!): mỗi thẻ là một câu, không cắt giữa câu.
  // Chỉ có tác dụng khi text đã có dấu câu (sau bước đánh bóng AI).
  sentences = splitIntoSentences(sentences)
  const clip = {
    videoId: meta.videoId,
    title: meta.title,
    level: meta.level,
    topic: meta.topic,
    lang: 'en',
    source: 'youtube-transcript',
    cleanup: polished,
    sentences,
  }
  await writeFile(join(CLIPS_DIR, `${meta.videoId}.json`), JSON.stringify(clip, null, 2) + '\n', 'utf8')
  console.log(`  ✓ ${meta.videoId}  ${sentences.length} câu  [${polished}]  — ${meta.title}`)
  return { videoId: meta.videoId, title: meta.title, level: meta.level, topic: meta.topic, sentenceCount: sentences.length }
}

async function writeIndex() {
  // Liệt kê mọi clip hiện có trong thư mục để index luôn khớp với file thực tế.
  const files = (await readdir(CLIPS_DIR)).filter((f) => f.endsWith('.json')).sort()
  const metas = []
  for (const f of files) {
    const c = JSON.parse(await readFile(join(CLIPS_DIR, f), 'utf8'))
    metas.push({ videoId: c.videoId, title: c.title, level: c.level, topic: c.topic, sentenceCount: c.sentences.length })
  }
  const body = `// TỆP TỰ SINH bởi scripts/curate-shadowing.mjs — đừng sửa tay, hãy chạy lại script.
// Danh mục clip shadowing + hàm nạp động dữ liệu câu (JSON nằm trong ./clips).

const files = import.meta.glob('./clips/*.json')

/** Danh mục hiển thị ở trang chọn clip. */
export const shadowingClips = ${JSON.stringify(metas, null, 2)}

/** Nạp đầy đủ một clip (kèm danh sách câu) theo videoId. */
export async function loadShadowingClip(videoId) {
  const loader = files['./clips/' + videoId + '.json']
  if (!loader) return null
  const mod = await loader()
  return mod.default || mod
}
`
  await writeFile(join(DATA_DIR, 'index.js'), body, 'utf8')
  console.log(`\n  index.js cập nhật: ${metas.length} clip`)
}

async function main() {
  await mkdir(CLIPS_DIR, { recursive: true })
  const arg = process.argv[2]
  const targets = arg ? CATALOG.filter((c) => c.videoId === arg) : CATALOG
  if (arg && !targets.length) targets.push({ videoId: arg, level: 'A1-A2', title: arg, topic: '' })

  const groqKey = await loadGroqKey()
  console.log(`Curate ${targets.length} video... (đánh bóng: ${groqKey ? 'AI Groq' : 'heuristic — không có GROQ_API_KEY'})`)
  for (const meta of targets) {
    try {
      await curateOne(meta, groqKey)
    } catch (e) {
      console.log(`  ✗ ${meta.videoId} lỗi: ${e.message}`)
    }
  }
  await writeIndex()
}

main()
