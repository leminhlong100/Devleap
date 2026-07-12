/**
 * Nhận diện giọng nói (Speech-to-Text) bằng Web Speech API — có sẵn trong trình
 * duyệt (Chrome/Edge), miễn phí, không cần API ngoài. Dùng để học viên "nói"
 * tiếng Anh thay vì gõ, luyện phát âm + phản xạ giao tiếp.
 */
import { recognitionSupported } from './speechRecognize'
import { stopSpeaking } from './speak'

function getCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

/** Trình duyệt có hỗ trợ nhận diện giọng nói không? */
export function canListen() {
  return recognitionSupported()
}

/**
 * Tạo bộ nhận diện cho MỘT lượt nói (tự dừng khi học viên ngừng nói HẲN).
 *
 * QUAN TRỌNG: dùng `continuous = false`, KHÔNG bật `true`. Từng thử bật
 * `continuous = true` + tự đếm im lặng để câu dài không bị cắt giữa chừng khi
 * người nói ngắt hơi, nhưng đây là bug đã biết của Chrome (đặc biệt mobile):
 * mảng `results` phình vô hạn suốt phiên + engine có thể rơi vào vòng lặp nội
 * bộ khiến CẢ TAB ĐỨNG HẲN (không F5 được, phải mở tab mới) — nặng hơn nhiều
 * so với việc bị cắt sớm giữa câu. Giữ `false` để đổi lấy ổn định.
 * @param {{ lang?: string, silenceMs?: number, leadMs?: number,
 *           onResult?: (t:{final:string, interim:string})=>void,
 *           onError?: (err:string)=>void, onEnd?: (finalText:string)=>void }} opts
 * @returns {SpeechRecognition|null}
 */
export function createRecognizer({ lang = 'en-US', silenceMs = 3000, leadMs = 8000, onResult, onError, onEnd } = {}) {
  const Ctor = getCtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = true // cập nhật chữ ngay khi đang nói
  rec.continuous = false // xem cảnh báo ở JSDoc trên — continuous=true từng làm đứng cả tab
  rec.maxAlternatives = 1

  let finalText = ''
  let silenceTimer = null
  let stopped = false
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
        rec.stop()
      } catch {
        /* đã dừng */
      }
    }, ms)
  }

  rec.onresult = (e) => {
    // Chỉ xử lý các kết quả MỚI (từ e.resultIndex) — không duyệt lại toàn bộ
    // e.results từ đầu mỗi lần. Ở continuous=true, mảng results phình dần suốt
    // phiên nghe; nếu duyệt lại từ đầu mỗi sự kiện (bắn rất dày khi đang nói),
    // chi phí tăng dần theo thời gian nói -> nghẽn luồng chính, đứng cả trang.
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t
      else interim += t
    }
    onResult?.({ final: finalText.trim(), interim: interim.trim() })
    if (!stopped) armSilence() // còn tiếng nói -> đặt lại đồng hồ im lặng
  }
  rec.onerror = (e) => {
    clearSilence()
    onError?.(e.error || 'speech-error')
  }
  rec.onend = () => {
    clearSilence()
    onEnd?.(finalText.trim())
  }

  // Bọc start()/stop() để quản lý đồng hồ im lặng. leadMs: chờ rộng hơn cho lần
  // bắt đầu (chưa nói gì); có tiếng rồi mỗi onresult sẽ rút xuống silenceMs.
  const nativeStart = rec.start.bind(rec)
  const nativeStop = rec.stop.bind(rec)
  rec.start = () => {
    stopped = false
    // Dừng TTS đang đọc trước khi nghe — TTS + STT đồng thời làm đứng tab Chrome.
    stopSpeaking()
    nativeStart()
    armSilence(leadMs)
  }
  rec.stop = () => {
    stopped = true
    clearSilence()
    nativeStop()
  }

  return rec
}
