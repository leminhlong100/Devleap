/**
 * Ba mốc ghi âm CỐ ĐỊNH của khóa "Giao Tiếp Thực Chiến" — nghe lại cạnh nhau ở
 * trang Tổng kết cuối khóa (xem views/CommSummaryView.vue). Khai báo tay, không suy
 * từ nhịp học vì nhịp comm ghi "Bản ghi…" chứ không phải "ghi âm"): Buổi 1.1 (mốc
 * 0) / Boss giữa khóa 4.7 / Final Boss 8.7 — để nghe lại cạnh nhau cuối khóa.
 * `recId` khớp quy ước VoiceRecorder ("comm:W:D") + đồng bộ qua recordingSync.
 */
export const COMM_MILESTONES = [
  { week: 1, day: 1, recId: 'comm:1:1', tag: 'Đầu khóa', label: 'Mốc 0 — Small talk buổi đầu' },
  { week: 4, day: 7, recId: 'comm:4:7', tag: 'Giữa khóa', label: 'Mốc giữa — Video call Boss giữa khóa' },
  { week: 8, day: 7, recId: 'comm:8:7', tag: 'Cuối khóa', label: 'Mốc cuối — Final Boss' },
]

/** Mốc ghi âm của một buổi khóa comm (null nếu buổi đó không phải mốc). */
export function commMilestoneOf(week, day) {
  return COMM_MILESTONES.find((m) => m.week === Number(week) && m.day === Number(day)) || null
}
