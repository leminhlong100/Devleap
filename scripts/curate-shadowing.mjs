/**
 * Curate nội dung shadowing "bán thực"/"clip gốc" cho Tuần 4-8 (thang nghe "thật
 * hóa dần" — xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục Đợt 3 và
 * docs/KE_HOACH_CAI_TIEN_WEBSITE.md Bước 1.3).
 *
 * Với mỗi video trong DANH SÁCH bên dưới: lấy phụ đề (youtube-transcript), gộp
 * thành câu (groupIntoSentences — dùng chung với netlify/functions/shadowing.js),
 * CẮT còn một cửa sổ 2-6 phút thật sự có nội dung (bỏ nhạc mở đầu/quảng cáo giữa
 * video/lời kêu gọi subscribe cuối video — mốc [trimStart,trimEnd] đã xem thủ công
 * transcript từng video để chọn điểm cắt sạch câu, KHÔNG cắt giữa câu), đánh bóng
 * qua Groq nếu có GROQ_API_KEY (polishSegments — cùng hàm dùng khi người dùng tự
 * dán URL), rồi ghi cả bộ vào `public/data/shadowing-clips.json` — file tĩnh mà
 * `src/lib/shadowingRepo.js` đọc làm lớp nền (Supabase, nếu có cấu hình, đè lên
 * trên khi admin thêm/sửa cùng videoId).
 *
 * Lưu ý an toàn ngôn ngữ: mặc định `YoutubeTranscript.fetchTranscript(id)` có thể
 * trả về track phụ đề KHÔNG phải tiếng Anh nếu video có nhiều track (gặp thật khi
 * curate — 2 video Asian Boss ban đầu dự kiến cho Tuần 8 hóa ra phụ đề mặc định là
 * tiếng Nhật/Trung vì người được phỏng vấn nói tiếng bản xứ). Nên sau khi gộp câu,
 * script LUÔN kiểm tra tỉ lệ ký tự Latin — video nào phụ đề không phải tiếng Anh
 * bị BÁO LỖI và bỏ qua thay vì âm thầm ghi rác vào dữ liệu.
 *
 * Chạy: node scripts/curate-shadowing.mjs (không cần .env đặc biệt; GROQ_API_KEY
 * lấy từ .env.local nếu Node được chạy qua `node --env-file=.env.local ...` hoặc
 * đã export sẵn trong shell — thiếu key thì tự rơi về bản "heuristic" như khi
 * người dùng tự dán URL mà server chưa cấu hình Groq).
 */
import { writeFile } from 'node:fs/promises'
import { YoutubeTranscript } from 'youtube-transcript'
import { groupIntoSentences, splitIntoSentences } from '../src/lib/shadowingSegment.js'
import { polishSegments } from '../netlify/functions/_shadowing.js'

const OUT_FILE = new URL('../public/data/shadowing-clips.json', import.meta.url)

// Cửa sổ [trimStart, trimEnd] tính bằng GIÂY trên video gốc (không phải trên bản
// đã cắt) — chọn thủ công sau khi đọc transcript từng video để tránh cắt giữa câu
// và tránh đoạn nhạc mở đầu / quảng cáo giữa video / lời kêu gọi subscribe cuối.
const CLIPS = [
  {
    videoId: 'I_tRSrPru94',
    week: 4,
    level: 'A2',
    topic: 'Giao tiếp cơ bản',
    trim: [2.8, 136.5],
  },
  {
    videoId: 'aiUGN3TDvw4',
    week: 4,
    level: 'A2',
    topic: 'Giao tiếp cơ bản',
    trim: [3.4, 160.9],
  },
  {
    videoId: 'OsW5sV3GMDM',
    week: 4,
    level: 'A2-B1',
    topic: 'Ngữ pháp',
    trim: [9.9, 313.7],
  },
  {
    videoId: '9ifQ3xRz4hM',
    week: 5,
    level: 'B1',
    topic: 'Học tập',
    trim: [20.0, 269.1],
  },
  {
    videoId: 'h_pvijqmolQ',
    week: 5,
    level: 'B1',
    topic: 'Đọc sách',
    trim: [13.0, 260.0],
  },
  {
    videoId: 'QdE63sYqwd8',
    week: 6,
    level: 'B1-B2',
    topic: 'Cuộc sống',
    trim: [14.5, 259.0],
  },
  {
    videoId: 'fEacJtQbTko',
    week: 7,
    level: 'B1-B2',
    topic: 'Tình bạn',
    trim: [85.6, 217.1],
  },
  {
    videoId: 'lBNM6aKwPl0',
    week: 7,
    level: 'B1-B2',
    topic: 'Giọng nói & accent',
    trim: [42.8, 249.4],
  },
  {
    videoId: 'FQhIPchN-AQ',
    week: 8,
    level: 'B2',
    topic: 'Cuộc sống',
    trim: [46.5, 253.4],
  },
  {
    videoId: 'Q8M57uJbVZo',
    week: 8,
    level: 'B2',
    topic: 'Giọng nói & accent',
    trim: [8.4, 253.4],
  },
]

