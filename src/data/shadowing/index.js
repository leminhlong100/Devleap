// TỆP TỰ SINH bởi scripts/curate-shadowing.mjs — đừng sửa tay, hãy chạy lại script.
// Danh mục clip shadowing + hàm nạp động dữ liệu câu (JSON nằm trong ./clips).

const files = import.meta.glob('./clips/*.json')

/** Danh mục hiển thị ở trang chọn clip. */
export const shadowingClips = [
  {
    "videoId": "EkY9cCOIIKk",
    "title": "Restaurant Dialogue — Gọi món ở nhà hàng",
    "level": "A1-A2",
    "topic": "Nhà hàng",
    "sentenceCount": 21
  },
  {
    "videoId": "GpYsomFl6Bs",
    "title": "Shadowing Technique — Hướng dẫn nhập môn",
    "level": "A1-A2",
    "topic": "Cách luyện shadowing",
    "sentenceCount": 40
  }
]

/** Nạp đầy đủ một clip (kèm danh sách câu) theo videoId. */
export async function loadShadowingClip(videoId) {
  const loader = files['./clips/' + videoId + '.json']
  if (!loader) return null
  const mod = await loader()
  return mod.default || mod
}
