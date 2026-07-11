import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// —— Mock lớp Supabase: bật cloud, điều khiển dữ liệu remote & bắt upsert ——
const mockMaybeSingle = vi.fn()
const mockUpsert = vi.fn(() => Promise.resolve({ error: null }))
const mockRpc = vi.fn(() => Promise.resolve({ data: [], error: null }))
const fromChain = {
  select: vi.fn(() => fromChain),
  eq: vi.fn(() => fromChain),
  maybeSingle: (...a) => mockMaybeSingle(...a),
  upsert: (...a) => mockUpsert(...a),
}
vi.mock('@/lib/supabase', () => ({
  isCloudEnabled: true,
  supabase: { from: vi.fn(() => fromChain), rpc: (...a) => mockRpc(...a) },
}))

import { useUserStore } from '@/stores/user'
import { isoWeekKey } from '@/stores/user/helpers'
import { mergeWeekXp } from '@/stores/user/progressSlice'

// 'YYYY-M-D' giống hàm ymd nội bộ của store (không pad số 0).
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('user store — recordShadowing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('giữ tiến độ (best) cao nhất qua nhiều lần thử', () => {
    const s = useUserStore()
    s.recordShadowing('vidA', 60, false)
    s.recordShadowing('vidA', 45, false)
    const r = s.shadowingOf('vidA')
    expect(r.best).toBe(60)
    expect(r.attempts).toBe(2)
    expect(r.passed).toBe(false)
  })

  it('hoàn thành (passed=true): +120 XP + 1 huy hiệu, chỉ thưởng một lần', () => {
    const s = useUserStore()
    s.recordShadowing('vidB', 80, true)
    expect(s.shadowingPassed('vidB')).toBe(true)
    expect(s.xp).toBe(120)
    expect(s.badges).toBe(1)
    // thử lại không cộng thêm; giữ best cao nhất
    s.recordShadowing('vidB', 100, true)
    expect(s.xp).toBe(120)
    expect(s.badges).toBe(1)
    expect(s.shadowingOf('vidB').best).toBe(100)
  })

  it('passed một lần thì giữ luôn, dù lần sau chưa đủ câu đạt', () => {
    const s = useUserStore()
    s.recordShadowing('vidD', 80, true)
    s.recordShadowing('vidD', 40, false)
    expect(s.shadowingPassed('vidD')).toBe(true)
  })

  it('shadowingPassedCount đếm số bài đã hoàn thành', () => {
    const s = useUserStore()
    s.recordShadowing('a', 80, true)
    s.recordShadowing('b', 50, false)
    s.recordShadowing('c', 90, true)
    expect(s.shadowingPassedCount).toBe(2)
  })

  it('kết quả shadowing được bền hoá vào localStorage', () => {
    const s = useUserStore()
    s.recordShadowing('vidC', 90, true)
    const raw = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(raw.shadowingScores.vidC.passed).toBe(true)
  })

  it('lưu điểm tốt nhất TỪNG CÂU, gộp max qua các lần thử', () => {
    const s = useUserStore()
    s.recordShadowing('vidE', 50, false, { 1: 80, 2: 40 })
    s.recordShadowing('vidE', 50, false, { 1: 60, 2: 90, 3: 100 })
    expect(s.shadowingSentences('vidE')).toEqual({ 1: 80, 2: 90, 3: 100 })
  })

  it('điểm từng câu khôi phục được sau khi tải lại từ localStorage', () => {
    const s = useUserStore()
    s.recordShadowing('vidF', 50, false, { 1: 75 })
    // mô phỏng phiên mới: hydrate từ localStorage
    setActivePinia(createPinia())
    const s2 = useUserStore()
    s2.hydrate()
    expect(s2.shadowingSentences('vidF')).toEqual({ 1: 75 })
  })
})

describe('user store — toggleDay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('đánh dấu hoàn thành: +50 XP, lưu key, isDone = true', () => {
    const s = useUserStore()
    s.toggleDay('java', 1, 1)
    expect(s.xp).toBe(50)
    expect(s.isDone('java', 1, 1)).toBe(true)
    expect(s.doneCount('java')).toBe(1)
  })

  it('bỏ đánh dấu: hoàn lại XP, isDone = false', () => {
    const s = useUserStore()
    s.toggleDay('java', 1, 1)
    s.toggleDay('java', 1, 1)
    expect(s.xp).toBe(0)
    expect(s.isDone('java', 1, 1)).toBe(false)
  })

  it('xong trọn tuần: thưởng +150 XP và +1 huy hiệu', () => {
    const s = useUserStore()
    s.toggleDay('java', 1, 1, 2)
    expect(s.badges).toBe(0)
    s.toggleDay('java', 1, 2, 2) // ngày cuối của tuần (totalDays=2)
    expect(s.xp).toBe(50 + 50 + 150)
    expect(s.badges).toBe(1)
  })

  it('bỏ ngày làm tuần không-còn-trọn: thu hồi thưởng & huy hiệu', () => {
    const s = useUserStore()
    s.toggleDay('java', 1, 1, 2)
    s.toggleDay('java', 1, 2, 2) // trọn tuần -> +150, +1 badge
    s.toggleDay('java', 1, 2, 2) // bỏ ngày vừa rồi
    expect(s.xp).toBe(50) // chỉ còn 1 ngày
    expect(s.badges).toBe(0)
  })

  it('XP không bao giờ âm', () => {
    const s = useUserStore()
    s.xp = 20
    s.completed.java = ['1:1']
    s.toggleDay('java', 1, 1) // -50 nhưng kẹp ở 0
    expect(s.xp).toBe(0)
  })

  it('ghi xuống localStorage', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 2, 3)
    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.completed.ielts).toContain('2:3')
  })

  it('xin quyền Notification đúng lúc vừa đủ buổi thứ 3 (gộp cả 2 khóa), không hỏi ở buổi 1-2', () => {
    const requestPermission = vi.fn(() => Promise.resolve('granted'))
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1)
    s.toggleDay('java', 1, 1)
    expect(requestPermission).not.toHaveBeenCalled()
    s.toggleDay('ielts', 1, 2) // buổi thứ 3 gộp cả 2 khóa
    expect(requestPermission).toHaveBeenCalledTimes(1)
    s.toggleDay('java', 1, 2)
    expect(requestPermission).toHaveBeenCalledTimes(1) // không hỏi lại
    vi.unstubAllGlobals()
  })
})

