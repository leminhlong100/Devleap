import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchVocabImage } from '@/lib/vocabImage'

// vocabImage.js tra ảnh minh họa qua Wikipedia REST API (thay LoremFlickr cũ),
// cache theo từ trong localStorage (kể cả kết quả rỗng) — xem Bước 2.2
// KE_HOACH_CAI_TIEN_WEBSITE.md.
describe('vocabImage — fetchVocabImage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function jsonRes(status, body) {
    return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
  }

  it('không có từ -> trả rỗng, không gọi mạng', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchVocabImage('')).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('có ảnh -> trả đúng URL thumbnail, gọi đúng tên trang viết hoa chữ đầu', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonRes(200, { type: 'standard', thumbnail: { source: 'https://x/img.jpg' } })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const url = await fetchVocabImage('computer')
    expect(url).toBe('https://x/img.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/page/summary/Computer')
  })

  it('trang định hướng (disambiguation) -> coi như không có ảnh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonRes(200, { type: 'disambiguation', thumbnail: { source: 'https://x/y.jpg' } }))),
    )
    expect(await fetchVocabImage('stress')).toBe('')
  })

  it('không có trường thumbnail -> rỗng', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonRes(200, { type: 'standard' }))))
    expect(await fetchVocabImage('confidence')).toBe('')
  })

  it('HTTP lỗi (404) -> rỗng, không ném lỗi', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonRes(404, {}))))
    await expect(fetchVocabImage('khong-ton-tai')).resolves.toBe('')
  })

  it('lỗi mạng -> rỗng, không ném lỗi', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))))
    await expect(fetchVocabImage('name')).resolves.toBe('')
  })

  it('trang chính không có ảnh -> thử thêm Wikipedia search, tìm được ảnh liên quan', async () => {
    const fetchMock = vi
      .fn()
      // 1) tra thẳng theo tên trang: đa nghĩa, coi như rỗng
      .mockResolvedValueOnce(jsonRes(200, { type: 'disambiguation' }))
      // 2) dự phòng: search trả về vài trang, trang đầu đa nghĩa, trang sau có ảnh
      .mockResolvedValueOnce(
        jsonRes(200, {
          query: {
            pages: {
              1: { index: 1, pageprops: { disambiguation: '' }, title: 'Stress (disambiguation)' },
              2: { index: 2, thumbnail: { source: 'https://x/stress.jpg' }, title: 'Psychological stress' },
            },
          },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchVocabImage('stress')).toBe('https://x/stress.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('cùng 1 từ: lần 2 lấy từ cache, KHÔNG gọi mạng lại (kể cả kết quả rỗng)', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonRes(200, { type: 'disambiguation' })))
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchVocabImage('balance')).toBe('')
    expect(await fetchVocabImage('balance')).toBe('')
    expect(await fetchVocabImage('Balance')).toBe('') // không phân biệt hoa/thường
    // lượt đầu: tra theo tên trang (đa nghĩa) + thử search dự phòng (cũng không có ảnh) = 2 lần gọi
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('cache thành công cũng không gọi lại mạng ở lần sau', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonRes(200, { type: 'standard', thumbnail: { source: 'https://x/name.jpg' } })),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchVocabImage('name')).toBe('https://x/name.jpg')
    expect(await fetchVocabImage('name')).toBe('https://x/name.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lỗi mạng KHÔNG được cache -> lần sau vẫn thử gọi lại', async () => {
    const fetchMock = vi
      .fn()
      // lượt đầu: cả tra thẳng lẫn search dự phòng đều lỗi mạng -> không xác định được, không cache
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      // lượt sau: tra thẳng theo tên trang thành công ngay, không cần search dự phòng
      .mockResolvedValueOnce(jsonRes(200, { type: 'standard', thumbnail: { source: 'https://x/z.jpg' } }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchVocabImage('goal')).toBe('')
    expect(await fetchVocabImage('goal')).toBe('https://x/z.jpg')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
