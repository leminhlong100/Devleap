import { fetchClipsByWeek, fetchClip } from './shadowingRepo'

/**
 * Danh sách câu thô của 1 clip shadowing — chấp cả 2 dạng lưu trữ:
 * mảng phẳng (clip gợi ý có sẵn) hoặc `{ ai, original }` (clip đã curate/tải từ
 * URL, ưu tiên bản AI đã đánh bóng — xem docs/KE_HOACH_CAI_TIEN_WEBSITE.md Bước 1.3).
 */
export function clipSentenceList(clip) {
  const s = clip?.sentences
  if (!s) return []
  if (Array.isArray(s)) return s
  return s.ai?.length ? s.ai : s.original || []
}

/** Lấy tối đa `n` câu đầu clip (có start/end thật) để làm bài nghe-chép. */
export function pickDictationSentences(clip, n = 5) {
  return clipSentenceList(clip)
    .slice(0, n)
    .filter((s) => s && s.text && typeof s.start === 'number' && typeof s.end === 'number')
    .map((s) => ({ text: s.text, start: s.start, end: s.end }))
}

/**
 * Bộ câu nghe-chép lấy từ clip THẬT đã curate cho một tuần (giai đoạn nghe
 * "clip gốc", xem `src/data/ieltsListeningStage.js`) — thay cho câu TTS mặc định
 * của `ListeningDictation.vue`. Trả `null` nếu tuần chưa có clip nào curate (rơi
 * về TTS như cũ, không phải lỗi).
 */
export async function dictationClipForWeek(week, n = 5) {
  const list = await fetchClipsByWeek(week)
  if (!list.length) return null
  const clip = await fetchClip(list[0].videoId)
  if (!clip) return null
  const sentences = pickDictationSentences(clip, n)
  if (!sentences.length) return null
  return { videoId: clip.videoId, title: clip.title, sentences }
}
