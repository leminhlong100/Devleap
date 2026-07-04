import { describe, it, expect } from 'vitest'
import { pendingWeekMission } from '@/lib/missionStats'

// user.missionDone thật là getter store `(course, week, day) => bool` — mock tối
// giản, không cần Pinia vì pendingWeekMission chỉ gọi đúng hàm này.
function mockUser(doneKeys = []) {
  return { missionDone: (course, week, day) => doneKeys.includes(`${course}:${week}:${day}`) }
}

describe('pendingWeekMission (Bước 4.1: nhắc Mission tuần chưa làm ở Home)', () => {
  it('tuần có Mission (Tuần 1, Buổi 6) và CHƯA đánh dấu xong -> trả đúng buổi + nội dung đã bỏ tiền tố', () => {
    const out = pendingWeekMission(mockUser(), 1)
    expect(out).toMatchObject({ week: 1, day: 6 })
    expect(out.text).toContain('điện thoại')
    expect(out.text).not.toMatch(/^🌍|^mission\s*tuần/i)
  })

  it('đã đánh dấu xong Mission của tuần -> null (không nhắc lại)', () => {
    const out = pendingWeekMission(mockUser(['ielts:1:6']), 1)
    expect(out).toBeNull()
  })

  it('Tuần 8: Mission ở buổi cuối (14), không phải buổi 6 — vẫn tìm đúng', () => {
    const out = pendingWeekMission(mockUser(), 8)
    expect(out).toMatchObject({ week: 8, day: 14 })
  })

  it('tuần không tồn tại -> null, an toàn không lỗi', () => {
    expect(pendingWeekMission(mockUser(), 99)).toBeNull()
  })

  it('không có tuần nào truyền vào (undefined) -> null, an toàn không lỗi', () => {
    expect(pendingWeekMission(mockUser(), undefined)).toBeNull()
  })
})
