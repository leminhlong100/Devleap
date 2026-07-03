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
  4: {
    'Present Continuous': [
      // —— Lỗi #1: thiếu "be" trước V-ing. Đặt LÊN ĐẦU để được ưu tiên khi gộp. ——
      { type: 'error', q: 'I learning English now.', answer: ['I am learning English now.'], ex: 'Present continuous cần be + V-ing: I am learning English now.' },
      { type: 'error', q: 'People using phones more often.', answer: ['People are using phones more often.'], ex: 'Chủ ngữ số nhiều "People" → are using: People are using phones more often.' },
      { type: 'error', q: 'The weather getting hotter.', answer: ['The weather is getting hotter.'], ex: 'Thiếu "be": The weather is getting hotter.' },
      { type: 'cloze', q: 'She _____ preparing for an exam. (be)', answer: ['is'], ex: 'Chủ ngữ số ít "She" → is preparing.' },
      { type: 'cloze', q: 'The city _____ becoming more crowded. (be)', answer: ['is'], ex: 'Chủ ngữ số ít "The city" → is becoming.' },
    ],
    'Past Simple — Kể chuyện đã xong': [
      // —— Lỗi #1: dùng V nguyên mẫu thay V2/ed, và "didn't + V2" thay vì "didn't + base verb". ——
      { type: 'error', q: 'I go there yesterday.', answer: ['I went there yesterday.'], ex: 'Dấu hiệu "yesterday" cần past simple: I went there yesterday.' },
      { type: 'error', q: 'She didn’t went home.', answer: ['She didn’t go home.'], ex: 'Sau "didn’t" dùng động từ nguyên mẫu: She didn’t go home.' },
      { type: 'error', q: 'Did you liked it?', answer: ['Did you like it?'], ex: 'Sau "Did" dùng động từ nguyên mẫu: Did you like it?' },
      { type: 'cloze', q: 'We _____ not have much homework yesterday. (do)', answer: ['did'], ex: 'Phủ định quá khứ: We did not have much homework yesterday.' },
      { type: 'cloze', q: 'She _____ to Da Nang two years ago. (go)', answer: ['went'], ex: '"go" bất quy tắc ở quá khứ là "went": She went to Da Nang two years ago.' },
    ],
    'Future — Kế hoạch, dự đoán, quyết định': [
      // —— Lỗi #1: thiếu "am/is/are" trước "going to", và chia sai động từ sau "will". ——
      { type: 'error', q: 'I going to study.', answer: ['I am going to study.'], ex: 'Thiếu "be" trước "going to": I am going to study.' },
      { type: 'error', q: 'She will studies.', answer: ['She will study.'], ex: 'Sau "will" dùng động từ nguyên mẫu: She will study.' },
      { type: 'error', q: 'They are go to travel.', answer: ['They are going to travel.'], ex: 'Cấu trúc đúng là "be going to + V": They are going to travel.' },
      { type: 'cloze', q: 'I am going to _____ my notes tonight. (review)', answer: ['review'], ex: 'Sau "going to" dùng động từ nguyên mẫu: I am going to review my notes tonight.' },
      { type: 'cloze', q: 'I think online learning _____ become more popular. (will)', answer: ['will'], ex: 'Dự đoán chung dùng "will": I think online learning will become more popular.' },
    ],
  },
  5: {
    'Connectors — Cầu nối ý tưởng': [
      // —— Lỗi #1: tách mệnh đề phụ "Because…"/"Although…" thành câu riêng thay vì nối bằng dấu phẩy. ——
      { type: 'error', q: 'Because I was tired. I slept early.', answer: ['Because I was tired, I slept early.'], ex: 'Mệnh đề "Because…" không đứng một mình → nối với mệnh đề chính bằng dấu phẩy: Because I was tired, I slept early.' },
      { type: 'error', q: 'Although it was raining. We went out.', answer: ['Although it was raining, we went out.'], ex: 'Mệnh đề "Although…" cần nối bằng dấu phẩy: Although it was raining, we went out.' },
      { type: 'error', q: 'I like English because it is useful so I study every day.', answer: ['I like English because it is useful, so I study every day.'], ex: 'Hai kết quả nối tiếp cần dấu phẩy trước "so": … it is useful, so I study every day.' },
      { type: 'error', q: 'I was tired I took a short break.', answer: ['I was tired, so I took a short break.'], ex: 'Hai mệnh đề độc lập cần từ nối: I was tired, so I took a short break.' },
      { type: 'cloze', q: 'The task was difficult, _____ I finished it. (but/so)', answer: ['but'], ex: '"difficult" và "finished it" là ý tương phản → but: The task was difficult, but I finished it.' },
      { type: 'cloze', q: 'I was tired, _____ I took a short break. (but/so)', answer: ['so'], ex: '"tired" dẫn đến kết quả "took a break" → so: I was tired, so I took a short break.' },
    ],
    'Although / When / If — Mệnh đề phụ & đại từ tham chiếu': [
      // —— Lỗi #1: tách mệnh đề although/when thành câu riêng; lặp lại danh từ thay vì dùng it/they/this. ——
      { type: 'error', q: 'Although my city is crowded. I still enjoy living there.', answer: ['Although my city is crowded, I still enjoy living there.'], ex: 'Mệnh đề "Although…" cần nối bằng dấu phẩy: Although my city is crowded, I still enjoy living there.' },
      { type: 'error', q: 'When I have free time. I usually read the news.', answer: ['When I have free time, I usually read the news.'], ex: 'Mệnh đề "When…" đứng đầu câu cần dấu phẩy: When I have free time, I usually read the news.' },
      { type: 'error', q: 'My hometown has a small market. My hometown sells fresh vegetables every morning.', answer: ['My hometown has a small market. It sells fresh vegetables every morning.'], ex: 'Tránh lặp danh từ "My hometown" ở câu sau → dùng đại từ "It": It sells fresh vegetables every morning.' },
      { type: 'error', q: 'I like this festival, I like this festival every year.', answer: ['I like this festival, and I attend it every year.'], ex: 'Tránh lặp "this festival" → dùng đại từ "it": I like this festival, and I attend it every year.' },
      { type: 'cloze', q: '_____ English is hard, I can improve gradually. (Although/Because)', answer: ['Although'], ex: 'Ý tương phản (khó nhưng vẫn cải thiện được) → Although: Although English is hard, I can improve gradually.' },
      { type: 'cloze', q: 'If I visit a new place, I try the local food. → "_____" ở câu sau thay cho "the local food" khi nhắc lại.', answer: ['it'], ex: 'Danh từ số ít đã nhắc → thay bằng "it" ở câu sau để không lặp từ.' },
    ],
  },
  6: {
    'Comparatives — So sánh hơn': [
      // —— Lỗi #1 của người Việt: "more + er" và "as + er + as" thay vì dạng nguyên gốc. ——
      { type: 'error', q: 'My phone is more cheaper than yours.', answer: ['My phone is cheaper than yours.'], ex: 'Tính từ ngắn chỉ thêm "-er", không dùng "more" kèm theo: My phone is cheaper than yours.' },
      { type: 'error', q: 'Speaking is not as easier as reading.', answer: ['Speaking is not as easy as reading.'], ex: 'Cấu trúc "as…as" dùng tính từ nguyên gốc: as easy as, không phải as easier as.' },
      { type: 'error', q: 'Online classes are more flexibler than traditional ones.', answer: ['Online classes are more flexible than traditional ones.'], ex: 'Tính từ dài chỉ thêm "more", không thêm cả "-er": more flexible.' },
      { type: 'cloze', q: 'This method is _____ stressful for beginners. (less/least)', answer: ['less'], ex: 'So sánh hơn theo hướng giảm dùng "less + adjective": less stressful.' },
      { type: 'cloze', q: 'My hometown is _____ than Ho Chi Minh City. (quiet)', answer: ['quieter'], ex: 'Tính từ ngắn "quiet" → thêm "-er": quieter than.' },
      { type: 'error', q: 'This phone is gooder than that one.', answer: ['This phone is better than that one.'], ex: '"good" là tính từ bất quy tắc → so sánh hơn là "better", không thêm "-er".' },
    ],
    'Superlatives, Passive & Noun Phrases — 3 mảnh cho Task 1': [
      // —— Lỗi #1: "the most" + "-est" trùng lặp; quên "be" trong câu bị động; cụm danh từ sai trật tự tính từ-danh từ. ——
      { type: 'error', q: 'Lan had the most biggest increase.', answer: ['Lan had the biggest increase.'], ex: 'Không dùng "the most" cùng lúc với "-est": chỉ cần "the biggest".' },
      { type: 'error', q: 'English speak in many countries.', answer: ['English is spoken in many countries.'], ex: 'Câu bị động cần "be + V3": English is spoken in many countries.' },
      { type: 'error', q: 'This is most convenient app I have ever used.', answer: ['This is the most convenient app I have ever used.'], ex: 'So sánh nhất với tính từ dài cần "the most + adjective": the most convenient.' },
      { type: 'error', q: 'There was a increase sharp in the number of users.', answer: ['There was a sharp increase in the number of users.'], ex: 'Cụm danh từ đúng trật tự là tính từ trước danh từ: a sharp increase.' },
      { type: 'cloze', q: 'The data _____ collected over a period of four weeks. (be)', answer: ['was'], ex: 'Câu bị động quá khứ, chủ ngữ số ít "The data" (coi như số ít trong ngữ cảnh này) → was collected.' },
      { type: 'cloze', q: 'Traffic is a _____ problem in many big cities. (serious/seriously)', answer: ['serious'], ex: 'Trước danh từ "problem" cần tính từ, không dùng trạng từ: a serious problem.' },
    ],
  },
  7: {
    'Articles': [
      // —— Lỗi #1 của người Việt: bỏ mạo từ trước danh từ đếm được số ít, hoặc dùng "a" với vật duy nhất. ——
      { type: 'error', q: 'I am student.', answer: ['I am a student.'], ex: 'Danh từ đếm được số ít cần mạo từ: I am a student.' },
      { type: 'error', q: 'Sun is hot today.', answer: ['The sun is hot today.'], ex: 'Vật duy nhất như "the sun" luôn đi với "the": The sun is hot today.' },
      { type: 'error', q: 'I bought book.', answer: ['I bought a book.'], ex: 'Danh từ đếm được số ít lần đầu nhắc tới cần "a/an": I bought a book.' },
      { type: 'error', q: 'She wants to become doctor.', answer: ['She wants to become a doctor.'], ex: 'Nghề nghiệp là danh từ đếm được số ít → cần "a": become a doctor.' },
      { type: 'cloze', q: 'I need _____ umbrella. (a/an)', answer: ['an'], ex: '"umbrella" bắt đầu bằng âm nguyên âm → dùng "an": an umbrella.' },
      { type: 'cloze', q: 'The café near my school is quiet. _____ café is my favourite place to study. (A/The)', answer: ['The'], ex: 'Đã nhắc đến ở câu trước → dùng "the" vì người nghe đã biết cái nào.' },
    ],
    'Prepositions — Học theo cảnh sử dụng': [
      // —— Lỗi #1 của người Việt: dùng sai giới từ trong cụm cố định (depend of, discuss about, married with). ——
      { type: 'error', q: 'My progress depends of how much I practise.', answer: ['My progress depends on how much I practise.'], ex: 'Cụm cố định là "depend on", không phải "depend of".' },
      { type: 'error', q: 'We need to discuss about the problem.', answer: ['We need to discuss the problem.'], ex: '"discuss" là ngoại động từ, không cần "about": discuss the problem.' },
      { type: 'error', q: 'She is married with a doctor.', answer: ['She is married to a doctor.'], ex: 'Cụm cố định là "married to", không phải "married with".' },
      { type: 'error', q: 'I am good in listening but weak at writing.', answer: ['I am good at listening but weak in writing.'], ex: 'Cụm cố định đúng là "good at" và "weak in".' },
      { type: 'cloze', q: 'She is interested _____ Korean music. (in/on)', answer: ['in'], ex: 'Cụm cố định là "interested in": interested in Korean music.' },
      { type: 'cloze', q: 'The book is _____ the desk. (on/at)', answer: ['on'], ex: 'Vật nằm trên bề mặt dùng "on": on the desk.' },
    ],
    'Relative Clauses': [
      // —— Lỗi #1 của người Việt: thiếu who/which/that, hoặc lặp lại chủ ngữ sau mệnh đề quan hệ. ——
      { type: 'error', q: 'I like teacher explain clearly.', answer: ['I like teachers who explain things clearly.'], ex: 'Cần đại từ quan hệ "who" trước động từ: teachers who explain things clearly.' },
      { type: 'error', q: 'The app which it is useful.', answer: ['The app which is useful.', 'The app is useful.'], ex: 'Không lặp lại chủ ngữ "it" sau mệnh đề quan hệ: The app which is useful.' },
      { type: 'error', q: 'This is a place I usually study at there.', answer: ['This is a place where I usually study.'], ex: 'Nói về nơi chốn dùng "where", không thêm "there" thừa: a place where I usually study.' },
      { type: 'error', q: 'I prefer videos have subtitles.', answer: ['I prefer videos which have subtitles.'], ex: 'Cần đại từ quan hệ "which" trước động từ: videos which have subtitles.' },
      { type: 'cloze', q: 'This is a book _____ helped me build habits. (who/that)', answer: ['that'], ex: 'Vật/sự việc dùng "that" hoặc "which": a book that helped me build habits.' },
      { type: 'cloze', q: 'Students _____ review regularly remember more. (who/which)', answer: ['who'], ex: 'Nói về người dùng "who": Students who review regularly remember more.' },
    ],
  },
  8: {
    'Modals — Should / Can': [
      // —— Lỗi #1 của người Việt: thêm "to" sau modal, hoặc chia động từ (thêm "-s") sau should/can. ——
      { type: 'error', q: 'Students should to review vocabulary every day.', answer: ['Students should review vocabulary every day.'], ex: 'Sau modal "should" dùng động từ nguyên mẫu, KHÔNG thêm "to": should review.' },
      { type: 'error', q: 'It can has a positive impact on confidence.', answer: ['It can have a positive impact on confidence.'], ex: 'Sau modal "can" dùng động từ nguyên mẫu: can have, không chia "has".' },
      { type: 'error', q: 'She should reviews her notes every night.', answer: ['She should review her notes every night.'], ex: 'Dù chủ ngữ số ít, sau "should" vẫn KHÔNG thêm "-s": should review.' },
      { type: 'error', q: 'This method can helps beginners feel more confident.', answer: ['This method can help beginners feel more confident.'], ex: 'Sau "can" dùng động từ nguyên mẫu: can help, không chia "-s".' },
      { type: 'cloze', q: 'You _____ practise speaking a little every day. (nên)', answer: ['should'], ex: 'Lời khuyên dùng "should + V nguyên mẫu": You should practise speaking a little every day.' },
    ],
    'Conditionals — Câu điều kiện loại 1': [
      // —— Lỗi #1 của người Việt: dùng "will" ở cả hai mệnh đề, hoặc quên chia động từ ở mệnh đề if. ——
      { type: 'error', q: 'If English will become too stressful, they lose interest.', answer: ['If English becomes too stressful, they will lose interest.'], ex: 'Mệnh đề "if" dùng hiện tại đơn (becomes), "will" chỉ đứng ở mệnh đề chính: … they will lose interest.' },
      { type: 'error', q: 'If she study hard, she will pass the exam.', answer: ['If she studies hard, she will pass the exam.'], ex: 'Chủ ngữ số ít "she" trong mệnh đề if → studies (thêm "-s").' },
      { type: 'error', q: 'If students practise every day, they will improved quickly.', answer: ['If students practise every day, they will improve quickly.'], ex: 'Sau "will" dùng động từ nguyên mẫu: will improve, không chia "-ed".' },
      { type: 'error', q: 'If I have free time tomorrow, I review my notes.', answer: ['If I have free time tomorrow, I will review my notes.'], ex: 'Mệnh đề chính của câu điều kiện loại 1 cần "will + V": I will review my notes.' },
      { type: 'cloze', q: 'If students practise every day, they _____ improve quickly. (will/would)', answer: ['will'], ex: 'Câu điều kiện loại 1 dùng "will" ở mệnh đề chính: they will improve quickly.' },
    ],
    'Sentence Variety — Đa dạng câu cho Task 2/Part 3': [
      // —— Lỗi #1 của người Việt: lặp "I think" nhiều lần và lặp danh từ thay vì dùng đại từ. ——
      { type: 'error', q: 'I think students should practise. I think it helps them improve.', answer: ['I think students should practise because it helps them improve.'], ex: 'Tránh lặp "I think" nhiều lần → nối 2 ý bằng "because": I think students should practise because it helps them improve.' },
      { type: 'error', q: 'My hometown is small. My hometown is quiet.', answer: ['My hometown is small. It is quiet.'], ex: 'Tránh lặp danh từ "My hometown" ở câu sau → dùng đại từ "It": It is quiet.' },
      { type: 'error', q: 'Many students find speaking difficult. But regular practice can help.', answer: ['Many students find speaking difficult; however, regular practice can help.'], ex: 'Trong văn phong trang trọng, nối ý tương phản bằng "however" (có dấu chấm phẩy/chấm câu trước), tránh viết hoa "But" giữa câu.' },
      { type: 'error', q: 'Students can join online classes. Students can use dictionaries on their phones.', answer: ['Students can join online classes, or use dictionaries on their phones.'], ex: 'Gộp 2 câu liên quan bằng từ nối thay vì lặp lại chủ ngữ "Students": … or use dictionaries on their phones.' },
      { type: 'cloze', q: 'My hometown is small. _____ is quiet and close to the sea. (It/This town)', answer: ['It'], ex: 'Đại từ "It" thay cho danh từ đã nhắc để tránh lặp từ.' },
    ],
  },
}

/** Lấy mảng bài tập biên soạn thêm cho một điểm ngữ pháp (theo tuần + tiêu đề). */
export function getGrammarExtra(weekNum, title) {
  return ieltsGrammarExtra[weekNum]?.[title] || []
}
