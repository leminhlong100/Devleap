/**
 * Tái ngắt các clip shadowing ĐÃ CÓ thành câu trọn vẹn (.?!), không cần gọi
 * YouTube/Groq — vì text trong JSON đã có dấu câu (từ bước đánh bóng AI trước đây).
 *
 *   node scripts/resplit-shadowing.mjs
 *
 * Đọc mọi JSON trong src/data/shadowing/clips/, chạy splitIntoSentences, ghi lại,
 * rồi cập nhật sentenceCount trong index.js.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { splitIntoSentences } from '../src/lib/shadowingSegment.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data', 'shadowing')
const CLIPS_DIR = join(DATA_DIR, 'clips')

async function main() {
  const files = (await readdir(CLIPS_DIR)).filter((f) => f.endsWith('.json')).sort()
  const metas = []
  for (const f of files) {
    const path = join(CLIPS_DIR, f)
    const clip = JSON.parse(await readFile(path, 'utf8'))
    const before = clip.sentences.length
    // Chỉ tái ngắt khi text đã có dấu kết câu (bản AI). Bản heuristic không có dấu
    // câu -> split sẽ gộp tất cả thành 1, nên giữ nguyên cách gom nhịp cũ.
    const hasPunct = clip.sentences.some((s) => /[.!?]/.test(s.text))
    if (hasPunct) {
      clip.sentences = splitIntoSentences(clip.sentences)
      await writeFile(path, JSON.stringify(clip, null, 2) + '\n', 'utf8')
      console.log(`  ✓ ${clip.videoId}: ${before} → ${clip.sentences.length} câu  — ${clip.title}`)
    } else {
      console.log(`  – ${clip.videoId}: bỏ qua (chưa có dấu câu / bản heuristic)  — ${clip.title}`)
    }
    metas.push({ videoId: clip.videoId, title: clip.title, level: clip.level, topic: clip.topic, sentenceCount: clip.sentences.length })
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

main()
