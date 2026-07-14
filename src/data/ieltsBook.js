/**
 * Khóa IELTS mới — dựng từ SÁCH "IELTS 4 kỹ năng cho người bắt đầu từ con số âm
 * — Tập 1". Nạp & parse `IELTS/day-*.md` lúc chạy (mỗi file = 1 buổi, số hóa từ
 * ảnh sách bằng skill `ielts-book-to-md`). Xem parser ở ./md/parseIeltsBook.js.
 *
 * Sách có 15 buổi (Day 1–15). Buổi nào đã số hóa (có file .md) thì học được;
 * buổi chưa có hiển thị "Sắp có". Tiến độ khóa dùng chung store (`completed.ielts`)
 * với khóa "week" cố định = 1 (khóa theo buổi: "1:1", "1:2", …).
 */
import { parseIeltsBookDay } from './md/parseIeltsBook'

const rawFiles = import.meta.glob('../../IELTS/day-*.md', { query: '?raw', import: 'default', eager: true })

/** Tổng số buổi theo thiết kế sách (kể cả buổi chưa số hóa). */
export const IELTS_BOOK_TOTAL_DAYS = 15
/** "Tuần" cố định dùng làm khóa tiến độ trong store (khóa này tính theo buổi). */
export const IELTS_BOOK_WEEK = 1

// Palette xoay vòng cho VocabCard (giống decorateVocab của khóa cũ).
const GRADS = [
  ['#6C5CE7', '#8B7CF0'], ['#00B8D9', '#3dd7f0'], ['#00D68F', '#34e0a8'],
  ['#FF7A59', '#ff9f85'], ['#FFB020', '#ffc659'], ['#A55EEA', '#c089f5'],
]
const ILLOS = ['📱', '💬', '🖼️', '👥', '🔗', '📢', '⭐', '🔔', '📝', '🌐', '🚀', '🧩']

/** Chèn placeholder {w} vào câu ví dụ để VocabCard tô đậm từ khóa. */
function withPlaceholder(exEn, term) {
  if (!exEn || !term) return exEn || ''
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es|ed|d)?\\b`, 'i')
  return re.test(exEn) ? exEn.replace(re, '{w}') : exEn
}

/** Biến 1 dòng từ vựng của sách thành object cho VocabCard. */
function toVocabCard(w, i) {
  return {
    term: w.term,
    pos: w.pos || '',
    vi: w.vi || '',
    ipa: w.ipa || '',
    ex: withPlaceholder(w.exEn, w.term),
    exVi: w.exVi || '',
    illo: ILLOS[i % ILLOS.length],
    g1: GRADS[i % GRADS.length][0],
    g2: GRADS[i % GRADS.length][1],
  }
}

// Parse tất cả các buổi có file .md, sắp theo số buổi.
const parsedDays = Object.values(rawFiles)
  .map((raw) => parseIeltsBookDay(raw))
  .filter((d) => d.day > 0)
  .sort((a, b) => a.day - b.day)

// Chỉ số buổi có nội dung (để mở khóa tuần tự & điều hướng prev/next).
const availableDayNums = parsedDays.map((d) => d.day)

export const ieltsBookDays = parsedDays
export const ieltsBookTotals = {
  days: IELTS_BOOK_TOTAL_DAYS,
  ready: parsedDays.length,
}

/** Bản đồ 15 buổi cho trang khóa học — kèm cờ có nội dung / tiêu đề nếu có. */
export function ieltsBookMap() {
  return Array.from({ length: IELTS_BOOK_TOTAL_DAYS }, (_, i) => {
    const n = i + 1
    const d = parsedDays.find((x) => x.day === n)
    return {
      day: n,
      title: d?.title || '',
      topic: d?.topicVocabulary || '',
      hasContent: !!d,
    }
  })
}

/** Buổi liền trước đã hoàn thành chưa (mở khóa tuần tự theo các buổi CÓ nội dung). */
function prevAvailable(n) {
  const idx = availableDayNums.indexOf(n)
  return idx <= 0 ? null : availableDayNums[idx - 1]
}
function nextAvailable(n) {
  const idx = availableDayNums.indexOf(n)
  return idx === -1 || idx === availableDayNums.length - 1 ? null : availableDayNums[idx + 1]
}

/** Chi tiết một buổi để render trang học. `null` nếu buổi chưa số hóa. */
export function getBookDay(dayNum) {
  const n = Number(dayNum)
  const d = parsedDays.find((x) => x.day === n)
  if (!d) return null
  const vocabCards = (d.vocab.words || []).map(toVocabCard)
  return {
    ...d,
    n: d.day,
    week: IELTS_BOOK_WEEK,
    totalDays: IELTS_BOOK_TOTAL_DAYS,
    vocabCards,
    vocabTerms: vocabCards.map((v) => v.term),
    prevDay: prevAvailable(n),
    nextDay: nextAvailable(n),
    availableDays: availableDayNums.slice(),
  }
}

/**
 * Tiến độ khóa IELTS (theo buổi, trên tổng 15 buổi của sách). `completed` = mảng
 * "1:n" của store. Buổi kế = buổi CHƯA hoàn thành đầu tiên trong 1..15 (kể cả
 * buổi chưa số hóa — để "Học tiếp" luôn tiến về phía trước khi thêm Day mới).
 * Khóa chỉ coi là allDone khi đã xong đủ 15 buổi.
 */
export function computeIeltsBookProgress(completed = []) {
  const doneNums = new Set(
    completed
      .map((k) => /^1:(\d+)$/.exec(k))
      .filter(Boolean)
      .map((m) => Number(m[1])),
  )
  const doneDays = [...doneNums].filter((n) => n >= 1 && n <= IELTS_BOOK_TOTAL_DAYS).length
  let nextDay = IELTS_BOOK_TOTAL_DAYS
  for (let n = 1; n <= IELTS_BOOK_TOTAL_DAYS; n++) {
    if (!doneNums.has(n)) {
      nextDay = n
      break
    }
  }
  const allDone = doneDays >= IELTS_BOOK_TOTAL_DAYS
  return {
    doneDays,
    totalDays: IELTS_BOOK_TOTAL_DAYS,
    readyDays: availableDayNums.length,
    continue: { week: IELTS_BOOK_WEEK, day: nextDay },
    allDone,
    pct: IELTS_BOOK_TOTAL_DAYS ? Math.round((doneDays / IELTS_BOOK_TOTAL_DAYS) * 100) : 0,
  }
}

/** Một buổi đã mở khóa chưa (buổi đầu luôn mở; sau đó cần buổi trước hoàn thành). */
export function isBookDayUnlocked(dayNum, completed = []) {
  const prev = prevAvailable(Number(dayNum))
  if (prev == null) return true
  return completed.includes(`${IELTS_BOOK_WEEK}:${prev}`)
}
