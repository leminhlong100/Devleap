import { supabase, isCloudEnabled } from '@/lib/supabase'
import { union, laterDate } from './helpers'
import { mergeSrs } from './srsSlice'
import { mergeQuiz } from './quizSlice'
import { mergeMissions, mergeWeekFeedback } from './missionSlice'
import { mergeSaved, mergeShadowing, mergeDictation, mergeTopics } from './vocabSlice'
import { mergeWritings } from './writingSlice'
import { mergeChecklists, mergeWeekXp } from './progressSlice'
import { mergeSpeakingLog } from './speakingSlice'
import { mergeLeaderboardPrefs } from './leaderboardSlice'

/**
 * Đồng bộ cloud (Supabase, bảng `progress`) — kéo/hợp nhất/đẩy tiến độ đa
 * thiết bị. Chỉ một tập con field được đồng bộ lên cloud (xem cột `select`/
 * `upsert` bên dưới); phần còn lại (writings/missions/realTalks/checklists/
 * speakingLog…) chỉ sống trong localStorage, xem comment ở từng slice.
 */
const STORAGE_KEY = 'devleap:user:v2'
const PUSH_DEBOUNCE_MS = 1200
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

let pushTimer = null // debounce đẩy lên cloud (module-level, không nằm trong state)

export function state() {
  return {
    // —— đồng bộ cloud ——
    cloudUserId: null, // id user khi đã đăng nhập; null = chế độ khách
    syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
  }
}

export const actions = {
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
        .select(
          'xp, streak, badges, last_study_date, known_cards, srs, completed, quiz_scores, saved_words, topics, shadowing_scores, dictation_scores, week_feedback, week_xp, week_xp_key, leaderboard_opt_in, leaderboard_name, enrolled',
        )
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
          topics: data.topics || [],
          shadowingScores: data.shadowing_scores || {},
          dictationScores: data.dictation_scores || {},
          weekFeedback: data.week_feedback || {},
          weekXp: data.week_xp || 0,
          weekXpKey: data.week_xp_key || null,
          leaderboardOptIn: !!data.leaderboard_opt_in,
          leaderboardName: data.leaderboard_name || '',
          enrolled: data.enrolled || [],
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
          topics: s.topics,
          shadowing_scores: s.shadowingScores,
          dictation_scores: s.dictationScores,
          week_feedback: s.weekFeedback,
          week_xp: s.weekXp,
          week_xp_key: s.weekXpKey,
          leaderboard_opt_in: s.leaderboardOptIn,
          leaderboard_name: s.leaderboardName,
          enrolled: s.enrolled,
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
}

/**
 * Hợp nhất tiến độ giữa 2 nguồn (khách & cloud) để không mất dữ liệu khi
 * học trên nhiều thiết bị: hợp các danh sách (union), lấy giá trị lớn hơn cho
 * điểm số. Đủ tốt cho quy mô cá nhân — không cần CRDT.
 */
export function mergeSnapshots(local, remote) {
  const weekXp = mergeWeekXp(local, remote)
  const leaderboardPrefs = mergeLeaderboardPrefs(local, remote)
  return {
    xp: Math.max(local.xp || 0, remote.xp || 0),
    weekXp: weekXp.weekXp,
    weekXpKey: weekXp.weekXpKey,
    leaderboardOptIn: leaderboardPrefs.leaderboardOptIn,
    leaderboardName: leaderboardPrefs.leaderboardName,
    streak: Math.max(local.streak || 0, remote.streak || 0),
    badges: Math.max(local.badges || 0, remote.badges || 0),
    lastStudyDate: laterDate(local.lastStudyDate, remote.lastStudyDate),
    knownCards: union(local.knownCards, remote.knownCards),
    srs: mergeSrs(local.srs, remote.srs),
    completed: {
      java: union(local.completed?.java, remote.completed?.java),
      ielts: union(local.completed?.ielts, remote.completed?.ielts),
      comm: union(local.completed?.comm, remote.completed?.comm),
    },
    quizScores: mergeQuiz(local.quizScores, remote.quizScores),
    savedWords: mergeSaved(local.savedWords, remote.savedWords),
    topics: mergeTopics(local.topics, remote.topics),
    shadowingScores: mergeShadowing(local.shadowingScores, remote.shadowingScores),
    dictationScores: mergeDictation(local.dictationScores, remote.dictationScores),
    writings: mergeWritings(local.writings, remote.writings),
    missions: mergeMissions(local.missions, remote.missions),
    realTalks: mergeMissions(local.realTalks, remote.realTalks),
    checklists: mergeChecklists(local.checklists, remote.checklists),
    enrolled: union(local.enrolled, remote.enrolled),
    speakingLog: mergeSpeakingLog(local.speakingLog, remote.speakingLog),
    speakingStreak: Math.max(local.speakingStreak || 0, remote.speakingStreak || 0),
    lastSpeakingDate: laterDate(local.lastSpeakingDate, remote.lastSpeakingDate),
    weekFeedback: mergeWeekFeedback(local.weekFeedback, remote.weekFeedback),
  }
}
