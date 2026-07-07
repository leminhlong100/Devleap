import { describe, it, expect, beforeEach } from 'vitest'
import {
  eligibleToShowInstallCard,
  getDismissedAt,
  markInstallDismissed,
  isStandaloneDisplay,
  isIosDevice,
} from '@/lib/installPrompt'

describe('eligibleToShowInstallCard', () => {
  const now = 1_700_000_000_000

  it('chưa đủ buổi học thì không mời', () => {
    expect(eligibleToShowInstallCard({ totalSessions: 0, dismissedAt: null, now })).toBe(false)
  })

  it('đủ ≥1 buổi và chưa từng "Để sau" thì mời', () => {
    expect(eligibleToShowInstallCard({ totalSessions: 1, dismissedAt: null, now })).toBe(true)
  })

  it('vừa bấm "Để sau" thì chưa mời lại', () => {
    expect(eligibleToShowInstallCard({ totalSessions: 5, dismissedAt: now - 1000, now })).toBe(false)
  })

  it('đã qua 7 ngày kể từ lần "Để sau" thì mời lại', () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    expect(eligibleToShowInstallCard({ totalSessions: 5, dismissedAt: now - sevenDays - 1, now })).toBe(true)
    expect(eligibleToShowInstallCard({ totalSessions: 5, dismissedAt: now - sevenDays + 1, now })).toBe(false)
  })
})

describe('lưu/đọc thời điểm "Để sau"', () => {
  beforeEach(() => localStorage.clear())

  it('chưa lưu gì thì trả về null', () => {
    expect(getDismissedAt()).toBe(null)
  })

  it('lưu rồi đọc lại đúng giá trị', () => {
    markInstallDismissed(12345)
    expect(getDismissedAt()).toBe(12345)
  })

  it('giá trị hỏng trong localStorage thì rơi về null', () => {
    localStorage.setItem('devleap:install-dismissed-at', 'abc')
    expect(getDismissedAt()).toBe(null)
  })
})

describe('isStandaloneDisplay', () => {
  it('không có matchMedia/navigator.standalone thì false', () => {
    expect(isStandaloneDisplay()).toBe(false)
  })
})

describe('isIosDevice', () => {
  it('nhận diện iPhone/iPad/iPod qua user agent', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14)')).toBe(false)
    expect(isIosDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false)
  })
})
