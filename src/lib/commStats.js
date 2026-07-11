import { commWeekStructure } from '@/data/courseComm'
import { COMM_BADGES } from '@/data/badges'
import { MINIMAL_PAIR_GROUPS } from '@/data/minimalPairs'

const PAIR_GROUP_BY_KEY = Object.fromEntries(MINIMAL_PAIR_GROUPS.map((g) => [g.key, g]))

// Chủ đề gom câu nâng cấp của khóa comm khi lưu vào SRS (khớp useChatEngine.js).
export const COMM_SAVE_TOPIC = 'Giao tiếp thực chiến'

/**
 * Số liệu cột mốc khóa "Giao Tiếp Thực Chiến" — suy TRỰC TIẾP từ state đã có:
 *   bossesPassed     số Boss tuần đã đạt (quizScores khóa "comm:boss:N", passed).
 *   marathonDone     đã hoàn thành buổi Marathon 8.4 (completed.comm chứa "8:4").
 *   mockInterviewDone đã vượt Boss phỏng vấn Tuần 7 (quizPassed comm:boss:7).
 * Không lưu ở store — dùng cho huy hiệu (COMM_BADGES) & trang tổng kết.
 */
export function commBadgeStats(user) {
  let bossesPassed = 0
  for (const wk of commWeekStructure) {
    if (user.quizPassed('comm', `boss:${wk.num}`)) bossesPassed += 1
  }
  return {
    bossesPassed,
    marathonDone: user.isDone('comm', 8, 4),
    mockInterviewDone: user.quizPassed('comm', 'boss:7'),
  }
}

/** Danh sách huy hiệu khóa comm đã đạt. */
export function earnedCommBadges(user) {
  const stats = commBadgeStats(user)
  return COMM_BADGES.filter((b) => b.check(stats))
}

/**
 * Bảng điểm 8 Boss tuần cho trang tổng kết: mỗi tuần một dòng kèm kết quả rubric
 * (null nếu chưa đấu Boss tuần đó). `passed` = đã đạt ≥ 70%.
 */
export function commBossScores(user) {
  return commWeekStructure.map((wk) => {
    const entry = user.quizOf('comm', `boss:${wk.num}`)
    return {
      week: wk.num,
      icon: wk.icon,
      title: wk.title,
      entry,
      pct: entry?.pct ?? null,
      passed: !!entry?.passed,
    }
  })
}

/**
 * "🔁 Cảnh phục thù" (kế hoạch "Nói Tự Tin" Trục E): tìm Boss của tuần TRƯỚC mà
 * người học từng TẠCH (đã đấu, chưa đạt < 70%) để mời roleplay lại ở buổi mission.
 * Trả về Boss có điểm THẤP NHẤT trong các tuần < `week`, hoặc null nếu chưa tạch
 * cái nào. Suy hoàn toàn từ quizScores đã lưu (đồng bộ Supabase) — không state mới.
 * @param {object} user  store (cần quizOf)
 * @param {number|string} week  tuần hiện tại (chỉ xét Boss các tuần trước đó)
 */
export function commRevengeScene(user, week) {
  const cur = Number(week) || 0
  let worst = null
  for (const wk of commWeekStructure) {
    if (wk.num >= cur) continue
    const entry = user.quizOf('comm', `boss:${wk.num}`)
    if (!entry || entry.passed) continue // chưa đấu hoặc đã đạt -> không cần phục thù
    const pct = entry.pct ?? 0
    if (!worst || pct < worst.pct) worst = { week: wk.num, day: 7, title: wk.title, icon: wk.icon, pct }
  }
  return worst
}

/**
 * Tổng kết số khách quan đã ghi trong buổi (WPM trôi chảy + % phát âm) từ
 * `convoPrefs.commMetrics` (map "w:d" -> { wpm, pron }). Dùng cho trang Tổng kết
 * để thấy "nói nhanh hơn / rõ hơn". Bỏ mẫu thiếu; trả null nếu chưa có gì.
 */
export function commMetricsSummary(user) {
  const map = user?.convoPrefs?.commMetrics || {}
  const rows = Object.values(map).filter((m) => m && typeof m === 'object')
  const wpms = rows.map((m) => m.wpm).filter((n) => n != null && Number.isFinite(Number(n)) && Number(n) > 0).map(Number)
  const prons = rows.map((m) => m.pron).filter((n) => n != null && Number.isFinite(Number(n)) && Number(n) >= 0).map(Number)
  const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length)
  return {
    sessions: rows.length,
    avgWpm: wpms.length ? avg(wpms) : null,
    bestWpm: wpms.length ? Math.max(...wpms) : null,
    avgPron: prons.length ? avg(prons) : null,
  }
}

/**
 * Nhóm âm học viên hay LẪN THẬT SỰ (kế hoạch cải tiến #8 — remediation cá nhân
 * hóa). Suy từ `convoPrefs.commConfusions` (map groupKey -> { attempts, confused })
 * do `PronunciationDrill` ghi lại khi cặp tối thiểu bị "nghe nhầm thành từ khác".
 * Trả danh sách nhóm có tỉ lệ lẫn cao (≥ minRate) với đủ số lần thử (≥ minAttempts),
 * xếp theo tỉ lệ giảm dần — dùng để ĐẨY drill cặp tối thiểu đúng chỗ yếu thay vì
 * theo lịch tuần cứng. Kèm nhãn nhóm để hiện UI.
 * @param {object} user  store (đọc convoPrefs.commConfusions)
 * @param {{minAttempts?:number, minRate?:number, limit?:number}} opts
 */
export function commWeakPairGroups(user, { minAttempts = 3, minRate = 0.34, limit = 2 } = {}) {
  const map = user?.convoPrefs?.commConfusions || {}
  const rows = []
  for (const [key, v] of Object.entries(map)) {
    const group = PAIR_GROUP_BY_KEY[key]
    if (!group || !v) continue
    const attempts = Number(v.attempts) || 0
    const confused = Number(v.confused) || 0
    if (attempts < minAttempts) continue
    const rate = attempts ? confused / attempts : 0
    if (rate < minRate) continue
    rows.push({ key, label: group.label, tip: group.tip, attempts, confused, rate })
  }
  rows.sort((a, b) => b.rate - a.rate || b.confused - a.confused)
  return rows.slice(0, limit)
}

/**
 * Tổng kết vốn cụm SRS của khóa comm: số câu đã lưu (chủ đề "Giao tiếp thực
 * chiến") và trong đó bao nhiêu đã ở trạng thái "nhớ" (đã ôn đúng ≥ 2 lần —
 * `reps >= 2` trong lịch SRS). Dùng cho thước đo "≥ 70% ở trạng thái nhớ".
 */
export function commSrsSummary(user) {
  const saved = user.savedWordList.filter((w) => w.topic === COMM_SAVE_TOPIC)
  let remembered = 0
  for (const w of saved) {
    const sched = user.srsOf(w.srsId)
    if (sched && (sched.reps || 0) >= 2) remembered += 1
  }
  const total = saved.length
  return { total, remembered, pct: total ? Math.round((remembered / total) * 100) : 0 }
}
