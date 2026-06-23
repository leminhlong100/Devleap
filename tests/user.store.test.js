import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// —— Mock lớp Supabase: bật cloud, điều khiển dữ liệu remote & bắt upsert ——
const mockMaybeSingle = vi.fn()
const mockUpsert = vi.fn(() => Promise.resolve({ error: null }))
const fromChain = {
  select: vi.fn(() => fromChain),
  eq: vi.fn(() => fromChain),
  maybeSingle: (...a) => mockMaybeSingle(...a),
  upsert: (...a) => mockUpsert(...a),
}
vi.mock('@/lib/supabase', () => ({
  isCloudEnabled: true,
  supabase: { from: vi.fn(() => fromChain) },
}))

import { useUserStore } from '@/stores/user'

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
