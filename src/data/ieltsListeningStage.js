/**
 * Thang nghe "thật hóa dần" của khóa IELTS nền tảng — xem
 * docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục 3.5. Ba giai đoạn theo độ khó chất liệu
 * nghe, tăng dần qua từng cụm tuần thay vì ném người mới vào tốc độ thật ngay.
 */
const STAGES = {
  tts: {
    label: 'TTS chậm',
    goal: 'Nghe script viết sẵn, tốc độ chậm — quen âm/từ trước khi nghe giọng thật.',
  },
  semi: {
    label: 'Bán thực · 0.8–1.0x',
    goal: 'Nghe podcast/kênh cho người học tiếng Anh, tốc độ gần tự nhiên.',
  },
  native: {
    label: 'Clip gốc · tốc độ thường',
    goal: 'Nghe clip YouTube gốc, giọng đa dạng — mục tiêu hiểu ≥60% ý chính, không cần nghe hết từ.',
  },
}

/** Giai đoạn nghe của một tuần (1-8). Tuần ngoài khóa mặc định về 'tts'. */
export function listeningStageOf(week) {
  const w = Number(week)
  if (w >= 7) return 'native'
  if (w >= 4) return 'semi'
  return 'tts'
}

/** Thông tin hiển thị (label + mục tiêu) của giai đoạn nghe một tuần. */
export function listeningStageInfo(week) {
  return STAGES[listeningStageOf(week)]
}
