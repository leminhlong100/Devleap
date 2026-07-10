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
 * Thang tốc độ Listening tăng dần theo tuần (docs/KE_HOACH_DO_KHO_KHOA_HOC.md mục 3):
 * Tuần 1–2 ~100 WPM (TTS chậm) -> Tuần 3–4 ~120 -> Tuần 5–6 ~140 -> Tuần 7–8 ~150–160
 * (tốc độ tự nhiên). `rate` của Web Speech API là hệ số tương đối (1.0 = giọng mặc định
 * của trình duyệt), nên đây là quy đổi GẦN ĐÚNG, không phải WPM chính xác tuyệt đối.
 */
const WEEK_RATE = [0.72, 0.72, 0.82, 0.82, 0.92, 0.92, 1, 1]

/** Tốc độ đọc cơ bản cho một tuần (1–8); tuần ngoài khoảng -> lấy mốc gần nhất. */
export function wpmRateForWeek(week) {
  const n = Number(week)
  if (!Number.isFinite(n) || n < 1) return WEEK_RATE[0]
  return WEEK_RATE[Math.min(n, WEEK_RATE.length) - 1]
}

/**
 * Đọc to một từ / cụm từ tiếng Anh. Tự hủy lần đọc trước để không chồng tiếng.
 * Bọc try/catch: một số máy dùng giọng TTS tải qua mạng (offline → phát lỗi),
 * hoặc trình duyệt chặn `speak()` khi chưa có tương tác người dùng — thay vì để
 * ngoại lệ nổi lên làm hỏng luồng, nuốt lỗi và trả `false` để nơi gọi (nếu cần)
 * hiển thị thông báo nhẹ. Trả `true` khi đã phát được lệnh đọc.
 * @param {string} text
 * @param {number} rate tốc độ đọc (mặc định hơi chậm để dễ nghe)
 * @returns {boolean}
 */
export function speak(text, rate = 0.9) {
  if (!canSpeak() || !text) return false
  try {
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
    return true
  } catch {
    return false
  }
}

// Danh sách giọng có thể nạp bất đồng bộ; lắng nghe để cập nhật khi sẵn sàng.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = pickEnglishVoice()
    voiceResolved = !!cachedVoice
  }
}
