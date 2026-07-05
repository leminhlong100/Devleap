import { supabase, isCloudEnabled } from '@/lib/supabase'

/**
 * Slice bảng xếp hạng XP tuần (Bước 5.1) — ẨN DANH MẶC ĐỊNH, chỉ hiện tên khi
 * người học tự bật tham gia (`leaderboardOptIn`) và tự đặt tên
 * (`leaderboardName`, rỗng = hiện "Học viên ẩn danh"). Chỉ 2 field này đồng bộ
 * cloud (cột `leaderboard_opt_in`/`leaderboard_name` trong `progress`) — XP
 * tuần dùng để xếp hạng nằm ở `progressSlice` (weekXp/weekXpKey) vì gắn chặt
 * với logic cộng/trừ XP tổng.
 *
 * Danh sách xếp hạng KHÔNG đọc trực tiếp bảng `progress` (tránh phải mở RLS
 * cho người dùng khác đọc XP/badges/... của nhau) — gọi qua RPC
 * `leaderboard_weekly()` (schema.sql), một hàm SQL `security definer` chỉ trả
 * đúng 3 cột (display_name, week_xp, is_me) của các dòng đã opt-in.
 */
export function state() {
  return {
    leaderboardOptIn: false,
    leaderboardName: '',
    leaderboardRows: [], // cache lần fetch gần nhất: [{ displayName, weekXp, isMe }]
    leaderboardStatus: 'idle', // 'idle' | 'loading' | 'loaded' | 'error'
  }
}

export const getters = {}

export const actions = {
  /**
   * Bật/tắt tham gia bảng xếp hạng + đặt tên hiển thị. Tên rỗng khi đã tham
   * gia -> hàm SQL tự hiện "Học viên ẩn danh" (không lộ email/tên tài khoản).
   */
  setLeaderboardOptIn(optIn, name = '') {
    this.leaderboardOptIn = !!optIn
    this.leaderboardName = (name || '').trim().slice(0, 40)
    this.persist()
  },

  /** Tải bảng xếp hạng tuần hiện tại. No-op ở chế độ khách/chưa đăng nhập. */
  async fetchLeaderboard() {
    if (!isCloudEnabled || !this.cloudUserId) return
    this.leaderboardStatus = 'loading'
    try {
      const { data, error } = await supabase.rpc('leaderboard_weekly')
      if (error) throw error
      this.leaderboardRows = (data || []).map((r) => ({
        displayName: r.display_name,
        weekXp: r.week_xp,
        isMe: !!r.is_me,
      }))
      this.leaderboardStatus = 'loaded'
    } catch {
      this.leaderboardStatus = 'error'
    }
  },
}

/** Phần bền hoá (local + cloud) thuộc slice này. */
export function pick(s) {
  return { leaderboardOptIn: s.leaderboardOptIn, leaderboardName: s.leaderboardName }
}

export function applyDefaults(s = {}) {
  return {
    leaderboardOptIn: !!s.leaderboardOptIn,
    leaderboardName: typeof s.leaderboardName === 'string' ? s.leaderboardName : '',
  }
}

// Hợp nhất tùy chọn tham gia leaderboard giữa 2 thiết bị: đã bật ở BẤT KỲ đâu
// thì coi là đã bật (an toàn hơn theo hướng người dùng đã chủ động chọn tham
// gia); tên ưu tiên bên có giá trị non-empty, local thắng khi cả 2 đều có.
export function mergeLeaderboardPrefs(a = {}, b = {}) {
  return {
    leaderboardOptIn: !!(a.leaderboardOptIn || b.leaderboardOptIn),
    leaderboardName: a.leaderboardName || b.leaderboardName || '',
  }
}
