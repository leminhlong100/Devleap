/**
 * Nhận diện giọng nói (Speech-to-Text) bằng Web Speech API — có sẵn trong trình
 * duyệt (Chrome/Edge), miễn phí, không cần API ngoài. Dùng để học viên "nói"
 * tiếng Anh thay vì gõ, luyện phát âm + phản xạ giao tiếp.
 */
function getCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

/** Trình duyệt có hỗ trợ nhận diện giọng nói không? */
export function canListen() {
  return !!getCtor()
}

/**
 * Tạo bộ nhận diện cho MỘT lượt nói (tự dừng khi học viên ngừng nói).
 * @param {{ lang?: string, onResult?: (t:{final:string, interim:string})=>void,
 *           onError?: (err:string)=>void, onEnd?: (finalText:string)=>void }} opts
 * @returns {SpeechRecognition|null}
 */
export function createRecognizer({ lang = 'en-US', onResult, onError, onEnd } = {}) {
  const Ctor = getCtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = true // cập nhật chữ ngay khi đang nói
  rec.continuous = false
  rec.maxAlternatives = 1

  let finalText = ''
  rec.onresult = (e) => {
    let interim = ''
    finalText = ''
    for (let i = 0; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t
      else interim += t
    }
    onResult?.({ final: finalText.trim(), interim: interim.trim() })
  }
  rec.onerror = (e) => onError?.(e.error || 'speech-error')
  rec.onend = () => onEnd?.(finalText.trim())

  return rec
}
