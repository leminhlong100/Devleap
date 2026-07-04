import { describe, it, expect } from 'vitest'
import { mergeSrs } from '@/stores/user/srsSlice'
import { mergeQuiz } from '@/stores/user/quizSlice'
import { mergeMissions, mergeWeekFeedback } from '@/stores/user/missionSlice'
import { mergeSaved, mergeShadowing } from '@/stores/user/vocabSlice'
import { mergeWritings } from '@/stores/user/writingSlice'
import { mergeChecklists } from '@/stores/user/progressSlice'
import { mergeSpeakingLog } from '@/stores/user/speakingSlice'
import { mergeSnapshots } from '@/stores/user/syncSupabase'

// Test trực tiếp từng hàm merge (thuần, không qua store/Pinia) — theo yêu cầu
// Bước 3.3 "mỗi hàm merge có test riêng". Các test 2 chiều đầy đủ (A mới hơn B
// và ngược lại) cho MỌI hàm merge thuộc phạm vi Bước 3.4, ở đây chỉ xác nhận
// mỗi hàm còn hoạt động đúng sau khi tách sang module riêng.

describe('mergeSrs', () => {
  it('giữ bản ôn gần nhất theo `last`', () => {
    const a = { w1: { last: '2026-1-1', reps: 1 } }
    const b = { w1: { last: '2026-1-5', reps: 2 } }
    expect(mergeSrs(a, b).w1.reps).toBe(2)
    expect(mergeSrs(b, a).w1.reps).toBe(2)
  })
  it('thẻ chỉ có ở một bên thì giữ nguyên', () => {
    const out = mergeSrs({ w1: { last: '2026-1-1' } }, { w2: { last: '2026-1-2' } })
    expect(Object.keys(out).sort()).toEqual(['w1', 'w2'])
  })
})

describe('mergeQuiz', () => {
  it('giữ điểm % cao nhất, OR trạng thái đạt (2 chiều: A mới hơn B)', () => {
    const a = { 'ielts:week:1': { pct: 60, passed: false, attempts: 1, lastAt: '2026-1-1', wrong: ['x'] } }
    const b = { 'ielts:week:1': { pct: 90, passed: true, attempts: 2, lastAt: '2026-1-2', wrong: [] } }
    const out = mergeQuiz(a, b)['ielts:week:1']
    expect(out.pct).toBe(90)
    expect(out.passed).toBe(true)
    expect(out.attempts).toBe(2)
    expect(out.wrong).toEqual([])
    // Đổi chiều gọi (B mới hơn A theo lastAt) -> kết quả phải giống nhau (order-independent).
    expect(mergeQuiz(b, a)['ielts:week:1']).toEqual(out)
  })
  it('B mới hơn A: pct thấp hơn nhưng lastAt mới hơn thì wrong lấy theo B', () => {
    const a = { k: { pct: 90, passed: false, attempts: 3, lastAt: '2026-1-1', wrong: [] } }
    const b = { k: { pct: 40, passed: false, attempts: 1, lastAt: '2026-1-5', wrong: ['z'] } }
    const out = mergeQuiz(a, b).k
    expect(out.pct).toBe(90) // vẫn giữ điểm cao nhất dù không phải lần làm gần nhất
    expect(out.wrong).toEqual(['z']) // wrong theo lần làm GẦN NHẤT, không theo điểm cao nhất
    expect(mergeQuiz(b, a).k).toEqual(out)
  })
  it('đã đạt thì wrong luôn rỗng dù bên nào còn wrong cũ (2 chiều)', () => {
    const a = { k: { pct: 100, passed: true, attempts: 1, lastAt: '2026-1-1', wrong: [] } }
    const b = { k: { pct: 50, passed: false, attempts: 1, lastAt: '2026-1-2', wrong: ['y'] } }
    expect(mergeQuiz(a, b).k.wrong).toEqual([])
    expect(mergeQuiz(b, a).k.wrong).toEqual([])
  })
})

describe('mergeMissions (dùng chung cho missions & realTalks)', () => {
  it('giữ note của bản mới hơn, OR trạng thái done (2 chiều)', () => {
    const a = { 'ielts:1:1': { note: 'cũ', done: false, at: '2026-1-1' } }
    const b = { 'ielts:1:1': { note: 'mới', done: true, at: '2026-1-5' } }
    const out = mergeMissions(a, b)['ielts:1:1']
    expect(out.note).toBe('mới')
    expect(out.done).toBe(true)
    expect(mergeMissions(b, a)['ielts:1:1']).toEqual(out)
  })
  it('B cũ hơn A nhưng đã done: done vẫn giữ true (OR), note vẫn theo A mới hơn', () => {
    const a = { k: { note: 'A mới', done: false, at: '2026-1-9' } }
    const b = { k: { note: 'B cũ', done: true, at: '2026-1-1' } }
    const out = mergeMissions(a, b).k
    expect(out.note).toBe('A mới')
    expect(out.done).toBe(true)
    expect(mergeMissions(b, a).k).toEqual(out)
  })
})

