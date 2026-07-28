import { reviewNext, isDue } from '@/lib/srsReview'

/**
 * "Sổ lỗi" ôn ngắt quãng XUYÊN BUỔI: gom câu sai (đọc/ngữ pháp/từ vựng/nghe…) rồi
 * cho ôn lại theo lịch Leitner (xem lib/srsReview.js) — chống quên, khác với quiz
 * chỉ sống trong 1 buổi. Local-only (chưa đẩy cloud).
 *
 * mistakes: { [id]: { id, q, answer, kind, box, due, addedAt } }
 *  - id  : khóa ổn định để không thêm trùng (vd "ielts:reading:10:2").
 *  - q   : đề/câu hỏi hiển thị khi ôn.
 *  - answer: đáp án đúng (string) để chấm khi ôn.
 *  - kind: 'reading' | 'grammar' | 'vocab' | 'listen' | … (để hiển thị/nhóm).
 */
export function state() {
  return { mistakes: {} }
}

export const getters = {
  /** Số câu tới hạn ôn (để hiện badge "Ôn N câu"). */
  dueMistakeCount: (s) => Object.values(s.mistakes).filter((m) => isDue(m)).length,
  /** Danh sách câu tới hạn ôn (mới đến hạn trước), giới hạn `limit`. */
  dueMistakes: (s) => (limit = 12) =>
    Object.values(s.mistakes)
      .filter((m) => isDue(m))
      .sort((a, b) => (a.due || 0) - (b.due || 0))
      .slice(0, limit),
  /** Tổng số câu trong sổ lỗi. */
  mistakeTotal: (s) => Object.keys(s.mistakes).length,
}

export const actions = {
  /**
   * Thêm một câu sai vào sổ lỗi (bỏ qua nếu thiếu dữ liệu hoặc đã có id đó — không
   * ghi đè lịch ôn đang chạy). Gọi khi học viên trả lời SAI ở các hoạt động chấm được.
   */
  addMistake({ id, q, answer, kind = '' } = {}) {
    if (!id || !q || !answer) return
    if (this.mistakes[id]) return
    this.mistakes[id] = { id, q, answer, kind, box: 0, due: Date.now(), addedAt: Date.now() }
    this.persist()
  },
  /**
   * Ghi nhận một lần ôn: đúng → lên box (giãn cách xa hơn); sai → về box 0. Khi đã
   * "thuộc" (lên hết box mà vẫn đúng) thì bỏ khỏi sổ.
   */
  reviewMistake(id, correct) {
    const m = this.mistakes[id]
    if (!m) return
    const nx = reviewNext(m.box || 0, !!correct, Date.now())
    if (nx.mastered) delete this.mistakes[id]
    else this.mistakes[id] = { ...m, box: nx.box, due: nx.due }
    this.persist()
  },
}

export function pick(s) {
  return { mistakes: s.mistakes }
}

export function applyDefaults(s = {}) {
  return { mistakes: s.mistakes && typeof s.mistakes === 'object' ? s.mistakes : {} }
}

/** Hợp nhất sổ lỗi 2 thiết bị: giữ bản có lịch ôn xa hơn (box cao / due muộn hơn). */
export function mergeMistakes(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) out[k] = v
    else out[k] = (v.box || 0) > (cur.box || 0) ? v : cur
  }
  return out
}
