import { ieltsWeekStructure, getIeltsDay } from '@/data/courseIelts'
import { MISSION_BADGES } from '@/data/badges'

/**
 * Duyệt toàn bộ 8 tuần IELTS để tính số liệu "real-life": Mission tuần đã xong,
 * số buổi nói người thật đã tick, và Mission Tuần 6 (email thật) đã xong chưa.
 * Không lưu ở store vì có thể suy trực tiếp từ `missions` + `checklists` đã có.
 */
export function ieltsMissionStats(user) {
  let missionsDone = 0
  let realTalksDone = 0
  let week6MissionDone = false

  for (const wk of ieltsWeekStructure) {
    for (const n of wk.dayNums) {
      if (user.realTalkDone('ielts', wk.num, n)) realTalksDone += 1
      if (user.missionDone('ielts', wk.num, n)) {
        missionsDone += 1
        if (wk.num === 6) week6MissionDone = true
      }
    }
  }

  return { missionsDone, realTalksDone, week6MissionDone }
}

/** Danh sách huy hiệu mission đã đạt (dùng cho Home / trang So sánh mốc). */
export function earnedMissionBadges(user) {
  const stats = ieltsMissionStats(user)
  return MISSION_BADGES.filter((b) => b.check(stats))
}

/** Nhật ký mission: mọi buổi đã có ghi chú/đánh dấu Mission, mới nhất trước. */
export function missionLogEntries(user) {
  const out = []
  for (const wk of ieltsWeekStructure) {
    for (const n of wk.dayNums) {
      const m = user.missionOf('ielts', wk.num, n)
      if (!m || (!m.note && !m.done)) continue
      const d = getIeltsDay(wk.num, n)
      const item = (d?.checklist || []).find((c) => /🌍|mission\s*tuần/i.test(c)) || ''
      const text = item.replace(/^.*?mission\s*tuần[^:]*:\s*/i, '').replace(/^🌍\s*/, '').trim() || item
      out.push({ week: wk.num, day: n, text, note: m.note || '', done: !!m.done, at: m.at || '' })
    }
  }
  return out.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}