describe('mergeWeekFeedback', () => {
  it('mỗi tuần giữ bản mới hơn theo `at`, không OR trạng thái (2 chiều)', () => {
    const a = { 'ielts:1': { rating: 'hard', at: '2026-1-1' } }
    const b = { 'ielts:1': { rating: 'easy', at: '2026-1-5' } }
    expect(mergeWeekFeedback(a, b)['ielts:1'].rating).toBe('easy')
    expect(mergeWeekFeedback(b, a)['ielts:1'].rating).toBe('easy')
  })
  it('A mới hơn B: giữ bản của A dù A là tham số thứ nhất hay thứ hai', () => {
    const a = { 'ielts:2': { rating: 'ok', at: '2026-2-9' } }
    const b = { 'ielts:2': { rating: 'skipped', at: '2026-2-1' } }
    expect(mergeWeekFeedback(a, b)['ielts:2'].rating).toBe('ok')
    expect(mergeWeekFeedback(b, a)['ielts:2'].rating).toBe('ok')
  })
})

describe('mergeSaved', () => {
  it('giữ bản lưu sớm nhất (savedAt nhỏ hơn), 2 chiều', () => {
    const a = { name: { term: 'name', savedAt: '2026-01-05T00:00:00Z' } }
    const b = { name: { term: 'name', savedAt: '2026-01-01T00:00:00Z' } }
    expect(mergeSaved(a, b).name.savedAt).toBe('2026-01-01T00:00:00Z')
    expect(mergeSaved(b, a).name.savedAt).toBe('2026-01-01T00:00:00Z')
  })
})

describe('mergeShadowing', () => {
  it('giữ điểm cao nhất + gộp điểm từng câu (2 chiều)', () => {
    const a = { v1: { best: 50, passed: false, attempts: 1, lastAt: '2026-1-1', sentences: { s1: 80 } } }
    const b = { v1: { best: 70, passed: true, attempts: 2, lastAt: '2026-1-2', sentences: { s1: 60, s2: 90 } } }
    const out = mergeShadowing(a, b).v1
    expect(out.best).toBe(70)
    expect(out.passed).toBe(true)
    expect(out.sentences).toEqual({ s1: 80, s2: 90 })
    expect(mergeShadowing(b, a).v1).toEqual(out)
  })
})

describe('mergeWritings', () => {
  it('giữ text của bản mới hơn, OR trạng thái nộp (2 chiều)', () => {
    const a = { 'ielts:1:1': { text: 'bản cũ', done: false, review: null, at: '2026-1-1' } }
    const b = { 'ielts:1:1': { text: 'bản mới', done: true, review: { score: 80 }, at: '2026-1-5' } }
    const out = mergeWritings(a, b)['ielts:1:1']
    expect(out.text).toBe('bản mới')
    expect(out.done).toBe(true)
    expect(out.review).toEqual({ score: 80 })
    expect(mergeWritings(b, a)['ielts:1:1']).toEqual(out)
  })
  it('bản mới hơn chưa có review (chưa chữa) thì vẫn giữ review cũ đã chữa', () => {
    const a = { k: { text: 'bài đã chữa', done: true, review: { score: 60 }, at: '2026-1-1' } }
    const b = { k: { text: 'nộp lại chưa chữa', done: true, review: null, at: '2026-1-5' } }
    const out = mergeWritings(a, b).k
    expect(out.text).toBe('nộp lại chưa chữa')
    expect(out.review).toEqual({ score: 60 })
    expect(mergeWritings(b, a).k).toEqual(out)
  })
})

describe('mergeChecklists', () => {
  it('OR theo từng vị trí, giữ độ dài lớn hơn (2 chiều)', () => {
    const a = { 'ielts:1:1': [true, false] }
    const b = { 'ielts:1:1': [false, true, true] }
    expect(mergeChecklists(a, b)['ielts:1:1']).toEqual([true, true, true])
    expect(mergeChecklists(b, a)['ielts:1:1']).toEqual([true, true, true])
  })
})

describe('mergeSpeakingLog', () => {
  it('mỗi ngày giữ số giây lớn hơn (2 chiều)', () => {
    const a = { '2026-1-1': 30 }
    const b = { '2026-1-1': 90, '2026-1-2': 10 }
    expect(mergeSpeakingLog(a, b)).toEqual({ '2026-1-1': 90, '2026-1-2': 10 })
    expect(mergeSpeakingLog(b, a)).toEqual({ '2026-1-1': 90, '2026-1-2': 10 })
  })
})

