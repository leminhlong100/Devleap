import { describe, it, expect } from 'vitest'
import { routeGuardDecision } from '@/router/guard'

/** Ràng buộc cổng vào (UX). An toàn thật ở function admin — xem adminAuth.test.js. */
describe('routeGuardDecision', () => {
  const admin = (over = {}) => ({ meta: { requiresAdmin: true }, fullPath: '/admin', ...over })
  const authed = (over = {}) => ({ meta: { requiresAuth: true }, fullPath: '/courses', ...over })

  it('route công khai (không meta) -> luôn cho qua', () => {
    expect(routeGuardDecision({ meta: {}, fullPath: '/' }, {})).toBe(true)
  })

  describe('requiresAdmin', () => {
    it('chưa cấu hình cloud -> về home', () => {
      const d = routeGuardDecision(admin(), { cloudEnabled: false, isAuthed: false, isAdmin: false })
      expect(d).toEqual({ name: 'home' })
    })

    it('chưa đăng nhập -> về home kèm login=required + redirect', () => {
      const d = routeGuardDecision(admin(), { cloudEnabled: true, isAuthed: false, isAdmin: false })
      expect(d).toEqual({ name: 'home', query: { login: 'required', redirect: '/admin' } })
    })

    it('đăng nhập nhưng KHÔNG phải admin -> về home', () => {
      const d = routeGuardDecision(admin(), { cloudEnabled: true, isAuthed: true, isAdmin: false })
      expect(d).toEqual({ name: 'home' })
    })

    it('đúng admin -> cho qua', () => {
      const d = routeGuardDecision(admin(), { cloudEnabled: true, isAuthed: true, isAdmin: true })
      expect(d).toBe(true)
    })
  })

  describe('requiresAuth', () => {
    it('chưa cấu hình cloud -> cho qua (chế độ khách)', () => {
      expect(routeGuardDecision(authed(), { cloudEnabled: false, isAuthed: false, isAdmin: false })).toBe(true)
    })

    it('đã đăng nhập -> cho qua', () => {
      expect(routeGuardDecision(authed(), { cloudEnabled: true, isAuthed: true, isAdmin: false })).toBe(true)
    })

    it('cloud bật nhưng chưa đăng nhập -> về home kèm redirect', () => {
      const d = routeGuardDecision(authed(), { cloudEnabled: true, isAuthed: false, isAdmin: false })
      expect(d).toEqual({ name: 'home', query: { login: 'required', redirect: '/courses' } })
    })
  })
})
