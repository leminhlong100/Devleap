import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getPreferredHour,
  setPreferredHour,
  shouldShowEveningReminder,
  eligibleForNotificationPrompt,
  maybeRequestNotificationPermission,
  maybeSendReminderNotification,
} from '@/lib/studyReminder'

describe('studyReminder — giờ ưa thích (mức 1)', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định 20h khi chưa lưu gì', () => {
    expect(getPreferredHour()).toBe(20)
  })

  it('lưu và đọc lại đúng giờ đã chọn', () => {
    setPreferredHour(18)
    expect(getPreferredHour()).toBe(18)
  })

  it('giá trị hỏng/ngoài phạm vi trong localStorage thì rơi về mặc định', () => {
    localStorage.setItem('devleap:reminder-hour', 'abc')
    expect(getPreferredHour()).toBe(20)
    localStorage.setItem('devleap:reminder-hour', '99')
    expect(getPreferredHour()).toBe(20)
  })
})

describe('shouldShowEveningReminder', () => {
  it('chỉ true khi có streak, chưa học hôm nay, và đã tới giờ nhắc', () => {
    expect(shouldShowEveningReminder({ streak: 5, studiedToday: false, hour: 21, preferredHour: 20 })).toBe(true)
    expect(shouldShowEveningReminder({ streak: 0, studiedToday: false, hour: 21, preferredHour: 20 })).toBe(false)
    expect(shouldShowEveningReminder({ streak: 5, studiedToday: true, hour: 21, preferredHour: 20 })).toBe(false)
    expect(shouldShowEveningReminder({ streak: 5, studiedToday: false, hour: 19, preferredHour: 20 })).toBe(false)
  })

  it('đúng giờ ưa thích cũng đủ điều kiện (>=, không phải >)', () => {
    expect(shouldShowEveningReminder({ streak: 1, studiedToday: false, hour: 20, preferredHour: 20 })).toBe(true)
  })
})

describe('eligibleForNotificationPrompt', () => {
  it('chỉ đủ điều kiện từ buổi thứ 3 trở đi và chưa hỏi trước đó', () => {
    expect(eligibleForNotificationPrompt(2, false)).toBe(false)
    expect(eligibleForNotificationPrompt(3, false)).toBe(true)
    expect(eligibleForNotificationPrompt(5, false)).toBe(true)
    expect(eligibleForNotificationPrompt(3, true)).toBe(false)
  })
})

describe('maybeRequestNotificationPermission (mức 2 — xin quyền)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('không làm gì nếu trình duyệt không có Notification API', () => {
    vi.stubGlobal('Notification', undefined)
    expect(() => maybeRequestNotificationPermission(5)).not.toThrow()
  })

  it('chưa hỏi khi chưa đủ 3 buổi', () => {
    const requestPermission = vi.fn(() => Promise.resolve('granted'))
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    maybeRequestNotificationPermission(2)
    expect(requestPermission).not.toHaveBeenCalled()
  })

  it('xin quyền đúng 1 lần khi vừa đủ 3 buổi, không hỏi lại ở các buổi sau', () => {
    const requestPermission = vi.fn(() => Promise.resolve('granted'))
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    maybeRequestNotificationPermission(3)
    expect(requestPermission).toHaveBeenCalledTimes(1)
    maybeRequestNotificationPermission(4)
    maybeRequestNotificationPermission(10)
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('đã từ chối trước đó (permission != default) thì không gọi requestPermission, và vẫn ghi nhớ đã hỏi', () => {
    const requestPermission = vi.fn(() => Promise.resolve('denied'))
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission })
    maybeRequestNotificationPermission(3)
    expect(requestPermission).not.toHaveBeenCalled()
    // Đổi permission giả lập về 'default' để chắc chắn phép thử sau chỉ do flag "đã hỏi" chặn lại.
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    maybeRequestNotificationPermission(4)
    expect(requestPermission).not.toHaveBeenCalled()
  })
})

describe('maybeSendReminderNotification (mức 2 — gửi nhắc)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  function stubNotification(permission) {
    const ctor = vi.fn()
    ctor.permission = permission
    vi.stubGlobal('Notification', ctor)
    return ctor
  }

  it('không gửi nếu chưa có quyền', () => {
    const ctor = stubNotification('default')
    const sent = maybeSendReminderNotification({ streak: 3, studiedToday: false, hour: 21, preferredHour: 20 })
    expect(sent).toBe(false)
    expect(ctor).not.toHaveBeenCalled()
  })

  it('gửi đúng khi có quyền và đủ điều kiện', () => {
    const ctor = stubNotification('granted')
    const sent = maybeSendReminderNotification({ streak: 3, studiedToday: false, hour: 21, preferredHour: 20 })
    expect(sent).toBe(true)
    expect(ctor).toHaveBeenCalledTimes(1)
  })

  it('không gửi 2 lần trong cùng 1 ngày', () => {
    const ctor = stubNotification('granted')
    maybeSendReminderNotification({ streak: 3, studiedToday: false, hour: 21, preferredHour: 20 })
    maybeSendReminderNotification({ streak: 3, studiedToday: false, hour: 22, preferredHour: 20 })
    expect(ctor).toHaveBeenCalledTimes(1)
  })

  it('không gửi nếu chưa tới giờ hoặc đã học hôm nay', () => {
    const ctor = stubNotification('granted')
    maybeSendReminderNotification({ streak: 3, studiedToday: false, hour: 19, preferredHour: 20 })
    maybeSendReminderNotification({ streak: 3, studiedToday: true, hour: 21, preferredHour: 20 })
    expect(ctor).not.toHaveBeenCalled()
  })
})
