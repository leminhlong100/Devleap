import { ieltsTrack, setIeltsTrackPref } from '@/data/courseIelts'

/**
 * Tùy chọn chỉ lưu LOCAL, không đồng bộ cloud và không nằm trong
 * snapshot()/applySnapshot() (không phải "tiến độ" mà là "sở thích thiết bị"):
 * persona chat + từ đánh dấu sao, track khóa IELTS nền tảng.
 */
const CONVO_KEY = 'devleap:convo:v1'
// `activeSaveTopic`: chủ đề đang chọn để gắn vào từ/câu lưu khi chat với AI
// (xem vocabSlice.js#createTopic) — chỉ local, không đồng bộ cloud.
const DEFAULT_CONVO = { persona: 'cotnha', activeSaveTopic: '' }

export function state() {
  return {
    // tùy chọn chế độ hội thoại (hiện chỉ có persona lời phê) — chỉ local.
    convoPrefs: { ...DEFAULT_CONVO },
    // Track khóa IELTS nền tảng ('A' = Work & Life English, mặc định; 'B' = IELTS
    // Bridge) — chỉ local, đọc từ data/courseIelts.js lúc app khởi động.
    ieltsTrack,
  }
}

export const actions = {
  /** Nạp tùy chọn hội thoại từ localStorage (local-only, gọi trong hydrate()). */
  loadConvoPrefs() {
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
}