describe('user store — seedSrsFromDay (tự động gieo SRS khi hoàn thành buổi IELTS)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('hoàn thành buổi IELTS: từ mới vào srs, due sau 3 ngày, KHÔNG cộng thêm XP', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name', 'Age'])
    expect(s.xp).toBe(50) // chỉ +XP_PER_DAY, không cộng gì thêm cho việc gieo SRS
    expect(s.srsOf('ielts:name')).toMatchObject({ due: '2026-06-24', reps: 0 })
    expect(s.srsOf('ielts:age')).toMatchObject({ due: '2026-06-24', reps: 0 })
    expect(s.isCardDue('ielts:name')).toBe(false) // chưa tới hạn ngay
  })

  it('không đè lịch của thẻ đã tự ôn trước đó', () => {
    const s = useUserStore()
    s.reviewCard('ielts:name', 'easy') // đã ôn thật, due đẩy xa hơn 3 ngày
    const before = s.srsOf('ielts:name')
    s.toggleDay('ielts', 1, 1, 0, ['Name'])
    expect(s.srsOf('ielts:name')).toEqual(before)
  })

  it('khóa Java KHÔNG tự gieo SRS (chỉ áp dụng IELTS)', () => {
    const s = useUserStore()
    s.toggleDay('java', 1, 1, 0, ['deploy'])
    expect(s.srsOf('java:deploy')).toBeNull()
    expect(s.srsLearned).toBe(0)
  })

  it('không có vocabTerms hoặc bỏ đánh dấu: an toàn, không lỗi', () => {
    const s = useUserStore()
    expect(() => s.toggleDay('ielts', 1, 1)).not.toThrow()
    expect(s.srsLearned).toBe(0)
    s.toggleDay('ielts', 1, 1) // bỏ đánh dấu
    expect(s.isDone('ielts', 1, 1)).toBe(false)
  })

  it('từ trùng nhau trong cùng buổi (khác hoa/thường/khoảng trắng) chỉ gieo 1 lần', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name', ' name ', 'NAME'])
    expect(Object.keys(s.srs)).toEqual(['ielts:name'])
  })

  it('nhận vocabTerms dạng object {term} (không chỉ string thuần)', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, [{ term: 'Goal' }, 'Age'])
    expect(s.srsOf('ielts:goal')).toMatchObject({ reps: 0 })
    expect(s.srsOf('ielts:age')).toMatchObject({ reps: 0 })
  })
})

describe('user store — dueTodayCount / dueWords', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('đếm & liệt kê thẻ đến hạn hôm nay, gộp cả từ tự lưu khi chat AI', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name']) // due 2026-06-24 -> chưa tới hạn
    s.saveWord({ term: 'inheritance', srsId: 'saved:inheritance', vi: 'kế thừa' }) // thẻ mới -> đến hạn ngay
    expect(s.dueTodayCount).toBe(1)
    expect(s.dueWords.map((c) => c.term)).toEqual(['inheritance'])
    expect(s.dueWords[0]).toMatchObject({ vi: 'kế thừa', srsId: 'saved:inheritance' })
  })

  it('tra ngược nghĩa từ vocabGlossary cho thẻ gieo tự động khi đã tới hạn', () => {
    const s = useUserStore()
    s.srs['ielts:name'] = { ease: 2.5, interval: 3, reps: 0, lapses: 0, due: '2026-06-20', last: null }
    expect(s.dueTodayCount).toBe(1)
    expect(s.dueWords[0]).toMatchObject({ term: 'name', vi: 'tên' })
  })
})

describe('user store — nextLesson / studiedToday (Bước 4.1: Home dashboard)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('khách mới (chưa học buổi nào): nextLesson rỗng, studiedToday() false', () => {
    const s = useUserStore()
    expect(s.nextLesson).toEqual([])
    expect(s.studiedToday()).toBe(false)
  })

  it('học 1 buổi IELTS: nextLesson chỉ có IELTS, chỉ đúng khóa đó, đến buổi kế tiếp CHƯA xong', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name'])
    expect(s.nextLesson).toHaveLength(1)
    expect(s.nextLesson[0]).toMatchObject({ course: 'ielts', route: 'ielts-day', week: 1, day: 2 })
    expect(s.nextLesson[0].title).toBeTruthy() // có tiêu đề buổi thật, không rỗng
    expect(s.studiedToday()).toBe(true)
  })

  it('học song song cả 2 khóa: nextLesson liệt kê đủ cả 2, không lẫn khóa', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name'])
    s.toggleDay('java', 1, 1)
    expect(s.nextLesson.map((n) => n.course).sort()).toEqual(['ielts', 'java'])
    const java = s.nextLesson.find((n) => n.course === 'java')
    expect(java).toMatchObject({ route: 'java-day', week: 1, day: 2 })
  })

  it('studiedToday() quay lại false vào ngày sau (không tính lại buổi hôm qua, không bị cache theo giờ đồng hồ)', () => {
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1, 0, ['Name'])
    expect(s.studiedToday()).toBe(true)
    vi.setSystemTime(new Date(2026, 5, 22, 9, 0, 0)) // hôm sau
    expect(s.studiedToday()).toBe(false)
  })
})

