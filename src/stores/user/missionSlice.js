import { ymd, laterDate } from './helpers'

/** Slice mission tuần + buổi nói người thật + khảo sát cảm nhận cuối tuần. */

// Mission tuần (real-life, ngoài app) — thưởng lớn hơn 1 buổi học thường vì đòi
// hỏi rủi ro thật (nói/viết với người thật), không phải chỉ hoàn thành trong app.
const XP_MISSION = 150
// Buổi nói người thật — rủi ro thật nhưng nhẹ hơn Mission (không cần bằng chứng
// dán link, chỉ cần 3 dòng sổ lỗi đời thực sau buổi nói).
const XP_REAL_TALK = 100

export function state() {
  return {
    // Mission tuần (real-life, ngoài app) — khóa theo "course:week:day":
    // { [key]: { note, done, at } }. note = ghi chú/link bằng chứng người học dán vào.
    // Local-only như writings/checklists (chưa đổi schema bảng progress).
    missions: {},

    // Buổi nói người thật (2 tuần/lần từ Tuần 3) — cùng hình dạng với `missions`,
    // khóa theo "course:week:day": { note, done, at }. note = 3 dòng sổ lỗi đời
    // thực sau buổi nói. Local-only.
    realTalks: {},

    // Khảo sát cảm nhận cuối tuần (Dễ/Vừa/Khó), khóa theo "course:week":
    // { [key]: { rating: 'easy'|'ok'|'hard'|'skipped', note, at } }. Đầu vào duy
    // nhất để hiệu chỉnh độ khó (xem docs/KE_HOACH_DO_KHO_KHOA_HOC.md mục 5).
    // Ghi cả trường hợp "bỏ qua" để modal không hỏi lại tuần đó. Đồng bộ cloud
    // (cột `week_feedback`) như srs/completed — khác với writings/missions vốn
    // chỉ local, vì dữ liệu này cần tổng hợp được kể cả khi đổi thiết bị.
    weekFeedback: {},
  }
}

export const getters = {
  /** Mission tuần của một ngày (null nếu chưa làm). Dùng: user.missionOf('ielts',w,d). */
  missionOf: (s) => (course, week, day) => s.missions[`${course}:${week}:${day}`] || null,
  /** Đã đánh dấu hoàn thành Mission tuần của ngày này chưa? */
  missionDone: (s) => (course, week, day) => !!s.missions[`${course}:${week}:${day}`]?.done,
  /** Buổi nói người thật của một ngày (null nếu chưa làm). */
  realTalkOf: (s) => (course, week, day) => s.realTalks[`${course}:${week}:${day}`] || null,
  /** Đã đánh dấu hoàn thành buổi nói người thật của ngày này chưa? */
  realTalkDone: (s) => (course, week, day) => !!s.realTalks[`${course}:${week}:${day}`]?.done,
  /** Khảo sát cảm nhận của một tuần (null nếu chưa trả lời/bỏ qua). */
  weekFeedbackOf: (s) => (course, week) => s.weekFeedback[`${course}:${week}`] || null,
}

export const actions = {
  /**
   * Lưu Mission tuần của một ngày (ghi chú/link bằng chứng + trạng thái đánh dấu
   * xong). `done` là "dính" — đã đánh dấu xong thì giữ (gõ thêm ghi chú không mất
   * XP đã thưởng). Chỉ thưởng XP vào LẦN ĐẦU đánh dấu xong (tránh cày XP).
   */
  saveMission(course, week, day, note, done = false) {
    if (!course) return
    const key = `${course}:${week}:${day}`
    const prev = this.missions[key] || null
    const wasDone = !!prev?.done
    this.missions[key] = {
      note: note ?? prev?.note ?? '',
      done: wasDone || !!done,
      at: ymd(new Date()),
    }
    if (!wasDone && this.missions[key].done) {
      this.addXp(XP_MISSION)
      this.badges += 1
      this.bumpStreak()
    }
    this.persist()
  },

  /**
   * Lưu buổi nói người thật của một ngày (3 dòng sổ lỗi đời thực + trạng thái
   * đánh dấu xong). Cùng cơ chế "dính" + thưởng-1-lần như `saveMission`.
   */
  saveRealTalk(course, week, day, note, done = false) {
    if (!course) return
    const key = `${course}:${week}:${day}`
    const prev = this.realTalks[key] || null
    const wasDone = !!prev?.done
    this.realTalks[key] = {
      note: note ?? prev?.note ?? '',
      done: wasDone || !!done,
      at: ymd(new Date()),
    }
    if (!wasDone && this.realTalks[key].done) {
      this.addXp(XP_REAL_TALK)
      this.bumpStreak()
    }
    this.persist()
  },

  /**
   * Lưu cảm nhận khảo sát cuối tuần (Dễ/Vừa/Khó) hoặc đánh dấu "bỏ qua". Ghi cả
   * hai trường hợp để modal không hỏi lại tuần đó ở lần sau. Không cộng XP —
   * đây chỉ là dữ liệu thu thập để hiệu chỉnh độ khó, không phải hoạt động học.
   * @param {'easy'|'ok'|'hard'|'skipped'} rating
   */
  saveWeekFeedback(course, week, rating, note = '') {
    if (!course || !week || !rating) return
    this.weekFeedback[`${course}:${week}`] = { rating, note: note || '', at: ymd(new Date()) }
    this.persist()
  },
}

export function pick(s) {
  return { missions: s.missions, realTalks: s.realTalks, weekFeedback: s.weekFeedback }
}

export function applyDefaults(s = {}) {
  return {
    missions: s.missions && typeof s.missions === 'object' ? s.missions : {},
    realTalks: s.realTalks && typeof s.realTalks === 'object' ? s.realTalks : {},
    weekFeedback: s.weekFeedback && typeof s.weekFeedback === 'object' ? s.weekFeedback : {},
  }
}

// Hợp nhất Mission tuần (và buổi nói người thật, cùng hình dạng): mỗi ngày giữ
// bản mới hơn (theo `at`), OR trạng thái đã xong.
export function mergeMissions(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) {
      out[k] = v
      continue
    }
    const keepNew = (v.at || '') > (cur.at || '')
    out[k] = {
      note: keepNew ? v.note : cur.note,
      done: !!(cur.done || v.done),
      at: laterDate(cur.at, v.at),
    }
  }
  return out
}

// Hợp nhất khảo sát cảm nhận tuần: mỗi tuần giữ bản mới hơn (theo `at`) — chỉ
// một lượt trả lời/tuần nên không cần OR trạng thái như mission/writing.
export function mergeWeekFeedback(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur || (v.at || '') > (cur.at || '')) out[k] = v
  }
  return out
}
