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
 * - silenceMs: thời gian im lặng (ms) trước khi tự dừng. Đặt continuous = true để
 *   không bị cắt ngay khi ngắt hơi giữa câu, rồi tự đếm im lặng dài hơn để dừng.
 */
export function recognizeOnce({ lang = 'en-US', silenceMs = 1500, leadMs = 5000 } = {}) {
  const SR = getSR()
  let rec = null
  let silenceTimer = null
  const promise = new Promise((resolve, reject) => {
    if (!SR) {
      reject(new Error('unsupported'))
      return
    }
    rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    // continuous = true: không tự dừng khi người dùng ngắt nghỉ ngắn giữa câu.
    // Thay vào đó ta tự đếm im lặng (silenceMs) — nói xong nghỉ đủ lâu mới dừng,
    // nên câu dài có chỗ ngắt hơi vẫn thu trọn vẹn thay vì bị cắt giữa chừng.
    rec.continuous = true
    let transcript = ''
    const clearSilence = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
    }
    const armSilence = (ms = silenceMs) => {
      clearSilence()
      silenceTimer = setTimeout(() => {
        try {
          rec?.stop()
        } catch {
          /* đã dừng */
        }
      }, ms)
    }
    rec.onresult = (e) => {
      transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript || '')
        .join(' ')
        .trim()
      armSilence() // có tiếng nói mới -> đặt lại đồng hồ im lặng
    }
    rec.onerror = (e) => {
      clearSilence()
      reject(new Error(e.error || 'speech-error'))
    }
    rec.onend = () => {
      clearSilence()
      resolve(transcript)
    }
    try {
      rec.start()
      armSilence(leadMs) // chờ rộng hơn cho lần bắt đầu nói; có tiếng rồi mới đếm silenceMs
    } catch (err) {
      reject(err)
    }
  })
  return {
    promise,
    stop: () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
      try {
        rec?.stop()
      } catch {
        /* đã dừng */
      }
    },
  }
}
