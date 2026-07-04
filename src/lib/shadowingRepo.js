import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Lớp truy cập dữ liệu clip Shadowing.
 *
 * Hai nguồn được GỘP lại:
 * - File tĩnh `public/data/shadowing-clips.json` — bộ clip đã curate sẵn qua
 *   `scripts/curate-shadowing.mjs` (xem docs/KE_HOACH_CAI_TIEN_WEBSITE.md Bước
 *   1.3), luôn có sẵn kể cả chế độ khách / chưa cấu hình Supabase.
 * - Bảng `shadowing_clips` trên Supabase — clip admin tự thêm/sửa qua
 *   `/admin/shadowing`, không cần deploy lại. Cùng `videoId` thì bản Supabase
 *   THẮNG (admin có thể ghi đè một clip đã seed sẵn).
 */

let staticClipsPromise = null

/** Nạp + cache bộ clip tĩnh trong phiên (tránh fetch lại mỗi lần gọi). */
function loadStaticClips() {
  if (!staticClipsPromise) {
    staticClipsPromise = fetch('/data/shadowing-clips.json')
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
  }
  return staticClipsPromise
}

function toListItem(c) {
  return {
    videoId: c.videoId,
    title: c.title,
    level: c.level,
    topic: c.topic,
    sentenceCount: c.sentenceCount ?? countSentences(c.sentences),
    week: c.week ?? null,
  }
}

/** Gộp 2 danh mục theo `videoId`, bản sau (`overrides`) thắng khi trùng. */
function mergeByVideoId(base, overrides) {
  const map = new Map(base.map((c) => [c.videoId, c]))
  for (const c of overrides) map.set(c.videoId, c)
  return [...map.values()]
}

/** Danh mục clip (cột nhẹ) cho lưới chọn clip — tĩnh + Supabase gộp lại. */
export async function fetchClipList() {
  const staticItems = (await loadStaticClips()).map(toListItem)
  if (!isCloudEnabled) return staticItems
  const { data, error } = await supabase
    .from('shadowing_clips')
    .select('video_id, title, level, topic, sentence_count, week')
    .order('created_at', { ascending: true })
  if (error) throw error
  const cloudItems = (data || []).map((r) => ({
    videoId: r.video_id,
    title: r.title,
    level: r.level,
    topic: r.topic,
    sentenceCount: r.sentence_count,
    week: r.week,
  }))
  return mergeByVideoId(staticItems, cloudItems)
}

/**
 * Danh mục clip đã curate cho MỘT tuần cụ thể của khóa IELTS (thang nghe "thật
 * hóa dần" — xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.5). Trả rỗng nếu chưa
 * curate bài nào cho tuần đó (bình thường, không phải lỗi).
 */
export async function fetchClipsByWeek(week) {
  if (!week) return []
  const list = await fetchClipList()
  return list.filter((c) => c.week === Number(week))
}

/** Nạp đầy đủ một clip (kèm câu) theo videoId. Trả null nếu không có. */
export async function fetchClip(videoId) {
  if (isCloudEnabled) {
    const { data, error } = await supabase
      .from('shadowing_clips')
      .select('*')
      .eq('video_id', videoId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      return {
        videoId: data.video_id,
        title: data.title,
        level: data.level,
        topic: data.topic,
        lang: data.lang,
        week: data.week,
        sentences: data.sentences, // { ai, original }
      }
    }
  }
  const staticClips = await loadStaticClips()
  return staticClips.find((c) => c.videoId === videoId) || null
}

/** Đếm số câu của clip (ưu tiên bản AI, fallback original). */
function countSentences(sentences) {
  if (Array.isArray(sentences)) return sentences.length
  return sentences?.ai?.length || sentences?.original?.length || 0
}

/**
 * Thêm/sửa một clip (admin). payload: { videoId, title, level, topic, lang, week, sentences }.
 * `week` (1-8, tùy chọn) gắn clip với một tuần của khóa IELTS nền tảng — dùng để
 * gợi ý bài shadowing/nghe thật trong buổi học của tuần đó (Tuần 4-8, xem
 * fetchClipsByWeek). Dùng upsert theo khóa video_id nên gọi lại cùng video sẽ ghi đè.
 */
export async function saveClip(payload) {
  if (!isCloudEnabled) throw new Error('Chưa cấu hình Supabase — không thể lưu clip.')
  const row = {
    video_id: payload.videoId,
    title: payload.title,
    level: payload.level,
    topic: payload.topic || null,
    lang: payload.lang || 'en',
    week: payload.week ? Number(payload.week) : null,
    sentences: payload.sentences,
    sentence_count: countSentences(payload.sentences),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('shadowing_clips').upsert(row, { onConflict: 'video_id' })
  if (error) throw error
}

/** Xóa một clip theo videoId (admin). */
export async function deleteClip(videoId) {
  if (!isCloudEnabled) throw new Error('Chưa cấu hình Supabase — không thể xóa clip.')
  const { error } = await supabase.from('shadowing_clips').delete().eq('video_id', videoId)
  if (error) throw error
}
