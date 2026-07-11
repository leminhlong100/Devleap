import { describe, it, expect } from 'vitest'
import {
  defaultConfig,
  normalizeConfig,
  normalizeMode,
  CONFIGURABLE_COURSES,
} from '@/stores/siteConfig'
import { courseIdForRoute } from '@/router/guard'

/**
 * Đợt 3 + 5 — Lớp phủ cấu hình site. An toàn nhất: normalizeConfig phải trả MẶC
 * ĐỊNH "mọi khóa public, banner tắt" khi thiếu/rác — để không bao giờ khóa nhầm
 * nội dung. Mỗi khóa 1 chế độ: 'public' | 'hidden' | 'restricted' (tương thích
 * ngược dữ liệu cũ dạng boolean). + ánh xạ route → khóa để lớp phủ chặn đúng.
 */
describe('normalizeMode — chuẩn hóa chế độ khóa', () => {
  it('boolean cũ: true -> public, false -> hidden', () => {
    expect(normalizeMode(true)).toBe('public')
    expect(normalizeMode(false)).toBe('hidden')
  })
  it('giữ nguyên chế độ hợp lệ', () => {
    expect(normalizeMode('public')).toBe('public')
    expect(normalizeMode('hidden')).toBe('hidden')
    expect(normalizeMode('restricted')).toBe('restricted')
  })
  it('thiếu / rác -> public (an toàn, không khóa nhầm)', () => {
    expect(normalizeMode(undefined)).toBe('public')
    expect(normalizeMode(null)).toBe('public')
    expect(normalizeMode('boom')).toBe('public')
    expect(normalizeMode(0)).toBe('public')
  })
})

describe('defaultConfig — mặc định an toàn', () => {
  it('mọi khóa public, banner tắt', () => {
    const c = defaultConfig()
    for (const id of CONFIGURABLE_COURSES) expect(c.courses[id]).toBe('public')
    expect(c.banner).toEqual({ enabled: false, text: '', tone: 'info' })
  })
})

describe('normalizeConfig — trộn DB lên mặc định', () => {
  it('thiếu hoàn toàn -> mặc định', () => {
    expect(normalizeConfig({})).toEqual(defaultConfig())
    expect(normalizeConfig(null)).toEqual(defaultConfig())
  })

  it('chỉ đổi khóa được chỉ định, khóa khác giữ public', () => {
    const c = normalizeConfig({ courses: { comm: 'hidden', ielts: 'restricted' } })
    expect(c.courses.comm).toBe('hidden')
    expect(c.courses.ielts).toBe('restricted')
    expect(c.courses.java).toBe('public')
  })

  it('tương thích ngược: boolean cũ -> public/hidden', () => {
    const c = normalizeConfig({ courses: { comm: false, java: true } })
    expect(c.courses.comm).toBe('hidden')
    expect(c.courses.java).toBe('public')
  })

  it('giá trị rác -> public (chống dữ liệu hỏng)', () => {
    const c = normalizeConfig({ courses: { java: 0, ielts: 'yes' } })
    expect(c.courses.java).toBe('public')
    expect(c.courses.ielts).toBe('public')
  })

  it('banner: ép kiểu enabled/text/tone, tone lạ -> info', () => {
    expect(normalizeConfig({ banner: { enabled: 1, text: 'Hi', tone: 'warn' } }).banner).toEqual({
      enabled: true,
      text: 'Hi',
      tone: 'warn',
    })
    expect(normalizeConfig({ banner: { tone: 'boom', text: 42 } }).banner).toEqual({
      enabled: false,
      text: '',
      tone: 'info',
    })
  })
})

describe('courseIdForRoute — ánh xạ route → khóa để chặn', () => {
  it('route landing & con đều map đúng khóa', () => {
    expect(courseIdForRoute({ name: 'java' })).toBe('java')
    expect(courseIdForRoute({ name: 'java-day' })).toBe('java')
    expect(courseIdForRoute({ name: 'java-mock' })).toBe('java-prep')
    expect(courseIdForRoute({ name: 'comm-summary' })).toBe('comm')
  })

  it('assessment lấy khóa từ params', () => {
    expect(courseIdForRoute({ name: 'assessment', params: { course: 'ielts' } })).toBe('ielts')
  })

  it('route không gắn khóa -> null', () => {
    expect(courseIdForRoute({ name: 'home' })).toBeNull()
    expect(courseIdForRoute({})).toBeNull()
  })
})
