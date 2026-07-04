import { describe, it, expect } from 'vitest'
import { listeningStageOf, listeningStageInfo } from '@/data/ieltsListeningStage'

describe('listeningStageOf() — thang nghe "thật hóa dần"', () => {
  it('Tuần 1-3: TTS chậm', () => {
    expect(listeningStageOf(1)).toBe('tts')
    expect(listeningStageOf(3)).toBe('tts')
  })

  it('Tuần 4-6: bán thực', () => {
    expect(listeningStageOf(4)).toBe('semi')
    expect(listeningStageOf(6)).toBe('semi')
  })

  it('Tuần 7-8: clip gốc', () => {
    expect(listeningStageOf(7)).toBe('native')
    expect(listeningStageOf(8)).toBe('native')
  })

  it('mỗi giai đoạn có label + goal hiển thị được', () => {
    for (const w of [1, 4, 7]) {
      const info = listeningStageInfo(w)
      expect(info.label).toBeTruthy()
      expect(info.goal).toBeTruthy()
    }
  })
})
