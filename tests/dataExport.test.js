import { describe, it, expect } from 'vitest'
import { buildExportPayload, parseImportPayload } from '@/lib/dataExport'

describe('lib/dataExport — sao lưu/nhập dữ liệu học tập', () => {
  it('buildExportPayload bọc snapshot với app/version/exportedAt', () => {
    const snapshot = { xp: 120, streak: 3 }
    const payload = buildExportPayload(snapshot, '2026-07-11T00:00:00.000Z')
    expect(payload).toEqual({
      app: 'devleap',
      version: 1,
      exportedAt: '2026-07-11T00:00:00.000Z',
      data: snapshot,
    })
  })

  it('round-trip: parseImportPayload đọc lại đúng snapshot đã export', () => {
    const snapshot = { xp: 250, streak: 7, savedWords: { hello: { term: 'hello' } } }
    const raw = JSON.stringify(buildExportPayload(snapshot))
    const res = parseImportPayload(raw)
    expect(res.ok).toBe(true)
    expect(res.data).toEqual(snapshot)
  })

  it('JSON hỏng -> báo lỗi thân thiện', () => {
    const res = parseImportPayload('{ not json')
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/JSON hợp lệ/)
  })

  it('JSON hợp lệ nhưng không phải file DevLeap -> báo lỗi định dạng', () => {
    const res = parseImportPayload(JSON.stringify({ foo: 'bar' }))
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/định dạng/)
  })

  it('thiếu trường data -> báo lỗi định dạng', () => {
    const res = parseImportPayload(JSON.stringify({ app: 'devleap', version: 1 }))
    expect(res.ok).toBe(false)
  })
})
