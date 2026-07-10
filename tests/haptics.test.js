import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import {
  vibrationPattern,
  isHapticEnabled,
  setHapticEnabled,
  haptic,
} from '@/lib/haptics'

describe('vibrationPattern — quyết định pattern rung (thuần)', () => {
  it('mỗi loại sự kiện có pattern riêng', () => {
    expect(vibrationPattern('light')).toBe(12)
    expect(vibrationPattern('success')).toEqual([14, 45, 26])
    expect(vibrationPattern('error')).toEqual([22, 55, 22])
  })

  it('loại lạ → 0 (không rung)', () => {
    expect(vibrationPattern('nope')).toBe(0)
    expect(vibrationPattern()).toBe(0)
  })
})

describe('isHapticEnabled / setHapticEnabled — mặc định bật, nhớ localStorage', () => {
  beforeEach(() => localStorage.clear())

  it('chưa lưu gì → mặc định bật', () => {
    expect(isHapticEnabled()).toBe(true)
  })

  it('tắt rồi bật lại', () => {
    setHapticEnabled(false)
    expect(isHapticEnabled()).toBe(false)
    setHapticEnabled(true)
    expect(isHapticEnabled()).toBe(true)
  })
})

describe('haptic — feature-detect + tôn trọng toggle', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('trình duyệt không hỗ trợ vibrate → không lỗi, trả false', () => {
    vi.stubGlobal('navigator', {})
    expect(haptic('light')).toBe(false)
  })

  it('được hỗ trợ + đang bật → gọi API với đúng pattern', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    expect(haptic('error')).toBe(true)
    expect(vibrate).toHaveBeenCalledWith([22, 55, 22])
  })

  it('đã tắt trong cài đặt → không gọi API', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    setHapticEnabled(false)
    expect(haptic('light')).toBe(false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('loại có pattern 0 → không gọi API', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    expect(haptic('unknown')).toBe(false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('API ném lỗi vẫn không sập, trả false', () => {
    const vibrate = vi.fn(() => {
      throw new Error('nope')
    })
    vi.stubGlobal('navigator', { vibrate })
    expect(haptic('success')).toBe(false)
  })
})
