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
