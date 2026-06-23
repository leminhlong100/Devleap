import { describe, it, expect } from 'vitest'
import { groupIntoSentences, tidyText } from '@/lib/shadowingSegment'

// Dòng phụ đề tính bằng mili-giây, đúng định dạng youtube-transcript trả về.
const L = (text, offset, duration) => ({ text, offset, duration })

describe('shadowingSegment — tidyText', () => {
  it('gộp khoảng trắng và viết hoa đầu câu', () => {
    expect(tidyText('  this   is  a  test ')).toBe('This is a test')
  })
  it('chuỗi rỗng trả về rỗng', () => {
    expect(tidyText('   ')).toBe('')
  })
  it('sửa "i" viết thường thành "I" (kể cả dạng rút gọn), không đụng từ khác', () => {
    expect(tidyText('i think i\'m fine and it is in')).toBe("I think I'm fine and it is in")
    expect(tidyText("i'll go and i've seen it")).toBe("I'll go and I've seen it")
  })
})

describe('shadowingSegment — groupIntoSentences', () => {
  it('gộp các dòng liền nhau thành một câu, đổi ms -> giây', () => {
    const out = groupIntoSentences([
      L('hello there', 1000, 1000),
      L('how are you', 2000, 1000),
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 1, text: 'Hello there how are you', start: 1, end: 3 })
  })

  it('ngắt câu khi có khoảng lặng lớn', () => {
    const out = groupIntoSentences([
      L('first part', 0, 1000),
      L('still first', 1000, 1000),
      // khoảng lặng 2s trước dòng kế -> câu mới
      L('second part', 4000, 1000),
    ])
    expect(out).toHaveLength(2)
    expect(out[0].text).toBe('First part still first')
    expect(out[1].text).toBe('Second part')
    expect(out[1].start).toBe(4)
  })

  it('ngắt khi vượt số từ tối đa', () => {
    const lines = Array.from({ length: 10 }, (_, i) => L('alpha beta', i * 500, 500))
    const out = groupIntoSentences(lines, { maxWords: 6, targetMs: 999999 })
    // mỗi câu tối đa 6 từ = 3 dòng "alpha beta"
    expect(out.every((s) => s.text.split(/\s+/).length <= 6)).toBe(true)
    expect(out.length).toBeGreaterThan(1)
  })

  it('bỏ qua dòng rỗng và sắp xếp theo thời gian', () => {
    const out = groupIntoSentences([
      L('world', 2000, 500),
      L('   ', 1500, 500),
      L('hello', 1000, 500),
    ], { maxGapMs: 2000 })
    expect(out).toHaveLength(1)
    expect(out[0].text).toBe('Hello world')
    expect(out[0].start).toBe(1)
  })

  it('mảng rỗng trả về []', () => {
    expect(groupIntoSentences([])).toEqual([])
    expect(groupIntoSentences(null)).toEqual([])
  })
})
