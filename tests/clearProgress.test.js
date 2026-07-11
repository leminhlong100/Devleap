import { describe, it, expect, beforeEach } from 'vitest'
import { clearLocalProgress } from '@/lib/clearProgress'

describe('clearLocalProgress — xóa dữ liệu tiến độ, giữ tùy chọn app', () => {
  beforeEach(() => localStorage.clear())

  it('xóa các key tiến độ cố định', () => {
    localStorage.setItem('devleap:user:v2', '{"xp":10}')
    localStorage.setItem('devleap:owner:v1', 'uid-123')
    localStorage.setItem('devleap:convo:v1', '{}')
    localStorage.setItem('devleap:javaprep:v1', '{}')
    localStorage.setItem('devleap:pending-recording-uploads', '[]')

    clearLocalProgress()

    expect(localStorage.getItem('devleap:user:v2')).toBeNull()
    expect(localStorage.getItem('devleap:owner:v1')).toBeNull()
    expect(localStorage.getItem('devleap:convo:v1')).toBeNull()
    expect(localStorage.getItem('devleap:javaprep:v1')).toBeNull()
    expect(localStorage.getItem('devleap:pending-recording-uploads')).toBeNull()
  })

  it('xóa các key động sổ lỗi (error-ledger-*)', () => {
    localStorage.setItem('error-ledger-w1-d1', '[]')
    localStorage.setItem('error-ledger-w8-d7', '[]')

    clearLocalProgress()

    expect(localStorage.getItem('error-ledger-w1-d1')).toBeNull()
    expect(localStorage.getItem('error-ledger-w8-d7')).toBeNull()
  })

  it('GIỮ nguyên tùy chọn cấp app', () => {
    localStorage.setItem('devleap:theme', 'dark')
    localStorage.setItem('devleap:haptics', 'off')
    localStorage.setItem('devleap:ielts-track:v1', 'B')
    localStorage.setItem('devleap:install-dismissed-at', '123')
    localStorage.setItem('devleap:reminder-hour', '20')
    localStorage.setItem('ipa:hello', 'həˈloʊ')

    clearLocalProgress()

    expect(localStorage.getItem('devleap:theme')).toBe('dark')
    expect(localStorage.getItem('devleap:haptics')).toBe('off')
    expect(localStorage.getItem('devleap:ielts-track:v1')).toBe('B')
    expect(localStorage.getItem('devleap:install-dismissed-at')).toBe('123')
    expect(localStorage.getItem('devleap:reminder-hour')).toBe('20')
    expect(localStorage.getItem('ipa:hello')).toBe('həˈloʊ')
  })
})
