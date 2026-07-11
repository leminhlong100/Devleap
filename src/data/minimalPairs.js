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
  // —— Nhóm "giao tiếp" — lỗi phụ âm ĐẦU người Việt hay lẫn, đổi hẳn nghĩa khi
  // nói (dùng cho COMM_WEEK_FOCUS khóa Giao Tiếp Thực Chiến). ——
  {
    key: 'sh-s',
    label: 'Âm đầu /ʃ/ (she) vs /s/ (see)',
    tip: 'sh chu môi tròn, đẩy hơi dài; s dẹt môi, hơi ngắn — “she” và “see” là hai từ khác hẳn.',
    pairs: [
      ['she', 'see'],
      ['sheet', 'seat'],
      ['shoe', 'sue'],
      ['show', 'so'],
      ['shock', 'sock'],
      ['shine', 'sign'],
      ['shave', 'save'],
      ['sheep', 'seep'],
    ],
  },
  {
    key: 'b-p',
    label: 'Âm đầu /b/ (bad) vs /p/ (pad)',
    tip: 'p bật hơi mạnh (để tay trước miệng thấy luồng hơi), b không bật hơi — “big” không phải “pig”.',
    pairs: [
      ['bad', 'pad'],
      ['big', 'pig'],
      ['back', 'pack'],
      ['bin', 'pin'],
      ['bear', 'pear'],
      ['ban', 'pan'],
      ['bull', 'pull'],
      ['best', 'pest'],
    ],
  },
  {
    key: 'l-n',
    label: 'Âm đầu /l/ (light) vs /n/ (night)',
    tip: 'l đặt đầu lưỡi sau răng trên rồi hạ xuống; n để hơi thoát qua mũi — “light” khác hẳn “night”.',
    pairs: [
      ['light', 'night'],
      ['lot', 'not'],
      ['low', 'no'],
      ['line', 'nine'],
      ['let', 'net'],
      ['lap', 'nap'],
      ['lame', 'name'],
      ['lead', 'need'],
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

// Trọng tâm phát âm THEO TUẦN cho khóa "Giao Tiếp Thực Chiến" — độc lập với
// WEEK_FOCUS (khóa Nền Tảng bám ngữ pháp), phủ đủ Tuần 1–8 và ưu tiên các lỗi
// người Việt hay mắc mà ẢNH HƯỞNG NGHĨA khi nói (kế hoạch "Nói Tự Tin", Trục A):
// âm cuối (T1-2) → th (T3) → sh/s (T4) → b/p (T5) → l/n (T6) → dài-ngắn (T7) →
// tổng hợp khó (T8). Bám khối: Khối 1 = âm cuối, Khối 2-3 = phụ âm khó, Khối 4 = nguyên âm/tổng hợp.
export const COMM_WEEK_FOCUS = {
  1: ['plural-s'],
  2: ['ed'],
  3: ['th'],
  4: ['sh-s'],
  5: ['b-p'],
  6: ['l-n'],
  7: ['vowel-i'],
  8: ['vowel-ae', 'finalCons'],
}

function norm(s) {
  return String(s || '').trim().toLowerCase()
}

/**
 * Nhóm trọng tâm của 1 tuần — dùng để hiện tiêu đề "Tuần này: ...".
 * @param {number|string} week
 * @param {string} course  'comm' -> dùng COMM_WEEK_FOCUS (phủ Tuần 1–8); else WEEK_FOCUS (Tuần 2–8, kẹp về nhóm gần nhất).
 * @param {string[]} priorityKeys  Nếu có (remediation cá nhân hóa theo confusions
 *   THẬT của học viên — kế hoạch cải tiến #8): dùng ĐÚNG các nhóm này thay cho lịch
 *   tuần cứng, để "vá" âm học viên hay lẫn thật sự. Bỏ qua key không tồn tại.
 */
export function focusForWeek(week, course = '', priorityKeys = []) {
  const priority = (Array.isArray(priorityKeys) ? priorityKeys : [])
    .map((k) => GROUP_BY_KEY[k])
    .filter(Boolean)
  if (priority.length) {
    // Dedup giữ thứ tự (nhóm hay lẫn nhất lên trước).
    const seen = new Set()
    return priority.filter((g) => (seen.has(g.key) ? false : seen.add(g.key)))
  }
  if (course === 'comm') {
    const w = Math.min(8, Math.max(1, Number(week) || 1))
    const keys = COMM_WEEK_FOCUS[w] || ['plural-s']
    return keys.map((k) => GROUP_BY_KEY[k]).filter(Boolean)
  }
  const w = Math.min(8, Math.max(2, Number(week) || 2))
  const keys = WEEK_FOCUS[w] || ['plural-s']
  return keys.map((k) => GROUP_BY_KEY[k]).filter(Boolean)
}

/**
 * Chọn 8 cặp tối thiểu cho 1 tuần, ưu tiên cặp có từ TRÙNG với từ vựng đã học
 * trong tuần (learnedTerms) để gắn luyện phát âm với từ vừa học. Không lặp
 * cặp trong cùng 1 lần chọn. Xác định (không dùng random) để test được.
 * @param {number|string} week
 * @param {string[]} learnedTerms
 * @param {string} course  chuyển tiếp cho focusForWeek ('comm' cho khóa Giao Tiếp).
 * @param {string[]} priorityKeys  Nhóm âm remediation (confusions thật) — nếu có,
 *   thay cho lịch tuần cứng (kế hoạch cải tiến #8).
 * @returns {{groupKey,groupLabel,tip,pairs,pairGroups}} `pairGroups[i]` = key nhóm
 *   của `pairs[i]` (để quy lỗi "nghe nhầm" về đúng nhóm âm khi track confusions).
 */
export function pairsForWeek(week, learnedTerms = [], course = '', priorityKeys = []) {
  const groups = focusForWeek(week, course, priorityKeys)
  const learned = new Set((learnedTerms || []).map(norm))
  // Giữ nhãn nhóm đi kèm từng cặp để quy lỗi về đúng nhóm âm.
  const all = groups.flatMap((g) => g.pairs.map((pair) => ({ pair, group: g.key })))
  const matched = []
  const rest = []
  for (const item of all) {
    const hit = item.pair.some((w) => learned.has(norm(w)))
    ;(hit ? matched : rest).push(item)
  }
  const ordered = [...matched, ...rest].slice(0, 8)
  return {
    groupKey: groups.map((g) => g.key).join('+'),
    groupLabel: groups.map((g) => g.label).join(' · '),
    tip: groups[0]?.tip || '',
    pairs: ordered.map((it) => it.pair),
    pairGroups: ordered.map((it) => it.group),
  }
}
