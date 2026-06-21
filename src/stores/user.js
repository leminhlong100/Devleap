import { defineStore } from 'pinia'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { schedule, isDue, GRADES } from '@/lib/srs'

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
const XP_QUIZ_PASS = 100 // thưởng khi LẦN ĐẦU đạt một bài kiểm tra
const PASS_PCT = 0.7 // ngưỡng đạt mặc định (70%)
const STORAGE_KEY = 'devleap:user:v2'
const PUSH_DEBOUNCE_MS = 1200

const dayKey = (week, day) => `${week}:${day}`
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

// Hợp nhất 2 mảng thành tập hợp không trùng (giữ tiến độ từ cả 2 thiết bị).
const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))
// XP thưởng khi ôn một thẻ đang đến hạn (chấm "Khó" được ít hơn "Tốt/Dễ").
const XP_REVIEW = { hard: 5, good: 10, easy: 10 }
// Hợp nhất lịch SRS: với mỗi thẻ, giữ bản ôn gần nhất (so theo `last`, dạng ISO).
const mergeSrs = (a = {}, b = {}) => {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur || (v.last || '') > (cur.last || '')) out[k] = v
  }
  return out
}
// Hợp nhất điểm kiểm tra: mỗi bài giữ điểm % cao nhất, OR trạng thái đạt,
// lấy số lần làm & ngày làm lớn hơn (đủ tốt cho đồng bộ đa thiết bị cá nhân).
const mergeQuiz = (a = {}, b = {}) => {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) {
      out[k] = v
      continue
    }
    const keepNew = (v.pct || 0) > (cur.pct || 0)
    out[k] = {
      best: keepNew ? v.best : cur.best,
      total: keepNew ? v.total : cur.total,
      pct: Math.max(cur.pct || 0, v.pct || 0),
      attempts: Math.max(cur.attempts || 0, v.attempts || 0),
      passed: !!(cur.passed || v.passed),
      lastAt: laterDate(cur.lastAt, v.lastAt),
    }
  }
  return out
}
// Hợp nhất danh sách từ đã lưu: gộp theo khóa từ, giữ bản lưu *sớm nhất*
// (để không mất câu ngữ cảnh/ngày lưu gốc khi học trên nhiều thiết bị).
const mergeSaved = (a = {}, b = {}) => {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || (v.savedAt || '') < (out[k].savedAt || '')) out[k] = v
  }
  return out
}
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
    knownCards: [], // (cũ) index các flashcard đã thuộc — giữ để tương thích bản trước
    srs: {}, // lịch ôn tập theo từng thẻ: { [srsId]: { ease, interval, reps, lapses, due, last } }
    completed: { java: [], ielts: [] }, // mảng khóa "week:day" đã hoàn thành
    // điểm kiểm tra cuối tuần/cuối khóa, khóa theo "course:scope"
    // (vd "java:week:3", "ielts:final"): { best, total, pct, attempts, passed, lastAt }
    quizScores: {},
    // từ vựng người học tự lưu khi trò chuyện với AI, khóa theo từ (thường hóa):
    // { [key]: { term, ipa, vi, ex, cat, srsId, context, savedAt } }. Dùng làm
    // một bộ flashcard riêng (srsId dạng "saved:từ" để có lịch ôn độc lập).
    savedWords: {},

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
    /** Lịch ôn của một thẻ (null nếu chưa từng ôn). Dùng: user.srsOf(id). */
    srsOf: (s) => (id) => s.srs[id] || null,
    /** Thẻ có đang đến hạn ôn không? Thẻ mới (chưa có lịch) coi như đến hạn. */
    isCardDue: (s) => (id) => isDue(s.srs[id]),
    /** Số thẻ đến hạn trong một danh sách srsId (để hiện huy hiệu "đến hạn"). */
    dueCount: (s) => (ids = []) => ids.filter((id) => isDue(s.srs[id])).length,
    /** Số thẻ đã có lịch ôn (đã học ít nhất 1 lần). */
    srsLearned: (s) => Object.keys(s.srs).length,
    /** Kết quả một bài kiểm tra (null nếu chưa làm). Dùng: user.quizOf('java','week:3'). */
    quizOf: (s) => (course, scope) => s.quizScores[`${course}:${scope}`] || null,
    /** Đã đạt một bài kiểm tra chưa? */
    quizPassed: (s) => (course, scope) => !!s.quizScores[`${course}:${scope}`]?.passed,
    /** Số bài kiểm tra đã đạt của một khóa (để hiện huy hiệu/tiến độ). */
    quizPassedCount: (s) => (course) =>
      Object.entries(s.quizScores).filter(([k, v]) => k.startsWith(`${course}:`) && v.passed).length,
    /** Danh sách từ đã lưu (mảng thẻ), xếp theo thứ tự lưu (cũ trước). */
    savedWordList: (s) =>
      Object.values(s.savedWords).sort((a, b) => ((a.savedAt || '') < (b.savedAt || '') ? -1 : 1)),
    /** Số từ đã lưu. */
    savedCount: (s) => Object.keys(s.savedWords).length,
    /** Một từ đã được lưu chưa? Dùng: user.isWordSaved('inheritance'). */
    isWordSaved: (s) => (term) => !!s.savedWords[String(term).trim().toLowerCase()],
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
     * Ghi nhận kết quả một bài kiểm tra cuối tuần/cuối khóa.
     * @param {'java'|'ielts'} course
     * @param {string} scope   định danh bài: "week:N" hoặc "final".
     * @param {number} correct số câu đúng.
     * @param {number} total   tổng số câu.
     * @param {number} threshold tỉ lệ đạt (0..1), mặc định 0.7.
     *
     * Lưu điểm % CAO NHẤT giữa các lần làm; chỉ thưởng XP + huy hiệu vào LẦN ĐẦU
     * đạt ngưỡng (không cày bằng cách làm lại). Làm bài cũng tính là có học (streak).
     */
    recordQuiz(course, scope, correct, total, threshold = PASS_PCT) {
      if (!course || !scope || !total) return
      const key = `${course}:${scope}`
      const pct = Math.round((correct / total) * 100)
      const prev = this.quizScores[key] || null
      const wasPassed = prev?.passed || false
      const keepNew = !prev || pct > prev.pct
      const entry = {
        best: keepNew ? correct : prev.best,
        total: keepNew ? total : prev.total,
        pct: keepNew ? pct : prev.pct,
        attempts: (prev?.attempts || 0) + 1,
        passed: wasPassed || pct >= threshold * 100,
        lastAt: ymd(new Date()),
      }
      this.quizScores[key] = entry
      if (!wasPassed && entry.passed) {
        this.xp += XP_QUIZ_PASS
        this.badges += 1
      }
      this.bumpStreak()
      this.persist()
      return entry
    },

    /**
     * Lưu một từ vào danh sách cá nhân (vd khi đang chat với AI).
     * @param {object} card  thẻ từ vựng (term + ipa/vi/ex/cat/srsId) — thường
     *   dựng sẵn bằng `cardsFromTerms([term], 'saved')[0]`; có thể kèm `context`.
     * @returns {boolean} true nếu là từ mới được thêm (false nếu đã có/không hợp lệ).
     */
    saveWord(card) {
      const term = card?.term
      const key = String(term || '').trim().toLowerCase()
      if (!key || this.savedWords[key]) return false
      this.savedWords[key] = { ...card, savedAt: new Date().toISOString() }
      this.persist()
      return true
    },

    /** Bỏ một từ khỏi danh sách đã lưu (giữ lịch ôn SRS cũ — vô hại). */
    removeSavedWord(term) {
      const key = String(term || '').trim().toLowerCase()
      if (!this.savedWords[key]) return
      delete this.savedWords[key]
      this.persist()
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
        srs: this.srs,
        completed: this.completed,
        quizScores: this.quizScores,
        savedWords: this.savedWords,
      }
    },

    /** Áp một snapshot vào state (đảm bảo shape khóa học luôn đầy đủ). */
    applySnapshot(s = {}) {
      this.xp = s.xp ?? 0
      this.streak = s.streak ?? 0
      this.badges = s.badges ?? 0
      this.lastStudyDate = s.lastStudyDate ?? null
      this.knownCards = Array.isArray(s.knownCards) ? s.knownCards : []
      this.srs = s.srs && typeof s.srs === 'object' ? s.srs : {}
      this.completed = { java: [], ielts: [], ...(s.completed || {}) }
      this.quizScores = s.quizScores && typeof s.quizScores === 'object' ? s.quizScores : {}
      this.savedWords = s.savedWords && typeof s.savedWords === 'object' ? s.savedWords : {}
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
          .select('xp, streak, badges, last_study_date, known_cards, srs, completed, quiz_scores, saved_words')
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
            srs: data.srs || {},
            completed: data.completed || {},
            quizScores: data.quiz_scores || {},
            savedWords: data.saved_words || {},
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
            srs: s.srs,
            completed: s.completed,
            quiz_scores: s.quizScores,
            saved_words: s.savedWords,
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
    srs: mergeSrs(local.srs, remote.srs),
    completed: {
      java: union(local.completed?.java, remote.completed?.java),
      ielts: union(local.completed?.ielts, remote.completed?.ielts),
    },
    quizScores: mergeQuiz(local.quizScores, remote.quizScores),
    savedWords: mergeSaved(local.savedWords, remote.savedWords),
  }
}
