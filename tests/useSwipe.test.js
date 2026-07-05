import { describe, it, expect } from 'vitest'
import { swipeState, SWIPE_THRESHOLD_RATIO } from '@/composables/useSwipe'

describe('swipeState — tính hướng/ngưỡng vuốt ngang thuần túy', () => {
  it('dx = 0 -> không hướng, chưa vượt ngưỡng', () => {
    const s = swipeState(0, 300)
    expect(s.direction).toBe(null)
    expect(s.committed).toBe(false)
    expect(s.progress).toBe(0)
  })

  it('kéo sang phải chưa đủ 30% bề ngang -> chưa committed', () => {
    const s = swipeState(50, 300) // ~16.7%
    expect(s.direction).toBe('right')
    expect(s.committed).toBe(false)
  })

  it('kéo sang phải đúng ngưỡng 30% -> committed', () => {
    const s = swipeState(300 * SWIPE_THRESHOLD_RATIO, 300)
    expect(s.direction).toBe('right')
    expect(s.committed).toBe(true)
  })

  it('kéo sang trái vượt ngưỡng -> direction left, committed', () => {
    const s = swipeState(-150, 300) // 50%
    expect(s.direction).toBe('left')
    expect(s.committed).toBe(true)
  })

  it('progress luôn kẹp trong [-1, 1] kể cả khi kéo quá bề ngang', () => {
    expect(swipeState(900, 300).progress).toBe(1)
    expect(swipeState(-900, 300).progress).toBe(-1)
  })

  it('width = 0 không chia cho 0 (dùng mốc 1px)', () => {
    const s = swipeState(5, 0)
    expect(Number.isFinite(s.progress)).toBe(true)
  })
})
