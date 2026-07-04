/**
 * Đồng bộ bản ghi âm (mốc 0, sản phẩm buổi…) lên Supabase Storage.
 *
 * `src/lib/recorder.js` lưu blob vào IndexedDB — cục bộ theo thiết bị. Module
 * này là lớp phụ, best-effort: đẩy thêm 1 bản lên Storage khi có đăng nhập, để
 * đổi máy vẫn nghe lại được (tải về theo yêu cầu, không tự tải hết mọi máy).
 * Guest mode (không cấu hình Supabase / chưa đăng nhập): mọi hàm no-op.
 */
import { supabase, isCloudEnabled } from './supabase'
import { loadRecording } from './recorder'

const BUCKET = 'recordings'
const PENDING_KEY = 'devleap:pending-recording-uploads'

// Storage path không được chứa ':' — recId có dạng "ielts:1:1".
function escapeKey(key) {
  return String(key).replace(/:/g, '_')
}
function storagePath(userId, key) {
  return `${userId}/${escapeKey(key)}.webm`
}

function readPending() {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}
function writePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}
function addPending(userId, key) {
  const list = readPending()
  if (!list.some((p) => p.userId === userId && p.key === key)) {
    writePending([...list, { userId, key }])
  }
}
function removePending(userId, key) {
  writePending(readPending().filter((p) => !(p.userId === userId && p.key === key)))
}

/** Đẩy 1 bản ghi lên Storage. Lỗi mạng thì xếp hàng thử lại sau (không ném lỗi). */
export async function uploadRecording(userId, key, blob) {
  if (!isCloudEnabled || !userId || !key || !blob) return false
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath(userId, key), blob, { upsert: true, contentType: blob.type || 'audio/webm' })
    if (error) throw error
    removePending(userId, key)
    return true
  } catch {
    addPending(userId, key)
    return false
  }
}

/** Tải 1 bản ghi từ Storage (Blob) — null nếu không có / lỗi. */
export async function downloadRecording(userId, key) {
  if (!isCloudEnabled || !userId || !key) return null
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath(userId, key))
    if (error) throw error
    return data || null
  } catch {
    return null
  }
}

/** Bản ghi này có mặt trên Storage không — kiểm tra rẻ (list lọc theo tên), không tải blob. */
export async function remoteRecordingExists(userId, key) {
  if (!isCloudEnabled || !userId || !key) return false
  try {
    const escaped = escapeKey(key)
    const { data, error } = await supabase.storage.from(BUCKET).list(userId, { search: escaped })
    if (error) throw error
    return (data || []).some((f) => f.name === `${escaped}.webm`)
  } catch {
    return false
  }
}

/** Xóa bản ghi trên Storage (best-effort, dùng khi người học xóa bản ghi local). */
export async function deleteRemoteRecording(userId, key) {
  if (!isCloudEnabled || !userId || !key) return
  try {
    await supabase.storage.from(BUCKET).remove([storagePath(userId, key)])
    removePending(userId, key)
  } catch {
    /* ignore */
  }
}

/** Thử đẩy lại các bản ghi lỡ lỗi mạng lần trước. Gọi khi vừa đăng nhập / có mạng lại. */
export async function flushPendingUploads(userId) {
  if (!isCloudEnabled || !userId) return
  for (const p of readPending().filter((p) => p.userId === userId)) {
    const blob = await loadRecording(p.key)
    if (blob) await uploadRecording(userId, p.key, blob)
    else removePending(userId, p.key)
  }
}
