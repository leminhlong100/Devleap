/**
 * Bọc Web Speech API (SpeechRecognition) để nhận dạng MỘT lần nói.
 * Chỉ chạy trên trình duyệt hỗ trợ (Chrome/Edge); Firefox/Safari cũ thì không.
 */
import { canSpeak, stopSpeaking } from './speak'

function getSR() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function recognitionSupported() {
  return !!getSR()
}

/**
 * Trạng thái hỗ trợ Web Speech API của trình duyệt — tách riêng recognition
 * (nghe thành chữ, KHÔNG có trên Safari/iOS) và synthesis (đọc to, Safari/iOS
 * vẫn có) vì 2 khả năng độc lập nhau, không suy ra được cái này từ cái kia.
 */
export function speechSupport() {
  return { recognition: recognitionSupported(), synthesis: canSpeak() }
}

/**
 * Bắt đầu nghe một câu. Trả về { promise, stop }.
 * - promise resolve bằng chuỗi văn bản nhận dạng được (có thể rỗng nếu không nghe rõ).
 * - stop() dừng nghe sớm (kết thúc câu nhanh hơn chờ im lặng).
 * - silenceMs: thời gian im lặng (ms) trước khi tự dừng.
 * QUAN TRỌNG: `continuous = false` — KHÔNG bật `true`. Đây là bug đã biết của
 * Chrome (đặc biệt mobile): mảng results phình vô hạn + engine có thể rơi vào
 * vòng lặp nội bộ khiến CẢ TAB ĐỨNG HẲN (không F5 được). Xem cảnh báo tương tự
 * ở lib/listen.js.
 */
export function recognizeOnce({ lang = 'en-US', silenceMs = 1500, leadMs = 5000 } = {}) {
  const SR = getSR()
  let rec = null
  let silenceTimer = null
  let hardTimer = null
  const clearHard = () => {
    if (hardTimer) {
      clearTimeout(hardTimer)
      hardTimer = null
    }
  }
  const promise = new Promise((resolve, reject) => {
    if (!SR) {
      reject(new Error('unsupported'))
      return
    }
    // Dừng mọi TTS đang đọc TRƯỚC khi nghe — chạy đồng thời TTS + STT là nguyên
    // nhân đã biết làm đứng cả tab trên Chrome (trang này vừa có 🔊 vừa có 🎤).
    stopSpeaking()
    rec = new SR()
    rec.lang = lang
    // interimResults = true: nhận cả kết quả tạm (từng từ đang nói) để reset đồng
    // hồ im lặng liên tục khi đọc chậm — không bị tự dừng giữa câu dài.
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = false // xem cảnh báo ở JSDoc trên — continuous=true từng làm đứng cả tab
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
      // Chỉ xử lý kết quả MỚI (từ e.resultIndex), không duyệt lại toàn bộ e.results
      // từ đầu mỗi sự kiện — ở continuous=true mảng results phình dần suốt phiên
      // nghe và sự kiện bắn rất dày, duyệt lại từ đầu mỗi lần sẽ nghẽn luồng chính.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = (e.results[i][0]?.transcript || '').trim()
          if (t) transcript = transcript ? `${transcript} ${t}` : t
        }
      }
      armSilence() // có tiếng nói (kể cả tạm) -> đặt lại đồng hồ im lặng
    }
    rec.onerror = (e) => {
      clearSilence()
      clearHard()
      reject(new Error(e.error || 'speech-error'))
    }
    rec.onend = () => {
      clearSilence()
      clearHard()
      resolve(transcript)
    }
    try {
      rec.start()
      armSilence(leadMs) // chờ rộng hơn cho lần bắt đầu nói; có tiếng rồi mới đếm silenceMs
      // Chốt chặn cuối: nếu engine không bao giờ onend/onerror (bị treo im lặng),
      // vẫn buộc dừng + kết thúc để UI không kẹt ở trạng thái "Đang nghe…" mãi.
      hardTimer = setTimeout(() => {
        try {
          rec?.stop()
        } catch {
          /* đã dừng */
        }
        resolve(transcript)
      }, leadMs + silenceMs + 5000)
    } catch (err) {
      clearSilence()
      clearHard()
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
      clearHard()
      try {
        rec?.stop()
      } catch {
        /* đã dừng */
      }
    },
  }
}
