import { describe, it, expect } from 'vitest'
import { pathDepth, directionFor } from '@/composables/useRouteTransition'

describe('pathDepth — số đoạn path khác rỗng', () => {
  it('gốc = 0, càng sâu càng lớn', () => {
    expect(pathDepth('/')).toBe(0)
    expect(pathDepth('/courses')).toBe(1)
    expect(pathDepth('/courses/ielts')).toBe(2)
    expect(pathDepth('/courses/ielts/week/2/day/3')).toBe(6)
  })

  it('an toàn với path rỗng/thiếu', () => {
    expect(pathDepth('')).toBe(0)
    expect(pathDepth(undefined)).toBe(0)
  })
})

describe('directionFor — hướng theo độ sâu', () => {
  it('đi sâu → forward', () => {
    expect(directionFor('/courses/ielts', '/courses')).toBe('forward')
    expect(directionFor('/courses/ielts/week/2/day/3', '/courses/ielts')).toBe('forward')
  })

  it('lùi ra → back', () => {
    expect(directionFor('/courses', '/courses/ielts')).toBe('back')
    expect(directionFor('/', '/courses')).toBe('back')
  })

  it('cùng độ sâu → none (dùng fade)', () => {
    expect(directionFor('/shadowing', '/progress')).toBe('none')
    expect(directionFor('/courses/java', '/courses/ielts')).toBe('none')
  })
})
