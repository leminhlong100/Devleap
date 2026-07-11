import { describe, it, expect } from 'vitest'
import { pickBySeed, setSpeechProfile, clearSpeechProfile, getSpeechRate } from '@/lib/speak'

describe('speak — pickBySeed (chọn giọng đa vùng ổn định, không random)', () => {
  const voices = ['en-US', 'en-GB', 'en-AU', 'en-IN']

  it('cùng seed -> cùng phần tử (deterministic)', () => {
    expect(pickBySeed(voices, 12)).toBe(pickBySeed(voices, 12))
    expect(pickBySeed(voices, 12)).toBe(voices[12 % 4])
  })
  it('seed khác nhau trải đều theo modulo', () => {
    expect(pickBySeed(voices, 0)).toBe('en-US')
    expect(pickBySeed(voices, 1)).toBe('en-GB')
    expect(pickBySeed(voices, 2)).toBe('en-AU')
    expect(pickBySeed(voices, 3)).toBe('en-IN')
    expect(pickBySeed(voices, 4)).toBe('en-US')
  })
  it('danh sách rỗng / seed lỗi -> null / phần tử đầu, không ném', () => {
    expect(pickBySeed([], 3)).toBeNull()
    expect(pickBySeed(null, 3)).toBeNull()
    expect(pickBySeed(voices, undefined)).toBe('en-US')
    expect(pickBySeed(voices, -6)).toBe(voices[6 % 4])
  })
})

describe('speak — hồ sơ giọng theo buổi (tốc độ)', () => {
  it('setSpeechProfile kẹp rate trong [0.4, 1.2]; clear về 1', () => {
    setSpeechProfile({ rate: 0.8 })
    expect(getSpeechRate()).toBe(0.8)
    setSpeechProfile({ rate: 5 })
    expect(getSpeechRate()).toBe(1.2)
    setSpeechProfile({ rate: 0.1 })
    expect(getSpeechRate()).toBe(0.4)
    clearSpeechProfile()
    expect(getSpeechRate()).toBe(1)
  })
})
