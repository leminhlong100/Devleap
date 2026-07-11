import { describe, it, expect } from 'vitest'
import {
  detectPitch,
  semitones,
  median,
  cleanContour,
  contourDirection,
  expectedDirection,
  scoreIntonation,
  normalizeForPlot,
} from '@/lib/pitchTrack'

/** Tạo một khung sóng sin tần số f (Hz) tại sampleRate, dài n mẫu. */
function sine(f, sampleRate, n) {
  const buf = new Float32Array(n)
  for (let i = 0; i < n; i++) buf[i] = Math.sin((2 * Math.PI * f * i) / sampleRate)
  return buf
}

describe('detectPitch() — autocorrelation', () => {
  it('đo đúng tần số một sóng sin thuần (± vài Hz)', () => {
    const f = detectPitch(sine(200, 44100, 2048), 44100)
    expect(f).toBeGreaterThan(190)
    expect(f).toBeLessThan(210)
  })

  it('đo được nhiều mốc cao độ giọng người (120 & 300 Hz)', () => {
    expect(detectPitch(sine(120, 48000, 2048), 48000)).toBeGreaterThan(112)
    expect(detectPitch(sine(120, 48000, 2048), 48000)).toBeLessThan(128)
    expect(detectPitch(sine(300, 48000, 2048), 48000)).toBeGreaterThan(285)
    expect(detectPitch(sine(300, 48000, 2048), 48000)).toBeLessThan(315)
  })

  it('im lặng (RMS thấp) -> -1', () => {
    expect(detectPitch(new Float32Array(2048), 44100)).toBe(-1)
  })

  it('ngoài dải giọng người (thấp/cao) -> -1', () => {
    expect(detectPitch(sine(40, 44100, 2048), 44100)).toBe(-1) // dưới 70 Hz
    expect(detectPitch(sine(1200, 44100, 2048), 44100)).toBe(-1) // trên 400 Hz
  })

  it('an toàn với input rỗng / sampleRate lỗi', () => {
    expect(detectPitch(new Float32Array(0), 44100)).toBe(-1)
    expect(detectPitch(sine(200, 44100, 2048), 0)).toBe(-1)
  })
})

describe('semitones() & median()', () => {
  it('quãng tám = 12 nửa cung', () => {
    expect(semitones(100, 200)).toBeCloseTo(12, 5)
    expect(semitones(200, 100)).toBeCloseTo(-12, 5)
  })
  it('tần số không hợp lệ -> 0', () => {
    expect(semitones(0, 200)).toBe(0)
    expect(semitones(100, -5)).toBe(0)
  })
  it('median lấy trung vị, bỏ NaN', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBe(0)
    expect(median([5, NaN, 5])).toBe(5)
  })
})

describe('cleanContour() — lọc điểm', () => {
  it('bỏ điểm -1 (im lặng) và ngoài ±12 nửa cung so trung vị', () => {
    const out = cleanContour([-1, 200, 205, 210, 3000, -1, 195])
    expect(out).not.toContain(-1)
    expect(out).not.toContain(3000) // ngoài dải -> cắt
    expect(out.length).toBe(4)
  })
})

describe('contourDirection() — hướng ngữ điệu', () => {
  it('đi lên rõ -> rising', () => {
    expect(contourDirection([100, 100, 105, 120, 140, 150])).toBe('rising')
  })
  it('đi xuống rõ -> falling', () => {
    expect(contourDirection([150, 145, 130, 110, 100, 98])).toBe('falling')
  })
  it('gần như phẳng -> flat', () => {
    expect(contourDirection([150, 151, 149, 150, 150, 151])).toBe('flat')
  })
  it('quá ít điểm hợp lệ -> unknown', () => {
    expect(contourDirection([-1, 200, -1])).toBe('unknown')
  })
})

describe('scoreIntonation() & expectedDirection()', () => {
  it('mẫu Yes/No = lên; câu kể/WH = xuống', () => {
    expect(expectedDirection('yesno')).toBe('rising')
    expect(expectedDirection('statement')).toBe('falling')
    expect(expectedDirection('wh')).toBe('falling')
  })
  it('đọc lên giọng cho câu Yes/No -> ok', () => {
    const r = scoreIntonation([100, 100, 110, 130, 150, 160], 'yesno')
    expect(r.direction).toBe('rising')
    expect(r.expected).toBe('rising')
    expect(r.ok).toBe(true)
    expect(r.points.length).toBeGreaterThan(2)
  })
  it('đọc lên giọng cho câu kể -> KHÔNG khớp', () => {
    const r = scoreIntonation([100, 100, 110, 130, 150, 160], 'statement')
    expect(r.ok).toBe(false)
  })
})

describe('normalizeForPlot()', () => {
  it('chuẩn hóa về [0,1], điểm thấp nhất=0, cao nhất=1', () => {
    const pts = normalizeForPlot([100, 150, 200])
    expect(pts.length).toBe(3)
    expect(pts[0].y).toBeCloseTo(0, 5)
    expect(pts[2].y).toBeCloseTo(1, 5)
    expect(pts[0].x).toBe(0)
    expect(pts[2].x).toBe(1)
  })
  it('quá ít điểm -> mảng rỗng', () => {
    expect(normalizeForPlot([-1])).toEqual([])
  })
})
