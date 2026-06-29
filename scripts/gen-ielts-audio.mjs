/**
 * SINH AUDIO BÀI NGHE IELTS bằng Google Translate TTS (miễn phí, không cần API key,
 * không cần gói ngoài). Giọng tiếng Anh rõ ràng, ổn định giữa các máy — đặc biệt hợp
 * bài đánh vần TÊN và đọc CON SỐ (Listening Section 1).
 *
 * Vì sao không dùng Web Speech / msedge-tts:
 *  - Web Speech (mặc định): giọng khác nhau theo máy, khó tin cho bài phân biệt âm.
 *  - msedge-tts: endpoint Edge nay bắt buộc token DRM (Sec-MS-GEC) + phụ thuộc đồng hồ,
 *    gói không còn theo kịp -> hay "Connect Error". Google TTS không có rào này.
 *
 * Dùng:
 *   npm run gen:audio            # sinh tất cả bài nghe còn thiếu
 *   npm run gen:audio -- --force # ghi đè cả file đã có
 *
 * Cơ chế: tải mp3 vào public/audio/ielts/<tuần>-<buổi>.mp3 và ghi đường dẫn vào
 * src/data/ieltsAudioManifest.js -> app tự ưu tiên phát file (xem getIeltsInput).
 * Buổi nào chưa sinh được -> vẫn fallback Web Speech, không vỡ.
 *
 * Muốn giọng người thật: bỏ qua script, đặt mp3 vào public/audio/ielts/ rồi điền
 * đường dẫn tay trong src/data/ieltsAudioManifest.js.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ieltsInput } from '../src/data/ieltsInput.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'ielts')
const MANIFEST = path.join(ROOT, 'src', 'data', 'ieltsAudioManifest.js')
const FORCE = process.argv.includes('--force')
const MAX_CHARS = 180 // giới hạn 1 yêu cầu translate_tts; câu dài -> chia nhỏ rồi ghép

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Bỏ nhãn người nói ("A:", "B:", "Teacher:", "Student:"…) để TTS không đọc thành chữ;
// câu trước đã kết bằng dấu chấm/hỏi nên vẫn có khoảng ngắt tự nhiên giữa các lượt.
function cleanScript(text) {
  return String(text || '')
    .replace(/(^|[\s])(?:Teacher|Student|Man|Woman|Boy|Girl|A|B)\s*:\s*/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

// Chia văn bản thành các đoạn ≤ MAX_CHARS: gom trọn câu, câu nào quá dài thì cắt theo từ.
function chunk(text) {
  const sentences = text.match(/[^.?!]+[.?!]*\s*/g) || [text]
  const out = []
  let cur = ''
  const push = () => { if (cur.trim()) out.push(cur.trim()); cur = '' }
  for (const s of sentences) {
    if (s.length > MAX_CHARS) {
      push()
      let line = ''
      for (const w of s.split(/\s+/)) {
        if ((line + ' ' + w).trim().length > MAX_CHARS) { out.push(line.trim()); line = w }
        else line += ' ' + w
      }
      if (line.trim()) out.push(line.trim())
    } else if ((cur + s).length > MAX_CHARS) {
      push(); cur = s
    } else {
      cur += s
    }
  }
  push()
  return out
}

async function ttsPart(textPart) {
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=' +
    encodeURIComponent(textPart)
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải đoạn: "${textPart.slice(0, 40)}…"`)
  return Buffer.from(await res.arrayBuffer())
}

async function synth(text, outPath) {
  const parts = chunk(text)
  const buffers = []
  for (let i = 0; i < parts.length; i++) {
    buffers.push(await ttsPart(parts[i]))
    if (i < parts.length - 1) await sleep(350) // lịch sự với endpoint, tránh bị chặn
  }
  fs.writeFileSync(outPath, Buffer.concat(buffers)) // ghép các mp3 -> phát liền mạch
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const manifest = {}
  let made = 0
  let skipped = 0

  for (const [key, entry] of Object.entries(ieltsInput)) {
    const script = entry?.listening?.script
    if (!script) continue
    const file = `${key.replace(':', '-')}.mp3` // "1:1" -> "1-1.mp3"
    const outPath = path.join(OUT_DIR, file)
    manifest[key] = `/audio/ielts/${file}`

    if (fs.existsSync(outPath) && !FORCE) {
      console.log(`• bỏ qua (đã có): ${file}  — dùng "-- --force" để ghi đè`)
      skipped++
      continue
    }
    process.stdout.write(`• sinh ${file} … `)
    await synth(cleanScript(script), outPath)
    console.log('xong')
    made++
    await sleep(350)
  }

  const body = Object.entries(manifest).map(([k, v]) => `  '${k}': '${v}',`).join('\n')
  fs.writeFileSync(
    MANIFEST,
    `/**
 * MANIFEST AUDIO LISTENING — ĐƯỢC SINH TỰ ĐỘNG bởi scripts/gen-ielts-audio.mjs.
 * Đừng sửa tay phần dưới (chạy lại \`npm run gen:audio\` để cập nhật); muốn trỏ tới
 * bản thu giọng thật thì thay đường dẫn tương ứng là được.
 */
export const ieltsAudioManifest = {
${body}
}
`,
    'utf8',
  )
  console.log(`\nHoàn tất: ${made} file mới, ${skipped} bỏ qua. Manifest → ${path.relative(ROOT, MANIFEST)}`)
}

main().catch((e) => {
  console.error('\n✗ Lỗi sinh audio:', e?.message || e)
  process.exit(1)
})
