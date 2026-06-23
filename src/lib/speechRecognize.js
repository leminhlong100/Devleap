/**
 * Bọc Web Speech API (SpeechRecognition) để nhận dạng MỘT lần nói.
 * Chỉ chạy trên trình duyệt hỗ trợ (Chrome/Edge); Firefox/Safari cũ thì không.
 */

function getSR() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function recognitionSupported() {
  return !!getSR()
}

/**
 * Bắt đầu nghe một câu. Trả về { promise, stop }.
 * - promise resolve bằng chuỗi văn bản nhận dạng được (có thể rỗng nếu không nghe rõ).
 * - stop() dừng nghe sớm (kết thúc câu nhanh hơn chờ im lặng).
 */
export function recognizeOnce({ lang = 'en-US' } = {}) {
  const SR = getSR()
  let rec = null
  const promise = new Promise((resolve, reject) => {
    if (!SR) {
      reject(new Error('unsupported'))
      return
    }
    rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false
    let transcript = ''
    rec.onresult = (e) => {
      transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript || '')
        .join(' ')
        .trim()
    }
    rec.onerror = (e) => reject(new Error(e.error || 'speech-error'))
    rec.onend = () => resolve(transcript)
    try {
      rec.start()
    } catch (err) {
      reject(err)
    }
  })
  return {
    promise,
    stop: () => {
      try {
        rec?.stop()
      } catch {
        /* đã dừng */
      }
    },
  }
}
