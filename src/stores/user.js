import { defineStore } from 'pinia'

/**
 * Trạng thái người học (gamification) — nguồn sự thật duy nhất cho tiến độ thật.
 *
 * Lưu danh sách ngày đã hoàn thành theo từng khóa (`completed.java`,
 * `completed.ielts`), từ đó suy ra: mở khóa tuần kế, streak, XP, huy hiệu.
 * Cấu trúc tuần/ngày (số ngày mỗi tuần) sống ở tầng dữ liệu khóa học
 * (`data/course.js`, `data/courseIelts.js`) để store không phải kéo các chunk
 * Markdown nặng — view truyền `totalDays` vào khi cần tính hoàn thành tuần.
 * Hiện lưu trong localStorage; sau này có thể thay bằng API.
 */
const LEVEL_SPAN = 500 // mỗi level rộng 500 XP
const XP_PER_DAY = 50 // hoàn thành 1 ngày học
const XP_PER_WEEK = 150 // thưởng thêm khi xong trọn 1 tuần
const STORAGE_KEY = 'devleap:user:v2'

const dayKey = (week, day) => `${week}:${day}`
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export const useUserStore = defineStore('user', {
  state: () => ({
    xp: 0,
    streak: 0,
    badges: 0,
    lastStudyDate: null, // 'YYYY-M-D' của lần học gần nhất (tính streak)
    knownCards: [], // index các flashcard đã thuộc
    completed: { java: [], ielts: [] }, // mảng khóa "week:day" đã hoàn thành
  }),

  getters: {
    level: (s) => Math.floor(s.xp / LEVEL_SPAN) + 1,
    levelStart: (s) => Math.floor(s.xp / LEVEL_SPAN) * LEVEL_SPAN,
    xpPct(s) {
      const start = Math.floor(s.xp / LEVEL_SPAN) * LEVEL_SPAN
      return Math.max(0, Math.min(100, Math.round(((s.xp - start) / LEVEL_SPAN) * 100)))
    },
    knownCount: (s) => s.knownCards.length,
    /** Đếm số ngày đã hoàn thành của một khóa. */
    doneCount: (s) => (course) => (s.completed[course] || []).length,
    /** Một ngày đã hoàn thành chưa? Dùng như hàm: user.isDone('java', w, d). */
    isDone: (s) => (course, week, day) =>
      (s.completed[course] || []).includes(dayKey(week, day)),
  },

  actions: {
    /**
     * Bật/tắt trạng thái hoàn thành của một ngày học.
     * `totalDays` = số ngày của tuần (để tính thưởng & huy hiệu khi xong trọn tuần).
     */
    toggleDay(course, week, day, totalDays = 0) {
      const arr = this.completed[course] || (this.completed[course] = [])
      const k = dayKey(week, day)
      const i = arr.indexOf(k)
      const weekCount = () => arr.filter((x) => x.startsWith(`${week}:`)).length

      if (i === -1) {
        // Đánh dấu hoàn thành
        arr.push(k)
        this.xp += XP_PER_DAY
        if (totalDays > 0 && weekCount() === totalDays) {
          this.xp += XP_PER_WEEK
          this.badges += 1
        }
        this.bumpStreak()
      } else {
        // Bỏ đánh dấu — hoàn lại XP/huy hiệu đã cấp
        const wasWeekDone = totalDays > 0 && weekCount() === totalDays
        arr.splice(i, 1)
        this.xp = Math.max(0, this.xp - XP_PER_DAY)
        if (wasWeekDone) {
          this.xp = Math.max(0, this.xp - XP_PER_WEEK)
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

    addXp(amount) {
      this.xp += amount
      this.persist()
    },
    markCardKnown(index) {
      if (!this.knownCards.includes(index)) {
        this.knownCards.push(index)
        this.xp += 20
        this.persist()
      }
    },
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            xp: this.xp,
            streak: this.streak,
            badges: this.badges,
            lastStudyDate: this.lastStudyDate,
            knownCards: this.knownCards,
            completed: this.completed,
          }),
        )
      } catch {
        /* ignore */
      }
    },
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        Object.assign(this, saved)
        // Đảm bảo shape khóa học luôn đầy đủ dù bản lưu cũ thiếu trường.
        this.completed = { java: [], ielts: [], ...(saved.completed || {}) }
      } catch {
        /* ignore */
      }
    },
  },
})
