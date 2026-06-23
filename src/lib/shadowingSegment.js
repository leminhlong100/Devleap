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
