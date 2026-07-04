import { defineStore } from 'pinia'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { schedule, seedSchedule, isDue, GRADES } from '@/lib/srs'
import { ieltsTrack, setIeltsTrackPref } from '@/data/courseIelts'
import { lookupVocab } from '@/data/vocabGlossary'

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
// Đánh dấu dữ liệu local đang thuộc về tài khoản nào (id user) — để phát hiện
// khi đăng nhập một tài khoản KHÁC với chủ của dữ liệu local hiện tại và tránh
// hợp nhất nhầm tiến độ giữa hai tài khoản. null/'guest' = chưa đăng nhập bao giờ.
const OWNER_KEY = 'devleap:owner:v1'
const readOwner = () => {
  try {
    return localStorage.getItem(OWNER_KEY) || null
  } catch {
    return null
  }
}
const writeOwner = (id) => {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id)
    else localStorage.removeItem(OWNER_KEY)
  } catch {
    /* ignore */
  }
}
// Tùy chọn hội thoại AI + từ đánh dấu sao: chỉ lưu LOCAL (không đồng bộ cloud để
// khỏi phải thêm cột mới ở bảng `progress`).
const CONVO_KEY = 'devleap:convo:v1'
const DEFAULT_CONVO = { persona: 'cotnha' }
const PUSH_DEBOUNCE_MS = 1200

