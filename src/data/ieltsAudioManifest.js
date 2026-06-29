/**
 * MANIFEST AUDIO LISTENING (giọng thu/sinh sẵn) cho khóa IELTS nền tảng.
 *
 * Vì sao tách file: bài nghe mặc định phát bằng Web Speech API của trình duyệt —
 * tiện nhưng giọng không ổn định giữa các máy và khó tin cho bài đánh vần tên
 * (Carter/Carver). Khi có bản mp3 (sinh bằng Edge Neural TTS qua `npm run gen:audio`,
 * hoặc thu giọng người thật), đường dẫn được liệt kê ở đây và `getIeltsInput` sẽ
 * tự gắn vào `listening.audioUrl` → component ưu tiên phát file.
 *
 * Khóa theo `${week}:${day}`; giá trị là đường dẫn TĨNH (đặt trong public/, phục vụ
 * tại gốc). Buổi nào KHÔNG có khóa ở đây → audioUrl vẫn null → fallback Web Speech.
 *
 * File này được `scripts/gen-ielts-audio.mjs` GHI ĐÈ sau khi sinh xong các mp3.
 * Có thể sửa tay để trỏ tới bản thu giọng thật (vd '/audio/ielts/1-1.mp3').
 */
export const ieltsAudioManifest = {
  // '1:1': '/audio/ielts/1-1.mp3',
}
