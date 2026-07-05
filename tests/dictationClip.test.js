import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clipSentenceList, pickDictationSentences } from '@/lib/dictationClip'

describe('dictationClip — câu nghe-chép lấy từ clip shadowing thật (Bước 5.3)', () => {
  describe('clipSentenceList — chấp cả 2 dạng lưu trữ', () => {
    it('mảng phẳng -> trả nguyên mảng', () => {
      const arr = [{ id: 1, text: 'Hi.', start: 0, end: 1 }]
      expect(clipSentenceList({ sentences: arr })).toBe(arr)
    })
    it('{ai, original} -> ưu tiên bản ai', () => {
      const ai = [{ id: 1, text: 'AI ver', start: 0, end: 1 }]
      const original = [{ id: 1, text: 'Original ver', start: 0, end: 1 }]
      expect(clipSentenceList({ sentences: { ai, original } })).toBe(ai)
    })
    it('ai rỗng -> rơi về original', () => {
      const original = [{ id: 1, text: 'Original ver', start: 0, end: 1 }]
      expect(clipSentenceList({ sentences: { ai: [], original } })).toBe(original)
    })
    it('không có sentences -> mảng rỗng', () => {
      expect(clipSentenceList({})).toEqual([])
      expect(clipSentenceList(null)).toEqual([])
    })
  })

  describe('pickDictationSentences', () => {
    const clip = {
      sentences: {
        ai: [
          { id: 1, text: 'One.', start: 0, end: 1 },
          { id: 2, text: 'Two.', start: 1, end: 2 },
          { id: 3, text: 'Three.', start: 2, end: 3 },
          { id: 4, text: 'Four.', start: 3, end: 4 },
          { id: 5, text: 'Five.', start: 4, end: 5 },
          { id: 6, text: 'Six.', start: 5, end: 6 },
        ],
        original: [],
      },
    }
    it('mặc định lấy tối đa 5 câu đầu, chỉ giữ {text,start,end}', () => {
      const picked = pickDictationSentences(clip)
      expect(picked).toHaveLength(5)
      expect(picked[0]).toEqual({ text: 'One.', start: 0, end: 1 })
      expect(picked.map((s) => s.text)).toEqual(['One.', 'Two.', 'Three.', 'Four.', 'Five.'])
    })
    it('n tùy chỉnh', () => {
      expect(pickDictationSentences(clip, 2)).toHaveLength(2)
    })
    it('bỏ qua câu thiếu text/start/end (dữ liệu hỏng)', () => {
      const broken = { sentences: [{ id: 1, text: 'Ok.', start: 0, end: 1 }, { id: 2, text: '', start: 1, end: 2 }, { id: 3, start: 2, end: 3 }] }
      expect(pickDictationSentences(broken)).toEqual([{ text: 'Ok.', start: 0, end: 1 }])
    })
    it('clip rỗng -> mảng rỗng', () => {
      expect(pickDictationSentences({ sentences: [] })).toEqual([])
    })
  })
})

// dictationClipForWeek gọi shadowingRepo (network/Supabase) -> mock riêng, reset
// module giữa các test vì shadowingRepo có cache module-scope.
describe('dictationClipForWeek', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  function mockRepo({ list = [], clip = null }) {
    vi.doMock('@/lib/shadowingRepo', () => ({
      fetchClipsByWeek: vi.fn(() => Promise.resolve(list)),
      fetchClip: vi.fn(() => Promise.resolve(clip)),
    }))
  }

  it('tuần chưa có clip nào curate -> null', async () => {
    mockRepo({ list: [] })
    const { dictationClipForWeek } = await import('@/lib/dictationClip')
    expect(await dictationClipForWeek(7)).toBeNull()
  })

  it('có clip nhưng fetchClip trả null -> null', async () => {
    mockRepo({ list: [{ videoId: 'a1' }], clip: null })
    const { dictationClipForWeek } = await import('@/lib/dictationClip')
    expect(await dictationClipForWeek(7)).toBeNull()
  })

  it('clip có câu nhưng không câu nào đủ start/end -> null', async () => {
    mockRepo({
      list: [{ videoId: 'a1' }],
      clip: { videoId: 'a1', title: 'A1', sentences: [{ id: 1, text: 'x' }] },
    })
    const { dictationClipForWeek } = await import('@/lib/dictationClip')
    expect(await dictationClipForWeek(7)).toBeNull()
  })

  it('lấy đúng clip ĐẦU TIÊN của tuần, tối đa n câu, kèm videoId/title', async () => {
    mockRepo({
      list: [{ videoId: 'a1' }, { videoId: 'b1' }],
      clip: {
        videoId: 'a1',
        title: 'Clip A',
        sentences: {
          ai: [
            { id: 1, text: 'One.', start: 0, end: 1 },
            { id: 2, text: 'Two.', start: 1, end: 2 },
            { id: 3, text: 'Three.', start: 2, end: 3 },
          ],
          original: [],
        },
      },
    })
    const { dictationClipForWeek } = await import('@/lib/dictationClip')
    const res = await dictationClipForWeek(7, 2)
    expect(res).toEqual({
      videoId: 'a1',
      title: 'Clip A',
      sentences: [
        { text: 'One.', start: 0, end: 1 },
        { text: 'Two.', start: 1, end: 2 },
      ],
    })
  })
})