const dayKey = (week, day) => `${week}:${day}`
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
// Chuẩn hóa từ để sinh srsId khớp với `cardsFromTerms` (data/tools.js) mà không
// phải kéo chunk khóa học (course.js/courseIelts.js) nặng vào bundle của store —
// xem `data/searchIndex.js#normalize`, cùng logic, cố ý trùng lặp.
const normalizeTerm = (str) =>
  (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// Hợp nhất 2 mảng thành tập hợp không trùng (giữ tiến độ từ cả 2 thiết bị).
const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))
// XP thưởng khi ôn một thẻ đang đến hạn (chấm "Khó" được ít hơn "Tốt/Dễ").
const XP_REVIEW = { hard: 5, good: 10, easy: 10 }
// Thưởng khi lần đầu hoàn thành một bài shadowing. Việc một bài "đạt" hay chưa
// do component tính theo SỐ CÂU đạt mốc cá nhân (xem ShadowingPlayer.vue), không
// suy từ một ngưỡng điểm trung bình ở đây.
const XP_SHADOWING_PASS = 120
// Mission tuần (real-life, ngoài app) — thưởng lớn hơn 1 buổi học thường vì đòi
// hỏi rủi ro thật (nói/viết với người thật), không phải chỉ hoàn thành trong app.
const XP_MISSION = 150
// Buổi nói người thật — rủi ro thật nhưng nhẹ hơn Mission (không cần bằng chứng
// dán link, chỉ cần 3 dòng sổ lỗi đời thực sau buổi nói).
const XP_REAL_TALK = 100
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
    const passed = !!(cur.passed || v.passed)
    // "wrong" phản ánh lần làm GẦN NHẤT (không phải điểm cao nhất) -> lấy theo bên có lastAt mới hơn.
    const wrongFromNewer = laterDate(cur.lastAt, v.lastAt) === v.lastAt ? v.wrong : cur.wrong
    out[k] = {
      best: keepNew ? v.best : cur.best,
      total: keepNew ? v.total : cur.total,
      pct: Math.max(cur.pct || 0, v.pct || 0),
      attempts: Math.max(cur.attempts || 0, v.attempts || 0),
      passed,
      lastAt: laterDate(cur.lastAt, v.lastAt),
      wrong: passed ? [] : wrongFromNewer || [],
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
// Hợp nhất kết quả shadowing: mỗi bài giữ điểm cao nhất, OR trạng thái đạt,
// lấy số lần thử & ngày lớn hơn (đủ cho đồng bộ đa thiết bị cá nhân).
const mergeShadowing = (a = {}, b = {}) => {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    if (!cur) {
      out[k] = v
      continue
    }
    out[k] = {
      best: Math.max(cur.best || 0, v.best || 0),
      passed: !!(cur.passed || v.passed),
      attempts: Math.max(cur.attempts || 0, v.attempts || 0),
      lastAt: laterDate(cur.lastAt, v.lastAt),
      sentences: mergeSentenceScores(cur.sentences, v.sentences),
    }
  }
  return out
}
// Gộp điểm từng câu giữa 2 thiết bị: mỗi câu giữ điểm cao nhất.
const mergeSentenceScores = (a = {}, b = {}) => {
  const out = { ...(a || {}) }
  for (const [id, v] of Object.entries(b || {})) out[id] = Math.max(out[id] || 0, v || 0)
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
    // kết quả luyện shadowing, khóa theo videoId:
    // { [videoId]: { best, passed, attempts, lastAt, sentences: { [id]: bestPct } } }
    // best = điểm trung bình các câu; `sentences` lưu điểm tốt nhất TỪNG CÂU để
    // tải lại không mất tiến độ.
    shadowingScores: {},

    // bài tập VIẾT làm tại bài (vd "Viết 10 câu…"), khóa theo "course:week:day":
    // { [key]: { text, done, at } }. Lưu cục bộ (localStorage) để không mất bài viết
    // và để khóa tiến độ; chưa đẩy lên cloud nên không cần đổi schema bảng progress.
    writings: {},

    // Mission tuần (real-life, ngoài app) — khóa theo "course:week:day":
    // { [key]: { note, done, at } }. note = ghi chú/link bằng chứng người học dán vào.
    // Local-only như writings/checklists (chưa đổi schema bảng progress).
    missions: {},

    // Buổi nói người thật (2 tuần/lần từ Tuần 3) — cùng hình dạng với `missions`,
    // khóa theo "course:week:day": { note, done, at }. note = 3 dòng sổ lỗi đời
    // thực sau buổi nói. Local-only.
    realTalks: {},

    // tiến độ checklist "việc cần làm hôm nay", khóa theo "course:week:day":
    // { [key]: [bool, bool, …] } theo thứ tự mục. Local-only (như writings) để
    // khóa hoàn thành buổi mà không phải đổi schema bảng progress.
    checklists: {},

    // tùy chọn chế độ hội thoại (hiện chỉ có persona lời phê) — chỉ local.
    convoPrefs: { ...DEFAULT_CONVO },

    // Track khóa IELTS nền tảng ('A' = Work & Life English, mặc định; 'B' = IELTS
    // Bridge) — chỉ local, đọc từ data/courseIelts.js lúc app khởi động.
    ieltsTrack,

    // Nhật ký NÓI (voice-first AiChat) — { [ 'YYYY-M-D' ]: số giây đã nói trong
    // ngày }. Tách streak nói khỏi streak học (bumpStreak) vì "dám nói" là rủi ro
    // thật riêng, không nên tính chung với việc hoàn thành task trong app (xem
    // docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.4/Đợt 4). Local-only.
    speakingLog: {},
    speakingStreak: 0,
    lastSpeakingDate: null,

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
    /** Tổng số giây đã NÓI trong 7 ngày gần nhất (kể cả hôm nay). */
    speakingSecondsThisWeek: (s) => {
      let sum = 0
      const d = new Date()
      for (let i = 0; i < 7; i++) {
        sum += s.speakingLog[ymd(d)] || 0
        d.setDate(d.getDate() - 1)
      }
      return sum
    },
    /** Số phút đã nói trong 7 ngày gần nhất (làm tròn). */
    speakingMinutesThisWeek() {
      return Math.round(this.speakingSecondsThisWeek / 60)
    },
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
    /** Kết quả một bài kiểm tra (null nếu chưa làm). Dùng: user.quizOf('java','week:3'). */
    quizOf: (s) => (course, scope) => s.quizScores[`${course}:${scope}`] || null,
    /** Đã đạt một bài kiểm tra chưa? */
    quizPassed: (s) => (course, scope) => !!s.quizScores[`${course}:${scope}`]?.passed,
    /** Số bài kiểm tra đã đạt của một khóa (để hiện huy hiệu/tiến độ).
     *  Bỏ qua khóa "gday:" — đó là cổng luyện ngữ pháp theo ngày, không phải bài kiểm tra. */
    quizPassedCount: (s) => (course) =>
      Object.entries(s.quizScores).filter(
        ([k, v]) => k.startsWith(`${course}:`) && !k.includes(':gday:') && !k.includes(':vday:') && v.passed,
      ).length,
    /** Đã ĐẠT cổng luyện ngữ pháp của một ngày chưa? Dùng để khóa/mở ngày kế.
     *  Khóa lưu dạng "course:gday:week:day" trong cùng cột quizScores (đồng bộ sẵn). */
    grammarDayPassed: (s) => (course, week, day) =>
      !!s.quizScores[`${course}:gday:${week}:${day}`]?.passed,
    /** Đã ĐẠT cổng quiz từ vựng của một ngày chưa? Khóa "course:vday:week:day". */
    vocabDayPassed: (s) => (course, week, day) =>
      !!s.quizScores[`${course}:vday:${week}:${day}`]?.passed,
    /** Trạng thái tick của checklist một ngày (mảng bool theo thứ tự mục). */
    checklistState: (s) => (course, week, day) => s.checklists[`${course}:${week}:${day}`] || [],
    /** Bài viết của một ngày (null nếu chưa viết). Dùng: user.writingOf('ielts',w,d). */
    writingOf: (s) => (course, week, day) => s.writings[`${course}:${week}:${day}`] || null,
    /** Đã NỘP xong bài viết của một ngày chưa? (dùng để khóa hoàn thành buổi) */
    writingDone: (s) => (course, week, day) => !!s.writings[`${course}:${week}:${day}`]?.done,
    /** Mission tuần của một ngày (null nếu chưa làm). Dùng: user.missionOf('ielts',w,d). */
    missionOf: (s) => (course, week, day) => s.missions[`${course}:${week}:${day}`] || null,
    /** Đã đánh dấu hoàn thành Mission tuần của ngày này chưa? */
    missionDone: (s) => (course, week, day) => !!s.missions[`${course}:${week}:${day}`]?.done,
    /** Buổi nói người thật của một ngày (null nếu chưa làm). */
    realTalkOf: (s) => (course, week, day) => s.realTalks[`${course}:${week}:${day}`] || null,
    /** Đã đánh dấu hoàn thành buổi nói người thật của ngày này chưa? */
    realTalkDone: (s) => (course, week, day) => !!s.realTalks[`${course}:${week}:${day}`]?.done,
    /** Danh sách từ đã lưu (mảng thẻ), xếp theo thứ tự lưu (cũ trước). */
    savedWordList: (s) =>
      Object.values(s.savedWords).sort((a, b) => ((a.savedAt || '') < (b.savedAt || '') ? -1 : 1)),
    /** Số từ đã lưu. */
    savedCount: (s) => Object.keys(s.savedWords).length,
    /** Một từ đã được lưu chưa? Dùng: user.isWordSaved('inheritance'). */
    isWordSaved: (s) => (term) => !!s.savedWords[String(term).trim().toLowerCase()],
    /** Kết quả shadowing một bài (null nếu chưa luyện). Dùng: user.shadowingOf(videoId). */
    shadowingOf: (s) => (videoId) => s.shadowingScores[videoId] || null,
    /** Đã hoàn thành (đủ số câu đạt mốc) một bài shadowing chưa? */
    shadowingPassed: (s) => (videoId) => !!s.shadowingScores[videoId]?.passed,
    /** Số bài shadowing đã đạt (để hiện huy hiệu/tiến độ). */
    shadowingPassedCount: (s) => Object.values(s.shadowingScores).filter((v) => v.passed).length,
    /** Map điểm tốt nhất từng câu của một bài: { [sentenceId]: bestPct }. */
    shadowingSentences: (s) => (videoId) => s.shadowingScores[videoId]?.sentences || {},
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
        this.xp += XP_PER_DAY
        if (totalDays > 0 && weekCount() === totalDays) {
          this.xp += XP_PER_WEEK
          this.badges += 1
        }
        this.bumpStreak()
        this.seedSrsFromDay(course, vocabTerms)
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
    recordQuiz(course, scope, correct, total, threshold = PASS_PCT, wrong = []) {
      if (!course || !scope || !total) return
      const key = `${course}:${scope}`
      const pct = Math.round((correct / total) * 100)
      const prev = this.quizScores[key] || null
      const wasPassed = prev?.passed || false
      const keepNew = !prev || pct > prev.pct
      const passed = wasPassed || pct >= threshold * 100
      const entry = {
        best: keepNew ? correct : prev.best,
        total: keepNew ? total : prev.total,
        pct: keepNew ? pct : prev.pct,
        attempts: (prev?.attempts || 0) + 1,
        passed,
        lastAt: ymd(new Date()),
        // Câu sai của LẦN LÀM GẦN NHẤT — nguồn cho "ngày ôn bù"; xóa khi đã đạt.
        wrong: passed ? [] : wrong.slice(0, 8),
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
     * Ghi nhận kết quả CỔNG luyện ngữ pháp theo ngày (điền chỗ trống / sửa câu).
     * Khác recordQuiz: KHÔNG thưởng huy hiệu/XP đạt-bài (XP đã cộng theo từng câu
     * đúng ở chế độ practice); chỉ ghi trạng thái đạt để mở khóa ngày kế tiếp.
     * Trạng thái `passed` là "dính" — đã đạt thì giữ, làm lại không mất.
     * @returns {boolean} đã đạt (tích lũy) hay chưa.
     */
    recordGrammarDay(course, week, day, correct, total, threshold = PASS_PCT) {
      if (!course || !total) return false
      const key = `${course}:gday:${week}:${day}`
      const pct = Math.round((correct / total) * 100)
      const prev = this.quizScores[key] || null
      const keepNew = !prev || pct > prev.pct
      this.quizScores[key] = {
        best: keepNew ? correct : prev.best,
        total: keepNew ? total : prev.total,
        pct: keepNew ? pct : prev.pct,
        attempts: (prev?.attempts || 0) + 1,
        passed: !!prev?.passed || pct >= threshold * 100,
        lastAt: ymd(new Date()),
      }
      this.bumpStreak()
      this.persist()
      return this.quizScores[key].passed
    },

    /**
     * Ghi nhận kết quả CỔNG quiz từ vựng theo ngày (trắc nghiệm nghĩa từ).
     * Như recordGrammarDay nhưng khóa "course:vday:week:day"; chỉ ghi trạng thái
     * đạt (≥ngưỡng) để mở khóa hoàn thành buổi. `passed` là "dính".
     * @returns {boolean} đã đạt (tích lũy) hay chưa.
     */
    recordVocabDay(course, week, day, correct, total, threshold = PASS_PCT) {
      if (!course || !total) return false
      const key = `${course}:vday:${week}:${day}`
      const pct = Math.round((correct / total) * 100)
      const prev = this.quizScores[key] || null
      const keepNew = !prev || pct > prev.pct
      this.quizScores[key] = {
        best: keepNew ? correct : prev.best,
        total: keepNew ? total : prev.total,
        pct: keepNew ? pct : prev.pct,
        attempts: (prev?.attempts || 0) + 1,
        passed: !!prev?.passed || pct >= threshold * 100,
        lastAt: ymd(new Date()),
      }
      this.bumpStreak()
      this.persist()
      return this.quizScores[key].passed
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
        this.xp += XP_MISSION
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
        this.xp += XP_REAL_TALK
        this.bumpStreak()
      }
      this.persist()
    },

    /**
     * Ghi nhận số giây vừa NÓI thật (mic mở ở AiChat voice-first), tách streak nói
     * (`speakingStreak`) khỏi streak học (`bumpStreak`) — nói là một rủi ro/kỹ năng
     * riêng, không nên tính chung với việc hoàn thành task trong app.
     */
    logSpeakingSeconds(seconds) {
      const sec = Math.round(seconds)
      if (!sec || sec < 1) return
      const today = ymd(new Date())
      this.speakingLog[today] = (this.speakingLog[today] || 0) + sec
      if (this.lastSpeakingDate !== today) {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        this.speakingStreak = this.lastSpeakingDate === ymd(y) ? this.speakingStreak + 1 : 1
        this.lastSpeakingDate = today
      }
      this.persist()
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

    /**
     * Ghi kết quả luyện một bài shadowing.
     * @param {number} pct  tiến độ cả bài = % số câu đã đạt mốc cá nhân (0..100).
     * @param {boolean} passed  bài đã hoàn thành chưa (đủ tỉ lệ câu đạt mốc) — do
     *   component quyết định theo "số câu đạt / tổng số câu", không suy từ điểm trung bình.
     * Giữ tiến độ cao nhất; lần đầu hoàn thành thì thưởng XP + huy hiệu (như đạt bài kiểm tra).
     * @returns {object} bản ghi kết quả của bài.
     */
    recordShadowing(videoId, pct, passed = false, sentences = null) {
      if (!videoId) return null
      const prev = this.shadowingScores[videoId]
      const wasPassed = !!prev?.passed
      const best = Math.max(prev?.best || 0, Math.round(pct))
      // Gộp điểm tốt nhất TỪNG CÂU (giữ max) để tải lại không mất tiến độ.
      const sent = { ...(prev?.sentences || {}) }
      if (sentences) {
        for (const [id, v] of Object.entries(sentences)) {
          const n = Math.round(Number(v))
          if (Number.isFinite(n) && n > (sent[id] || 0)) sent[id] = n
        }
      }
      const entry = {
        best,
        passed: wasPassed || !!passed,
        attempts: (prev?.attempts || 0) + 1,
        lastAt: ymd(new Date()),
        sentences: sent,
      }
      this.shadowingScores[videoId] = entry
      if (!wasPassed && entry.passed) {
        this.xp += XP_SHADOWING_PASS
        this.badges += 1
      }
      this.bumpStreak()
      this.persist()
      return entry
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
        shadowingScores: this.shadowingScores,
        writings: this.writings,
        missions: this.missions,
        realTalks: this.realTalks,
        checklists: this.checklists,
        speakingLog: this.speakingLog,
        speakingStreak: this.speakingStreak,
        lastSpeakingDate: this.lastSpeakingDate,
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
      this.shadowingScores =
        s.shadowingScores && typeof s.shadowingScores === 'object' ? s.shadowingScores : {}
      this.writings = s.writings && typeof s.writings === 'object' ? s.writings : {}
      this.missions = s.missions && typeof s.missions === 'object' ? s.missions : {}
      this.realTalks = s.realTalks && typeof s.realTalks === 'object' ? s.realTalks : {}
      this.checklists = s.checklists && typeof s.checklists === 'object' ? s.checklists : {}
      this.speakingLog = s.speakingLog && typeof s.speakingLog === 'object' ? s.speakingLog : {}
      this.speakingStreak = s.speakingStreak ?? 0
      this.lastSpeakingDate = s.lastSpeakingDate ?? null
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
        if (raw) this.applySnapshot(JSON.parse(raw))
      } catch {
        /* ignore */
      }
      // Nạp tùy chọn hội thoại (local-only).
      try {
        const raw = localStorage.getItem(CONVO_KEY)
        if (raw) {
          const c = JSON.parse(raw) || {}
          this.convoPrefs = { ...DEFAULT_CONVO, ...(c.convoPrefs || {}) }
        }
      } catch {
        /* ignore */
      }
    },

    /** Lưu phần hội thoại (chỉ local). */
    persistConvo() {
      try {
        localStorage.setItem(CONVO_KEY, JSON.stringify({ convoPrefs: this.convoPrefs }))
      } catch {
        /* ignore */
      }
    },

    /** Cập nhật một phần tùy chọn hội thoại. Dùng: user.setConvoPrefs({ persona }). */
    setConvoPrefs(patch = {}) {
      this.convoPrefs = { ...this.convoPrefs, ...patch }
      this.persistConvo()
    },

    /**
     * Đổi track khóa IELTS nền tảng ('A'|'B'). Tuần 1–8 được nạp một lần lúc
     * module tải (xem data/courseIelts.js) nên đổi track cần tải lại trang.
     */
    setIeltsTrack(track) {
      const next = track === 'B' ? 'B' : 'A'
      if (next === this.ieltsTrack) return
      setIeltsTrackPref(next)
      window.location.reload()
    },

    // ——————————————————————— đồng bộ cloud ———————————————————————

    /**
     * Đăng nhập xong: kéo dữ liệu trên cloud về, hợp nhất với tiến độ khách
     * (đang có trong localStorage/state), ghi lại cả 2 phía rồi bật chế độ sync.
     */
    async pullAndMerge(userId) {
      this.cloudUserId = userId
      if (!isCloudEnabled) return
      // Nếu dữ liệu local đang thuộc về một tài khoản KHÁC (vd vừa đăng xuất A
      // rồi đăng nhập B), KHÔNG hợp nhất: xóa sạch local trước khi kéo để tiến độ
      // của tài khoản cũ không lẫn sang tài khoản mới. Chỉ merge khi chủ trước là
      // khách (null) — đúng với tình huống "dùng thử rồi đăng nhập lần đầu".
      const prevOwner = readOwner()
      if (prevOwner && prevOwner !== userId) {
        this.applySnapshot({})
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
      }
      this.syncStatus = 'syncing'
      try {
        const { data, error } = await supabase
          .from('progress')
          .select('xp, streak, badges, last_study_date, known_cards, srs, completed, quiz_scores, saved_words, shadowing_scores')
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
            shadowingScores: data.shadowing_scores || {},
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
        // Đánh dấu local hiện thuộc về tài khoản này (giữ qua cả khi đăng xuất,
        // để lần sau đăng nhập tài khoản khác còn phát hiện được sự khác chủ).
        writeOwner(userId)
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
            shadowing_scores: s.shadowingScores,
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
    shadowingScores: mergeShadowing(local.shadowingScores, remote.shadowingScores),
    writings: mergeWritings(local.writings, remote.writings),
    missions: mergeMissions(local.missions, remote.missions),
    realTalks: mergeMissions(local.realTalks, remote.realTalks),
    checklists: mergeChecklists(local.checklists, remote.checklists),
    speakingLog: mergeSpeakingLog(local.speakingLog, remote.speakingLog),
    speakingStreak: Math.max(local.speakingStreak || 0, remote.speakingStreak || 0),
    lastSpeakingDate: laterDate(local.lastSpeakingDate, remote.lastSpeakingDate),
  }
}

// Hợp nhất nhật ký nói: mỗi ngày giữ số giây LỚN HƠN (thiết bị nào nói nhiều hơn
// ngày đó thắng) — đơn giản, đủ dùng cho quy mô cá nhân như các merge khác.
function mergeSpeakingLog(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) out[k] = Math.max(out[k] || 0, v || 0)
  return out
}

// Hợp nhất Mission tuần: mỗi ngày giữ bản mới hơn (theo `at`), OR trạng thái đã xong.
function mergeMissions(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) {
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

// Hợp nhất checklist: mỗi ngày OR theo từng vị trí (đã tick ở thiết bị nào thì giữ).
function mergeChecklists(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) {
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

// Hợp nhất bài viết: mỗi ngày giữ bản mới hơn (theo `at`), OR trạng thái đã nộp.
function mergeWritings(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) {
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
