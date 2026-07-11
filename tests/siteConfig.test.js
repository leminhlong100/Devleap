import { describe, it, expect } from 'vitest'
import { defaultConfig, normalizeConfig, CONFIGURABLE_COURSES } from '@/stores/siteConfig'
import { courseIdForRoute } from '@/router/guard'

/**
 * Đợt 3 — Lớp phủ cấu hình site. An toàn nhất: normalizeConfig phải trả MẶC ĐỊNH
 * "mọi khóa bật, banner tắt" khi thiếu/rác — để không bao giờ khóa nhầm nội dung.
 * + ánh xạ route → khóa để lớp phủ chặn đúng khóa bị tắt.
 */
describe('defaultConfig — mặc định an toàn', () => {
  it('mọi khóa bật, banner tắt', () => {
    const c = defaultConfig()
    for (const id of CONFIGURABLE_COURSES) expect(c.courses[id]).toBe(true)
    expect(c.banner).toEqual({ enabled: false, text: '', tone: 'info' })
  })
})

describe('normalizeConfig — trộn DB lên mặc định', () => {
  it('thiếu hoàn toàn -> mặc định', () => {
    expect(normalizeConfig({})).toEqual(defaultConfig())
    expect(normalizeConfig(null)).toEqual(defaultConfig())
  })

  it('chỉ tắt khóa được chỉ định, khóa khác giữ bật', () => {
    const c = normalizeConfig({ courses: { comm: false } })
    expect(c.courses.comm).toBe(false)
    expect(c.courses.java).toBe(true)
  })

  it('coi mọi giá trị !== false là bật (chống dữ liệu rác)', () => {
    const c = normalizeConfig({ courses: { java: 0, ielts: 'yes' } })
    expect(c.courses.java).toBe(true)
    expect(c.courses.ielts).toBe(true)
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
