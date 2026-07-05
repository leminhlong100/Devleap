import { ymd, laterDate } from './helpers'

/** Slice từ đã lưu (chat AI) + kết quả luyện shadowing. */

// Thưởng khi lần đầu hoàn thành một bài shadowing. Việc một bài "đạt" hay chưa
// do component tính theo SỐ CÂU đạt mốc cá nhân (xem ShadowingPlayer.vue), không
// suy từ một ngưỡng điểm trung bình ở đây.
const XP_SHADOWING_PASS = 120

export function state() {
  return {
    // từ vựng người học tự lưu khi trò chuyện với AI, khóa theo từ (thường hóa):
    // { [key]: { term, ipa, vi, ex, cat, srsId, context, savedAt } }. Dùng làm
    // một bộ flashcard riêng (srsId dạng "saved:từ" để có lịch ôn độc lập).
    savedWords: {},
    // kết quả luyện shadowing, khóa theo videoId:
    // { [videoId]: { best, passed, attempts, lastAt, sentences: { [id]: bestPct } } }
    // best = điểm trung bình các câu; `sentences` lưu điểm tốt nhất TỪNG CÂU để
    // tải lại không mất tiến độ.
    shadowingScores: {},
  }
}

export const getters = {
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
}

export const actions = {
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
      this.addXp(XP_SHADOWING_PASS)
      this.badges += 1
    }
    this.bumpStreak()
    this.persist()
    return entry
  },
}

export function pick(s) {
  return { savedWords: s.savedWords, shadowingScores: s.shadowingScores }
}

export function applyDefaults(s = {}) {
  return {
    savedWords: s.savedWords && typeof s.savedWords === 'object' ? s.savedWords : {},
    shadowingScores: s.shadowingScores && typeof s.shadowingScores === 'object' ? s.shadowingScores : {},
  }
}

// Hợp nhất danh sách từ đã lưu: gộp theo khóa từ, giữ bản lưu *sớm nhất*
// (để không mất câu ngữ cảnh/ngày lưu gốc khi học trên nhiều thiết bị).
export function mergeSaved(a = {}, b = {}) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || (v.savedAt || '') < (out[k].savedAt || '')) out[k] = v
  }
  return out
}

// Gộp điểm từng câu giữa 2 thiết bị: mỗi câu giữ điểm cao nhất.
function mergeSentenceScores(a = {}, b = {}) {
  const out = { ...(a || {}) }
  for (const [id, v] of Object.entries(b || {})) out[id] = Math.max(out[id] || 0, v || 0)
  return out
}

// Hợp nhất kết quả shadowing: mỗi bài giữ điểm cao nhất, OR trạng thái đạt,
// lấy số lần thử & ngày lớn hơn (đủ cho đồng bộ đa thiết bị cá nhân).
export function mergeShadowing(a = {}, b = {}) {
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
