/**
 * Ghi âm "mốc 0" (và các bản ghi sản phẩm khác) bằng MediaRecorder.
 *
 * Bản ghi là blob âm thanh khá nặng nên KHÔNG nhét vào Pinia store / localStorage
 * (sẽ phình snapshot đồng bộ Supabase). Thay vào đó lưu vào IndexedDB — chứa blob
 * gọn gàng, dung lượng lớn, vẫn còn sau khi tải lại. Đây là tư liệu cá nhân theo
 * thiết bị (bản ghi mốc xuất phát để cuối khóa nghe lại so sánh), không cần đồng bộ.
 */

const DB_NAME = 'devleap'
const STORE = 'recordings'

let dbPromise = null

/** Mở (hoặc tạo) IndexedDB chứa bản ghi. Trả về Promise<IDBDatabase>. */
function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB không khả dụng'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/** Thực thi một thao tác trên object store, trả về Promise theo kết quả request. */
async function tx(mode, run) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = run(store)
    t.oncomplete = () => resolve(req ? req.result : undefined)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

/** Lưu một bản ghi theo khóa (vd "ielts:1:1"). */
export async function saveRecording(key, blob) {
  if (!key || !blob) return
  await tx('readwrite', (s) => s.put(blob, key))
}

/** Đọc bản ghi đã lưu (Blob) — null nếu chưa có / lỗi. */
export async function loadRecording(key) {
  if (!key) return null
  try {
    const blob = await tx('readonly', (s) => s.get(key))
    return blob || null
  } catch {
    return null
  }
}

/** Xóa một bản ghi. */
export async function deleteRecording(key) {
  if (!key) return
  try {
    await tx('readwrite', (s) => s.delete(key))
  } catch {
    /* ignore */
  }
}

/** Trình duyệt có hỗ trợ ghi âm không? */
export function recordingSupported() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  )
}

/** Chọn mime type được hỗ trợ (Chrome/Edge: webm/opus; Safari: mp4). '' = mặc định. */
function pickMime() {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const m of cands) {
    if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

/**
 * Bắt đầu ghi âm. Trả về một handle:
 *   - stop(): Promise<Blob> — dừng & trả bản ghi (đồng thời tắt micro).
 *   - cancel(): hủy, không trả bản ghi (tắt micro).
 * Ném lỗi nếu người dùng từ chối micro hoặc trình duyệt không hỗ trợ.
 */
export async function startRecording() {
  if (!recordingSupported()) throw new Error('Trình duyệt không hỗ trợ ghi âm')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = pickMime()
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks = []
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data)
  }
  rec.start()

  const cleanup = () => stream.getTracks().forEach((t) => t.stop())

  return {
    stop() {
      return new Promise((resolve) => {
        rec.onstop = () => {
          cleanup()
          resolve(new Blob(chunks, { type: mime || 'audio/webm' }))
        }
        rec.stop()
      })
    },
    cancel() {
      try {
        if (rec.state !== 'inactive') rec.stop()
      } catch {
        /* ignore */
      }
      cleanup()
    },
  }
}
