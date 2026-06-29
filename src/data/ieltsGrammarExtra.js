/**
 * BÀI TẬP NGỮ PHÁP BIÊN SOẠN THÊM — bổ sung cho phần auto-sinh từ markdown.
 *
 * Vì sao cần: một số điểm ngữ pháp (vd "Sentence Backbone") có ít bảng lỗi và
 * ít câu mẫu chứa "từ ngữ pháp an toàn" để khoét chỗ trống, nên auto chỉ ra 3–4
 * câu — cổng ≥70% gần như "được/trượt" theo một câu. File này thêm câu chất lượng
 * để mỗi buổi học mới có 6–10 câu, cổng mới thực sự có ý nghĩa.
 *
 * Khóa theo `${weekNum}` -> { '<tiêu đề điểm ngữ pháp khớp md>': [drill, ...] }.
 * Drill dùng đúng định dạng QuizTool:
 *   - cloze: { type:'cloze', q:'… _____ …', answer:[các đáp án chấp nhận], ex }
 *   - error: { type:'error', q:'câu sai', answer:['câu đúng'], ex }
 * Gộp ở courseIelts (dedup theo câu hỏi, cắt tối đa 10).
 */

export const ieltsGrammarExtra = {
  1: {
    'Sentence Backbone — Xương sống của câu': [
      { type: 'error', q: 'He happy today.', answer: ['He is happy today.'], ex: 'Câu cần động từ. Mô tả trạng thái dùng "be": He is happy today.' },
      { type: 'cloze', q: 'My sister _____ a doctor.', answer: ['is'], ex: 'Mô tả danh tính cần "be": My sister is a doctor.' },
      { type: 'error', q: 'In my school have a big library.', answer: ['There is a big library in my school.'], ex: 'Diễn đạt "có…" bằng "There is/are…", không dùng "have".' },
      { type: 'error', q: 'I like very much coffee.', answer: ['I like coffee very much.'], ex: 'Trật tự đúng: V + O + (very much): I like coffee very much.' },
    ],
    'Be — Động từ dễ bị bỏ quên nhất': [
      { type: 'cloze', q: 'The students _____ in the classroom now.', answer: ['are'], ex: 'Chủ ngữ số nhiều "The students" → are.' },
      { type: 'error', q: 'My mother a nurse.', answer: ['My mother is a nurse.'], ex: 'Thiếu "be": My mother is a nurse.' },
    ],
    'Do, Does và Did': [
      // —— Phân biệt be ↔ động từ thường: lỗi #1 của người Việt ("I am study", "Do you are…").
      // Đặt LÊN ĐẦU để được ưu tiên giữ khi gộp (cổng cắt còn ≤10 câu/điểm). ——
      { type: 'error', q: 'I am study English every day.', answer: ['I study English every day.'], ex: 'Động từ hành động "study" KHÔNG đi với "am". Đúng: I study English every day. (Chỉ dùng "be" với danh từ/tính từ/nơi chốn.)' },
      { type: 'error', q: 'Do you are a student?', answer: ['Are you a student?'], ex: 'Sau danh từ/tính từ dùng "be": câu hỏi là "Are you…?", không phải "Do you are…?".' },
      { type: 'error', q: 'She is work at a hospital.', answer: ['She works at a hospital.'], ex: '"work" là động từ hành động → bỏ "is": She works at a hospital.' },
      { type: 'error', q: 'Are you have a car?', answer: ['Do you have a car?'], ex: '"have" là động từ thường → hỏi bằng "Do", không dùng "Are": Do you have a car?' },
      { type: 'cloze', q: '_____ you a student? — Yes, I am.', answer: ['Are'], ex: 'Trả lời "I am" → câu hỏi dùng "be": Are you a student?' },
      { type: 'cloze', q: '_____ you study every day? — Yes, I do.', answer: ['Do'], ex: 'Trả lời "I do" → câu hỏi dùng trợ động từ: Do you study every day?' },
      { type: 'cloze', q: '_____ your brother work in a bank?', answer: ['Does'], ex: 'Chủ ngữ số ít "your brother" → Does … work?' },
      { type: 'error', q: 'She do not like tea.', answer: ["She does not like tea.", "She doesn't like tea."], ex: 'Chủ ngữ số ít → does not / doesn’t.' },
    ],
  },
  2: {
    'Câu phải có động từ — Chủ ngữ hợp động từ': [
      // —— Lỗi #1 của người Việt: quên động từ "be" + sai hòa hợp chủ ngữ–động từ + thiếu "s". ——
      { type: 'error', q: 'My mother very patient.', answer: ['My mother is very patient.'], ex: 'Thiếu động từ "be": My mother is very patient.' },
      { type: 'error', q: 'Student need to review regularly.', answer: ['Students need to review regularly.', 'A student needs to review regularly.'], ex: 'Số nhiều cần "s": Students need…; hoặc số ít: A student needs…' },
      { type: 'error', q: 'She like music very much.', answer: ['She likes music very much.'], ex: 'Chủ ngữ số ít "she" → động từ thêm "s": She likes music.' },
      { type: 'cloze', q: 'Many students _____ afraid of speaking.', answer: ['are'], ex: 'Chủ ngữ số nhiều "many students" → are.' },
      { type: 'cloze', q: 'Learning English _____ a long journey.', answer: ['is'], ex: 'Chủ ngữ "Learning English" (số ít) → is.' },
      { type: 'error', q: 'I am go to school every day.', answer: ['I go to school every day.'], ex: 'Động từ hành động "go" không đi với "am": I go to school every day.' },
    ],
    'Countable và Uncountable': [
      // —— Lỗi #1: "many + danh từ không đếm được". Đặt LÊN ĐẦU để được ưu tiên khi gộp. ——
      { type: 'error', q: 'I have many homework.', answer: ['I have a lot of homework.', 'I have much homework.'], ex: '"homework" không đếm được → dùng "a lot of"/"much", không dùng "many".' },
      { type: 'error', q: 'She gave me two advice.', answer: ['She gave me two pieces of advice.'], ex: '"advice" không đếm được → đếm bằng "pieces of advice", không thêm "s".' },
      { type: 'cloze', q: 'I do not have _____ free time. (much/many)', answer: ['much'], ex: '"free time" không đếm được → "much".' },
      { type: 'cloze', q: 'How _____ books do you read each month? (much/many)', answer: ['many'], ex: '"books" đếm được số nhiều → "many".' },
      { type: 'cloze', q: 'There is a lot of _____ on this website. (information/informations)', answer: ['information'], ex: '"information" không đếm được → không thêm "s".' },
      { type: 'error', q: 'There is many students in my class.', answer: ['There are many students in my class.'], ex: '"many students" số nhiều → "There are".' },
    ],
  },
  3: {
    'Present Simple': [
      // —— Lỗi #1 của người Việt: quên "s" với he/she/it, dùng don't thay doesn't,
      // và đặt sai vị trí trạng từ tần suất. Đặt LÊN ĐẦU để được ưu tiên khi gộp. ——
      { type: 'error', q: 'She study English after dinner.', answer: ['She studies English after dinner.'], ex: 'Chủ ngữ he/she/it → động từ thêm s/es: She studies English after dinner.' },
      { type: 'error', q: "He don't like tea.", answer: ["He doesn't like tea.", 'He does not like tea.'], ex: 'he/she/it phủ định dùng doesn’t + V nguyên thể: He doesn’t like tea.' },
      { type: 'error', q: 'I am go to school by bus.', answer: ['I go to school by bus.'], ex: 'Động từ hành động "go" không đi với "am": I go to school by bus.' },
      { type: 'error', q: 'I go usually to school by bus.', answer: ['I usually go to school by bus.'], ex: 'Trạng từ tần suất đứng TRƯỚC động từ thường: I usually go to school by bus.' },
      { type: 'cloze', q: 'My school _____ at seven a.m. (start)', answer: ['starts'], ex: 'Chủ ngữ số ít "My school" → starts.' },
      { type: 'cloze', q: 'I _____ review vocabulary at night. (trạng từ tần suất: usually)', answer: ['usually'], ex: 'usually đứng trước động từ thường: I usually review vocabulary at night.' },
      { type: 'cloze', q: 'Many students _____ nervous when they speak English. (be)', answer: ['are'], ex: 'Chủ ngữ số nhiều "Many students" → are.' },
    ],
    'Questions': [
      // —— Lỗi #1: thiếu do/does trong câu hỏi, dùng do với "be", does + V-s. ——
      { type: 'error', q: 'Where you live?', answer: ['Where do you live?'], ex: 'Câu hỏi thường cần do/does: Where do you live?' },
      { type: 'error', q: 'Why you are sad?', answer: ['Why are you sad?'], ex: 'Với "be" thì đảo ngữ, KHÔNG thêm do: Why are you sad?' },
      { type: 'error', q: 'What she likes?', answer: ['What does she like?'], ex: 'Chủ ngữ số ít → does + V nguyên thể: What does she like?' },
      { type: 'error', q: 'Where does you live?', answer: ['Where do you live?'], ex: 'Với "you" dùng "do", không "does": Where do you live?' },
      { type: 'cloze', q: '_____ do you usually do at weekends?', answer: ['What'], ex: 'Hỏi về hoạt động → What do you usually do at weekends?' },
      { type: 'cloze', q: 'How often _____ you use social media?', answer: ['do'], ex: 'Câu hỏi với "you" → do: How often do you use social media?' },
      { type: 'cloze', q: 'Where _____ your brother live? (do/does)', answer: ['does'], ex: 'Chủ ngữ số ít "your brother" → does.' },
    ],
  },
}

/** Lấy mảng bài tập biên soạn thêm cho một điểm ngữ pháp (theo tuần + tiêu đề). */
export function getGrammarExtra(weekNum, title) {
  return ieltsGrammarExtra[weekNum]?.[title] || []
}
