import { dayKey, ymd, isoWeekKey } from './helpers'
import { computeIeltsProgress, getIeltsDay } from '@/data/courseIelts'
import { computeJavaProgress, getJavaDay } from '@/data/course'
import { computeCommProgress, getCommDay } from '@/data/courseComm'
import { maybeRequestNotificationPermission } from '@/lib/studyReminder'
import { useAnalytics } from '@/composables/useAnalytics'

/**
 * Slice "tiến độ cốt lõi": ngày đã hoàn thành, streak, XP, huy hiệu, thẻ đã
 * thuộc (cũ), checklist việc-cần-làm-hôm-nay. Đây là nguồn suy ra mở khóa
 * tuần/ngày cho cả 2 khóa.
 */
const XP_PER_DAY = 50 // hoàn thành 1 ngày học
const XP_PER_WEEK = 150 // thưởng thêm khi xong trọn 1 tuần

export function state() {
  return {
    xp: 0,
    // XP tính riêng cho tuần ISO hiện tại (Bước 5.1 — leaderboard tuần), reset
    // qua `weekXpKey` (xem `addXp`/`subtractXp`). Không phải nguồn sự thật cho
    // tổng XP — chỉ để xếp hạng, `xp` (tổng) vẫn dùng cho level/streak như cũ.
    weekXp: 0,
    weekXpKey: null,
    streak: 0,
    badges: 0,
    lastStudyDate: null, // 'YYYY-M-D' của lần học gần nhất (tính streak)
    knownCards: [], // (cũ) index các flashcard đã thuộc — giữ để tương thích bản trước
    completed: { java: [], ielts: [], comm: [] }, // mảng khóa "week:day" đã hoàn thành
    // tiến độ checklist "việc cần làm hôm nay", khóa theo "course:week:day":
    // { [key]: [bool, bool, …] } theo thứ tự mục. Local-only (như writings) để
    // khóa hoàn thành buổi mà không phải đổi schema bảng progress.
    checklists: {},
    // Danh sách id khóa đã "Đăng ký" (tự chọn bắt đầu học) — khóa chưa có trong
    // đây thì thư viện khóa học hiện nút Đăng ký thay vì tiến độ, và router chặn
    // vào thẳng bằng URL. Xem `isEnrolled` bên dưới.
    enrolled: [],
  }
}

export const getters = {
  level: (s) => Math.floor(s.xp / 500) + 1,
  levelStart: (s) => Math.floor(s.xp / 500) * 500,
  xpPct(s) {
    const start = Math.floor(s.xp / 500) * 500
    return Math.max(0, Math.min(100, Math.round(((s.xp - start) / 500) * 100)))
  },
  knownCount: (s) => s.knownCards.length,
  /** Đếm số ngày đã hoàn thành của một khóa. */
  doneCount: (s) => (course) => (s.completed[course] || []).length,
  /** Một ngày đã hoàn thành chưa? Dùng như hàm: user.isDone('java', w, d). */
  isDone: (s) => (course, week, day) => (s.completed[course] || []).includes(dayKey(week, day)),
  /** Trạng thái tick của checklist một ngày (mảng bool theo thứ tự mục). */
  checklistState: (s) => (course, week, day) => s.checklists[`${course}:${week}:${day}`] || [],
  /**
   * Đã "vào học" khóa này chưa — đã bấm Đăng ký, HOẶC (tương thích ngược) đã có
   * ít nhất 1 buổi hoàn thành từ trước khi khái niệm Đăng ký tồn tại.
   */
  isEnrolled: (s) => (courseId) => s.enrolled.includes(courseId) || (s.completed[courseId] || []).length > 0,
  /**
   * Đã hoàn thành ít nhất 1 buổi hôm nay chưa — dùng để cảnh báo "sắp đứt streak".
   * Trả về HÀM (như `isCardDue`) chứ không phải boolean trực tiếp: Pinia cache
   * getter theo dependency reactive, mà "hôm nay" chỉ đổi theo đồng hồ thật (không
   * phải state) — nếu trả boolean thẳng, giá trị sẽ bị "đông cứng" qua nửa đêm
   * khi không có state nào khác đổi. Gọi như hàm: `user.studiedToday()`.
   */
  studiedToday: (s) => () => s.lastStudyDate === ymd(new Date()),
  /**
   * Buổi học tiếp theo cho MỖI khóa đang học (bỏ qua khóa chưa từng học hoặc đã
   * xong hết) — dùng cho khối "Học tiếp" ở Home. Đọc `quizPassed` (quizSlice)
   * qua `this` nên viết dạng function thường, không phải arrow.
   */
  nextLesson() {
    const out = []
    if (this.completed.ielts.length) {
      const prog = computeIeltsProgress(this.completed.ielts, (w) => this.quizPassed('ielts', `week:${w}`))
      if (!prog.allDone) {
        const day = getIeltsDay(prog.continue.week, prog.continue.day)
        out.push({
          course: 'ielts',
          label: 'IELTS',
          route: 'ielts-day',
          week: prog.continue.week,
          day: prog.continue.day,
          title: day?.title || '',
        })
      }
    }
    if (this.completed.java.length) {
      const prog = computeJavaProgress(this.completed.java)
      if (!prog.allDone) {
        const day = getJavaDay(prog.continue.week, prog.continue.day)
        out.push({
          course: 'java',
          label: 'Java',
          route: 'java-day',
          week: prog.continue.week,
          day: prog.continue.day,
          title: day?.title || '',
        })
      }
    }
    if ((this.completed.comm || []).length) {
      const prog = computeCommProgress(this.completed.comm, (w) => this.quizPassed('comm', `week:${w}`))
      if (!prog.allDone) {
        const day = getCommDay(prog.continue.week, prog.continue.day)
        out.push({
          course: 'comm',
          label: 'Giao tiếp',
          route: 'comm-day',
          week: prog.continue.week,
          day: prog.continue.day,
          title: day?.title || '',
        })
      }
    }
    return out
  },
}