describe('user store — bumpStreak', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('lần đầu trong ngày: streak = 1', () => {
    const s = useUserStore()
    s.bumpStreak()
    expect(s.streak).toBe(1)
    expect(s.lastStudyDate).toBe('2026-6-21')
  })

  it('học lại cùng ngày: streak không đổi', () => {
    const s = useUserStore()
    s.bumpStreak()
    s.bumpStreak()
    expect(s.streak).toBe(1)
  })

  it('học hôm qua -> hôm nay: streak +1', () => {
    const s = useUserStore()
    const y = new Date(2026, 5, 20)
    s.lastStudyDate = ymd(y)
    s.streak = 4
    s.bumpStreak()
    expect(s.streak).toBe(5)
  })

  it('cách quãng (đứt chuỗi): reset về 1', () => {
    const s = useUserStore()
    s.lastStudyDate = '2026-6-18' // 3 ngày trước
    s.streak = 9
    s.bumpStreak()
    expect(s.streak).toBe(1)
  })
})

describe('user store — pullAndMerge (hợp nhất khách + cloud)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockMaybeSingle.mockReset()
    mockUpsert.mockClear()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('hợp nhất: union danh sách hoàn thành, lấy điểm lớn hơn, ngày muộn hơn', async () => {
    const s = useUserStore()
    // tiến độ khách (local) hiện tại
    s.applySnapshot({
      xp: 100,
      streak: 2,
      badges: 0,
      lastStudyDate: '2026-6-10',
      knownCards: [1, 2],
      completed: { java: ['1:1'], ielts: [] },
    })
    // remote trên cloud
    mockMaybeSingle.mockResolvedValue({
      data: {
        xp: 300,
        streak: 5,
        badges: 2,
        last_study_date: '2026-6-15',
        known_cards: [2, 3],
        completed: { java: ['1:2'], ielts: ['1:1'] },
      },
      error: null,
    })

    await s.pullAndMerge('user-123')

    expect(s.cloudUserId).toBe('user-123')
    expect(s.xp).toBe(300) // max
    expect(s.streak).toBe(5) // max
    expect(s.badges).toBe(2) // max
    expect(s.lastStudyDate).toBe('2026-6-15') // muộn hơn
    expect(s.knownCards.sort()).toEqual([1, 2, 3]) // union
    expect(s.completed.java.sort()).toEqual(['1:1', '1:2']) // union
    expect(s.completed.ielts).toEqual(['1:1'])
    expect(s.syncStatus).toBe('synced')
    expect(mockUpsert).toHaveBeenCalledTimes(1) // đẩy bản hợp nhất lên ngay
  })

  it('cloud chưa có dữ liệu: giữ nguyên tiến độ khách rồi đẩy lên', async () => {
    const s = useUserStore()
    s.applySnapshot({ xp: 80, completed: { java: ['1:1'], ielts: [] } })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await s.pullAndMerge('user-xyz')

    expect(s.xp).toBe(80)
    expect(s.completed.java).toEqual(['1:1'])
    expect(mockUpsert).toHaveBeenCalledTimes(1)
    expect(s.syncStatus).toBe('synced')
  })

  it('lỗi truy vấn: syncStatus = error, không ném ra ngoài', async () => {
    const s = useUserStore()
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('boom') })
    await expect(s.pullAndMerge('user-err')).resolves.toBeUndefined()
    expect(s.syncStatus).toBe('error')
  })

  it('hợp nhất srs: mỗi thẻ giữ bản ôn gần nhất (so theo last)', async () => {
    const s = useUserStore()
    s.applySnapshot({
      srs: {
        'java:a': { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: '2026-06-12', last: '2026-06-11' },
        'java:b': { ease: 2.5, interval: 6, reps: 2, lapses: 0, due: '2026-06-20', last: '2026-06-14' },
      },
    })
    mockMaybeSingle.mockResolvedValue({
      data: {
        srs: {
          'java:a': { ease: 2.4, interval: 6, reps: 2, lapses: 0, due: '2026-06-25', last: '2026-06-19' },
          'java:c': { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: '2026-06-22', last: '2026-06-21' },
        },
      },
      error: null,
    })

    await s.pullAndMerge('user-srs')

    expect(s.srs['java:a'].last).toBe('2026-06-19') // remote mới hơn -> thắng
    expect(s.srs['java:b'].last).toBe('2026-06-14') // chỉ có ở local -> giữ
    expect(s.srs['java:c'].last).toBe('2026-06-21') // chỉ có ở remote -> nhận
  })

  it('hợp nhất điểm kiểm tra: giữ % cao nhất, OR trạng thái đạt', async () => {
    const s = useUserStore()
    s.applySnapshot({
      quizScores: {
        'java:week:1': { best: 6, total: 10, pct: 60, attempts: 1, passed: false, lastAt: '2026-6-10' },
        'java:week:2': { best: 9, total: 10, pct: 90, attempts: 2, passed: true, lastAt: '2026-6-12' },
      },
    })
    mockMaybeSingle.mockResolvedValue({
      data: {
        quiz_scores: {
          'java:week:1': { best: 8, total: 10, pct: 80, attempts: 3, passed: true, lastAt: '2026-6-15' },
          'java:final': { best: 7, total: 10, pct: 70, attempts: 1, passed: true, lastAt: '2026-6-16' },
        },
      },
      error: null,
    })

    await s.pullAndMerge('user-quiz')

    expect(s.quizOf('java', 'week:1')).toMatchObject({ pct: 80, passed: true, attempts: 3 }) // remote cao hơn
    expect(s.quizOf('java', 'week:2')).toMatchObject({ pct: 90, passed: true }) // chỉ ở local -> giữ
    expect(s.quizOf('java', 'final')).toMatchObject({ pct: 70, passed: true }) // chỉ ở remote -> nhận
  })

  it('chuyển tài khoản: KHÔNG hợp nhất dữ liệu tài khoản cũ sang tài khoản mới', async () => {
    const s = useUserStore()

    // Đăng nhập tài khoản A: tạo dữ liệu rồi đẩy lên (đặt owner = user-A).
    s.applySnapshot({ xp: 500, completed: { java: ['1:1', '1:2'], ielts: [] } })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await s.pullAndMerge('user-A')
    expect(s.completed.java).toEqual(['1:1', '1:2'])

    // Đăng xuất: detachCloud giữ dữ liệu A trong local (chế độ khách).
    s.detachCloud()

    // Đăng nhập tài khoản B (cloud của B chỉ có 1 ngày khác).
    mockUpsert.mockClear()
    mockMaybeSingle.mockResolvedValue({
      data: { xp: 50, completed: { java: ['3:1'], ielts: [] } },
      error: null,
    })
    await s.pullAndMerge('user-B')

    // Chỉ còn dữ liệu của B — KHÔNG có ngày của A lẫn vào.
    expect(s.completed.java).toEqual(['3:1'])
    expect(s.xp).toBe(50)
    // Bản đẩy lên cloud B cũng không chứa dữ liệu A.
    const pushed = mockUpsert.mock.calls.at(-1)[0]
    expect(pushed.completed.java).toEqual(['3:1'])
  })

  it('đăng nhập lại CÙNG tài khoản: vẫn hợp nhất tiến độ khách offline', async () => {
    const s = useUserStore()

    // Lần đầu đăng nhập A (đặt owner = user-A).
    s.applySnapshot({ completed: { java: ['1:1'], ielts: [] } })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await s.pullAndMerge('user-A')

    // Đăng xuất, học thêm offline rồi đăng nhập LẠI A.
    s.detachCloud()
    s.applySnapshot({ completed: { java: ['1:1', '2:1'], ielts: [] } })
    mockMaybeSingle.mockResolvedValue({
      data: { completed: { java: ['1:1'], ielts: [] } },
      error: null,
    })
    await s.pullAndMerge('user-A')

    // Cùng chủ -> hợp nhất, giữ tiến độ offline.
    expect(s.completed.java.sort()).toEqual(['1:1', '2:1'])
  })
})

