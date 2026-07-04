import { ymd, laterDate } from './helpers'

/** Slice bài tập viết tại buổi (giàn giáo + kết quả AI chữa). Local-only. */

export function state() {
  return {
    // bài tập VIẾT làm tại bài (vd "Viết 10 câu…"), khóa theo "course:week:day":
    // { [key]: { text, done, at } }. Lưu cục bộ (localStorage) để không mất bài viết
    // và để khóa tiến độ; chưa đẩy lên cloud nên không cần đổi schema bảng progress.
    writings: {},
  }
}

export const getters = {
  /** Bài viết của một ngày (null nếu chưa viết). Dùng: user.writingOf('ielts',w,d). */
  writingOf: (s) => (course, week, day) => s.writings[`${course}:${week}:${day}`] || null,
  /** Đã NỘP xong bài viết của một ngày chưa? (dùng để khóa hoàn thành buổi) */
  writingDone: (s) => (course, week, day) => !!s.writings[`${course}:${week}:${day}`]?.done,
}

export const actions = {
  /**
   * Lưu bài tập viết của một ngày (text + trạng thái đã nộp + kết quả AI chữa).
   * Gọi khi gõ (lưu nháp) và khi AI chữa xong (done=true, kèm review). `done`
   * là "dính" — đã xong thì giữ.
   */
  saveWriting(course, week, day, text, done = false, review = undefined) {
    if (!course) return
    const key = `${course}:${week}:${day}`
    const prev = this.writings[key] || null
    this.writings[key] = {
      text: text ?? prev?.text ?? '',
      done: !!prev?.done || done,
      review: review !== undefined ? review : prev?.review || null, // kết quả AI chữa bài
      at: ymd(new Date()),
    }
    this.persist()
  },
}

export function pick(s) {
  return { writings: s.writings }
}

export function applyDefaults(s = {}) {
  return { writings: s.writings && typeof s.writings === 'object' ? s.writings : {} }
}

// Hợp nhất bài viết: mỗi ngày giữ bản mới hơn (theo `at`), OR trạng thái đã nộp.
export function mergeWritings(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) {
      out[k] = v
      continue
    }
    const keepNew = (v.at || '') > (cur.at || '')
    out[k] = {
      text: keepNew ? v.text : cur.text,
      done: !!(cur.done || v.done),
      review: (keepNew ? v.review : cur.review) || cur.review || v.review || null,
      at: laterDate(cur.at, v.at),
    }
  }
  return out
}
