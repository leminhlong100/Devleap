/**
 * Netlify Function (v2): tạo bài shadowing từ một URL YouTube bất kỳ.
 * Endpoint khi deploy: POST /.netlify/functions/shadowing
 *
 * Nhận { url } từ client → lấy phụ đề (youtube-transcript) + tiêu đề (oEmbed),
 * gom nhịp, đánh bóng AI (Groq) rồi ngắt theo câu trọn vẹn (.?!). Trả về
 * { videoId, title, author, thumbnail, sentences: { ai, original } }.
 *
 * Lưu ý: YouTube chặn IP datacenter của Netlify nên scrape trực tiếp (youtube-transcript)
 * trả phụ đề rỗng. Trên production ta dùng Supadata (https://supadata.ai) — API đi qua
 * proxy residential nên không bị chặn. Đặt env var SUPADATA_API_KEY ở Netlify để bật.
 * Local không có key thì tự fallback về youtube-transcript. Nếu vẫn rỗng -> trả 422.
 */
import { YoutubeTranscript } from 'youtube-transcript'
import { parseVideoId } from '../../src/lib/youtube.js'
import { groupIntoSentences, splitIntoSentences } from '../../src/lib/shadowingSegment.js'
import { polishSegments } from './_shadowing.js'
import { errorResponse } from './_llm.js'

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

/**
 * Lấy phụ đề qua Supadata — trả về mảng { text, offset, duration } (mili-giây),
 * đúng định dạng groupIntoSentences cần. API đi qua proxy residential nên chạy
 * được trên IP datacenter của Netlify.
 */
async function fetchTranscriptSupadata(videoId, key) {
  const url =
    'https://api.supadata.ai/v1/transcript?lang=en&url=' +
    encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)
  const res = await fetch(url, { headers: { 'x-api-key': key } })
  if (!res.ok) throw new Error('Supadata HTTP ' + res.status)
  const data = await res.json()
  // content: [{ text, offset, duration, lang }] — map thẳng sang dạng cần dùng.
  return Array.isArray(data?.content)
    ? data.content.map((c) => ({ text: c.text, offset: c.offset, duration: c.duration }))
    : []
}

/** Fallback khi không có key (local dev): scrape trực tiếp qua youtube-transcript. */
async function fetchTranscriptScrape(videoId) {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
  } catch {
    return await YoutubeTranscript.fetchTranscript(videoId)
  }
}

/** Ưu tiên Supadata nếu có key (production), ngược lại fallback scrape (local). */
async function fetchTranscript(videoId) {
  const key = process.env.SUPADATA_API_KEY
  if (key) return fetchTranscriptSupadata(videoId, key)
  return fetchTranscriptScrape(videoId)
}

export default async (req) => {
  if (req.method !== 'POST')
    return json({ error: { code: 'bad_request', message: 'Method not allowed' } }, 405)

  let videoId
  try {
    const { url } = await req.json()
    videoId = parseVideoId(url)
  } catch {
    return json({ error: { code: 'bad_request', message: 'Body không hợp lệ.' } }, 400)
  }
  if (!videoId)
    return json(
      { error: { code: 'bad_request', message: 'Không nhận ra link YouTube. Hãy dán link dạng youtube.com/watch?v=… hoặc youtu.be/…' } },
      400,
    )

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
        error: {
          code: 'no_transcript',
          message:
            'Không lấy được phụ đề — video không có phụ đề tiếng Anh hoặc YouTube đang tạm chặn. ' +
            'Thử video khác (có phụ đề) hoặc chọn một clip gợi ý bên dưới.',
        },
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
