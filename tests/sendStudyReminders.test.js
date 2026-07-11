import { describe, it, expect } from 'vitest'
import { shouldSendReminder } from '../netlify/functions/send-study-reminders.js'

describe('shouldSendReminder — nhắc học qua push (Bước 3.3)', () => {
  const now = { hour: 20, dateKey: '2026-7-12' }

  it('gửi khi đúng giờ ưa thích, chưa học hôm nay, streak > 0', () => {
    expect(shouldSendReminder({ streak: 3, lastStudyDate: '2026-7-11', preferredHour: 20 }, now)).toBe(true)
  })

  it('không gửi nếu chưa từng học (streak = 0)', () => {
    expect(shouldSendReminder({ streak: 0, lastStudyDate: null, preferredHour: 20 }, now)).toBe(false)
  })

  it('không gửi nếu đã học hôm nay rồi', () => {
    expect(shouldSendReminder({ streak: 5, lastStudyDate: '2026-7-12', preferredHour: 20 }, now)).toBe(false)
  })

  it('không gửi nếu chưa tới giờ ưa thích', () => {
    expect(shouldSendReminder({ streak: 5, lastStudyDate: '2026-7-11', preferredHour: 21 }, now)).toBe(false)
  })
})
