import { schedule, seedSchedule, isDue, GRADES } from '@/lib/srs'
import { lookupVocab } from '@/data/vocabGlossary'
import { normalizeTerm } from './helpers'

/** Slice SRS (spaced repetition) — lịch ôn tập theo từng thẻ. */

export function state() {
  return {
    // lịch ôn tập theo từng thẻ: { [srsId]: { ease, interval, reps, lapses, due, last } }
    srs: {},
  }
}

// XP thưởng khi ôn một thẻ đang đến hạn (chấm "Khó" được ít hơn "Tốt/Dễ").
const XP_REVIEW = { hard: 5, good: 10, easy: 10 }

export const getters = {
  /** Lịch ôn của một thẻ (null nếu chưa từng ôn). Dùng: user.srsOf(id). */
  srsOf: (s) => (id) => s.srs[id] || null,
  /** Thẻ có đang đến hạn ôn không? Thẻ mới (chưa có lịch) coi như đến hạn. */
  isCardDue: (s) => (id) => isDue(s.srs[id]),
  /** Số thẻ đến hạn trong một danh sách srsId (để hiện huy hiệu "đến hạn"). */
  dueCount: (s) => (ids = []) => ids.filter((id) => isDue(s.srs[id])).length,
  /** Số thẻ đã có lịch ôn (đã học ít nhất 1 lần). */
  srsLearned: (s) => Object.keys(s.srs).length,
  /**
   * Mọi srsId đang đến hạn ôn hôm nay, gộp mọi nguồn: thẻ đã có lịch (đến
   * hạn/quá hạn) + từ vừa lưu khi chat AI nhưng CHƯA từng ôn lần nào (thẻ mới
   * luôn tính là đến hạn — savedWords không tự ghi vào `srs` cho tới lần ôn đầu).
   */
  dueSrsIds: (s) => {
    const ids = new Set(Object.keys(s.srs).filter((id) => isDue(s.srs[id])))
    for (const w of Object.values(s.savedWords)) {
      if (w.srsId && !s.srs[w.srsId]) ids.add(w.srsId)
    }
    return Array.from(ids)
  },
  /** Tổng số từ đến hạn ôn hôm nay — dùng cho banner nhắc ở Home/course. */
  dueTodayCount() {
    return this.dueSrsIds.length
  },
  /**
   * Thẻ đến hạn ôn hôm nay, tra ngược nghĩa/IPA/ví dụ để nạp thẳng cho
   * FlashcardTool (deck `due`) mà không cần tải dữ liệu khóa học. Ưu tiên
   * savedWords (đủ context); còn lại tra `vocabGlossary.js` theo từ suy ra
   * từ srsId (`course:từ`). Không tìm được nghĩa thì vẫn hiện thẻ (để trống).
   */
  dueWords(s) {
    const savedBySrsId = new Map(Object.values(s.savedWords).map((w) => [w.srsId, w]))
    return this.dueSrsIds.map((id) => {
      const saved = savedBySrsId.get(id)
      if (saved) return saved
      const term = id.slice(id.indexOf(':') + 1)
      const g = lookupVocab(term)
      return {
        term,
        ipa: g?.ipa || '',
        cat: 'Từ vựng',
        vi: g?.vi || '',
        ex: g?.ex ? g.ex.replace('{w}', term) : '',
        srsId: id,
      }
    })
  },
}

export const actions = {
  /**
   * Ôn một flashcard và cập nhật lịch giãn cách (SM-2).
   * @param {string} id  srsId của thẻ (vd "java:inheritance").
   * @param {'again'|'hard'|'good'|'easy'} grade  Mức độ nhớ vừa chấm.
   *
   * Chỉ thưởng XP + tính streak khi thẻ *đang đến hạn* và không phải "Quên" —
   * tránh cày XP bằng cách ôn đi ôn lại một thẻ đã thuộc trước hạn.
   */
  reviewCard(id, grade) {
    if (!id || !GRADES.includes(grade)) return
    const prev = this.srs[id] || null
    const wasDue = isDue(prev)
    this.srs[id] = schedule(prev, grade)
    if (wasDue && grade !== 'again') {
      this.xp += XP_REVIEW[grade] || 0
      this.bumpStreak()
    }
    this.persist()
  },

  /**
   * "Gieo" lịch ôn SRS mặc định cho từ vựng của một buổi vừa hoàn thành, để
   * người học vẫn được nhắc ôn dù chưa từng tự lật flashcard. Chỉ áp dụng khóa
   * IELTS (Java học thuật ngữ qua flashcard riêng, không theo "từ vựng buổi").
   * Không đè lịch đã có (thẻ đã ôn thật giữ nguyên tiến độ); KHÔNG cộng XP
   * (tránh farm XP bằng cách tắt/bật lại hoàn thành buổi).
   * @param {string[]|{term:string}[]} terms  danh sách từ (chuỗi hoặc object có `.term`).
   */
  seedSrsFromDay(course, terms = []) {
    if (course !== 'ielts' || !Array.isArray(terms) || !terms.length) return
    const seen = new Set()
    for (const raw of terms) {
      const term = typeof raw === 'string' ? raw : raw?.term
      const key = normalizeTerm(term)
      if (!key || seen.has(key)) continue
      seen.add(key)
      const id = `ielts:${key}`
      if (!this.srs[id]) this.srs[id] = seedSchedule()
    }
  },
}

export function pick(s) {
  return { srs: s.srs }
}

export function applyDefaults(s = {}) {
  return { srs: s.srs && typeof s.srs === 'object' ? s.srs : {} }
}

// Hợp nhất lịch SRS: với mỗi thẻ, giữ bản ôn gần nhất (so theo `last`, dạng ISO).
export function mergeSrs(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur || (v.last || '') > (cur.last || '')) out[k] = v
  }
  return out
}