describe('user store — reviewCard (Spaced Repetition)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('ôn thẻ mới "Tốt": tạo lịch, +10 XP, streak chạy', () => {
    const s = useUserStore()
    s.reviewCard('java:inheritance', 'good')
    expect(s.srsOf('java:inheritance')).toMatchObject({ reps: 1, interval: 1, due: '2026-06-22' })
    expect(s.xp).toBe(10)
    expect(s.streak).toBe(1)
    expect(s.srsLearned).toBe(1)
  })

  it('"Khó" thưởng ít hơn (+5); "Quên" không thưởng', () => {
    const s = useUserStore()
    s.reviewCard('java:a', 'hard')
    expect(s.xp).toBe(5)
    s.reviewCard('java:b', 'again')
    expect(s.xp).toBe(5) // không cộng thêm
  })

  it('ôn lại thẻ CHƯA tới hạn: cập nhật lịch nhưng KHÔNG thưởng XP (chống cày)', () => {
    const s = useUserStore()
    s.reviewCard('java:a', 'easy') // mới -> đến hạn -> +10, due đẩy về tương lai
    const xpAfterFirst = s.xp
    expect(s.isCardDue('java:a')).toBe(false)
    s.reviewCard('java:a', 'good') // ôn sớm khi chưa tới hạn
    expect(s.xp).toBe(xpAfterFirst) // không thưởng thêm
  })

  it('dueCount đếm thẻ mới + thẻ quá hạn trong danh sách', () => {
    const s = useUserStore()
    s.reviewCard('java:a', 'good') // due ngày mai -> chưa tới hạn
    const ids = ['java:a', 'java:b', 'java:c'] // b, c là thẻ mới
    expect(s.dueCount(ids)).toBe(2)
  })

  it('bỏ qua grade không hợp lệ và id rỗng', () => {
    const s = useUserStore()
    s.reviewCard('java:a', 'super')
    s.reviewCard('', 'good')
    expect(s.srsLearned).toBe(0)
    expect(s.xp).toBe(0)
  })

  it('ghi lịch srs xuống localStorage', () => {
    const s = useUserStore()
    s.reviewCard('java:a', 'good')
    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.srs['java:a'].reps).toBe(1)
  })
})

