/**
 * Gộp các dòng phụ đề YouTube (auto-caption) thành "câu" để luyện shadowing.
 *
 * Phụ đề tự động thường không có dấu câu và bị cắt vụn theo nhịp hiển thị
 * (mỗi dòng vài từ). Để shadowing được, ta gộp các dòng liền nhau thành đoạn
 * dài vừa phải, ngắt khi gặp khoảng lặng đủ lớn hoặc khi đoạn đã quá dài.
 *
 * Đầu vào: mảng { text, offset, duration } với offset/duration tính bằng MILI-giây
 * (đúng định dạng thư viện `youtube-transcript` trả về).
 * Đầu ra: mảng câu { id, text, start, end } với start/end tính bằng GIÂY.
 */

const DEFAULTS = {
  maxGapMs: 700, // khoảng lặng giữa 2 dòng > ngưỡng này -> ngắt câu
  targetMs: 6000, // độ dài mong muốn của một câu (~6s)
  maxWords: 16, // số từ tối đa cho một câu
}

const round2 = (ms) => Math.round(ms / 10) / 100 // ms -> giây, 2 chữ số thập phân

/**
 * Làm sạch nhẹ & an toàn (không đổi số từ → giữ nguyên timestamp):
 * - gộp khoảng trắng,
 * - sửa "i" viết thường thành "I" (caption tự động luôn viết thường, kể cả i'm/i'll…),
 * - viết hoa chữ cái đầu.
 * (Thêm dấu câu / sửa từ sai do AI đảm nhận ở bước curate — xem scripts/curate-shadowing.mjs.)
 */
export function tidyText(raw) {
  let t = String(raw).replace(/\s+/g, ' ').trim()
  if (!t) return ''
  t = t.replace(/\bi('(m|ll|ve|d|re))?\b/g, (_m, g1) => 'I' + (g1 || ''))
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const wordCount = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)

const roundSec = (s) => Math.round(s * 100) / 100 // giữ 2 chữ số thập phân (giây)

// Một "từ" kết thúc câu khi tận cùng là . ! ? (cho phép theo sau là dấu nháy/ngoặc đóng),
// nhưng KHÔNG tính các chữ viết tắt phổ biến (Mr. Mrs. Dr. …) để tránh ngắt nhầm.
const ABBREV = /\b(mr|mrs|ms|dr|st|vs|etc|jr|sr|no|prof)\.$/i
const endsSentence = (word) => /[.!?]['")\]]*$/.test(word) && !ABBREV.test(word)

/**
 * Tái ngắt các đoạn (đã có dấu câu) thành CÂU TRỌN VẸN cho shadowing — mỗi thẻ là
 * một câu, ngắt tại dấu kết câu `. ? !`. Vừa GỘP đuôi đoạn này với đầu đoạn kế khi
 * chúng cùng một câu, vừa TÁCH đoạn chứa nhiều câu.
 *
 * Timestamp của từng từ được nội suy đều trong khoảng [start, end] của đoạn gốc,
 * nên mốc thời gian của câu mới vẫn bám sát video.
 *
 * @param {Array<{text:string, start:number, end:number}>} segments  (đơn vị: GIÂY)
 * @returns {Array<{id:number, text:string, start:number, end:number}>}
 */
export function splitIntoSentences(segments) {
  // 1) Trải mọi đoạn thành chuỗi "từ" liên tục, mỗi từ kèm khoảng thời gian ước lượng.
  const words = []
  for (const seg of segments || []) {
    const text = String(seg?.text || '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const parts = text.split(' ')
    const start = +seg.start
    const end = +seg.end
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      // Không có thời gian hợp lệ -> vẫn giữ từ, gắn mốc tạm bằng start.
      for (const w of parts) words.push({ w, start: start || 0, end: start || 0 })
      continue
    }
    const span = (end - start) / parts.length
    parts.forEach((w, i) => words.push({ w, start: start + i * span, end: start + (i + 1) * span }))
  }

  // 2) Gom từ thành câu, ngắt sau từ kết thúc câu.
  const out = []
  let cur = null // { parts:[], start, end }
  const flush = () => {
    if (!cur) return
    const text = cur.parts.join(' ').trim()
    if (text) out.push({ id: out.length + 1, text, start: roundSec(cur.start), end: roundSec(cur.end) })
    cur = null
  }
  for (const item of words) {
    if (!cur) cur = { parts: [], start: item.start, end: item.end }
    cur.parts.push(item.w)
    cur.end = item.end
    if (endsSentence(item.w)) flush()
  }
  flush()

  // 3) Kẹp end không vượt start câu kế (giống groupIntoSentences) để phát gọn từng câu.
  for (let i = 0; i < out.length - 1; i++) {
    const next = out[i + 1].start
    if (out[i].end > next) out[i].end = Math.max(next, roundSec(out[i].start + 0.3))
  }
  return out
}

/**
 * @param {Array<{text:string, offset:number, duration:number}>} lines
 * @param {{maxGapMs?:number, targetMs?:number, maxWords?:number}} [opts]
 * @returns {Array<{id:number, text:string, start:number, end:number}>}
 */
export function groupIntoSentences(lines, opts = {}) {
  const { maxGapMs, targetMs, maxWords } = { ...DEFAULTS, ...opts }
  const clean = (lines || [])
    .map((l) => ({ text: String(l.text || '').replace(/\s+/g, ' ').trim(), offset: +l.offset, duration: +l.duration }))
    .filter((l) => l.text && Number.isFinite(l.offset) && Number.isFinite(l.duration))
    .sort((a, b) => a.offset - b.offset)

  const out = []
  let cur = null // { startMs, endMs, parts:[] }

  const flush = () => {
    if (!cur) return
    const text = tidyText(cur.parts.join(' '))
    if (text) out.push({ id: out.length + 1, text, start: round2(cur.startMs), end: round2(cur.endMs) })
    cur = null
  }

  for (const line of clean) {
    const lineEnd = line.offset + line.duration
    if (!cur) {
      cur = { startMs: line.offset, endMs: lineEnd, parts: [line.text] }
      continue
    }
    const gap = line.offset - cur.endMs
    const wouldWords = wordCount(cur.parts.join(' ')) + wordCount(line.text)
    const tooLong = cur.endMs - cur.startMs >= targetMs
    // Ngắt câu nếu: khoảng lặng lớn, đã đủ dài, hoặc vượt số từ tối đa.
    if (gap > maxGapMs || tooLong || wouldWords > maxWords) {
      flush()
      cur = { startMs: line.offset, endMs: lineEnd, parts: [line.text] }
    } else {
      cur.parts.push(line.text)
      cur.endMs = lineEnd
    }
  }
  flush()

  // Caption tự động hay để duration tràn sang dòng kế -> các câu chồng thời gian.
  // Kẹp end của mỗi câu không vượt quá start của câu kế để phát "đến hết câu" gọn,
  // không lố sang câu sau (giữ tối thiểu 0.3s để câu không bị rỗng).
  for (let i = 0; i < out.length - 1; i++) {
    const next = out[i + 1].start
    if (out[i].end > next) out[i].end = Math.max(next, round2(out[i].start * 1000 + 300))
  }
  return out
}
