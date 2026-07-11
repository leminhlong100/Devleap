/**
 * Đo cao độ (pitch / F0) từ mic bằng Web Audio API — nền cho "Bộ hiện ngữ điệu"
 * (kế hoạch "Nói Tự Tin", Đợt A #2). Client-side hoàn toàn: LLM không nghe được
 * audio, nhưng autocorrelation trên buffer thời gian đo được ĐƯỜNG LÊN/XUỐNG của
 * giọng — thứ quyết định câu hỏi Yes/No (lên) vs câu kể/WH (xuống).
 *
 * Các hàm ở đây là THUẦN (không đụng DOM/AudioContext) để test được: component
 * chỉ lo lấy buffer từ AnalyserNode rồi gọi `detectPitch` mỗi khung hình.
 */

/**
 * Ước lượng tần số cơ bản (Hz) của một khung tín hiệu bằng autocorrelation
 * chuẩn hóa (ACF), kèm ngưỡng độ rõ (clarity) và năng lượng (RMS) để bỏ khung
 * im lặng / nhiễu. Trả về `-1` khi không đủ tin cậy (im lặng, phụ âm xát…).
 *
 * @param {Float32Array|number[]} buf  mẫu tín hiệu miền thời gian, biên độ ~[-1,1]
 * @param {number} sampleRate          tần số lấy mẫu (vd 44100, 48000)
 * @param {{minHz?:number, maxHz?:number, rmsMin?:number, clarityMin?:number}} [opts]
 * @returns {number} tần số Hz, hoặc -1 nếu không đo được
 */
export function detectPitch(buf, sampleRate, opts = {}) {
  const minHz = opts.minHz ?? 70 // giọng người ~70–400 Hz khi nói
  const maxHz = opts.maxHz ?? 400
  const rmsMin = opts.rmsMin ?? 0.01
  const clarityMin = opts.clarityMin ?? 0.5

  const n = buf.length
  if (!n || !Number.isFinite(sampleRate) || sampleRate <= 0) return -1

  // Năng lượng đủ lớn mới xét (bỏ khung im lặng).
  let sumSq = 0
  for (let i = 0; i < n; i++) sumSq += buf[i] * buf[i]
  const rms = Math.sqrt(sumSq / n)
  if (rms < rmsMin) return -1

  // Chỉ dò trong khoảng lag hợp lệ ứng với minHz..maxHz.
  const maxLag = Math.min(n - 1, Math.floor(sampleRate / minHz))
  const minLag = Math.max(1, Math.floor(sampleRate / maxHz))

  let bestLag = -1
  let bestCorr = 0
  // Chuẩn hóa ACF theo năng lượng để có "độ rõ" 0..1 so ngưỡng ổn định.
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let i = 0; i < n - lag; i++) corr += buf[i] * buf[i + lag]
    const norm = corr / (sumSq || 1)
    if (norm > bestCorr) {
      bestCorr = norm
      bestLag = lag
    }
  }
  if (bestLag <= 0 || bestCorr < clarityMin) return -1

  // Nội suy parabol quanh đỉnh để tinh chỉnh lag (mượt hơn, chính xác hơn 1 mẫu).
  const refined = parabolicPeak(buf, bestLag, sumSq)
  const freq = sampleRate / refined
  if (freq < minHz || freq > maxHz) return -1
  return freq
}

/** Tinh chỉnh vị trí đỉnh ACF bằng nội suy parabol quanh `lag` (giảm lượng tử hóa). */
function parabolicPeak(buf, lag, sumSq) {
  const acf = (l) => {
    if (l < 1 || l >= buf.length) return 0
    let c = 0
    for (let i = 0; i < buf.length - l; i++) c += buf[i] * buf[i + l]
    return c / (sumSq || 1)
  }
  const a = acf(lag - 1)
  const b = acf(lag)
  const c = acf(lag + 1)
  const denom = a - 2 * b + c
  if (denom === 0) return lag
  const shift = (0.5 * (a - c)) / denom
  // Chỉ nhận chỉnh nhỏ (|shift|<1) để tránh nhảy sang đỉnh khác.
  return Math.abs(shift) < 1 ? lag + shift : lag
}

