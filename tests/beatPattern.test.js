import { describe, it, expect } from 'vitest'
import { beatPattern, beatCount } from '@/lib/beatPattern'

describe('beatPattern() — nhịp trọng âm câu', () => {
  it('nhấn từ mang nghĩa, nuốt từ chức năng', () => {
    const { words, beats } = beatPattern('Could I get a coffee, please?')
    const stressed = words.filter((w) => w.stressed).map((w) => w.word)
    expect(stressed).toEqual(['get', 'coffee,', 'please?'])
    expect(beats).toBe(3)
    // từ chức năng KHÔNG nhấn
    expect(words.find((w) => w.word === 'Could').stressed).toBe(false)
    expect(words.find((w) => w.word === 'a').stressed).toBe(false)
  })

  it('từ hỏi WH vẫn được nhấn (mang nội dung)', () => {
    const { words, beats } = beatPattern('What do you want?')
    expect(words.find((w) => w.word === 'What').stressed).toBe(true)
    expect(words.find((w) => w.word === 'do').stressed).toBe(false)
    expect(words.find((w) => w.word === 'you').stressed).toBe(false)
    expect(beats).toBe(2) // What + want
  })

  it('câu toàn từ chức năng -> vẫn có ít nhất 1 nhịp (từ dài nhất)', () => {
    const { beats } = beatPattern('to the')
    expect(beats).toBe(1)
  })

  it('câu rỗng -> 0 nhịp', () => {
    expect(beatPattern('').beats).toBe(0)
    expect(beatPattern('   ').words).toEqual([])
  })

  it('beatCount() = số nhịp của beatPattern()', () => {
    const s = 'I would like to book a table for two.'
    expect(beatCount(s)).toBe(beatPattern(s).beats)
    // like, book, table, two = 4 nhịp (would/to/a/for/I là chức năng)
    expect(beatCount(s)).toBe(4)
  })
})
