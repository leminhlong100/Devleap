import { describe, it, expect, beforeEach, vi } from 'vitest'

// recordingSync.js đọc `isCloudEnabled`/`supabase` ở đầu module -> mock qua
// vi.doMock + import động (giống pattern trong tests/shadowingRepo.test.js).
describe('recordingSync — đồng bộ ghi âm mốc lên Supabase Storage', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  function mockSupabase({ cloudEnabled, upload, download, list, remove }) {
    vi.doMock('@/lib/supabase', () => ({
      isCloudEnabled: cloudEnabled,
      supabase: {
        storage: {
          from: () => ({
            upload: upload || (() => Promise.resolve({ error: null })),
            download: download || (() => Promise.resolve({ data: null, error: null })),
            list: list || (() => Promise.resolve({ data: [], error: null })),
            remove: remove || (() => Promise.resolve({ error: null })),
          }),
        },
      },
    }))
  }

  function mockRecorder(blobsByKey = {}) {
    vi.doMock('@/lib/recorder', () => ({
      loadRecording: vi.fn((key) => Promise.resolve(blobsByKey[key] || null)),
    }))
  }

  it('chế độ khách (Supabase chưa cấu hình): mọi hàm no-op, không ném lỗi', async () => {
    mockSupabase({ cloudEnabled: false })
    mockRecorder()
    const { uploadRecording, downloadRecording, remoteRecordingExists, deleteRemoteRecording } = await import(
      '@/lib/recordingSync'
    )
    expect(await uploadRecording('u1', 'ielts:1:1', new Blob(['x']))).toBe(false)
    expect(await downloadRecording('u1', 'ielts:1:1')).toBeNull()
    expect(await remoteRecordingExists('u1', 'ielts:1:1')).toBe(false)
    await expect(deleteRemoteRecording('u1', 'ielts:1:1')).resolves.toBeUndefined()
  })

  it('uploadRecording: ghi đúng path escape dấu ":" và trả true khi thành công', async () => {
    const upload = vi.fn(() => Promise.resolve({ error: null }))
    mockSupabase({ cloudEnabled: true, upload })
    mockRecorder()
    const { uploadRecording } = await import('@/lib/recordingSync')
    const blob = new Blob(['x'], { type: 'audio/webm' })
    const ok = await uploadRecording('u1', 'ielts:1:1', blob)
    expect(ok).toBe(true)
    expect(upload).toHaveBeenCalledWith('u1/ielts_1_1.webm', blob, { upsert: true, contentType: 'audio/webm' })
  })

  it('uploadRecording lỗi mạng: trả false và xếp vào hàng chờ (đọc lại thấy đúng)', async () => {
    mockSupabase({ cloudEnabled: true, upload: () => Promise.reject(new Error('network')) })
    mockRecorder()
    const { uploadRecording, flushPendingUploads } = await import('@/lib/recordingSync')
    const ok = await uploadRecording('u1', 'ielts:1:1', new Blob(['x']))
    expect(ok).toBe(false)
    const pending = JSON.parse(localStorage.getItem('devleap:pending-recording-uploads'))
    expect(pending).toEqual([{ userId: 'u1', key: 'ielts:1:1' }])

    // flush sau đó với recorder có blob local -> thử upload lại
    vi.resetModules()
    localStorage.setItem('devleap:pending-recording-uploads', JSON.stringify(pending))
    const upload2 = vi.fn(() => Promise.resolve({ error: null }))
    mockSupabase({ cloudEnabled: true, upload: upload2 })
    const blob = new Blob(['x'])
    mockRecorder({ 'ielts:1:1': blob })
    const mod2 = await import('@/lib/recordingSync')
    await mod2.flushPendingUploads('u1')
    expect(upload2).toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('devleap:pending-recording-uploads'))).toEqual([])
  })

  it('downloadRecording: trả Blob khi có, null khi lỗi', async () => {
    const blob = new Blob(['y'])
    mockSupabase({ cloudEnabled: true, download: () => Promise.resolve({ data: blob, error: null }) })
    mockRecorder()
    const { downloadRecording } = await import('@/lib/recordingSync')
    expect(await downloadRecording('u1', 'ielts:1:1')).toBe(blob)
  })

  it('downloadRecording: lỗi -> null, không ném', async () => {
    mockSupabase({ cloudEnabled: true, download: () => Promise.reject(new Error('boom')) })
    mockRecorder()
    const { downloadRecording } = await import('@/lib/recordingSync')
    expect(await downloadRecording('u1', 'ielts:1:1')).toBeNull()
  })

  it('remoteRecordingExists: true khi list trả đúng tên file đã escape', async () => {
    mockSupabase({
      cloudEnabled: true,
      list: () => Promise.resolve({ data: [{ name: 'ielts_1_1.webm' }], error: null }),
    })
    mockRecorder()
    const { remoteRecordingExists } = await import('@/lib/recordingSync')
    expect(await remoteRecordingExists('u1', 'ielts:1:1')).toBe(true)
  })

  it('remoteRecordingExists: false khi không tìm thấy tên khớp', async () => {
    mockSupabase({
      cloudEnabled: true,
      list: () => Promise.resolve({ data: [{ name: 'khac.webm' }], error: null }),
    })
    mockRecorder()
    const { remoteRecordingExists } = await import('@/lib/recordingSync')
    expect(await remoteRecordingExists('u1', 'ielts:1:1')).toBe(false)
  })

  it('deleteRemoteRecording: gọi remove với đúng path, best-effort không ném khi lỗi', async () => {
    const remove = vi.fn(() => Promise.resolve({ error: null }))
    mockSupabase({ cloudEnabled: true, remove })
    mockRecorder()
    const { deleteRemoteRecording } = await import('@/lib/recordingSync')
    await deleteRemoteRecording('u1', 'ielts:1:1')
    expect(remove).toHaveBeenCalledWith(['u1/ielts_1_1.webm'])

    vi.resetModules()
    mockSupabase({ cloudEnabled: true, remove: () => Promise.reject(new Error('boom')) })
    mockRecorder()
    const mod2 = await import('@/lib/recordingSync')
    await expect(mod2.deleteRemoteRecording('u1', 'ielts:1:1')).resolves.toBeUndefined()
  })

  it('flushPendingUploads: bản ghi không còn ở local (đã xóa) thì bỏ khỏi hàng chờ, không upload', async () => {
    localStorage.setItem(
      'devleap:pending-recording-uploads',
      JSON.stringify([{ userId: 'u1', key: 'ielts:1:1' }]),
    )
    const upload = vi.fn(() => Promise.resolve({ error: null }))
    mockSupabase({ cloudEnabled: true, upload })
    mockRecorder({}) // không có blob nào local
    const { flushPendingUploads } = await import('@/lib/recordingSync')
    await flushPendingUploads('u1')
    expect(upload).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('devleap:pending-recording-uploads'))).toEqual([])
  })
})