/** Khoảng cách nửa cung (semitone) giữa 2 tần số — thang cảm nhận cao độ tuyến tính. */
export function semitones(f1, f2) {
  if (!(f1 > 0) || !(f2 > 0)) return 0
  return 12 * Math.log2(f2 / f1)
}

/** Lấy trung vị của một mảng số (bỏ mảng rỗng -> 0). Dùng để chống nhiễu điểm lẻ. */
export function median(arr) {
  const a = arr.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y)
  if (!a.length) return 0
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

/**
 * Chuỗi cao độ thô (kèm điểm -1 khi im lặng) -> chuỗi Hz "hợp lệ" đã lọc, để vẽ
 * và phân loại. Bỏ điểm -1, cắt điểm lạc lõng (ngoài ±12 nửa cung so trung vị).
 */
export function cleanContour(series) {
  const valid = series.filter((f) => Number.isFinite(f) && f > 0)
  if (valid.length < 2) return valid
  const mid = median(valid)
  return valid.filter((f) => Math.abs(semitones(mid, f)) <= 12)
}

/**
 * Phân loại hướng ngữ điệu của một chuỗi cao độ: so trung vị 1/3 ĐẦU với 1/3
 * CUỐI câu. Chênh > `thresholdST` nửa cung -> 'rising'/'falling', còn lại 'flat'.
 * (Câu hỏi Yes/No thường lên ≥ ~2 nửa cung ở cuối; câu kể/WH đi xuống.)
 *
 * @param {number[]} series  chuỗi Hz (đã hoặc chưa lọc — hàm tự lọc)
 * @param {{thresholdST?:number}} [opts]
 * @returns {'rising'|'falling'|'flat'|'unknown'}
 */
export function contourDirection(series, opts = {}) {
  const thresholdST = opts.thresholdST ?? 1.5
  const c = cleanContour(series)
  if (c.length < 4) return 'unknown'
  const third = Math.max(1, Math.floor(c.length / 3))
  const head = median(c.slice(0, third))
  const tail = median(c.slice(-third))
  const diff = semitones(head, tail)
  if (diff >= thresholdST) return 'rising'
  if (diff <= -thresholdST) return 'falling'
  return 'flat'
}

/** Hướng ngữ điệu MẪU cho một loại câu (chuẩn dạy phát âm giao tiếp). */
export function expectedDirection(type) {
  return type === 'yesno' ? 'rising' : 'falling'
}

/**
 * Chấm một lần đọc so với ngữ điệu mẫu mong đợi. Trả về hướng đo được, có khớp
 * mẫu không, và chuỗi đã lọc (để vẽ). `ok` chỉ đúng khi hướng đo TRÙNG mẫu.
 *
 * @param {number[]} series  chuỗi Hz thô đo được khi người học đọc
 * @param {'yesno'|'statement'|'wh'} type  loại câu (quyết định mẫu)
 * @returns {{direction:string, expected:string, ok:boolean, points:number[]}}
 */
export function scoreIntonation(series, type) {
  const expected = expectedDirection(type)
  const direction = contourDirection(series)
  return { direction, expected, ok: direction === expected, points: cleanContour(series) }
}

/**
 * Chuẩn hóa chuỗi cao độ về tọa độ [0..1] để vẽ (0 = thấp nhất, 1 = cao nhất).
 * Trục Y trong SVG thường lộn ngược nên component tự lật; ở đây chỉ min-max.
 * Mảng < 2 điểm -> rỗng (không đủ để vẽ đường).
 */
export function normalizeForPlot(series) {
  const c = cleanContour(series)
  if (c.length < 2) return []
  const lo = Math.min(...c)
  const hi = Math.max(...c)
  const span = hi - lo || 1
  return c.map((f, i) => ({ x: i / (c.length - 1), y: (f - lo) / span }))
}

/** Trình duyệt có đủ Web Audio + getUserMedia để đo cao độ không? */
export function pitchSupported() {
  return (
    typeof window !== 'undefined' &&
    !!(window.AudioContext || window.webkitAudioContext) &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}
