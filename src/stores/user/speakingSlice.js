import { ymd } from './helpers'

/**
 * Nhật ký NÓI (voice-first AiChat) — tách streak nói khỏi streak học
 * (`bumpStreak`) vì "dám nói" là rủi ro thật riêng, không nên tính chung với
 * việc hoàn thành task trong app (xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục
 * 3.4/Đợt 4). Local-only.
 */

export function state() {
  return {
    // { [ 'YYYY-M-D' ]: số giây đã nói trong ngày }
    speakingLog: {},
    speakingStreak: 0,
    lastSpeakingDate: null,
  }
}

export const getters = {
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
}

export const actions = {
  /**
   * Ghi nhận số giây vừa NÓI thật (mic mở ở AiChat voice-first), tách streak nói
   * (`speakingStreak`) khỏi streak học (`bumpStreak`).
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
}

export function pick(s) {
  return {
    speakingLog: s.speakingLog,
    speakingStreak: s.speakingStreak,
    lastSpeakingDate: s.lastSpeakingDate,
  }
}

export function applyDefaults(s = {}) {
  return {
    speakingLog: s.speakingLog && typeof s.speakingLog === 'object' ? s.speakingLog : {},
    speakingStreak: s.speakingStreak ?? 0,
    lastSpeakingDate: s.lastSpeakingDate ?? null,
  }
}

// Hợp nhất nhật ký nói: mỗi ngày giữ số giây LỚN HƠN (thiết bị nào nói nhiều hơn
// ngày đó thắng) — đơn giản, đủ dùng cho quy mô cá nhân như các merge khác.
export function mergeSpeakingLog(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] || 0, v || 0)
  return out
}
