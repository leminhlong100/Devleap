/**
 * Xuất/nhập dữ liệu học tập (trang Hồ sơ, Bước 2.3) — cho người dùng tự sao
 * lưu tiến độ (XP, ngày hoàn thành, SRS, quiz, từ đã lưu, bài viết, nhật ký
 * nói…) ra 1 file JSON, và nạp lại khi cần (máy mới, khôi phục sau lỗi…).
 *
 * Tái dùng thẳng `snapshot()`/`applySnapshot()` của store `user` — cùng dữ
 * liệu đã đồng bộ cloud, chỉ bọc thêm version + thời điểm xuất để nhận diện.
 */

const EXPORT_VERSION = 1

/** Đóng gói snapshot tiến độ hiện tại thành object sẵn sàng `JSON.stringify`. */
export function buildExportPayload(snapshot, exportedAt = new Date().toISOString()) {
  return {
    app: 'devleap',
    version: EXPORT_VERSION,
    exportedAt,
    data: snapshot,
  }
}

/**
 * Kiểm tra + bóc tách 1 file JSON đã nạp. Trả về { ok: true, data } nếu hợp lệ,
 * hoặc { ok: false, error } (tiếng Việt) nếu sai định dạng — không throw để UI
 * tự hiển thị lỗi.
 */
export function parseImportPayload(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' }
  }
  if (!parsed || typeof parsed !== 'object' || parsed.app !== 'devleap' || !parsed.data || typeof parsed.data !== 'object') {
    return { ok: false, error: 'File không đúng định dạng sao lưu DevLeap.' }
  }
  return { ok: true, data: parsed.data }
}