describe('user store — recordQuiz (bài kiểm tra cuối tuần/khóa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 21, 9, 0, 0)) // 2026-06-21
  })
  afterEach(() => vi.useRealTimers())

  it('lần đầu ĐẠT: lưu điểm, +100 XP, +1 huy hiệu, streak chạy', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:1', 8, 10) // 80% >= 70%
    const r = s.quizOf('java', 'week:1')
    expect(r).toMatchObject({ best: 8, total: 10, pct: 80, attempts: 1, passed: true })
    expect(s.xp).toBe(100)
    expect(s.badges).toBe(1)
    expect(s.streak).toBe(1)
    expect(s.quizPassed('java', 'week:1')).toBe(true)
  })

  it('dưới ngưỡng: lưu điểm nhưng KHÔNG đạt, không thưởng', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:2', 5, 10) // 50%
    expect(s.quizOf('java', 'week:2')).toMatchObject({ pct: 50, passed: false, attempts: 1 })
    expect(s.xp).toBe(0)
    expect(s.badges).toBe(0)
  })

  it('làm lại điểm cao hơn: giữ % cao nhất, tăng số lần', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:3', 4, 10) // 40%
    s.recordQuiz('java', 'week:3', 9, 10) // 90% -> đạt lần đầu
    const r = s.quizOf('java', 'week:3')
    expect(r).toMatchObject({ best: 9, pct: 90, attempts: 2, passed: true })
    expect(s.xp).toBe(100) // thưởng đúng 1 lần
    expect(s.badges).toBe(1)
  })

  it('đã đạt rồi, làm lại điểm thấp hơn: giữ best & passed, KHÔNG thưởng lại', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:4', 10, 10) // 100% đạt -> +100, +1 badge
    s.recordQuiz('java', 'week:4', 3, 10) // 30%
    const r = s.quizOf('java', 'week:4')
    expect(r).toMatchObject({ best: 10, pct: 100, passed: true, attempts: 2 })
    expect(s.xp).toBe(100) // không cộng thêm
    expect(s.badges).toBe(1)
  })

  it('ngưỡng tuỳ biến & quizPassedCount theo khóa', () => {
    const s = useUserStore()
    s.recordQuiz('ielts', 'week:1', 6, 10, 0.6) // 60% >= 60% -> đạt
    s.recordQuiz('ielts', 'final', 5, 10, 0.6) // 50% < 60%
    expect(s.quizPassed('ielts', 'week:1')).toBe(true)
    expect(s.quizPassedCount('ielts')).toBe(1)
    expect(s.quizPassedCount('java')).toBe(0)
  })

  it('bỏ qua đầu vào không hợp lệ (thiếu total)', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:1', 3, 0)
    expect(s.quizOf('java', 'week:1')).toBeNull()
    expect(s.xp).toBe(0)
  })

  it('ghi điểm xuống localStorage', () => {
    const s = useUserStore()
    s.recordQuiz('java', 'week:1', 7, 10)
    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.quizScores['java:week:1'].pct).toBe(70)
  })
})

describe('user store — recordGrammarDay (cổng luyện ngữ pháp theo ngày)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('đạt ≥70% -> ghi passed, KHÔNG thưởng huy hiệu/XP đạt-bài', () => {
    const s = useUserStore()
    const passed = s.recordGrammarDay('ielts', 1, 1, 3, 3, 0.7) // 100%
    expect(passed).toBe(true)
    expect(s.grammarDayPassed('ielts', 1, 1)).toBe(true)
    expect(s.badges).toBe(0) // khác bài kiểm tra: không thưởng huy hiệu
    expect(s.xp).toBe(0) // XP đã cộng theo từng câu ở practice, không cộng lại đây
  })

  it('dưới ngưỡng -> chưa đạt; trạng thái đạt là "dính" qua các lần làm', () => {
    const s = useUserStore()
    expect(s.recordGrammarDay('ielts', 1, 2, 1, 3, 0.7)).toBe(false) // 33%
    expect(s.grammarDayPassed('ielts', 1, 2)).toBe(false)
    s.recordGrammarDay('ielts', 1, 2, 3, 3, 0.7) // đạt
    s.recordGrammarDay('ielts', 1, 2, 0, 3, 0.7) // làm lại kém -> vẫn giữ đạt
    expect(s.grammarDayPassed('ielts', 1, 2)).toBe(true)
  })

  it('cổng ngày KHÔNG bị tính vào quizPassedCount (không phải bài kiểm tra)', () => {
    const s = useUserStore()
    s.recordGrammarDay('ielts', 1, 1, 3, 3, 0.7)
    s.recordQuiz('ielts', 'week:1', 8, 10) // 1 bài kiểm tra thật đã đạt
    expect(s.quizPassedCount('ielts')).toBe(1)
  })
})

describe('user store — saveWriting (bài tập viết tại bài)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('lưu nháp rồi nộp; trạng thái nộp là "dính"', () => {
    const s = useUserStore()
    s.saveWriting('ielts', 1, 1, 'Câu một. Câu hai.', false)
    expect(s.writingDone('ielts', 1, 1)).toBe(false)
    expect(s.writingOf('ielts', 1, 1).text).toContain('Câu một')
    s.saveWriting('ielts', 1, 1, 'Câu một. Câu hai.', true) // nộp
    s.saveWriting('ielts', 1, 1, '', false) // sửa tiếp -> vẫn giữ đã nộp
    expect(s.writingDone('ielts', 1, 1)).toBe(true)
  })

  it('bền hoá xuống localStorage', () => {
    const s = useUserStore()
    s.saveWriting('ielts', 2, 3, 'My day.', true)
    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.writings['ielts:2:3']).toMatchObject({ done: true, text: 'My day.' })
  })

  it('lưu & giữ kết quả AI chữa bài (review)', () => {
    const s = useUserStore()
    const review = { cefr: 'A2', score: 60, summary: 'ok', lines: [{ original: 'a', corrected: 'A', ok: false, note: 'x' }] }
    s.saveWriting('ielts', 1, 1, 'a', true, review)
    expect(s.writingOf('ielts', 1, 1).review.score).toBe(60)
    // sửa nháp sau đó (không truyền review) vẫn giữ review cũ
    s.saveWriting('ielts', 1, 1, 'a b', false)
    expect(s.writingOf('ielts', 1, 1).review.cefr).toBe('A2')
  })
})

