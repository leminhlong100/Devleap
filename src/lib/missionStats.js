import { ieltsWeekStructure, getIeltsDay } from '@/data/courseIelts'
import { MISSION_BADGES } from '@/data/badges'

/** Nội dung Mission tuần của một ngày lấy từ checklist (bullet "🌍 Mission tuần…: …"), null nếu ngày không có. */
function extractMissionText(checklist) {
  const item = (checklist || []).find((c) => /🌍|mission\s*tuần/i.test(c))
  if (!item) return null
  return item.replace(/^.*?mission\s*tuần[^:]*:\s*/i, '').replace(/^🌍\s*/, '').trim() || item
}

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
      const text = extractMissionText(d?.checklist) || ''
      out.push({ week: wk.num, day: n, text, note: m.note || '', done: !!m.done, at: m.at || '' })
    }
  }
  return out.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}

/**
 * Mission tuần của tuần đang học (nếu tuần đó có bullet "🌍 Mission tuần" và
 * CHƯA đánh dấu xong) — dùng để nhắc 1 dòng ở Home dashboard. `null` nếu tuần
 * không có mission hoặc đã hoàn thành rồi (không cần nhắc lại).
 */
export function pendingWeekMission(user, week) {
  const wk = ieltsWeekStructure.find((w) => w.num === Number(week))
  if (!wk) return null
  for (const n of wk.dayNums) {
    const d = getIeltsDay(wk.num, n)
    const text = extractMissionText(d?.checklist)
    if (!text) continue
    if (user.missionDone('ielts', wk.num, n)) return null
    return { week: wk.num, day: n, text }
  }
  return null
}
