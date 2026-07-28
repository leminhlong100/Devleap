import { describe, it, expect } from 'vitest'
import { requiredSentencesFor } from '@/lib/dayPlan'

describe('requiredSentencesFor() — số câu bắt buộc rút từ đề bài viết', () => {
  it('đọc được số câu trong đề', () => {
    expect(requiredSentencesFor('Viết 10 câu về bản thân em.')).toBe(10)
    expect(requiredSentencesFor('Viết 5 câu.')).toBe(5)
  })
  it('kẹp trong khoảng 3..20', () => {
    expect(requiredSentencesFor('Viết 1 câu.')).toBe(3)
    expect(requiredSentencesFor('Viết 99 câu.')).toBe(20)
  })
  it('đề không nêu số câu -> mặc định 3', () => {
    expect(requiredSentencesFor('Viết về bản thân em.')).toBe(3)
    expect(requiredSentencesFor('')).toBe(3)
    expect(requiredSentencesFor(undefined)).toBe(3)
  })
})
