import { describe, it, expect, beforeEach, vi } from 'vitest'

// shadowingRepo cache (`staticClipsPromise`) sống ở module scope nên mỗi test cần
// resetModules() + import động để mock fetch/supabase khác nhau không bị dính nhau.
describe('shadowingRepo — gộp clip tĩnh (public/data/shadowing-clips.json) + Supabase', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  function stubStaticFetch(clips) {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(clips) })),
    )
  }

  function mockSupabase({ cloudEnabled, listRows = [], singleRow = null }) {
    vi.doMock('@/lib/supabase', () => ({
      isCloudEnabled: cloudEnabled,
      supabase: {
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({ data: listRows, error: null }),
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: singleRow, error: null }) }),
          }),
        }),
      },
    }))
  }

  const staticClipA = {
    videoId: 'a1',
    title: 'A1 tĩnh',
    level: 'A2',
    topic: 'Giao tiếp',
    week: 4,
    sentences: { ai: [{ id: 1, text: 'Hi.', start: 0, end: 1 }], original: [] },
  }
  const staticClipB = {
    videoId: 'b1',
    title: 'B1 tĩnh',
    level: 'B1',
    topic: 'Học tập',
    week: 5,
    sentences: { ai: [{ id: 1, text: 'x', start: 0, end: 1 }, { id: 2, text: 'y', start: 1, end: 2 }], original: [] },
  }

  it('chế độ khách (Supabase chưa cấu hình): fetchClipList chỉ trả bộ tĩnh', async () => {
    stubStaticFetch([staticClipA, staticClipB])
    mockSupabase({ cloudEnabled: false })
    const { fetchClipList } = await import('@/lib/shadowingRepo')
    const list = await fetchClipList()
    expect(list).toEqual([
      { videoId: 'a1', title: 'A1 tĩnh', level: 'A2', topic: 'Giao tiếp', sentenceCount: 1, week: 4 },
      { videoId: 'b1', title: 'B1 tĩnh', level: 'B1', topic: 'Học tập', sentenceCount: 2, week: 5 },
    ])
  })

  it('fetchClipsByWeek lọc đúng theo tuần trên bộ đã gộp', async () => {
    stubStaticFetch([staticClipA, staticClipB])
    mockSupabase({ cloudEnabled: false })
    const { fetchClipsByWeek } = await import('@/lib/shadowingRepo')
    expect((await fetchClipsByWeek(4)).map((c) => c.videoId)).toEqual(['a1'])
    expect((await fetchClipsByWeek(5)).map((c) => c.videoId)).toEqual(['b1'])
    expect(await fetchClipsByWeek(6)).toEqual([])
    expect(await fetchClipsByWeek()).toEqual([])
  })

  it('cùng videoId ở cả 2 nguồn: clip Supabase (admin sửa) thắng clip tĩnh', async () => {
    stubStaticFetch([staticClipA])
    mockSupabase({
      cloudEnabled: true,
      listRows: [
        { video_id: 'a1', title: 'A1 admin đã sửa', level: 'B1', topic: 'Đổi chủ đề', sentence_count: 9, week: 4 },
      ],
    })
    const { fetchClipList } = await import('@/lib/shadowingRepo')
    const list = await fetchClipList()
    expect(list).toEqual([
      { videoId: 'a1', title: 'A1 admin đã sửa', level: 'B1', topic: 'Đổi chủ đề', sentenceCount: 9, week: 4 },
    ])
  })

  it('fetchClipList vẫn giữ clip tĩnh không trùng videoId khi có Supabase', async () => {
    stubStaticFetch([staticClipA, staticClipB])
    mockSupabase({
      cloudEnabled: true,
      listRows: [{ video_id: 'c1', title: 'C1 admin', level: 'C1', topic: null, sentence_count: 5, week: 8 }],
    })
    const { fetchClipList } = await import('@/lib/shadowingRepo')
    const ids = (await fetchClipList()).map((c) => c.videoId).sort()
    expect(ids).toEqual(['a1', 'b1', 'c1'])
  })

  it('fetchClip: có bản Supabase -> trả bản Supabase (kể cả trùng videoId với tĩnh)', async () => {
    stubStaticFetch([staticClipA])
    mockSupabase({
      cloudEnabled: true,
      singleRow: {
        video_id: 'a1',
        title: 'A1 admin',
        level: 'B2',
        topic: 'x',
        lang: 'en',
        week: 4,
        sentences: { ai: [], original: [] },
      },
    })
    const { fetchClip } = await import('@/lib/shadowingRepo')
    const clip = await fetchClip('a1')
    expect(clip.title).toBe('A1 admin')
  })

  it('fetchClip: Supabase không có bản ghi -> rơi về clip tĩnh', async () => {
    stubStaticFetch([staticClipA])
    mockSupabase({ cloudEnabled: true, singleRow: null })
    const { fetchClip } = await import('@/lib/shadowingRepo')
    const clip = await fetchClip('a1')
    expect(clip).toEqual(staticClipA)
  })

  it('fetchClip: không có ở cả 2 nguồn -> null', async () => {
    stubStaticFetch([staticClipA])
    mockSupabase({ cloudEnabled: false })
    const { fetchClip } = await import('@/lib/shadowingRepo')
    expect(await fetchClip('khong-ton-tai')).toBeNull()
  })

  it('fetch bộ tĩnh lỗi mạng -> không văng lỗi, coi như rỗng', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))))
    mockSupabase({ cloudEnabled: false })
    const { fetchClipList } = await import('@/lib/shadowingRepo')
    expect(await fetchClipList()).toEqual([])
  })
})