export const actions = {
  /**
   * Bật/tắt trạng thái hoàn thành của một ngày học.
   * `totalDays` = số ngày của tuần (để tính thưởng & huy hiệu khi xong trọn tuần).
   * `vocabTerms` (tùy chọn) = từ vựng của buổi — chỉ dùng để tự "gieo" lịch SRS
   * (xem `seedSrsFromDay`) khi vừa đánh dấu hoàn thành, không ảnh hưởng XP/badge.
   */
  toggleDay(course, week, day, totalDays = 0, vocabTerms = []) {
    const arr = this.completed[course] || (this.completed[course] = [])
    const k = dayKey(week, day)
    const i = arr.indexOf(k)
    const weekCount = () => arr.filter((x) => x.startsWith(`${week}:`)).length

    if (i === -1) {
      // Đánh dấu hoàn thành
      arr.push(k)
      this.addXp(XP_PER_DAY)
      if (totalDays > 0 && weekCount() === totalDays) {
        this.addXp(XP_PER_WEEK)
        this.badges += 1
      }
      this.bumpStreak()
      this.seedSrsFromDay(course, vocabTerms)
      // Mức 2 của Bước 4.4: xin quyền Notification đúng lúc vừa đủ buổi thứ 3
      // (đúng thời điểm "engagement" — không hỏi ngay lần đầu mở app).
      maybeRequestNotificationPermission((this.completed.java || []).length + (this.completed.ielts || []).length)
      // Bước 4.1 — đo "hoàn thành buổi" (không bắn khi bỏ đánh dấu).
      useAnalytics().track('lesson_complete', { course, week, day })
    } else {
      // Bỏ đánh dấu — hoàn lại XP/huy hiệu đã cấp
      const wasWeekDone = totalDays > 0 && weekCount() === totalDays
      arr.splice(i, 1)
      this.subtractXp(XP_PER_DAY)
      if (wasWeekDone) {
        this.subtractXp(XP_PER_WEEK)
        this.badges = Math.max(0, this.badges - 1)
      }
    }
    this.persist()
  },

  /** Cập nhật streak dựa trên ngày học gần nhất (hôm nay / hôm qua / đứt chuỗi). */
  bumpStreak() {
    const today = ymd(new Date())
    if (this.lastStudyDate === today) return
    const y = new Date()
    y.setDate(y.getDate() - 1)
    this.streak = this.lastStudyDate === ymd(y) ? this.streak + 1 : 1
    this.lastStudyDate = today
  },

  /**
   * Nguồn DUY NHẤT cộng XP trong toàn app (mọi slice khác gọi `this.addXp(...)`
   * thay vì tự `this.xp += ...`) — để mọi lượt cộng XP đều tính vào `weekXp`
   * (Bước 5.1, leaderboard tuần) mà không phải sửa rải rác từng nơi thưởng XP.
   */
  addXp(amount) {
    this._rolloverWeekXp()
    this.xp += amount
    this.weekXp += amount
    this.persist()
  },

  /** Trừ XP đã cấp nhầm/hoàn tác (vd bỏ đánh dấu buổi đã hoàn thành). */
  subtractXp(amount) {
    this._rolloverWeekXp()
    this.xp = Math.max(0, this.xp - amount)
    this.weekXp = Math.max(0, this.weekXp - amount)
    this.persist()
  },

  /** Sang tuần ISO mới thì reset bộ đếm XP-tuần (không đụng tổng XP). */
  _rolloverWeekXp() {
    const key = isoWeekKey(new Date())
    if (this.weekXpKey !== key) {
      this.weekXpKey = key
      this.weekXp = 0
    }
  },

  markCardKnown(index) {
    if (!this.knownCards.includes(index)) {
      this.knownCards.push(index)
      this.addXp(20)
    }
  },

  /**
   * Lưu trạng thái tick của checklist một ngày (mảng bool). Dùng để khóa hoàn
   * thành buổi: phải tick hết các mục mới qua được.
   */
  setChecklist(course, week, day, arr) {
    if (!course) return
    this.checklists[`${course}:${week}:${day}`] = Array.isArray(arr) ? arr.slice() : []
    this.persist()
  },

  /** "Đăng ký" một khóa — đánh dấu đã chọn học để thư viện + router cho vào. */
  enroll(courseId) {
    if (!courseId || this.enrolled.includes(courseId)) return
    this.enrolled.push(courseId)
    this.persist()
  },
}

