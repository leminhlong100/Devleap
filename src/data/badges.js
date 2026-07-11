/**
 * Huy hiệu MISSION (real-life, ngoài app) — tách khỏi bộ đếm `badges` chung
 * trong store (thưởng khi xong tuần/quiz/shadowing). Điều kiện tính từ
 * `missionBadgeStats()` (lib/missionStats.js), không cần cột Supabase mới vì
 * suy trực tiếp từ state đã có (`missions`, `checklists`).
 */
export const MISSION_BADGES = [
  {
    key: 'first-mission',
    icon: '🚪',
    title: 'Ra khỏi app lần đầu',
    desc: 'Hoàn thành Mission tuần đầu tiên',
    check: (stats) => stats.missionsDone >= 1,
  },
  {
    key: 'real-talks-4',
    icon: '🗣️',
    title: '4 buổi người thật',
    desc: 'Hoàn thành 4 buổi nói với người thật',
    check: (stats) => stats.realTalksDone >= 4,
  },
  {
    key: 'real-email',
    icon: '📧',
    title: 'Email thật đã gửi',
    desc: 'Hoàn thành Mission Tuần 6 (gửi email tiếng Anh thật)',
    check: (stats) => stats.week6MissionDone,
  },
]

/**
 * Huy hiệu khóa "Giao Tiếp Thực Chiến" — cột mốc riêng của khóa comm, tính từ
 * `commBadgeStats()` (lib/commStats.js): suy từ điểm Boss (quizScores khóa
 * "comm:boss:N") + buổi đã hoàn thành (completed.comm), không cần cột mới.
 */
export const COMM_BADGES = [
  {
    key: 'comm-first-boss',
    icon: '👑',
    title: 'Qua Boss đầu tiên',
    desc: 'Vượt một Boss tuần với rubric ≥ 70%',
    check: (stats) => stats.bossesPassed >= 1,
  },
  {
    key: 'comm-marathon',
    icon: '🏃',
    title: 'Marathon sống sót',
    desc: 'Hoàn thành buổi Marathon 8.4 — 3 tình huống bất ngờ liên tiếp',
    check: (stats) => stats.marathonDone,
  },
  {
    key: 'comm-mock-interview',
    icon: '🎤',
    title: 'Mock interview hoàn thành',
    desc: 'Vượt Boss phỏng vấn Tuần 7 (mock interview 15’)',
    check: (stats) => stats.mockInterviewDone,
  },
]
