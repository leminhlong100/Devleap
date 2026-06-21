import { describe, it, expect } from 'vitest'
import { parseQuiz } from '@/data/md/quiz'

describe('parseQuiz()', () => {
  const sample = `
1. Generics tồn tại ở đâu?
   - [ ] Runtime
   - [x] Compile-time
   - [ ] Cả hai
   💡 Type erasure xóa generic lúc compile.
2. HashMap có thread-safe không?
   - [x] Không
   - [ ] Có
`.split('\n')

  it('tách đúng số câu & phương án', () => {
    const q = parseQuiz(sample)
    expect(q).toHaveLength(2)
    expect(q[0].opts).toHaveLength(3)
    expect(q[1].opts).toHaveLength(2)
  })

  it('xác định đúng đáp án đúng (index)', () => {
    const q = parseQuiz(sample)
    expect(q[0].correct).toBe(1) // "Compile-time"
    expect(q[0].opts[q[0].correct]).toBe('Compile-time')
    expect(q[1].correct).toBe(0) // "Không"
  })

  it('gom phần giải thích 💡 vào ex', () => {
    const q = parseQuiz(sample)
    expect(q[0].ex).toContain('Type erasure')
    expect(q[1].ex).toBe('')
  })

  it('bỏ câu có dưới 2 phương án', () => {
    const lines = ['1. Câu lỗi?', '   - [x] Chỉ một đáp án'].join('\n').split('\n')
    expect(parseQuiz(lines)).toHaveLength(0)
  })

  it('tôn trọng khoảng [start, end)', () => {
    const q = parseQuiz(sample, 5) // bỏ câu 1
    expect(q).toHaveLength(1)
    expect(q[0].q).toContain('HashMap')
  })
})
