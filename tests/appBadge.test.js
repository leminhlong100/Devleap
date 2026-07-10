import { describe, it, expect, afterEach, vi } from 'vitest'
import { badgeCount, setAppBadge, clearAppBadge, updateAppBadge } from '@/lib/appBadge'

describe('badgeCount', () => {
  it('số dương thì giữ nguyên (làm tròn xuống số nguyên)', () => {
    expect(badgeCount(3)).toBe(3)
    expect(badgeCount(3.7)).toBe(3)
  })

  it('0 / âm / không phải số → 0 (nghĩa là xóa badge)', () => {
    expect(badgeCount(0)).toBe(0)
    expect(badgeCount(-5)).toBe(0)
    expect(badgeCount(NaN)).toBe(0)
    expect(badgeCount(undefined)).toBe(0)
    expect(badgeCount('abc')).toBe(0)
  })
})

describe('setAppBadge / clearAppBadge — feature-detect + nuốt lỗi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('trình duyệt không hỗ trợ API thì không lỗi, trả false', () => {
    vi.stubGlobal('navigator', {})
    expect(setAppBadge(3)).toBe(false)
    expect(clearAppBadge()).toBe(false)
  })

  it('gọi đúng API khi được hỗ trợ (promise được nuốt lỗi)', () => {
    const setBadge = vi.fn(() => Promise.resolve())
    const clearBadge = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { setAppBadge: setBadge, clearAppBadge: clearBadge })
    expect(setAppBadge(3)).toBe(true)
    expect(setBadge).toHaveBeenCalledWith(3)
    expect(clearAppBadge()).toBe(true)
    expect(clearBadge).toHaveBeenCalledTimes(1)
  })

  it('API ném lỗi đồng bộ vẫn không làm sập, trả false', () => {
    const setBadge = vi.fn(() => {
      throw new Error('nope')
    })
    vi.stubGlobal('navigator', { setAppBadge: setBadge })
    expect(setAppBadge(3)).toBe(false)
  })
})

describe('updateAppBadge — đồng bộ badge theo số từ đến hạn', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('>0 thì đặt số, không xóa', () => {
    const setBadge = vi.fn(() => Promise.resolve())
    const clearBadge = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { setAppBadge: setBadge, clearAppBadge: clearBadge })
    expect(updateAppBadge(4)).toBe(4)
    expect(setBadge).toHaveBeenCalledWith(4)
    expect(clearBadge).not.toHaveBeenCalled()
  })

  it('=0 thì xóa, không đặt số', () => {
    const setBadge = vi.fn(() => Promise.resolve())
    const clearBadge = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { setAppBadge: setBadge, clearAppBadge: clearBadge })
    expect(updateAppBadge(0)).toBe(0)
    expect(clearBadge).toHaveBeenCalledTimes(1)
    expect(setBadge).not.toHaveBeenCalled()
  })
})
