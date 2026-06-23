/**
 * Netlify Function (v2): tạo bài shadowing từ một URL YouTube bất kỳ.
 * Endpoint khi deploy: POST /.netlify/functions/shadowing
 *
 * Nhận { url } từ client → lấy phụ đề (youtube-transcript) + tiêu đề (oEmbed),
 * gom nhịp, đánh bóng AI (Groq) rồi ngắt theo câu trọn vẹn (.?!). Trả về
 * { videoId, title, author, thumbnail, sentences: { ai, original } }.
 *
 * Lưu ý: YouTube có thể chặn IP datacenter của Netlify -> phụ đề rỗng. Khi đó
 * trả 422 với thông điệp rõ ràng để client gợi ý người dùng chọn clip có sẵn.
 */
import { YoutubeTranscript } from 'youtube-transcript'
import { parseVideoId } from '../../src/lib/youtube.js'
import { groupIntoSentences, splitIntoSentences } from '../../src/lib/shadowingSegment.js'
import { polishSegments } from './_shadowing.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Lấy tiêu đề/tác giả/thumbnail qua oEmbed công khai (không bị chặn IP). */
async function fetchMeta(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      'https://www.youtube.com/watch?v=' + videoId,
    )}&format=json`
    const res = await fetch(url)
    if (!res.ok) return {}
    const d = await res.json()
    return { title: d.title, author: d.author_name, thumbnail: d.thumbnail_url }
  } catch {
    return {}
  }
}

/** Lấy phụ đề: thử kèm lang 'en' trước, lỗi thì thử mặc định. */
async function fetchTranscript(videoId) {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
  } catch {
    return await YoutubeTranscript.fetchTranscript(videoId)
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let videoId
  try {
    const { url } = await req.json()
    videoId = parseVideoId(url)
  } catch {
    return json({ error: 'Body không hợp lệ.' }, 400)
  }
  if (!videoId) return json({ error: 'Không nhận ra link YouTube. Hãy dán link dạng youtube.com/watch?v=… hoặc youtu.be/…' }, 400)

  // Phụ đề là phần dễ hỏng nhất (YouTube chặn IP) -> bắt riêng để báo 422.
  let raw
  try {
    raw = await fetchTranscript(videoId)
  } catch {
    raw = null
  }
  if (!raw || !raw.length) {
    return json(
      {
        error:
          'Không lấy được phụ đề — video không có phụ đề tiếng Anh hoặc YouTube đang tạm chặn. ' +
          'Thử video khác (có phụ đề) hoặc chọn một clip gợi ý bên dưới.',
        videoId,
      },
      422,
    )
  }

  const meta = await fetchMeta(videoId)

  // original: phụ đề gom nhịp (không AI). ai: đánh bóng + ngắt câu trọn vẹn.
  const grouped = groupIntoSentences(raw)
  const original = grouped.map((s) => ({ ...s }))
  let ai = original
  let cleanup = 'heuristic'
  const key = process.env.GROQ_API_KEY
  if (key) {
    try {
      const cleaned = await polishSegments(grouped.map((s) => s.text), key)
      const polished = grouped.map((s, i) => ({ ...s, text: cleaned[i] }))
      ai = splitIntoSentences(polished)
      cleanup = 'ai'
    } catch {
      // Giữ ai = original (vẫn dùng được, chỉ kém gọn hơn).
    }
  }

  return json({
    videoId,
    title: meta.title || `Video ${videoId}`,
    author: meta.author || '',
    thumbnail: meta.thumbnail || '',
    cleanup,
    sentences: { ai, original },
  })
}
