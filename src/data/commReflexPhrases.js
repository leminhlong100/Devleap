/**
 * Cụm "phản hồi trong lúc nghe" + tín hiệu luân phiên lượt lời — khóa Giao Tiếp
 * Thực Chiến (Đợt B — "Ứng biến & Tương tác thật", vá lỗ hổng #4 kế hoạch "Nói
 * Tự Tin").
 *
 * Vì sao cần: người mới nói tiếng Anh hay đứng hình khi *đang nghe* (không biết
 * thả gì để người kia biết mình còn theo dõi) và khi *chuyển lượt* (không biết
 * cách xin nói, nhường lời, hay câu giờ khi bí). Bốn nhóm dưới đây là bộ "keo dán
 * hội thoại" tối thiểu để nói nghe tự nhiên như người bản xứ:
 *
 *   - backchannel: thả nhẹ trong lúc NGHE để người kia biết bạn đang theo dõi.
 *   - hold:        giữ lượt / "câu giờ" khi cần vài giây suy nghĩ mà không im bặt.
 *   - yield:       nhường lượt — chủ động đẩy micro sang người kia.
 *   - take:        xin / giành lượt lịch sự khi bạn muốn chen vào nói.
 *
 * Dùng ở CommDayView.vue (thẻ tham chiếu bấm-để-đọc) — mỗi cụm { en, vi }.
 */
export const commReflexGroups = [
  {
    key: 'backchannel',
    icon: '👂',
    label: 'Phản hồi khi đang nghe',
    hint: 'Thả nhẹ trong lúc người kia nói để họ biết bạn đang theo dõi — không cần chờ tới lượt.',
    phrases: [
      { en: 'Right.', vi: 'Ừ, đúng vậy.' },
      { en: 'I see.', vi: 'Tôi hiểu rồi.' },
      { en: 'Uh-huh.', vi: 'Ừ hử (đang nghe đây).' },
      { en: 'Go on.', vi: 'Nói tiếp đi.' },
      { en: 'Oh really?', vi: 'Ồ thật à?' },
      { en: 'That makes sense.', vi: 'Nghe hợp lý đấy.' },
      { en: 'Exactly.', vi: 'Chính xác.' },
      { en: 'Got it.', vi: 'Hiểu rồi.' },
    ],
  },
  {
    key: 'hold',
    icon: '⏳',
    label: 'Giữ lượt (câu giờ)',
    hint: 'Khi cần vài giây suy nghĩ mà KHÔNG im bặt — giữ lượt nói của mình một cách tự nhiên.',
    phrases: [
      { en: 'Well, let me think…', vi: 'Ừm, để tôi nghĩ đã…' },
      { en: "That's a good question.", vi: 'Câu hỏi hay đấy.' },
      { en: 'How do I put this…', vi: 'Nói thế nào nhỉ…' },
      { en: 'Give me a second.', vi: 'Cho tôi một giây.' },
      { en: 'The thing is…', vi: 'Vấn đề là…' },
    ],
  },
  {
    key: 'yield',
    icon: '🔄',
    label: 'Nhường lượt',
    hint: 'Chủ động đẩy micro sang người kia — dấu hiệu rõ ràng rằng tới lượt họ.',
    phrases: [
      { en: 'What about you?', vi: 'Còn bạn thì sao?' },
      { en: 'What do you think?', vi: 'Bạn nghĩ sao?' },
      { en: 'Does that make sense?', vi: 'Vậy có hợp lý không?' },
      { en: "How about you? What's your take?", vi: 'Còn bạn? Bạn thấy thế nào?' },
      { en: 'Sorry, you were saying?', vi: 'Xin lỗi, bạn đang nói dở…?' },
    ],
  },
  {
    key: 'take',
    icon: '✋',
    label: 'Xin / giành lượt',
    hint: 'Chen vào lịch sự khi bạn muốn nói — không cắt lời thô, mà báo hiệu trước.',
    phrases: [
      { en: 'Can I add something?', vi: 'Cho tôi bổ sung một chút được không?' },
      { en: 'Actually, I think…', vi: 'Thật ra, tôi nghĩ là…' },
      { en: 'Just to jump in here…', vi: 'Cho tôi xen vào một chút…' },
      { en: 'If I could say something…', vi: 'Nếu tôi được nói một câu…' },
      { en: 'Sorry to interrupt, but…', vi: 'Xin lỗi cắt ngang, nhưng…' },
    ],
  },
]

/** Toàn bộ cụm (chỉ tiếng Anh) — tiện cho gợi ý/kiểm thử. */
export function flatReflexPhrases() {
  return commReflexGroups.flatMap((g) => g.phrases.map((p) => p.en))
}
