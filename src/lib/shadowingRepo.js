import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Lớp truy cập dữ liệu clip Shadowing.
 *
 * Nguồn chính là bảng `shadowing_clips` trên Supabase (thêm/sửa qua trang admin,
 * không cần deploy). Nếu chưa cấu hình Supabase (chế độ khách / dev local không
 * có .env) thì tự fallback về kho tĩnh cũ src/data/shadowing để app vẫn chạy.
 */

/** Fallback: nạp module tĩnh cũ chỉ khi cần (tránh kéo vào bundle khi đã có cloud). */
async function staticModule() {
  return import('@/data/shadowing')
}

/** Danh mục clip (cột nhẹ) cho lưới chọn clip. */
export async function fetchClipList() {
  if (!isCloudEnabled) {
    const { shadowingClips } = await staticModule()
    return shadowingClips
  }
  const { data, error } = await supabase
    .from('shadowing_clips')
    .select('video_id, title, level, topic, sentence_count')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((r) => ({
    videoId: r.video_id,
    title: r.title,
    level: r.level,
    topic: r.topic,
    sentenceCount: r.sentence_count,
  }))
}

/** Nạp đầy đủ một clip (kèm câu) theo videoId. Trả null nếu không có. */
export async function fetchClip(videoId) {
  if (!isCloudEnabled) {
    const { loadShadowingClip } = await staticModule()
    return loadShadowingClip(videoId)
  }
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
    sentences: data.sentences, // { ai, original }
  }
}

/** Đếm số câu của clip (ưu tiên bản AI, fallback original). */
function countSentences(sentences) {
  if (Array.isArray(sentences)) return sentences.length
  return sentences?.ai?.length || sentences?.original?.length || 0
}

/**
 * Thêm/sửa một clip (admin). payload: { videoId, title, level, topic, lang, sentences }.
 * Dùng upsert theo khóa video_id nên gọi lại cùng video sẽ ghi đè.
 */
export async function saveClip(payload) {
  if (!isCloudEnabled) throw new Error('Chưa cấu hình Supabase — không thể lưu clip.')
  const row = {
    video_id: payload.videoId,
    title: payload.title,
    level: payload.level,
    topic: payload.topic || null,
    lang: payload.lang || 'en',
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
