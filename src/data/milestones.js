import { ieltsWeekStructure, getIeltsDay } from './courseIelts'

/** Mọi buổi có ghi âm "mốc" (sản phẩm của buổi là ghi âm), theo thứ tự toàn khóa. */
export function listMilestoneRecordings() {
  const out = []
  let globalDay = 0
  for (const wk of ieltsWeekStructure) {
    for (const n of wk.dayNums) {
      globalDay += 1
      const d = getIeltsDay(wk.num, n)
      const product = d?.rhythm?.product || ''
      if (/ghi\s*âm/i.test(product)) {
        out.push({ week: wk.num, day: n, globalDay, recId: `ielts:${wk.num}:${n}`, label: product.trim() })
      }
    }
  }
  return out
}

/** Chọn 3 mốc tiêu biểu để so sánh: đầu khóa (mốc 0), giữa khóa, cuối khóa. */
export function pickComparisonMilestones() {
  const all = listMilestoneRecordings()
  if (all.length <= 3) return all
  return [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]]
}

/**
 * Ba mốc ghi âm CỐ ĐỊNH của khóa "Giao Tiếp Thực Chiến" (khai báo tay, không suy
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