describe('user store — savedWords (từ vựng lưu khi chat AI)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('lưu từ mới: vào danh sách, đếm tăng, isWordSaved = true', () => {
    const s = useUserStore()
    const ok = s.saveWord({ term: 'inheritance', srsId: 'saved:inheritance', vi: 'kế thừa' })
    expect(ok).toBe(true)
    expect(s.savedCount).toBe(1)
    expect(s.isWordSaved('Inheritance')).toBe(true) // không phân biệt hoa/thường
    expect(s.savedWordList[0]).toMatchObject({ term: 'inheritance', vi: 'kế thừa' })
    expect(s.savedWordList[0].savedAt).toBeTruthy()
  })

  it('lưu trùng (không phân biệt hoa/thường): bỏ qua, trả về false', () => {
    const s = useUserStore()
    s.saveWord({ term: 'deploy', srsId: 'saved:deploy' })
    const again = s.saveWord({ term: 'Deploy', srsId: 'saved:deploy' })
    expect(again).toBe(false)
    expect(s.savedCount).toBe(1)
  })

  it('từ rỗng/không hợp lệ: không lưu', () => {
    const s = useUserStore()
    expect(s.saveWord({ term: '  ' })).toBe(false)
    expect(s.saveWord(null)).toBe(false)
    expect(s.savedCount).toBe(0)
  })

  it('bỏ lưu: rời danh sách', () => {
    const s = useUserStore()
    s.saveWord({ term: 'exception', srsId: 'saved:exception' })
    s.removeSavedWord('Exception')
    expect(s.savedCount).toBe(0)
    expect(s.isWordSaved('exception')).toBe(false)
  })

  it('ghi danh sách xuống localStorage', () => {
    const s = useUserStore()
    s.saveWord({ term: 'stream', srsId: 'saved:stream' })
    const saved = JSON.parse(localStorage.getItem('devleap:user:v2'))
    expect(saved.savedWords.stream).toMatchObject({ term: 'stream', srsId: 'saved:stream' })
  })
})

describe('user store — pullAndMerge savedWords', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockMaybeSingle.mockReset()
    mockUpsert.mockClear()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('hợp nhất từ đã lưu: gộp 2 thiết bị, giữ bản lưu sớm hơn', async () => {
    const s = useUserStore()
    s.applySnapshot({
      savedWords: {
        deploy: { term: 'deploy', srsId: 'saved:deploy', savedAt: '2026-06-10T00:00:00.000Z' },
        stream: { term: 'stream', srsId: 'saved:stream', savedAt: '2026-06-12T00:00:00.000Z' },
      },
    })
    mockMaybeSingle.mockResolvedValue({
      data: {
        saved_words: {
          deploy: { term: 'deploy', srsId: 'saved:deploy', savedAt: '2026-06-09T00:00:00.000Z' },
          exception: { term: 'exception', srsId: 'saved:exception', savedAt: '2026-06-15T00:00:00.000Z' },
        },
      },
      error: null,
    })

    await s.pullAndMerge('user-sw')

    expect(s.savedCount).toBe(3) // union 3 từ
    expect(s.savedWords.deploy.savedAt).toBe('2026-06-09T00:00:00.000Z') // remote sớm hơn -> giữ
    expect(s.isWordSaved('stream')).toBe(true) // chỉ ở local -> giữ
    expect(s.isWordSaved('exception')).toBe(true) // chỉ ở remote -> nhận
  })
})

describe('user store — saveWeekFeedback (khảo sát Dễ/Vừa/Khó)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('lưu cảm nhận + ghi chú, tra lại được qua weekFeedbackOf', () => {
    const s = useUserStore()
    expect(s.weekFeedbackOf('ielts', 3)).toBeNull()
    s.saveWeekFeedback('ielts', 3, 'hard', 'Ngữ pháp tuần này khó')
    const fb = s.weekFeedbackOf('ielts', 3)
    expect(fb.rating).toBe('hard')
    expect(fb.note).toBe('Ngữ pháp tuần này khó')
    expect(fb.at).toBeTruthy()
  })

  it('"bỏ qua" cũng được ghi lại (không hỏi lại tuần đó)', () => {
    const s = useUserStore()
    s.saveWeekFeedback('ielts', 2, 'skipped')
    expect(s.weekFeedbackOf('ielts', 2).rating).toBe('skipped')
  })

  it('không cộng XP/huy hiệu — chỉ là dữ liệu thu thập', () => {
    const s = useUserStore()
    s.saveWeekFeedback('ielts', 1, 'easy')
    expect(s.xp).toBe(0)
    expect(s.badges).toBe(0)
  })

  it('không lưu khi thiếu course/week/rating', () => {
    const s = useUserStore()
    s.saveWeekFeedback('', 1, 'easy')
    s.saveWeekFeedback('ielts', 0, 'easy')
    s.saveWeekFeedback('ielts', 1, '')
    expect(Object.keys(s.weekFeedback)).toHaveLength(0)
  })

  it('bền hoá vào localStorage và khôi phục được qua hydrate', () => {
    const s = useUserStore()
    s.saveWeekFeedback('ielts', 4, 'ok', 'Vừa sức')
    setActivePinia(createPinia())
    const s2 = useUserStore()
    s2.hydrate()
    expect(s2.weekFeedbackOf('ielts', 4)).toMatchObject({ rating: 'ok', note: 'Vừa sức' })
  })
})

