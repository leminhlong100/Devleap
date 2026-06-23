import { describe, it, expect } from 'vitest'
import { normalizeWords, scoreTranscript, scoreVerdict } from '@/lib/pronounceScore'

describe('pronounceScore — normalizeWords', () => {
  it('thường hóa, bỏ dấu câu, giữ dấu nháy', () => {
    expect(normalizeWords("I'll take a slice, thanks!")).toEqual(["i'll", 'take', 'a', 'slice', 'thanks'])
  })
  it('câu rỗng -> []', () => {
    expect(normalizeWords('   ')).toEqual([])
  })
})

describe('pronounceScore — scoreTranscript', () => {
  it('nói đúng hệt -> 100', () => {
    const r = scoreTranscript('I heard there is a special', 'i heard there is a special')
    expect(r.score).toBe(100)
    expect(r.words.every((w) => w.ok)).toBe(true)
  })

  it('thiếu vài từ -> điểm tỉ lệ theo số từ trùng', () => {
    const r = scoreTranscript('one two three four', 'one three')
    expect(r.hit).toBe(2)
    expect(r.total).toBe(4)
    expect(r.score).toBe(50)
    expect(r.words.map((w) => w.ok)).toEqual([true, false, true, false])
  })

  it('bỏ qua từ thừa người học chêm vào (vẫn khớp đúng thứ tự)', () => {
    const r = scoreTranscript('please order tea', 'please uh order some tea')
    expect(r.score).toBe(100)
  })

  it('không nghe được gì -> 0 và mọi từ sai', () => {
    const r = scoreTranscript('hello world', '')
    expect(r.score).toBe(0)
    expect(r.words.every((w) => !w.ok)).toBe(true)
  })

  it('câu gốc rỗng -> 0, không chia cho 0', () => {
    expect(scoreTranscript('', 'anything')).toMatchObject({ score: 0, total: 0 })
  })

  it('giữ nguyên hoa/thường của từ gốc để hiển thị', () => {
    const r = scoreTranscript('Asparagus and a roll', 'asparagus and a roll')
    expect(r.words[0].word).toBe('Asparagus')
  })
})

describe('pronounceScore — scoreVerdict', () => {
  it('phân ngưỡng điểm', () => {
    expect(scoreVerdict(95).kind).toBe('great')
    expect(scoreVerdict(80).kind).toBe('good')
    expect(scoreVerdict(60).kind).toBe('ok')
    expect(scoreVerdict(30).kind).toBe('low')
  })
})
