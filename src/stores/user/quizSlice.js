import { ymd, laterDate } from './helpers'

/** Slice điểm kiểm tra: bài kiểm tra cuối tuần/cuối khóa + 2 cổng theo ngày. */

const XP_QUIZ_PASS = 100 // thưởng khi LẦN ĐẦU đạt một bài kiểm tra
const PASS_PCT = 0.7 // ngưỡng đạt mặc định (70%)

export function state() {
  return {
    // điểm kiểm tra cuối tuần/cuối khóa, khóa theo "course:scope"
    // (vd "java:week:3", "ielts:final"): { best, total, pct, attempts, passed, lastAt }
    quizScores: {},
  }
}

export const getters = {
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
  grammarDayPassed: (s) => (course, week, day) => !!s.quizScores[`${course}:gday:${week}:${day}`]?.passed,
  /** Đã ĐẠT cổng quiz từ vựng của một ngày chưa? Khóa "course:vday:week:day". */
  vocabDayPassed: (s) => (course, week, day) => !!s.quizScores[`${course}:vday:${week}:${day}`]?.passed,
}

export const actions = {
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
}

export function pick(s) {
  return { quizScores: s.quizScores }
}

export function applyDefaults(s = {}) {
  return { quizScores: s.quizScores && typeof s.quizScores === 'object' ? s.quizScores : {} }
}

// Hợp nhất điểm kiểm tra: mỗi bài giữ điểm % cao nhất, OR trạng thái đạt,
// lấy số lần làm & ngày làm lớn hơn (đủ tốt cho đồng bộ đa thiết bị cá nhân).
export function mergeQuiz(a = {}, b = {}) {
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
