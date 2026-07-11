import { describe, it, expect, beforeEach } from 'vitest'
import {
  TOUR_SLIDES,
  hasSeenTour,
  markTourSeen,
  hasPickedCourse,
  markCoursePicked,
  isChecklistDismissed,
  dismissChecklist,
  computeChecklist,
} from '@/lib/onboarding'

describe('onboarding — tour', () => {
  beforeEach(() => localStorage.clear())

  it('có 3-4 slide, mỗi slide có emoji/title/text', () => {
    expect(TOUR_SLIDES.length).toBeGreaterThanOrEqual(3)
    expect(TOUR_SLIDES.length).toBeLessThanOrEqual(4)
    TOUR_SLIDES.forEach((s) => {
      expect(s.emoji).toBeTruthy()
      expect(s.title).toBeTruthy()
      expect(s.text).toBeTruthy()
    })
  })

  it('chưa xem tour -> hasSeenTour false; sau khi mark -> true vĩnh viễn', () => {
    expect(hasSeenTour()).toBe(false)
    markTourSeen()
    expect(hasSeenTour()).toBe(true)
  })
})

describe('onboarding — đã chọn khóa', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định chưa chọn khóa; sau khi vào 1 khóa thì ghi nhớ', () => {
    expect(hasPickedCourse()).toBe(false)
    markCoursePicked()
    expect(hasPickedCourse()).toBe(true)
  })
})

describe('onboarding — checklist khởi động', () => {
  beforeEach(() => localStorage.clear())

  it('3 bước: chọn khóa, hoàn thành buổi đầu, bật nhắc học', () => {
    const items = computeChecklist({ coursePicked: false, sessionsDone: 0, reminderEnabled: false })
    expect(items).toHaveLength(3)
    expect(items.every((i) => !i.done)).toBe(true)
  })

  it('đánh dấu done đúng theo từng điều kiện', () => {
    const items = computeChecklist({ coursePicked: true, sessionsDone: 2, reminderEnabled: true })
    expect(items.find((i) => i.key === 'course').done).toBe(true)
    expect(items.find((i) => i.key === 'session').done).toBe(true)
    expect(items.find((i) => i.key === 'reminder').done).toBe(true)
  })

  it('sessionsDone = 0 -> bước "buổi đầu" chưa done dù coursePicked true', () => {
    const items = computeChecklist({ coursePicked: true, sessionsDone: 0, reminderEnabled: false })
    expect(items.find((i) => i.key === 'session').done).toBe(false)
  })

  it('dismissChecklist ghi nhớ vĩnh viễn', () => {
    expect(isChecklistDismissed()).toBe(false)
    dismissChecklist()
    expect(isChecklistDismissed()).toBe(true)
  })
})