describe('mergeSnapshots (hàm tổng hợp gọi mọi merge slice — dùng trong pullAndMerge)', () => {
  const local = {
    xp: 100,
    streak: 2,
    badges: 1,
    lastStudyDate: '2026-6-10',
    knownCards: [1, 2],
    srs: { w1: { last: '2026-6-1', reps: 1 } },
    completed: { java: ['1:1'], ielts: [] },
    quizScores: { 'ielts:week:1': { pct: 60, passed: false, attempts: 1, lastAt: '2026-6-1', wrong: ['x'] } },
    savedWords: { name: { term: 'name', savedAt: '2026-01-05T00:00:00Z' } },
    shadowingScores: { v1: { best: 50, passed: false, attempts: 1, lastAt: '2026-6-1', sentences: {} } },
    writings: { 'ielts:1:1': { text: 'cũ', done: false, review: null, at: '2026-6-1' } },
    missions: { 'ielts:1:1': { note: 'cũ', done: false, at: '2026-6-1' } },
    realTalks: {},
    checklists: { 'ielts:1:1': [true, false] },
    speakingLog: { '2026-6-1': 30 },
    speakingStreak: 2,
    lastSpeakingDate: '2026-6-1',
    weekFeedback: { 'ielts:1': { rating: 'hard', at: '2026-6-1' } },
  }
  const remote = {
    xp: 40,
    streak: 5,
    badges: 0,
    lastStudyDate: '2026-6-15',
    knownCards: [2, 3],
    srs: { w1: { last: '2026-6-5', reps: 2 } },
    completed: { java: ['1:2'], ielts: ['1:1'] },
    quizScores: { 'ielts:week:1': { pct: 90, passed: true, attempts: 2, lastAt: '2026-6-5', wrong: [] } },
    savedWords: { name: { term: 'name', savedAt: '2026-01-01T00:00:00Z' } },
    shadowingScores: { v1: { best: 70, passed: true, attempts: 2, lastAt: '2026-6-5', sentences: { s1: 90 } } },
    writings: { 'ielts:1:1': { text: 'mới', done: true, review: { score: 80 }, at: '2026-6-5' } },
    missions: { 'ielts:1:1': { note: 'mới', done: true, at: '2026-6-5' } },
    realTalks: {},
    checklists: { 'ielts:1:1': [false, true, true] },
    speakingLog: { '2026-6-1': 90, '2026-6-2': 10 },
    speakingStreak: 1,
    lastSpeakingDate: '2026-6-5',
    weekFeedback: { 'ielts:1': { rating: 'easy', at: '2026-6-5' } },
  }

  it('gộp Math.max cho số đếm, laterDate cho ngày, union cho danh sách, và ủy quyền đúng cho từng slice', () => {
    const out = mergeSnapshots(local, remote)
    expect(out.xp).toBe(100) // max
    expect(out.streak).toBe(5) // max
    expect(out.badges).toBe(1) // max
    expect(out.lastStudyDate).toBe('2026-6-15') // muộn hơn
    expect(out.knownCards.sort()).toEqual([1, 2, 3]) // union
    expect(out.completed.java.sort()).toEqual(['1:1', '1:2'])
    expect(out.completed.ielts).toEqual(['1:1'])
    expect(out.srs.w1.reps).toBe(2) // mergeSrs: bản ôn gần nhất
    expect(out.quizScores['ielts:week:1'].pct).toBe(90) // mergeQuiz
    expect(out.savedWords.name.savedAt).toBe('2026-01-01T00:00:00Z') // mergeSaved: sớm nhất
    expect(out.shadowingScores.v1.best).toBe(70) // mergeShadowing
    expect(out.writings['ielts:1:1'].text).toBe('mới') // mergeWritings
    expect(out.missions['ielts:1:1'].note).toBe('mới') // mergeMissions
    expect(out.checklists['ielts:1:1']).toEqual([true, true, true]) // mergeChecklists
    expect(out.speakingLog).toEqual({ '2026-6-1': 90, '2026-6-2': 10 }) // mergeSpeakingLog
    expect(out.speakingStreak).toBe(2) // max
    expect(out.lastSpeakingDate).toBe('2026-6-5') // muộn hơn
    expect(out.weekFeedback['ielts:1'].rating).toBe('easy') // mergeWeekFeedback
  })

  it('đổi chiều gọi mergeSnapshots(remote, local) ra đúng cùng kết quả (order-independent)', () => {
    // union (knownCards/completed.*) không đảm bảo cùng THỨ TỰ phần tử khi đổi
    // chiều gọi (đúng bản chất tập hợp) -> sort trước khi so deep-equal.
    const sortArrays = (snap) => ({
      ...snap,
      knownCards: [...snap.knownCards].sort(),
      completed: {
        java: [...snap.completed.java].sort(),
        ielts: [...snap.completed.ielts].sort(),
      },
    })
    expect(sortArrays(mergeSnapshots(remote, local))).toEqual(sortArrays(mergeSnapshots(local, remote)))
  })
})
