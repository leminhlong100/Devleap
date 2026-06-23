// Trích videoId thật từ playlist/kênh YouTube rồi kiểm tra có phụ đề (transcript) không.
// Dùng: node scripts/verify-shadowing.mjs
import { YoutubeTranscript } from 'youtube-transcript'

// Các playlist/kênh có phụ đề, phân theo trình độ (URL lấy từ nguồn công khai)
const SOURCES = [
  { level: 'A1-A2 (cơ bản)', url: 'https://www.youtube.com/playlist?list=PLUiFeF9KuaPYJrmMK6RhEN-u1rHaYcoUE' }, // Easy English - Street Interviews
  { level: 'A2-B1 (luyện shadowing)', url: 'https://www.youtube.com/playlist?list=PLlZ0dlSbrSXjIckuX0RfJKtRCr0FXfzG7' }, // American English Shadowing Exercises
]

const MAX_PER_SOURCE = 12

async function extractVideoIds(url) {
  const res = await fetch(url, { headers: { 'Accept-Language': 'en-US,en' } })
  const html = await res.text()
  const ids = new Set()
  for (const m of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)) ids.add(m[1])
  return [...ids]
}

async function titleOf(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`)
    if (!r.ok) return null
    return (await r.json()).title
  } catch { return null }
}

async function hasTranscript(id) {
  try {
    const t = await YoutubeTranscript.fetchTranscript(id, { lang: 'en' })
    return t && t.length > 5 ? t.length : 0
  } catch { return 0 }
}

const verified = []
for (const src of SOURCES) {
  console.log(`\n=== ${src.level} ===`)
  let ids
  try { ids = await extractVideoIds(src.url) } catch (e) { console.log('  (không tải được playlist)', e.message); continue }
  console.log(`  tìm thấy ${ids.length} video, kiểm tra tối đa ${MAX_PER_SOURCE}...`)
  let kept = 0
  for (const id of ids) {
    if (kept >= MAX_PER_SOURCE) break
    const lines = await hasTranscript(id)
    if (!lines) continue
    const title = await titleOf(id)
    if (!title) continue
    kept++
    verified.push({ level: src.level, id, title, lines })
    console.log(`  ✓ ${id}  [${lines} dòng]  ${title}`)
  }
}

console.log(`\n=== TỔNG: ${verified.length} video có phụ đề ===`)
console.log(JSON.stringify(verified, null, 2))
