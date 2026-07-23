import { describe, it, expect } from 'vitest'
import { reviewNext, isDue, REVIEW_INTERVALS_DAYS } from '@/lib/srsReview'

const DAY = 86400000
const NOW = 1_700_000_000_000

describe('reviewNext — Leitner', () => {
  it('đúng -> lên box, hạn ôn giãn xa hơn', () => {
    const r = reviewNext(0, true, NOW)
    expect(r.box).toBe(1)
    expect(r.due).toBe(NOW + REVIEW_INTERVALS_DAYS[1] * DAY)
    expect(r.mastered).toBe(false)
  })

  it('sai -> về box 0', () => {
    const r = reviewNext(3, false, NOW)
    expect(r.box).toBe(0)
    expect(r.due).toBe(NOW + REVIEW_INTERVALS_DAYS[0] * DAY)
  })

  it('đúng ở box cao nhất -> mastered', () => {
    const max = REVIEW_INTERVALS_DAYS.length - 1
    const r = reviewNext(max, true, NOW)
    expect(r.mastered).toBe(true)
    expect(r.box).toBe(max)
  })
})

describe('isDue', () => {
  it('tới hạn khi due <= now', () => {
    expect(isDue({ due: NOW - 1 }, NOW)).toBe(true)
    expect(isDue({ due: NOW + 1 }, NOW)).toBe(false)
  })
})