describe('user store — pullAndMerge weekFeedback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockMaybeSingle.mockReset()
    mockUpsert.mockClear()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('hợp nhất khảo sát tuần: giữ bản MỚI HƠN theo `at` (remote mới hơn local)', async () => {
    const s = useUserStore()
    s.applySnapshot({
      weekFeedback: { 'ielts:1': { rating: 'hard', note: '', at: '2026-06-10' } },
    })
    mockMaybeSingle.mockResolvedValue({
      data: { week_feedback: { 'ielts:1': { rating: 'ok', note: 'sửa lại', at: '2026-06-12' } } },
      error: null,
    })

    await s.pullAndMerge('user-wf-a')

    expect(s.weekFeedbackOf('ielts', 1)).toMatchObject({ rating: 'ok', note: 'sửa lại' })
  })

  it('hợp nhất khảo sát tuần: giữ bản MỚI HƠN theo `at` (local mới hơn remote)', async () => {
    const s = useUserStore()
    s.applySnapshot({
      weekFeedback: { 'ielts:1': { rating: 'easy', note: 'local mới', at: '2026-06-15' } },
    })
    mockMaybeSingle.mockResolvedValue({
      data: { week_feedback: { 'ielts:1': { rating: 'hard', note: 'remote cũ', at: '2026-06-12' } } },
      error: null,
    })

    await s.pullAndMerge('user-wf-b')

    expect(s.weekFeedbackOf('ielts', 1)).toMatchObject({ rating: 'easy', note: 'local mới' })
  })

  it('gộp union các tuần khác nhau giữa 2 thiết bị', async () => {
    const s = useUserStore()
    s.applySnapshot({
      weekFeedback: { 'ielts:1': { rating: 'hard', note: '', at: '2026-06-10' } },
    })
    mockMaybeSingle.mockResolvedValue({
      data: { week_feedback: { 'ielts:2': { rating: 'easy', note: '', at: '2026-06-11' } } },
      error: null,
    })

    await s.pullAndMerge('user-wf-c')

    expect(s.weekFeedbackOf('ielts', 1).rating).toBe('hard')
    expect(s.weekFeedbackOf('ielts', 2).rating).toBe('easy')
  })
})

describe('isoWeekKey (khóa tuần ISO cho leaderboard Bước 5.1)', () => {
  // Thứ 2 của tuần chứa `d`, không phụ thuộc vào isoWeekKey đang được kiểm.
  const mondayOf = (d) => {
    const dow = d.getDay() || 7
    const m = new Date(d)
    m.setDate(d.getDate() - dow + 1)
    return m
  }

  it('dạng "YYYY-Wnn"', () => {
    expect(isoWeekKey(new Date(2026, 5, 21))).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('mọi ngày trong cùng 1 tuần (Thứ 2 -> Chủ nhật) ra cùng 1 khóa', () => {
    const mon = mondayOf(new Date(2026, 5, 18))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    expect(isoWeekKey(mon)).toBe(isoWeekKey(sun))
  })

  it('nhiều tuần liên tiếp luôn tăng dần (so sánh chuỗi), kể cả qua năm mới', () => {
    const base = mondayOf(new Date(2025, 11, 20))
    const keys = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i * 7)
      return isoWeekKey(d)
    })
    for (let i = 1; i < keys.length; i++) expect(keys[i] > keys[i - 1]).toBe(true)
  })
})

describe('user store — weekXp (Bước 5.1, XP theo tuần cho leaderboard)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('addXp cộng cả xp tổng và weekXp, gán đúng weekXpKey của tuần hiện tại', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    const s = useUserStore()
    s.addXp(50)
    expect(s.xp).toBe(50)
    expect(s.weekXp).toBe(50)
    expect(s.weekXpKey).toBe(isoWeekKey(new Date(2026, 5, 15)))
  })

  it('sang tuần ISO mới thì weekXp reset về 0, tổng xp vẫn cộng dồn', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    const s = useUserStore()
    s.addXp(50)
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0, 0)) // +8 ngày, chắc chắn qua tuần khác
    s.addXp(20)
    expect(s.xp).toBe(70)
    expect(s.weekXp).toBe(20)
  })

  it('subtractXp trừ cả xp tổng và weekXp, kẹp ở 0', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    const s = useUserStore()
    s.addXp(30)
    s.subtractXp(50)
    expect(s.xp).toBe(0)
    expect(s.weekXp).toBe(0)
  })

  it('hoàn thành buổi (toggleDay) cũng cộng weekXp; bỏ đánh dấu thì trừ lại', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    const s = useUserStore()
    s.toggleDay('ielts', 1, 1)
    expect(s.weekXp).toBe(50)
    s.toggleDay('ielts', 1, 1) // bỏ đánh dấu lại
    expect(s.weekXp).toBe(0)
    expect(s.xp).toBe(0)
  })
})

describe('mergeWeekXp (hợp nhất XP-tuần đa thiết bị)', () => {
  it('cùng tuần: lấy weekXp lớn hơn', () => {
    expect(mergeWeekXp({ weekXpKey: '2026-W25', weekXp: 30 }, { weekXpKey: '2026-W25', weekXp: 50 })).toEqual({
      weekXpKey: '2026-W25',
      weekXp: 50,
    })
  })

  it('khác tuần: tuần MỚI HƠN thắng toàn bộ (tuần cũ bị bỏ, không cộng dồn)', () => {
    expect(mergeWeekXp({ weekXpKey: '2026-W24', weekXp: 999 }, { weekXpKey: '2026-W25', weekXp: 10 })).toEqual({
      weekXpKey: '2026-W25',
      weekXp: 10,
    })
  })

  it('một bên chưa từng có khóa (null/thiếu) thì lấy bên có', () => {
    expect(mergeWeekXp({}, { weekXpKey: '2026-W25', weekXp: 10 })).toEqual({ weekXpKey: '2026-W25', weekXp: 10 })
    expect(mergeWeekXp({ weekXpKey: '2026-W25', weekXp: 10 }, {})).toEqual({ weekXpKey: '2026-W25', weekXp: 10 })
  })
})

