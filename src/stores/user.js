import { defineStore } from 'pinia'
import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Trạng thái người học (gamification) — nguồn sự thật duy nhất cho tiến độ thật.
 *
 * Lưu danh sách ngày đã hoàn thành theo từng khóa (`completed.java`,
 * `completed.ielts`), từ đó suy ra: mở khóa tuần kế, streak, XP, huy hiệu.
 * Cấu trúc tuần/ngày (số ngày mỗi tuần) sống ở tầng dữ liệu khóa học
 * (`data/course.js`, `data/courseIelts.js`) để store không phải kéo các chunk
 * Markdown nặng — view truyền `totalDays` vào khi cần tính hoàn thành tuần.
 *
 * Lưu trữ 2 lớp:
 *  - localStorage: cache tức thì, hoạt động offline & ở chế độ khách.
 *  - Supabase (bảng `progress`): đồng bộ đa thiết bị khi đã đăng nhập.
 * Khi đăng nhập lần đầu, tiến độ khách được hợp nhất vào tài khoản (xem
 * `pullAndMerge`). Mọi thay đổi sau đó vừa ghi localStorage vừa đẩy lên cloud
 * (có debounce) qua `persist()`.
 */
const LEVEL_SPAN = 500 // mỗi level rộng 500 XP
const XP_PER_DAY = 50 // hoàn thành 1 ngày học
const XP_PER_WEEK = 150 // thưởng thêm khi xong trọn 1 tuần
const STORAGE_KEY = 'devleap:user:v2'
const PUSH_DEBOUNCE_MS = 1200

const dayKey = (week, day) => `${week}:${day}`
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

// Hợp nhất 2 mảng thành tập hợp không trùng (giữ tiến độ từ cả 2 thiết bị).
const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))
// Chọn ngày muộn hơn giữa 2 chuỗi 'YYYY-M-D' (null-safe).
const laterDate = (a, b) => {
  if (!a) return b || null
  if (!b) return a
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b
}

let pushTimer = null // debounce đẩy lên cloud (module-level, không nằm trong state)

export const useUserStore = defineStore('user', {
  state: () => ({
    xp: 0,
    streak: 0,
    badges: 0,
    lastStudyDate: null, // 'YYYY-M-D' của lần học gần nhất (tính streak)
    knownCards: [], // index các flashcard đã thuộc
    completed: { java: [], ielts: [] }, // mảng khóa "week:day" đã hoàn thành

    // —— đồng bộ cloud ——
    cloudUserId: null, // id user khi đã đăng nhập; null = chế độ khách
    syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
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

    // ——————————————————————— lưu trữ ———————————————————————

    /** Ảnh chụp phần dữ liệu cần bền hoá (không gồm trạng thái sync). */
    snapshot() {
      return {
        xp: this.xp,
        streak: this.streak,
        badges: this.badges,
        lastStudyDate: this.lastStudyDate,
        knownCards: this.knownCards,
        completed: this.completed,
      }
    },

    /** Áp một snapshot vào state (đảm bảo shape khóa học luôn đầy đủ). */
    applySnapshot(s = {}) {
      this.xp = s.xp ?? 0
      this.streak = s.streak ?? 0
      this.badges = s.badges ?? 0
      this.lastStudyDate = s.lastStudyDate ?? null
      this.knownCards = Array.isArray(s.knownCards) ? s.knownCards : []
      this.completed = { java: [], ielts: [], ...(s.completed || {}) }
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot()))
      } catch {
        /* ignore */
      }
      // Đã đăng nhập -> đẩy lên cloud (gộp nhiều thay đổi liên tiếp thành 1 lần).
      if (this.cloudUserId) this.schedulePush()
    },

    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        this.applySnapshot(JSON.parse(raw))
      } catch {
        /* ignore */
      }
    },

    // ——————————————————————— đồng bộ cloud ———————————————————————

    /**
     * Đăng nhập xong: kéo dữ liệu trên cloud về, hợp nhất với tiến độ khách
     * (đang có trong localStorage/state), ghi lại cả 2 phía rồi bật chế độ sync.
     */
    async pullAndMerge(userId) {
      this.cloudUserId = userId
      if (!isCloudEnabled) return
      this.syncStatus = 'syncing'
      try {
        const { data, error } = await supabase
          .from('progress')
          .select('xp, streak, badges, last_study_date, known_cards, completed')
          .eq('user_id', userId)
          .maybeSingle()
        if (error) throw error

        const local = this.snapshot()
        if (data) {
          const remote = {
            xp: data.xp,
            streak: data.streak,
            badges: data.badges,
            lastStudyDate: data.last_study_date,
            knownCards: data.known_cards || [],
            completed: data.completed || {},
          }
          this.applySnapshot(mergeSnapshots(local, remote))
        }
        // Lưu local rồi đẩy bản hợp nhất lên cloud ngay (không debounce).
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot()))
        } catch {
          /* ignore */
        }
        await this.pushNow()
      } catch {
        this.syncStatus = 'error'
      }
    },

    /** Tách khỏi cloud (đăng xuất): dừng sync, giữ dữ liệu hiện tại làm khách. */
    detachCloud() {
      if (pushTimer) {
        clearTimeout(pushTimer)
        pushTimer = null
      }
      this.cloudUserId = null
      this.syncStatus = 'idle'
    },

    /** Đẩy snapshot lên cloud sau một khoảng lặng (gộp thay đổi liên tiếp). */
    schedulePush() {
      if (!isCloudEnabled || !this.cloudUserId) return
      this.syncStatus = 'syncing'
      if (pushTimer) clearTimeout(pushTimer)
      pushTimer = setTimeout(() => {
        pushTimer = null
        this.pushNow()
      }, PUSH_DEBOUNCE_MS)
    },

    /** Ghi snapshot hiện tại lên bảng `progress` (upsert theo user_id). */
    async pushNow() {
      if (!isCloudEnabled || !this.cloudUserId) return
      const s = this.snapshot()
      try {
        const { error } = await supabase.from('progress').upsert(
          {
            user_id: this.cloudUserId,
            xp: s.xp,
            streak: s.streak,
            badges: s.badges,
            last_study_date: s.lastStudyDate,
            known_cards: s.knownCards,
            completed: s.completed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (error) throw error
        this.syncStatus = 'synced'
      } catch {
        this.syncStatus = 'error'
      }
    },
  },
})

/**
 * Hợp nhất tiến độ giữa 2 nguồn (khách & cloud) để không mất dữ liệu khi
 * học trên nhiều thiết bị: hợp các danh sách (union), lấy giá trị lớn hơn cho
 * điểm số. Đủ tốt cho quy mô cá nhân — không cần CRDT.
 */
function mergeSnapshots(local, remote) {
  return {
    xp: Math.max(local.xp || 0, remote.xp || 0),
    streak: Math.max(local.streak || 0, remote.streak || 0),
    badges: Math.max(local.badges || 0, remote.badges || 0),
    lastStudyDate: laterDate(local.lastStudyDate, remote.lastStudyDate),
    knownCards: union(local.knownCards, remote.knownCards),
    completed: {
      java: union(local.completed?.java, remote.completed?.java),
      ielts: union(local.completed?.ielts, remote.completed?.ielts),
    },
  }
}
