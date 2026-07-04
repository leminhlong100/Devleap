import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Lớp truy cập dữ liệu clip Shadowing.
 *
 * Nguồn duy nhất là bảng `shadowing_clips` trên Supabase (thêm/sửa qua trang
 * admin, không cần deploy). Khi chưa cấu hình Supabase (chế độ khách / dev local
 * không có .env), danh mục trả rỗng — người dùng vẫn dán URL YouTube để tự tạo bài.
 */

/** Danh mục clip (cột nhẹ) cho lưới chọn clip. */
export async function fetchClipList() {
  if (!isCloudEnabled) return []
  const { data, error } = await supabase
    .from('shadowing_clips')
    .select('video_id, title, level, topic, sentence_count, week')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((r) => ({
    videoId: r.video_id,
    title: r.title,
    level: r.level,
    topic: r.topic,
    sentenceCount: r.sentence_count,
    week: r.week,
  }))
}

/**
 * Danh mục clip đã curate cho MỘT tuần cụ thể của khóa IELTS (thang nghe "thật
 * hóa dần" — xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.5). Trả rỗng nếu chưa
 * curate bài nào cho tuần đó (bình thường, không phải lỗi).
 */
export async function fetchClipsByWeek(week) {
  if (!isCloudEnabled || !week) return []
  const { data, error } = await supabase
    .from('shadowing_clips')
    .select('video_id, title, level, topic, sentence_count, week')
    .eq('week', Number(week))
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((r) => ({
    videoId: r.video_id,
    title: r.title,
    level: r.level,
    topic: r.topic,
    sentenceCount: r.sentence_count,
    week: r.week,
  }))
}

/** Nạp đầy đủ một clip (kèm câu) theo videoId. Trả null nếu không có. */
export async function fetchClip(videoId) {
  if (!isCloudEnabled) return null
  const { data, error } = await supabase
    .from('shadowing_clips')
    .select('*')
    .eq('video_id', videoId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
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