describe('user store — pullAndMerge weekXp + tùy chọn leaderboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockMaybeSingle.mockReset()
    mockUpsert.mockClear()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('cùng tuần: hợp nhất weekXp lấy giá trị lớn hơn', async () => {
    const s = useUserStore()
    s.applySnapshot({ weekXp: 30, weekXpKey: '2026-W25' })
    mockMaybeSingle.mockResolvedValue({ data: { week_xp: 80, week_xp_key: '2026-W25' }, error: null })

    await s.pullAndMerge('user-wx-a')

    expect(s.weekXp).toBe(80)
    expect(s.weekXpKey).toBe('2026-W25')
  })

  it('khác tuần: tuần mới hơn thắng, không cộng dồn XP tuần cũ', async () => {
    const s = useUserStore()
    s.applySnapshot({ weekXp: 999, weekXpKey: '2026-W20' })
    mockMaybeSingle.mockResolvedValue({ data: { week_xp: 5, week_xp_key: '2026-W25' }, error: null })

    await s.pullAndMerge('user-wx-b')

    expect(s.weekXp).toBe(5)
    expect(s.weekXpKey).toBe('2026-W25')
  })

  it('opt-in leaderboard: OR giữa 2 thiết bị, ưu tiên tên local khi khác rỗng', async () => {
    const s = useUserStore()
    s.applySnapshot({ leaderboardOptIn: false, leaderboardName: 'Tên máy A' })
    mockMaybeSingle.mockResolvedValue({ data: { leaderboard_opt_in: true, leaderboard_name: '' }, error: null })

    await s.pullAndMerge('user-lb-a')

    expect(s.leaderboardOptIn).toBe(true) // remote đã bật -> OR ra true
    expect(s.leaderboardName).toBe('Tên máy A') // local non-empty được giữ
  })
})

describe('user store — leaderboard tuần (Bước 5.1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockRpc.mockClear()
    mockRpc.mockResolvedValue({ data: [], error: null })
  })

  it('setLeaderboardOptIn lưu trạng thái + tên, cắt tối đa 40 ký tự', () => {
    const s = useUserStore()
    s.setLeaderboardOptIn(true, 'A'.repeat(50))
    expect(s.leaderboardOptIn).toBe(true)
    expect(s.leaderboardName).toHaveLength(40)
  })

  it('fetchLeaderboard: no-op khi chưa đăng nhập (chế độ khách)', async () => {
    const s = useUserStore()
    await s.fetchLeaderboard()
    expect(mockRpc).not.toHaveBeenCalled()
    expect(s.leaderboardStatus).toBe('idle')
  })

  it('fetchLeaderboard: nạp danh sách khi đã đăng nhập', async () => {
    const s = useUserStore()
    s.cloudUserId = 'user-lb-x'
    mockRpc.mockResolvedValue({
      data: [{ display_name: 'Học viên ẩn danh', week_xp: 100, is_me: true }],
      error: null,
    })

    await s.fetchLeaderboard()

    expect(s.leaderboardStatus).toBe('loaded')
    expect(s.leaderboardRows).toEqual([{ displayName: 'Học viên ẩn danh', weekXp: 100, isMe: true }])
  })

  it('fetchLeaderboard: lỗi truy vấn -> leaderboardStatus = error, không ném ra ngoài', async () => {
    const s = useUserStore()
    s.cloudUserId = 'user-lb-y'
    mockRpc.mockResolvedValue({ data: null, error: new Error('boom') })

    await expect(s.fetchLeaderboard()).resolves.toBeUndefined()
    expect(s.leaderboardStatus).toBe('error')
  })
})

describe('user store — toggleReviewQuestion (đánh dấu câu hỏi Java cần ôn lại)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('đánh dấu rồi bỏ đánh dấu một câu hỏi', () => {
    const s = useUserStore()
    expect(s.javaPrep.reviewQuestions).toEqual([])
    s.toggleReviewQuestion('jpa-1')
    expect(s.javaPrep.reviewQuestions).toEqual(['jpa-1'])
    s.toggleReviewQuestion('jpa-1')
    expect(s.javaPrep.reviewQuestions).toEqual([])
  })

  it('đánh dấu nhiều câu, giữ nguyên topicScores/bestScore đã có', () => {
    const s = useUserStore()
    s.saveInterviewResult({ overall: 80, byTopic: [{ topic: 'jpa', score: 80 }] })
    s.toggleReviewQuestion('jpa-1')
    s.toggleReviewQuestion('con-2')
    expect(s.javaPrep.reviewQuestions.sort()).toEqual(['con-2', 'jpa-1'])
    expect(s.javaPrep.bestScore).toBe(80)
    expect(s.javaPrep.topicScores.jpa).toBe(80)
  })

  it('id rỗng/không hợp lệ thì bỏ qua', () => {
    const s = useUserStore()
    s.toggleReviewQuestion('')
    s.toggleReviewQuestion(null)
    expect(s.javaPrep.reviewQuestions).toEqual([])
  })

  it('ghi xuống localStorage và nạp lại được qua loadJavaPrep', () => {
    const s = useUserStore()
    s.toggleReviewQuestion('spr-16')
    const s2 = useUserStore()
    s2.javaPrep = { bestScore: 0, lastReport: null, topicScores: {}, reviewQuestions: [] }
    s2.loadJavaPrep()
    expect(s2.javaPrep.reviewQuestions).toEqual(['spr-16'])
  })
})
