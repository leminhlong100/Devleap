import { describe, it, expect } from 'vitest'
import { MINIMAL_PAIR_GROUPS, WEEK_FOCUS, COMM_WEEK_FOCUS, focusForWeek, pairsForWeek } from '@/data/minimalPairs'

describe('minimalPairs — pool dữ liệu', () => {
  it('có ít nhất 60 cặp trong toàn bộ pool', () => {
    const total = MINIMAL_PAIR_GROUPS.reduce((n, g) => n + g.pairs.length, 0)
    expect(total).toBeGreaterThanOrEqual(60)
  })
  it('mỗi nhóm có ít nhất 8 cặp và không cặp nào trùng trong nhóm', () => {
    for (const g of MINIMAL_PAIR_GROUPS) {
      expect(g.pairs.length).toBeGreaterThanOrEqual(8)
      const keys = g.pairs.map((p) => p.join('/').toLowerCase())
      expect(new Set(keys).size).toBe(keys.length)
    }
  })
  it('mỗi cặp gồm đúng 2 từ khác nhau, không rỗng', () => {
    for (const g of MINIMAL_PAIR_GROUPS) {
      for (const pair of g.pairs) {
        expect(pair.length).toBe(2)
        expect(pair[0].toLowerCase()).not.toBe(pair[1].toLowerCase())
        expect(pair[0].trim()).not.toBe('')
        expect(pair[1].trim()).not.toBe('')
      }
    }
  })
})

describe('minimalPairs — focusForWeek', () => {
  it('Tuần 2-8 khớp đúng WEEK_FOCUS đã khai báo', () => {
    for (let w = 2; w <= 8; w++) {
      const groups = focusForWeek(w)
      expect(groups.map((g) => g.key)).toEqual(WEEK_FOCUS[w])
    }
  })
  it('tuần ngoài khoảng (1, 9, 99) kẹp về nhóm gần nhất (2 hoặc 8)', () => {
    expect(focusForWeek(1).map((g) => g.key)).toEqual(WEEK_FOCUS[2])
    expect(focusForWeek(0).map((g) => g.key)).toEqual(WEEK_FOCUS[2])
    expect(focusForWeek(9).map((g) => g.key)).toEqual(WEEK_FOCUS[8])
    expect(focusForWeek(99).map((g) => g.key)).toEqual(WEEK_FOCUS[8])
  })
  it('mỗi tuần 2-8 có trọng tâm khác nhau (không lặp lại tuần liền kề)', () => {
    const keys = []
    for (let w = 2; w <= 8; w++) keys.push(focusForWeek(w).map((g) => g.key).join('+'))
    for (let i = 1; i < keys.length; i++) expect(keys[i]).not.toBe(keys[i - 1])
  })
})

describe('minimalPairs — pairsForWeek', () => {
  it('trả về đúng 8 cặp cho mỗi tuần 2-8', () => {
    for (let w = 2; w <= 8; w++) {
      const { pairs } = pairsForWeek(w)
      expect(pairs.length).toBe(8)
    }
  })
  it('không cặp nào lặp lại trong cùng 1 lần chọn', () => {
    for (let w = 2; w <= 8; w++) {
      const { pairs } = pairsForWeek(w)
      const keys = pairs.map((p) => p.join('/').toLowerCase())
      expect(new Set(keys).size).toBe(keys.length)
    }
  })
  it('quyết định (deterministic) — gọi lại nhiều lần ra cùng kết quả', () => {
    const a = pairsForWeek(4, ['play', 'visit'])
    const b = pairsForWeek(4, ['play', 'visit'])
    expect(a).toEqual(b)
  })
  it('ưu tiên cặp chứa từ đã học trong tuần lên đầu danh sách', () => {
    const { pairs, groupKey } = pairsForWeek(4, ['finish'])
    expect(groupKey).toBe('ed')
    expect(pairs[0]).toEqual(['finish', 'finished'])
  })
  it('không có từ đã học khớp thì vẫn trả đủ 8 cặp theo thứ tự gốc của nhóm', () => {
    const { pairs } = pairsForWeek(2, ['zzz-khong-ton-tai'])
    expect(pairs.length).toBe(8)
    expect(pairs[0]).toEqual(['cat', 'cats'])
  })
  it('Tuần 8 trộn nhiều nhóm khó nhất (groupKey ghép nhiều key)', () => {
    const { groupKey, groupLabel } = pairsForWeek(8)
    expect(groupKey.split('+').length).toBeGreaterThan(1)
    expect(groupLabel).toContain('·')
  })
  it('learnedTerms không phân biệt hoa/thường và khoảng trắng', () => {
    const { pairs } = pairsForWeek(3, ['  STUDY  '])
    expect(pairs[0]).toEqual(['study', 'studies'])
  })
})

describe('minimalPairs — khóa comm (COMM_WEEK_FOCUS, course="comm")', () => {
  it('có đủ nhóm âm "giao tiếp" mới (sh/s, b/p, l/n) trong pool', () => {
    const keys = MINIMAL_PAIR_GROUPS.map((g) => g.key)
    expect(keys).toEqual(expect.arrayContaining(['sh-s', 'b-p', 'l-n']))
  })
  it('COMM_WEEK_FOCUS phủ đủ Tuần 1–8 và mọi key tồn tại trong pool', () => {
    const keys = new Set(MINIMAL_PAIR_GROUPS.map((g) => g.key))
    for (let w = 1; w <= 8; w++) {
      expect(Array.isArray(COMM_WEEK_FOCUS[w])).toBe(true)
      expect(COMM_WEEK_FOCUS[w].length).toBeGreaterThanOrEqual(1)
      for (const k of COMM_WEEK_FOCUS[w]) expect(keys.has(k)).toBe(true)
    }
  })
  it('focusForWeek(w, "comm") khớp COMM_WEEK_FOCUS cho Tuần 1–8', () => {
    for (let w = 1; w <= 8; w++) {
      const groups = focusForWeek(w, 'comm')
      expect(groups.map((g) => g.key)).toEqual(COMM_WEEK_FOCUS[w])
    }
  })
  it('pairsForWeek(w, [], "comm") trả đủ 8 cặp cho mỗi Tuần 1–8', () => {
    for (let w = 1; w <= 8; w++) {
      const { pairs } = pairsForWeek(w, [], 'comm')
      expect(pairs.length).toBe(8)
      const uniq = new Set(pairs.map((p) => p.join('/').toLowerCase()))
      expect(uniq.size).toBe(8)
    }
  })
  it('khóa comm khác đường cong Nền Tảng (Tuần 4 comm = sh-s, không phải ed)', () => {
    expect(focusForWeek(4, 'comm').map((g) => g.key)).toEqual(['sh-s'])
    expect(focusForWeek(4).map((g) => g.key)).toEqual(['ed'])
  })
  it('vẫn quyết định + ưu tiên từ đã học (course comm)', () => {
    const a = pairsForWeek(5, ['big'], 'comm')
    const b = pairsForWeek(5, ['big'], 'comm')
    expect(a).toEqual(b)
    expect(a.groupKey).toBe('b-p')
    expect(a.pairs[0]).toEqual(['big', 'pig'])
  })
})