async function fetchMeta(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      'https://www.youtube.com/watch?v=' + videoId,
    )}&format=json`
    const res = await fetch(url)
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

/** Tỉ lệ ký tự chữ cái Latin trong tổng số ký tự chữ cái — chặn nhầm track không phải tiếng Anh. */
function latinRatio(text) {
  const letters = text.match(/\p{L}/gu) || []
  if (!letters.length) return 0
  const latin = text.match(/[a-zA-Z]/g) || []
  return latin.length / letters.length
}

async function curateOne(cfg) {
  const raw = await YoutubeTranscript.fetchTranscript(cfg.videoId)
  const grouped = groupIntoSentences(raw)
  const [trimStart, trimEnd] = cfg.trim
  const windowed = grouped.filter((s) => s.start >= trimStart && s.end <= trimEnd)
  if (!windowed.length) throw new Error(`cửa sổ [${trimStart},${trimEnd}] rỗng`)

  const fullText = windowed.map((s) => s.text).join(' ')
  const ratio = latinRatio(fullText)
  if (ratio < 0.9) {
    throw new Error(`phụ đề có vẻ không phải tiếng Anh (tỉ lệ Latin ${(ratio * 100).toFixed(0)}%)`)
  }

  const original = windowed.map((s) => ({ ...s }))
  let ai = original
  let cleanup = 'heuristic'
  const key = process.env.GROQ_API_KEY
  if (key) {
    try {
      const cleaned = await polishSegments(windowed.map((s) => s.text), key)
      const polished = windowed.map((s, i) => ({ ...s, text: cleaned[i] }))
      ai = splitIntoSentences(polished)
      cleanup = 'ai'
    } catch (e) {
      console.warn(`  ⚠ polish thất bại (${cfg.videoId}): ${e.message} — dùng bản heuristic`)
    }
  }

  const meta = await fetchMeta(cfg.videoId)
  return {
    videoId: cfg.videoId,
    title: meta.title || cfg.videoId,
    level: cfg.level,
    topic: cfg.topic,
    lang: 'en',
    week: cfg.week,
    sentenceCount: ai.length,
    cleanup,
    sentences: { ai, original },
  }
}

const results = []
for (const cfg of CLIPS) {
  process.stdout.write(`Tuần ${cfg.week} · ${cfg.videoId} … `)
  try {
    const clip = await curateOne(cfg)
    results.push(clip)
    console.log(`OK (${clip.sentenceCount} câu, ${clip.cleanup}) — "${clip.title}"`)
  } catch (e) {
    console.log(`BỎ QUA — ${e.message}`)
  }
}

await writeFile(OUT_FILE, JSON.stringify(results, null, 2) + '\n', 'utf8')
console.log(`\nĐã ghi ${results.length}/${CLIPS.length} clip vào public/data/shadowing-clips.json`)
for (let w = 4; w <= 8; w++) {
  const n = results.filter((r) => r.week === w).length
  if (!n) console.log(`  ⚠ Tuần ${w}: chưa có clip nào!`)
}
