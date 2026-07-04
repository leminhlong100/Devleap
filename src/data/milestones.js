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
