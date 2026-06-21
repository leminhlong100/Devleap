import { describe, it, expect } from 'vitest'
import {
  schedule,
  previewInterval,
  isDue,
  daysUntil,
  addDaysISO,
  todayISO,
  intervalLabel,
} from '@/lib/srs'

// Ngày cố định để kết quả lịch ôn ổn định, không phụ thuộc đồng hồ thực.
const NOW = new Date(2026, 5, 21) // 2026-06-21 (local)

describe('srs — tiện ích ngày', () => {
  it('todayISO trả về YYYY-MM-DD có đệm 0', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('addDaysISO cộng ngày qua ranh giới tháng', () => {
    expect(addDaysISO('2026-06-21', 6)).toBe('2026-06-27')
    expect(addDaysISO('2026-06-30', 1)).toBe('2026-07-01')
  })
  it('daysUntil: dương = tương lai, âm = quá hạn, 0 = hôm nay', () => {
    expect(daysUntil('2026-06-27', NOW)).toBe(6)
    expect(daysUntil('2026-06-21', NOW)).toBe(0)
    expect(daysUntil('2026-06-18', NOW)).toBe(-3)
  })
})

describe('srs — schedule (SM-2)', () => {
  it('thẻ mới chấm "Tốt": reps=1, interval=1 ngày, due=ngày mai', () => {
    const c = schedule(null, 'good', NOW)
    expect(c.reps).toBe(1)
    expect(c.interval).toBe(1)
    expect(c.due).toBe('2026-06-22')
    expect(c.last).toBe('2026-06-21')
    expect(c.ease).toBe(2.5)
    expect(c.lapses).toBe(0)
  })

  it('thẻ mới chấm "Dễ": interval=4 ngày, ease tăng', () => {
    const c = schedule(null, 'easy', NOW)
    expect(c.interval).toBe(4)
    expect(c.ease).toBe(2.65)
  })

  it('lần ôn thứ 2 chấm "Tốt": interval nhảy lên 6 ngày', () => {
    const first = schedule(null, 'good', NOW)
    const second = schedule(first, 'good', NOW)
    expect(second.reps).toBe(2)
    expect(second.interval).toBe(6)
  })

  it('từ lần 3 trở đi: interval = round(interval * ease)', () => {
    let c = schedule(null, 'good', NOW) // i=1
    c = schedule(c, 'good', NOW) // i=6
    const third = schedule(c, 'good', NOW) // 6 * 2.5 = 15
    expect(third.reps).toBe(3)
    expect(third.interval).toBe(15)
  })

  it('"Quên" đặt lại reps về 0, tăng lapses, giảm ease, đến hạn hôm nay', () => {
    let c = schedule(null, 'good', NOW)
    c = schedule(c, 'good', NOW) // ease 2.5, reps 2
    const lapsed = schedule(c, 'again', NOW)
    expect(lapsed.reps).toBe(0)
    expect(lapsed.lapses).toBe(1)
    expect(lapsed.interval).toBe(0)
    expect(lapsed.due).toBe('2026-06-21') // hôm nay -> vẫn đến hạn
    expect(lapsed.ease).toBe(2.3)
  })

  it('ease không xuống dưới sàn 1.3', () => {
    let c = { ease: 1.4, reps: 0, lapses: 0, interval: 0 }
    c = schedule(c, 'again', NOW) // 1.4 - 0.2 = 1.2 -> kẹp 1.3
    expect(c.ease).toBe(1.3)
  })

  it('previewInterval khớp với interval mà schedule tạo ra', () => {
    const c = schedule(null, 'good', NOW)
    expect(previewInterval(c, 'good', NOW)).toBe(schedule(c, 'good', NOW).interval)
  })
})

describe('srs — isDue & intervalLabel', () => {
  it('thẻ mới (null/không due) luôn đến hạn', () => {
    expect(isDue(null, NOW)).toBe(true)
    expect(isDue({}, NOW)).toBe(true)
  })
  it('due hôm nay hoặc quá khứ = đến hạn; tương lai = chưa', () => {
    expect(isDue({ due: '2026-06-21' }, NOW)).toBe(true)
    expect(isDue({ due: '2026-06-20' }, NOW)).toBe(true)
    expect(isDue({ due: '2026-06-25' }, NOW)).toBe(false)
  })
  it('intervalLabel: ngày / tháng / năm', () => {
    expect(intervalLabel(0)).toBe('ôn lại')
    expect(intervalLabel(1)).toBe('1 ngày')
    expect(intervalLabel(6)).toBe('6 ngày')
    expect(intervalLabel(45)).toBe('2 tháng')
    expect(intervalLabel(400)).toBe('1 năm')
  })
})
