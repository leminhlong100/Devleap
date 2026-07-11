import { describe, it, expect } from 'vitest'
import { buildSearchIndex, searchAll, searchEntries, normalize } from '@/data/searchIndex'

describe('normalize() — bỏ dấu + thường hóa', () => {
  it('bỏ dấu thanh và dấu mũ tiếng Việt', () => {
    expect(normalize('Kế Thừa')).toBe('ke thua')
    expect(normalize('Đa hình')).toBe('da hinh')
    expect(normalize('  Lập   trình  ')).toBe('lap trinh')
  })
  it('an toàn với null/rỗng', () => {
    expect(normalize(null)).toBe('')
    expect(normalize('')).toBe('')
  })
})

describe('buildSearchIndex() — fixtures thật', () => {
  const index = buildSearchIndex()

  it('có cả ba loại entry và cả hai khóa học', () => {
    const types = new Set(index.map((e) => e.type))
    const courses = new Set(index.map((e) => e.course))
    expect(types).toContain('lesson')
    expect(types).toContain('vocab')
    expect(types).toContain('term')
    expect(courses).toContain('java')
    expect(courses).toContain('ielts')
  })

  it('mỗi entry bài học có route điều hướng hợp lệ', () => {
    for (const e of index.filter((x) => x.type === 'lesson')) {
      expect(['java-day', 'ielts-day', 'comm-day']).toContain(e.route.name)
      expect(e.route.params.week).toBeGreaterThan(0)
      expect(e.route.params.day).toBeGreaterThan(0)
    }
  })

  it('số bài học khớp tổng số ngày của ba khóa (~170)', () => {
    const lessons = index.filter((e) => e.type === 'lesson').length
    expect(lessons).toBeGreaterThanOrEqual(110)
  })

  it('có nội dung khóa Giao Tiếp: bài học comm-day + tình huống roleplay', () => {
    const commLessons = index.filter((e) => e.course === 'comm' && e.type === 'lesson')
    expect(commLessons.length).toBe(56)
    // Tình huống roleplay thành term, tới đúng buổi N.D.
    const commTerms = index.filter((e) => e.course === 'comm' && e.type === 'term')
    expect(commTerms.length).toBeGreaterThanOrEqual(40)
    for (const e of commTerms) expect(e.route.name).toBe('comm-day')
  })

  it('từ vựng được gộp trùng theo từng khóa (không lặp tiêu đề chuẩn hóa)', () => {
    const seen = new Set()
    for (const e of index.filter((x) => x.type === 'vocab')) {
      const key = `${e.course}:${normalize(e.title)}`
      expect(seen.has(key), `trùng: ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it('searchEntries là chỉ mục dựng sẵn cùng kích thước', () => {
    expect(searchEntries.length).toBe(index.length)
  })
})

describe('searchAll() — chấm điểm & xếp hạng', () => {
  it('truy vấn rỗng trả về mảng rỗng', () => {
    expect(searchAll('')).toEqual([])
    expect(searchAll('   ')).toEqual([])
  })

  it('tìm không dấu vẫn ra kết quả có dấu', () => {
    const withTone = searchAll('kế thừa')
    const noTone = searchAll('ke thua')
    expect(noTone.length).toBeGreaterThan(0)
    expect(noTone.length).toBe(withTone.length)
  })

  it('mọi token phải xuất hiện (ngữ nghĩa AND)', () => {
    const r = searchAll('zzqq khongtontai')
    expect(r).toEqual([])
  })

  it('khớp tiêu đề chính xác được ưu tiên hơn khớp phụ', () => {
    // tìm một từ vựng bất kỳ rồi xác nhận nó nằm gần đầu khi gõ đúng từ đó
    const vocab = buildSearchIndex().find((e) => e.type === 'vocab')
    const r = searchAll(vocab.title)
    const top = r[0]
    expect(top).toBeTruthy()
    expect(normalize(top.title)).toContain(normalize(vocab.title))
  })

  it('tôn trọng giới hạn limit', () => {
    const r = searchAll('a', { limit: 5 })
    expect(r.length).toBeLessThanOrEqual(5)
  })

  it('kết quả sắp theo điểm giảm dần', () => {
    const r = searchAll('java')
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score)
    }
  })
})
