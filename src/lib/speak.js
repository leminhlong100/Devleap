/**
 * Phát âm từ vựng bằng Web Speech API (SpeechSynthesis) — có sẵn trong trình
 * duyệt, không cần file âm thanh hay API ngoài. Tự chọn giọng tiếng Anh nếu có.
 */
let cachedVoice = null
let voiceResolved = false

function pickEnglishVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // Ưu tiên giọng Anh-Mỹ / Anh-Anh, sau đó bất kỳ giọng en-* nào.
  return (
    voices.find((v) => /^en[-_](US|GB)/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null
  )
}

/** Trình duyệt có hỗ trợ đọc phát âm không? */
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/**
 * Đọc to một từ / cụm từ tiếng Anh. Tự hủy lần đọc trước để không chồng tiếng.
 * @param {string} text
 * @param {number} rate tốc độ đọc (mặc định hơi chậm để dễ nghe)
 */
export function speak(text, rate = 0.9) {
  if (!canSpeak() || !text) return
  const synth = window.speechSynthesis
  synth.cancel() // dừng câu đang đọc dở (nếu có)

  if (!voiceResolved) {
    cachedVoice = pickEnglishVoice()
    if (cachedVoice) voiceResolved = true
  }

  const u = new SpeechSynthesisUtterance(String(text))
  u.lang = cachedVoice?.lang || 'en-US'
  if (cachedVoice) u.voice = cachedVoice
  u.rate = rate
  u.pitch = 1
  synth.speak(u)
}

// Danh sách giọng có thể nạp bất đồng bộ; lắng nghe để cập nhật khi sẵn sàng.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = pickEnglishVoice()
    voiceResolved = !!cachedVoice
  }
}
