// Cặp tối thiểu (minimal pairs) cho luyện phát âm — PronunciationDrill.vue.
// Mỗi cặp là [từ A, từ B] mà người Việt hay lẫn khi nói/nghe; chấm bằng cách
// đối chiếu Web Speech API với TỪ THỨ HAI trong cặp (xem giải thích trong
// PronunciationDrill.vue) nên các cặp phải là 2 TỪ THẬT khác nhau, đủ gần âm
// để luyện đúng lỗi nhưng đủ khác để ASR phân biệt được khi đọc đúng.
//
// Nhóm theo trọng tâm âm, gán theo tuần (assignFocusForWeek) khớp với ngữ pháp
// tuần đó trong Base_English/*.md (cả 2 track): Tuần 2 số ít/nhiều, Tuần 3
// present simple ngôi 3, Tuần 4 quá khứ đơn -ed. Tuần 5-7 không có điểm ngữ
// pháp gắn trực tiếp với 1 âm cụ thể nên xếp theo độ khó tăng dần (nguyên âm
// nền tảng trước, phụ âm khó "th" sau). Tuần 8 tổng hợp nhóm khó nhất.
export const MINIMAL_PAIR_GROUPS = [
  {
    key: 'plural-s',
    label: 'Âm cuối -s/-z (số nhiều)',
    tip: 'Đẩy nhẹ hơi ở cuối từ để nghe rõ "-s" — đừng nuốt mất nó.',
    pairs: [
      ['cat', 'cats'],
      ['dog', 'dogs'],
      ['book', 'books'],
      ['idea', 'ideas'],
      ['plan', 'plans'],
      ['friend', 'friends'],
      ['key', 'keys'],
      ['bag', 'bags'],
      ['phone', 'phones'],
    ],
  },
  {
    key: 'verb-s',
    label: 'Âm cuối -s/-z (ngôi thứ 3 số ít)',
    tip: 'Chủ ngữ he/she/it luôn cần "-s/-es" ở cuối động từ — không được bỏ qua.',
    pairs: [
      ['work', 'works'],
      ['need', 'needs'],
      ['look', 'looks'],
      ['live', 'lives'],
      ['study', 'studies'],
      ['like', 'likes'],
      ['want', 'wants'],
      ['ask', 'asks'],
      ['help', 'helps'],
    ],
  },
  {
    key: 'ed',
    label: 'Âm cuối -ed (quá khứ đơn)',
    tip: 'Chú ý 3 cách đọc -ed: /t/ (watched), /d/ (played), /ɪd/ (started) — đừng đọc thành "-ed" như 1 âm tiết thừa.',
    pairs: [
      ['play', 'played'],
      ['watch', 'watched'],
      ['walk', 'walked'],
      ['start', 'started'],
      ['finish', 'finished'],
      ['visit', 'visited'],
      ['use', 'used'],
      ['ask', 'asked'],
      ['help', 'helped'],
    ],
  },
  {
    key: 'vowel-i',
    label: 'Nguyên âm ngắn i /ɪ/ vs dài iː',
    tip: 'i ngắn (ship) bật nhanh, miệng mở hơn; iː dài (sheep) kéo dài, miệng hẹp hơn.',
    pairs: [
      ['ship', 'sheep'],
      ['fill', 'feel'],
      ['sit', 'seat'],
      ['live', 'leave'],
      ['chip', 'cheap'],
      ['hit', 'heat'],
      ['bit', 'beat'],
      ['sick', 'seek'],
      ['rich', 'reach'],
    ],
  },
  {
    key: 'vowel-ae',
    label: 'Nguyên âm æ (bad) vs e (bed)',
    tip: 'æ mở miệng rộng hơn và kéo dài hơn "e" một chút — 2 âm người Việt hay đọc giống nhau.',
    pairs: [
      ['bad', 'bed'],
      ['man', 'men'],
      ['sad', 'said'],
      ['bag', 'beg'],
      ['land', 'lend'],
      ['sand', 'send'],
      ['pan', 'pen'],
      ['tan', 'ten'],
    ],
  },
  {
    key: 'th',
    label: 'Âm th (đưa lưỡi ra giữa 2 hàm răng)',
    tip: 'Đặt đầu lưỡi giữa 2 hàm răng và đẩy hơi ra — không phát âm "th" thành "t" hay "s".',
    pairs: [
      ['think', 'sink'],
      ['thick', 'sick'],
      ['thumb', 'sum'],
      ['mouth', 'mouse'],
      ['thing', 'sing'],
      ['thin', 'tin'],
      ['thank', 'tank'],
      ['three', 'tree'],
      ['path', 'pat'],
    ],
  },
  {
    key: 'finalCons',
    label: 'Phụ âm cuối dễ lẫn (t/d, k/g, l/n, -st/-sk)',
    tip: 'Đọc dứt khoát phụ âm cuối cùng — 1 âm khác ở cuối từ đổi hẳn nghĩa của từ.',
    pairs: [
      ['bat', 'bad'],
      ['seat', 'seed'],
      ['wait', 'wade'],
      ['cart', 'card'],
      ['light', 'lied'],
      ['back', 'bag'],
      ['lock', 'log'],
      ['pick', 'pig'],
      ['duck', 'dug'],
      ['will', 'win'],
      ['fill', 'fin'],
      ['tell', 'ten'],
      ['meal', 'mean'],
      ['mask', 'mast'],
      ['risk', 'wrist'],
    ],
  },
]

const GROUP_BY_KEY = Object.fromEntries(MINIMAL_PAIR_GROUPS.map((g) => [g.key, g]))

// Tuần -> nhóm trọng tâm (mảng nhiều key = trộn nhiều nhóm, dùng cho tuần tổng hợp).
export const WEEK_FOCUS = {
  2: ['plural-s'],
  3: ['verb-s'],
  4: ['ed'],
  5: ['vowel-i'],
  6: ['vowel-ae'],
  7: ['th'],
  8: ['th', 'finalCons'],
}

function norm(s) {
  return String(s || '').trim().toLowerCase()
}

/** Nhóm trọng tâm của 1 tuần — dùng để hiện tiêu đề "Tuần này: ...". Tuần <2 hoặc >8 dùng nhóm gần nhất. */
export function focusForWeek(week) {
  const w = Math.min(8, Math.max(2, Number(week) || 2))
  const keys = WEEK_FOCUS[w] || ['plural-s']
  return keys.map((k) => GROUP_BY_KEY[k]).filter(Boolean)
}

/**
 * Chọn 8 cặp tối thiểu cho 1 tuần, ưu tiên cặp có từ TRÙNG với từ vựng đã học
 * trong tuần (learnedTerms) để gắn luyện phát âm với từ vừa học. Không lặp
 * cặp trong cùng 1 lần chọn. Xác định (không dùng random) để test được.
 */
export function pairsForWeek(week, learnedTerms = []) {
  const groups = focusForWeek(week)
  const learned = new Set((learnedTerms || []).map(norm))
  const all = groups.flatMap((g) => g.pairs)
  const matched = []
  const rest = []
  for (const pair of all) {
    const hit = pair.some((w) => learned.has(norm(w)))
    ;(hit ? matched : rest).push(pair)
  }
  const ordered = [...matched, ...rest].slice(0, 8)
  return {
    groupKey: groups.map((g) => g.key).join('+'),
    groupLabel: groups.map((g) => g.label).join(' · '),
    tip: groups[0]?.tip || '',
    pairs: ordered,
  }
}