/** Phần của snapshot bền hóa thuộc slice này. */
export function pick(s) {
  return {
    xp: s.xp,
    weekXp: s.weekXp,
    weekXpKey: s.weekXpKey,
    streak: s.streak,
    badges: s.badges,
    lastStudyDate: s.lastStudyDate,
    knownCards: s.knownCards,
    completed: s.completed,
    checklists: s.checklists,
    enrolled: s.enrolled,
  }
}

/** Áp một snapshot thô vào state của slice này (đảm bảo shape luôn đầy đủ). */
export function applyDefaults(s = {}) {
  return {
    xp: s.xp ?? 0,
    weekXp: s.weekXp ?? 0,
    weekXpKey: s.weekXpKey ?? null,
    streak: s.streak ?? 0,
    badges: s.badges ?? 0,
    lastStudyDate: s.lastStudyDate ?? null,
    knownCards: Array.isArray(s.knownCards) ? s.knownCards : [],
    completed: { java: [], ielts: [], comm: [], ...(s.completed || {}) },
    checklists: s.checklists && typeof s.checklists === 'object' ? s.checklists : {},
    enrolled: Array.isArray(s.enrolled) ? s.enrolled : [],
  }
}

// Hợp nhất checklist: mỗi ngày OR theo từng vị trí (đã tick ở thiết bị nào thì giữ).
export function mergeChecklists(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) {
      out[k] = v
      continue
    }
    const len = Math.max(cur.length, v.length)
    out[k] = Array.from({ length: len }, (_, i) => !!cur[i] || !!v[i])
  }
  return out
}

/**
 * Hợp nhất XP-tuần giữa 2 thiết bị: cùng tuần ISO thì lấy lớn hơn (như `xp`
 * tổng); khác tuần thì tuần MỚI HƠN thắng toàn bộ (khóa dạng "YYYY-Wnn" so
 * sánh lexicographic đúng thứ tự thời gian) — tránh cộng nhầm XP của tuần cũ
 * (đã hết hạn xếp hạng) vào tuần đang tính trên thiết bị khác.
 */
export function mergeWeekXp(a = {}, b = {}) {
  const ak = a.weekXpKey || null
  const bk = b.weekXpKey || null
  if (ak === bk) return { weekXpKey: ak, weekXp: Math.max(a.weekXp || 0, b.weekXp || 0) }
  if (!ak) return { weekXpKey: bk, weekXp: b.weekXp || 0 }
  if (!bk) return { weekXpKey: ak, weekXp: a.weekXp || 0 }
  return ak > bk ? { weekXpKey: ak, weekXp: a.weekXp || 0 } : { weekXpKey: bk, weekXp: b.weekXp || 0 }
}
