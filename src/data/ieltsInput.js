/**
 * NGUỒN NHẬP THẬT (Reading + Listening) cho khóa IELTS nền tảng.
 *
 * Vì sao tách riêng file: nội dung tuần (Base_English/*.md) chỉ có ngữ pháp + từ
 * vựng + checklist, KHÔNG có bài đọc/bài nghe đúng nghĩa. Tuần nền tảng vì thế
 * thiếu hẳn kỹ năng tiếp nhận (receptive input). File này bổ sung cho từng buổi:
 *  - reading:  một đoạn ngắn 60–80 từ + câu hỏi đọc hiểu, trong đó có ÍT NHẤT 1 câu
 *    dạng PARAPHRASE (đáp án không chép nguyên văn) để luyện đúng phản xạ IELTS.
 *  - listening: một đoạn ngắn; câu hỏi tên/số/giờ dùng dạng ĐIỀN PHIẾU (form
 *    completion) như Listening Section 1, câu hiểu/suy luận giữ dạng trắc nghiệm.
 *
 * Định dạng câu dùng chung với QuizTool:
 *  - trắc nghiệm:  { q, opts, correct, ex }
 *  - điền chỗ trống: { type:'cloze', q:'… _____ …', answer:[các dạng chấp nhận], ex }
 *    (QuizTool tự chuẩn hóa: số/chữ, viết hoa-thường, viết tắt → chấm theo nghĩa).
 *
 * Audio: mặc định phát bằng Web Speech API (script). Khi có bản THU GIỌNG NGƯỜI
 * THẬT, chỉ cần đặt `audioUrl` (đường dẫn file .mp3) — component sẽ ưu tiên file.
 *
 * Khóa theo `${week}:${day}` — day = SỐ THỨ TỰ BUỔI TRONG TUẦN (1..7), không phải số
 * buổi tuyệt đối. Vì vậy Tuần 2 (hiển thị "Day 8–14" trong .md) vẫn dùng khóa 2:1..2:7.
 * Hiện có đủ Tuần 1 và Tuần 2; thêm tuần khác bằng cách bổ sung khóa mới theo đúng cấu trúc.
 */

import { ieltsAudioManifest } from './ieltsAudioManifest.js'

export const ieltsInput = {
  // ───────────────────────── Tuần 1 · Buổi 1 ─────────────────────────
  '1:1': {
    reading: {
      title: 'About Mai',
      subtitle: 'Đọc đoạn tự giới thiệu (72 từ) rồi trả lời câu hỏi',
      // 72 từ, chủ đề Self/Identity — dùng đúng be, S–V–O, present simple của tuần.
      text:
        'Hi, my name is Mai. I am nineteen years old and I live in Da Nang. ' +
        'I am a student at a local college, and I study tourism. In my free time, ' +
        'I read books and I listen to music. I am a quiet person, but I enjoy ' +
        'meeting new people. I am not very good at English yet, but I practise ' +
        'every day. My goal is to speak English more confidently.',
      questions: [
        {
          q: 'How old is Mai?',
          opts: ['Eighteen', 'Nineteen', 'Twenty', 'Twenty-one'],
          correct: 1,
          ex: '“I am nineteen years old.” → Mai 19 tuổi.',
        },
        {
          q: 'What does Mai study?',
          opts: ['Music', 'English', 'Tourism', 'Business'],
          correct: 2,
          ex: '“I study tourism.” → Cô ấy học ngành du lịch (tourism).',
        },
        {
          q: 'What is her main goal?',
          opts: [
            'To read more books',
            'To make many friends',
            'To travel around Da Nang',
            'To speak English more confidently',
          ],
          correct: 3,
          ex: '“My goal is to speak English more confidently.”',
        },
        {
          // Paraphrase: đáp án đúng KHÔNG chép nguyên văn câu trong bài.
          q: 'Which sentence is TRUE about Mai?',
          opts: [
            'She dislikes meeting new people',
            'She studies English every day',
            'She is already fluent in English',
            'She lives in Hue',
          ],
          correct: 1,
          ex: '“… I practise every day.” → luyện mỗi ngày (diễn đạt lại bằng từ khác, không chép nguyên văn).',
        },
      ],
    },

    listening: {
      title: 'Meet Nam',
      subtitle: 'Điền PHIẾU THÔNG TIN — nghe rồi viết đúng tên, tuổi, số nhà (giống Listening Section 1)',
      // Phát bằng Web Speech API. Thay bằng file thu giọng thật: đặt audioUrl.
      audioUrl: null,
      script:
        'Hello. My name is Nam. I am twenty-three years old. ' +
        'I live on Tran Phu Street, at number forty-five. ' +
        'I have one brother and two sisters.',
      questions: [
        {
          type: 'cloze',
          q: 'Name: _____',
          answer: ['Nam'],
          ex: '“My name is Nam.” → viết hoa tên riêng: Nam.',
        },
        {
          type: 'cloze',
          q: 'Age: _____ years old',
          answer: ['twenty-three', 'twenty three', '23'],
          ex: '“I am twenty-three years old.” → 23. (Có thể viết số hoặc chữ.)',
        },
        {
          type: 'cloze',
          q: 'House number: _____',
          answer: ['forty-five', 'forty five', '45'],
          ex: '“… at number forty-five.” → 45. Cẩn thận: forty-FIVE (45), không phải fifty (50).',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 4 ─────────────────────────
  // Chủ đề Self & Health — đọc về thói quen/sức khỏe + nghe GIỜ GIẤC & CON SỐ.
  '1:4': {
    reading: {
      title: "Linh's healthy day",
      subtitle: 'Đọc đoạn về thói quen giữ sức khỏe (68 từ) rồi trả lời câu hỏi',
      // 68 từ — dùng từ vựng Health (under pressure, enough sleep, exercise, stressed).
      text:
        'Linh is a university student in Hue. She often feels under pressure before ' +
        'exams. To stay healthy, she gets enough sleep and she does light exercise ' +
        'every morning. She drinks a lot of water and she does not drink coffee at ' +
        'night. When she feels stressed, she listens to music and talks to her friends. ' +
        'She believes that good sleep and a calm mind help her study better.',
      questions: [
        {
          q: 'How does Linh often feel before exams?',
          opts: ['Bored', 'Under pressure', 'Excited', 'Sleepy'],
          correct: 1,
          ex: '“She often feels under pressure before exams.”',
        },
        {
          q: 'What does she do to stay healthy?',
          opts: [
            'She drinks coffee at night',
            'She studies all night',
            'She gets enough sleep and exercises',
            'She skips breakfast',
          ],
          correct: 2,
          ex: '“… she gets enough sleep and she does light exercise every morning.”',
        },
        {
          q: 'What does she do when she feels stressed?',
          opts: [
            'She drinks coffee',
            'She listens to music and talks to friends',
            'She goes to bed',
            'She watches TV',
          ],
          correct: 1,
          ex: '“… she listens to music and talks to her friends.”',
        },
        {
          // Paraphrase: diễn đạt lại "good sleep and a calm mind help her study better".
          q: 'According to the text, what helps Linh study better?',
          opts: [
            'Studying late every night',
            'Resting well and staying calm',
            'Drinking lots of coffee',
            'Skipping breakfast',
          ],
          correct: 1,
          ex: '“… good sleep and a calm mind help her study better.” → nghỉ ngơi tốt và giữ tinh thần bình tĩnh.',
        },
      ],
    },

    listening: {
      title: "Linh's weekday",
      subtitle: 'Điền THỜI GIAN BIỂU — nghe rồi viết đúng GIỜ GIẤC và CON SỐ',
      audioUrl: null,
      script:
        'Hi, I am Linh. On weekdays, I wake up at six o’clock. ' +
        'I have breakfast at half past six. I study at the library for three hours ' +
        'every afternoon. I go to bed at eleven.',
      questions: [
        {
          type: 'cloze',
          q: 'Wake-up time: _____ o’clock',
          answer: ['six', '6'],
          ex: '“I wake up at six o’clock.” → six (6).',
        },
        {
          type: 'cloze',
          q: 'Hours of study each afternoon: _____',
          answer: ['three', '3'],
          ex: '“… I study at the library for three hours …” → three (3).',
        },
        {
          type: 'cloze',
          q: 'Bedtime: _____ o’clock',
          answer: ['eleven', '11'],
          ex: '“I go to bed at eleven.” → eleven (11).',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 5 ─────────────────────────
  // "Ngày nạp" — đoạn đọc dài & liền mạch hơn + nghe TÊN ĐÁNH VẦN + SỐ PHÒNG/GIỜ.
  '1:5': {
    reading: {
      title: 'My best friend',
      subtitle: 'Đọc đoạn kể về một người bạn (75 từ) rồi trả lời câu hỏi',
      // 75 từ — câu liền mạch hơn (be + do + quá khứ "met"), hợp ngày đọc to/shadowing.
      text:
        'My best friend is called Hoa. We met five years ago at secondary school. ' +
        'She is friendly, and she is very good at maths. Hoa lives near my house, ' +
        'so we often study together after class. On Sundays, we go to a small café ' +
        'and we talk about our plans. She wants to be a teacher, and I want to work ' +
        'in tourism. We do not agree on everything, but we always support each other.',
      questions: [
        {
          q: 'Where did they meet?',
          opts: ['At a café', 'At secondary school', 'At university', 'Near her house'],
          correct: 1,
          ex: '“We met five years ago at secondary school.”',
        },
        {
          q: 'What does Hoa want to be?',
          opts: ['A nurse', 'A teacher', 'A tour guide', 'A student'],
          correct: 1,
          ex: '“She wants to be a teacher …”',
        },
        {
          q: 'How often do they go to a café?',
          opts: ['Every day', 'On Sundays', 'After every class', 'Once a year'],
          correct: 1,
          ex: '“On Sundays, we go to a small café …”',
        },
        {
          // Paraphrase: lý do học chung được diễn đạt lại.
          q: 'Why do they often study together after class?',
          opts: [
            'Because they are in the same class',
            'Because Hoa lives nearby',
            'Because they both want to be teachers',
            'Because the café is free',
          ],
          correct: 1,
          ex: '“Hoa lives near my house, so we often study together …” → vì Hoa ở gần nhà.',
        },
      ],
    },

    listening: {
      title: 'New student',
      subtitle: 'Điền PHIẾU ĐĂNG KÝ — nghe và viết đúng HỌ (đánh vần), số phòng, giờ học',
      audioUrl: null,
      script:
        'Good morning. My name is Tom Carter. My family name is Carter. ' +
        'I am in room number twelve. My class starts at nine fifteen.',
      questions: [
        {
          type: 'cloze',
          q: 'Family name: _____',
          answer: ['Carter'],
          ex: '“My family name is Carter.” → C-A-R-T-E-R. Nghe kỹ âm cuối để khỏi nhầm Carver/Porter.',
        },
        {
          type: 'cloze',
          q: 'Room number: _____',
          answer: ['twelve', '12'],
          ex: '“I am in room number twelve.” → 12. Cẩn thận twelve (12) ≠ twenty (20).',
        },
        {
          type: 'cloze',
          q: 'Class starts at: _____',
          answer: ['nine fifteen', 'nine-fifteen', '9:15', '9.15', '9 15'],
          ex: '“My class starts at nine fifteen.” → 9:15.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 2 ─────────────────────────
  // Động từ "be" — đọc mô tả lớp học + nghe giới thiệu gia đình (TÊN & TUỔI).
  '1:2': {
    reading: {
      title: 'My English class',
      subtitle: 'Đọc đoạn mô tả lớp học (71 từ) rồi trả lời câu hỏi',
      // 71 từ — dùng "be" (is, am, are) xuyên suốt, chủ đề Self & Identity.
      text:
        'I am a student in an English class in Ho Chi Minh City. My classroom is on ' +
        'the second floor. It is big and clean. There are twenty students in my class. ' +
        'Our teacher is Mrs Lan. She is very kind and patient. The desks are new, and ' +
        'the walls are white. There is a large board at the front. I am happy because ' +
        'my classmates are friendly. We are all beginners.',
      questions: [
        {
          q: 'Where is the classroom?',
          opts: ['First floor', 'Second floor', 'Third floor', 'Ground floor'],
          correct: 1,
          ex: '"My classroom is on the second floor." → Lớp học ở tầng hai.',
        },
        {
          q: 'How many students are in the class?',
          opts: ['Twelve', 'Fifteen', 'Twenty', 'Twenty-five'],
          correct: 2,
          ex: '"There are twenty students in my class." → Có 20 học viên.',
        },
        {
          q: 'How does the writer feel about the class?',
          opts: [
            'Tired',
            'Bored',
            'Happy',
            'Nervous',
          ],
          correct: 2,
          ex: '"I am happy because my classmates are friendly." → Tác giả vui vì bạn cùng lớp thân thiện.',
        },
        {
          // Paraphrase: "We are all beginners" diễn đạt lại.
          q: 'What does the text suggest about the students?',
          opts: [
            'They are advanced learners',
            'They are new to learning English',
            'They are the teachers',
            'They study on their own',
          ],
          correct: 1,
          ex: '"We are all beginners." → họ đều mới bắt đầu học tiếng Anh.',
        },
      ],
    },

    listening: {
      title: "Tuan's family",
      subtitle: 'Điền PHIẾU GIA ĐÌNH — nghe và viết đúng TÊN và TUỔI',
      audioUrl: null,
      script:
        'Hi! My name is Tuan. I am twenty years old. My father is Mr Hung. ' +
        'He is forty-eight. My mother is Mrs Thao. She is forty-five. ' +
        'My sister is Linh. She is sixteen.',
      questions: [
        {
          type: 'cloze',
          q: "Tuan's age: _____",
          answer: ['twenty', '20'],
          ex: '"I am twenty years old." → 20.',
        },
        {
          type: 'cloze',
          q: "Father's name: Mr _____",
          answer: ['Hung'],
          ex: '"My father is Mr Hung." → Hùng.',
        },
        {
          type: 'cloze',
          q: "Sister's age: _____",
          answer: ['sixteen', '16'],
          ex: '"She is sixteen." → 16. Cẩn thận sixteen (16) ≠ sixty (60).',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 3 ─────────────────────────
  // Do / Does / Did — đọc về thói quen hàng ngày + nghe hỏi-đáp ngắn.
  '1:3': {
    reading: {
      title: "Minh's daily routine",
      subtitle: 'Đọc đoạn về thói quen hàng ngày (73 từ) rồi trả lời câu hỏi',
      // 73 từ — dùng do/does/did tự nhiên trong câu hỏi & phủ định.
      text:
        'Minh lives in Can Tho. Every day, he wakes up at six and does exercise in the ' +
        'park. He does not eat breakfast at home — he buys bread on the way to school. ' +
        'After school, he does his homework before dinner. Yesterday, he did not go to ' +
        'the park because it rained. "Do you like mornings?" his friend asked. Minh ' +
        'answered, "Yes, I do. Mornings give me energy."',
      questions: [
        {
          q: 'What does Minh do every morning?',
          opts: ['He reads books', 'He does exercise', 'He cooks breakfast', 'He watches TV'],
          correct: 1,
          ex: '"… he wakes up at six and does exercise in the park." → Minh tập thể dục.',
        },
        {
          q: 'Why did Minh not go to the park yesterday?',
          opts: [
            'He was tired',
            'He had homework',
            'It rained',
            'He woke up late',
          ],
          correct: 2,
          ex: '"… he did not go to the park because it rained." → Vì trời mưa.',
        },
        {
          q: 'Does Minh like mornings?',
          opts: [
            'No, he does not',
            'Yes, he does',
            'He does not answer',
            'He likes evenings',
          ],
          correct: 1,
          ex: '"Yes, I do. Mornings give me energy." → Minh thích buổi sáng.',
        },
        {
          // Paraphrase: "does not eat breakfast at home — he buys bread on the way".
          q: 'What do we learn about Minh’s breakfast?',
          opts: [
            'He cooks breakfast at home',
            'He buys something to eat on the way to school',
            'He never eats in the morning',
            'He eats breakfast at the park',
          ],
          correct: 1,
          ex: '"He does not eat breakfast at home — he buys bread on the way to school." → mua đồ ăn trên đường đi học.',
        },
      ],
    },

    listening: {
      title: 'At the school gate',
      subtitle: 'Nghe một đoạn hỏi-đáp ngắn — chú ý CÂU HỎI và CÂU TRẢ LỜI',
      audioUrl: null,
      script:
        'A: Do you walk to school? B: No, I do not. I take the bus. ' +
        'A: Does your sister go to this school? B: Yes, she does. ' +
        'A: Did you do the homework? B: Yes, I did it last night.',
      questions: [
        {
          q: 'How does speaker B go to school?',
          opts: ['On foot', 'By bus', 'By bike', 'By car'],
          correct: 1,
          ex: '"No, I do not. I take the bus." → B đi xe buýt.',
        },
        {
          q: "Does B's sister go to the same school?",
          opts: ['No, she does not', 'Yes, she does', 'She stays home', 'We do not know'],
          correct: 1,
          ex: '"Yes, she does." → Chị/em gái cũng học cùng trường.',
        },
        {
          q: 'When did B do the homework?',
          opts: ['This morning', 'Last night', 'At school', 'After lunch'],
          correct: 1,
          ex: '"Yes, I did it last night." → B làm bài tối qua.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 6 ─────────────────────────
  // Self-introduction 60s — đọc bài mẫu giới thiệu + nghe giới thiệu trước lớp.
  '1:6': {
    reading: {
      title: 'Nguyen Thanh Hoa',
      subtitle: 'Đọc bài tự giới thiệu mẫu (76 từ) rồi trả lời câu hỏi',
      // 76 từ — kết hợp be + do + từ vựng cả tuần (Self, Health, Feelings).
      text:
        'My name is Nguyen Thanh Hoa. I am twenty-one years old and I come from Hai Phong. ' +
        'I am a third-year student, and I study business at a university in Ha Noi. ' +
        'In my free time, I play badminton and I watch movies. I do not like waking up ' +
        'early, but I do it every day for class. My dream is to work for an international ' +
        'company. I feel excited about the future.',
      questions: [
        {
          q: 'Where does Hoa come from?',
          opts: ['Ha Noi', 'Da Nang', 'Hai Phong', 'Ho Chi Minh City'],
          correct: 2,
          ex: '"I come from Hai Phong." → Hoa đến từ Hải Phòng.',
        },
        {
          q: 'What does Hoa study?',
          opts: ['Tourism', 'Medicine', 'Business', 'English'],
          correct: 2,
          ex: '"… I study business at a university in Ha Noi." → Hoa học ngành kinh doanh.',
        },
        {
          q: 'What is her dream?',
          opts: [
            'To be a teacher',
            'To travel the world',
            'To work for an international company',
            'To study abroad',
          ],
          correct: 2,
          ex: '"My dream is to work for an international company." → Mơ ước làm việc ở công ty quốc tế.',
        },
        {
          // Paraphrase: "I do not like waking up early, but I do it every day for class."
          q: 'What do we learn about Hoa’s mornings?',
          opts: [
            'She loves waking up early',
            'She wakes up early although she dislikes it',
            'She never wakes up early',
            'She has no morning classes',
          ],
          correct: 1,
          ex: '"I do not like waking up early, but I do it every day for class." → dậy sớm dù không thích.',
        },
      ],
    },

    listening: {
      title: 'Hello, class!',
      subtitle: 'Điền PHIẾU GIỚI THIỆU — nghe và viết đúng quê quán, tuổi; câu cuối chọn đáp án',
      audioUrl: null,
      script:
        'Hello, everyone! My name is Phuong. I am from Nha Trang. ' +
        'I am eighteen years old. I like swimming and cooking. ' +
        'I do not have any brothers, but I have one sister.',
      questions: [
        {
          type: 'cloze',
          q: 'Hometown: _____',
          answer: ['Nha Trang'],
          ex: '"I am from Nha Trang." → Nha Trang.',
        },
        {
          type: 'cloze',
          q: 'Age: _____ years old',
          answer: ['eighteen', '18'],
          ex: '"I am eighteen years old." → 18. Cẩn thận eighteen (18) ≠ eighty (80).',
        },
        {
          q: 'Does Phuong have any brothers?',
          opts: ['Yes, one brother', 'Yes, two brothers', 'No, she does not', 'We do not know'],
          correct: 2,
          ex: '"I do not have any brothers …" → Phương không có anh/em trai.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 1 · Buổi 7 ─────────────────────────
  // Tổng hợp tuần — đọc bài phản hồi tuần học + nghe hội thoại lớp học (SỐ & CHI TIẾT).
  '1:7': {
    reading: {
      title: 'My first week of English',
      subtitle: 'Đọc đoạn nhìn lại tuần học đầu tiên (78 từ) rồi trả lời câu hỏi',
      // 78 từ — tổng hợp be + do/does/did + hiện tại + quá khứ.
      text:
        'This is my first week at the English centre. On Monday, I was nervous because ' +
        'everything was new. The teacher asked, "Do you like English?" and I said, "Yes, ' +
        'I do, but I am not confident." During the week, I did many exercises and I ' +
        'practised speaking with my classmates. Now I feel more comfortable. I am still ' +
        'not perfect, but I am proud of myself. I did not give up, and that is important.',
      questions: [
        {
          q: 'How did the writer feel on Monday?',
          opts: ['Excited', 'Nervous', 'Angry', 'Happy'],
          correct: 1,
          ex: '"On Monday, I was nervous because everything was new." → Thứ Hai tác giả lo lắng.',
        },
        {
          q: 'What did the writer do during the week?',
          opts: [
            'Watched TV',
            'Slept a lot',
            'Did many exercises and practised speaking',
            'Played games',
          ],
          correct: 2,
          ex: '"… I did many exercises and I practised speaking with my classmates." → Làm bài tập và luyện nói.',
        },
        {
          q: 'How does the writer feel now?',
          opts: [
            'Still very nervous',
            'Angry at the teacher',
            'More comfortable and proud',
            'Bored and tired',
          ],
          correct: 2,
          ex: '"Now I feel more comfortable … I am proud of myself." → Bây giờ thoải mái hơn và tự hào.',
        },
        {
          // Paraphrase: "I did not give up, and that is important."
          q: 'What is the writer’s attitude at the end of the week?',
          opts: [
            'She regrets joining the class',
            'She is proud that she kept going',
            'She thinks giving up is fine',
            'She wants to quit English',
          ],
          correct: 1,
          ex: '"I did not give up, and that is important." → tự hào vì đã không bỏ cuộc.',
        },
      ],
    },

    listening: {
      title: 'End of week chat',
      subtitle: 'Nghe hội thoại thầy–trò — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many new words did you learn this week? ' +
        'Student: I learned about thirty words. Teacher: That is great! ' +
        'Do you feel better about English now? Student: Yes, I do. I am more confident.',
      questions: [
        {
          type: 'cloze',
          q: 'Number of new words learned this week: about _____',
          answer: ['thirty', '30'],
          ex: '"I learned about thirty words." → khoảng 30 (gồm ~20 từ chính + các cụm đã học). Cẩn thận thirty (30) ≠ thirteen (13).',
        },
        {
          q: 'What does the teacher think about the result?',
          opts: ['It is bad', 'It is okay', 'It is great', 'It is too many'],
          correct: 2,
          ex: '"That is great!" → Thầy giáo khen kết quả tốt.',
        },
        {
          q: 'How does the student feel now?',
          opts: ['Tired', 'Nervous', 'More confident', 'Bored'],
          correct: 2,
          ex: '"Yes, I do. I am more confident." → Học viên tự tin hơn.',
        },
      ],
    },
  },

  // ═══════════════════════════ TUẦN 2 ═══════════════════════════
  // Trọng tâm: xương sống câu — chủ ngữ–động từ hợp nhau, đếm được/không đếm được,
  // bồi câu ngắn thành dài. Từ vựng: Family & Relationships, School & Learning.

  // ───────────────────────── Tuần 2 · Buổi 1 (Day 8) ─────────────────────────
  // Chủ ngữ – động từ hợp nhau (be vs động từ thường, "s" số nhiều).
  '2:1': {
    reading: {
      title: "Trang's family",
      subtitle: 'Đọc đoạn về gia đình (68 từ) rồi trả lời câu hỏi',
      // 68 từ — luyện "be" (is/are) + hòa hợp chủ ngữ–động từ + "s" số nhiều.
      text:
        'Trang lives in Nam Dinh with her parents and her two brothers. Her father is ' +
        'an engineer, and her mother is a nurse. Her brothers are still at school. ' +
        'Every evening, the family eats dinner together and talks about the day. ' +
        'Trang and her mother often share the housework. Her brothers are noisy, but ' +
        'she gets along with them well. She thinks a close family makes life easier.',
      questions: [
        {
          q: "What does Trang's father do?",
          opts: ['He is a nurse', 'He is an engineer', 'He is a teacher', 'He is a student'],
          correct: 1,
          ex: '“Her father is an engineer.” → Bố Trang là kỹ sư.',
        },
        {
          q: 'Where are her brothers during the day?',
          opts: ['At work', 'At home', 'Still at school', 'In another city'],
          correct: 2,
          ex: '“Her brothers are still at school.” → Các em vẫn còn đi học.',
        },
        {
          q: 'What do Trang and her mother often do together?',
          opts: [
            'Share the housework',
            'Cook for the brothers',
            'Go to work',
            'Play music',
          ],
          correct: 0,
          ex: '“Trang and her mother often share the housework.” → cùng chia việc nhà.',
        },
        {
          // Paraphrase: "she gets along with them well" diễn đạt lại.
          q: 'What does the text suggest about Trang and her brothers?',
          opts: [
            'They argue all the time',
            'They have a good relationship',
            'They never meet',
            'They study the same subject',
          ],
          correct: 1,
          ex: '“… she gets along with them well.” → quan hệ tốt với các em (dù các em ồn ào).',
        },
      ],
    },

    listening: {
      title: 'A new classmate',
      subtitle: 'Điền PHIẾU GIỚI THIỆU — nghe và viết đúng TUỔI, SỐ ANH CHỊ EM và MÔN học',
      audioUrl: null,
      script:
        'Hi, I am Mai Anh. I am sixteen years old. ' +
        'I have two sisters and one brother. My favourite subject is history.',
      questions: [
        {
          type: 'cloze',
          q: 'Age: _____ years old',
          answer: ['sixteen', '16'],
          ex: '“I am sixteen years old.” → 16. Cẩn thận sixteen (16) ≠ sixty (60).',
        },
        {
          type: 'cloze',
          q: 'Number of sisters: _____',
          answer: ['two', '2'],
          ex: '“I have two sisters …” → 2.',
        },
        {
          type: 'cloze',
          q: 'Favourite subject: _____',
          answer: ['history'],
          ex: '“My favourite subject is history.” → history.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 2 (Day 9) ─────────────────────────
  // Đếm được / Không đếm được (much / many / a lot of).
  '2:2': {
    reading: {
      title: 'Too much homework?',
      subtitle: 'Đọc đoạn về việc học của Nam (74 từ) rồi trả lời câu hỏi',
      // 74 từ — dùng much/many/a lot of + danh từ đếm được/không đếm được.
      text:
        'Nam is a student in Hue. This year, he has a lot of homework and not much ' +
        'free time. He says, "I do not have many hobbies now, but I still play ' +
        'football on Sundays." Nam drinks a lot of water during the day, but he does ' +
        'not drink much coffee. He has many friends at school, and they often share ' +
        'advice about studying. Nam believes that a little rest every day is important.',
      questions: [
        {
          q: 'How much free time does Nam have this year?',
          opts: ['A lot', 'Not much', 'Too much', 'No homework'],
          correct: 1,
          ex: '“… he has a lot of homework and not much free time.” → ít thời gian rảnh.',
        },
        {
          q: 'What does Nam do on Sundays?',
          opts: ['He studies all day', 'He plays football', 'He drinks coffee', 'He sleeps'],
          correct: 1,
          ex: '“… I still play football on Sundays.”',
        },
        {
          q: 'What do Nam and his friends often share?',
          opts: [
            'Their homework',
            'Their coffee',
            'Advice about studying',
            'Their hobbies',
          ],
          correct: 2,
          ex: '“… they often share advice about studying.” (“advice” không đếm được.)',
        },
        {
          // Paraphrase: "a little rest every day is important".
          q: 'What does Nam believe?',
          opts: [
            'Studying all night is best',
            'Resting a little each day matters',
            'Coffee helps him study',
            'Hobbies are a waste of time',
          ],
          correct: 1,
          ex: '“… a little rest every day is important.” → nghỉ ngơi một chút mỗi ngày là quan trọng.',
        },
      ],
    },

    listening: {
      title: 'The shopping list',
      subtitle: 'Điền PHIẾU MUA HÀNG — nghe và viết đúng SỐ LƯỢNG (đếm được & không đếm được)',
      audioUrl: null,
      script:
        'How many apples do we need? We need six apples and three bottles of milk. ' +
        'We do not have much sugar, so buy one kilo.',
      questions: [
        {
          type: 'cloze',
          q: 'Apples: _____',
          answer: ['six', '6'],
          ex: '“We need six apples …” → 6.',
        },
        {
          type: 'cloze',
          q: 'Bottles of milk: _____',
          answer: ['three', '3'],
          ex: '“… and three bottles of milk.” → 3.',
        },
        {
          type: 'cloze',
          q: 'Sugar to buy: _____ kilo',
          answer: ['one', '1'],
          ex: '“… buy one kilo.” → 1 kilo. (“sugar” không đếm được → dùng “much”.)',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 3 (Day 10) ─────────────────────────
  // Phòng từ vựng Family & School — đọc về một người thầy + nghe thời khóa biểu.
  '2:3': {
    reading: {
      title: 'My favourite teacher',
      subtitle: 'Đọc đoạn về một người thầy (73 từ) rồi trả lời câu hỏi',
      // 73 từ — từ vựng School & Learning (pay attention, mistake, review, habit).
      text:
        'My favourite teacher is Mr Quang. He teaches maths, and he always pays ' +
        'attention to weak students. When I make a mistake, he does not get angry. ' +
        'He explains the problem again in a simple way. He often says, "Mistakes are ' +
        'part of learning." Because of him, I review my lessons regularly and I am not ' +
        'afraid of exams. Mr Quang helps me build good study habits, and I respect him a lot.',
      questions: [
        {
          q: 'What subject does Mr Quang teach?',
          opts: ['English', 'History', 'Maths', 'Science'],
          correct: 2,
          ex: '“He teaches maths …” → Thầy dạy Toán.',
        },
        {
          q: 'What does Mr Quang do when the writer makes a mistake?',
          opts: [
            'He gets angry',
            'He explains it again simply',
            'He ignores the student',
            'He gives more homework',
          ],
          correct: 1,
          ex: '“… he does not get angry. He explains the problem again in a simple way.”',
        },
        {
          q: 'How does the writer prepare for exams now?',
          opts: [
            'By studying only the night before',
            'By reviewing lessons regularly',
            'By copying friends',
            'By avoiding maths',
          ],
          correct: 1,
          ex: '“… I review my lessons regularly …”',
        },
        {
          // Paraphrase: "Mistakes are part of learning."
          q: 'What does Mr Quang believe about mistakes?',
          opts: [
            'They should be punished',
            'They are a normal part of studying',
            'They mean a student is lazy',
            'They must be hidden',
          ],
          correct: 1,
          ex: '“Mistakes are part of learning.” → mắc lỗi là phần bình thường của việc học.',
        },
      ],
    },

    listening: {
      title: 'Today at school',
      subtitle: 'Điền THỜI KHÓA BIỂU — nghe và viết đúng MÔN, SỐ PHÒNG và GIỜ học',
      audioUrl: null,
      script:
        'Good morning. Today we have English in room ten at eight o’clock. ' +
        'After that, we have history. Do not forget your homework for Friday.',
      questions: [
        {
          type: 'cloze',
          q: 'First lesson: _____',
          answer: ['English'],
          ex: '“… we have English in room ten …” → môn đầu là English.',
        },
        {
          type: 'cloze',
          q: 'Room number: _____',
          answer: ['ten', '10'],
          ex: '“… in room ten …” → phòng 10.',
        },
        {
          type: 'cloze',
          q: 'Start time: _____ o’clock',
          answer: ['eight', '8'],
          ex: '“… at eight o’clock.” → 8 giờ.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 4 (Day 11) ─────────────────────────
  // Luyện nói Part 1 — đọc bài mẫu cách trả lời + nghe hỏi-đáp Part 1.
  '2:4': {
    reading: {
      title: 'How to answer Part 1',
      subtitle: 'Đọc mẹo trả lời Speaking Part 1 (74 từ) rồi trả lời câu hỏi',
      // 74 từ — meta về kỹ năng Part 1: trả lời 2–3 câu, thêm lý do/ví dụ.
      text:
        'In a Part 1 interview, the examiner asks simple questions about you. For ' +
        'example, "Do you work or study?" A good answer has two or three sentences. ' +
        'You can say, "I am a student. I study economics at university, and I really ' +
        'enjoy it." Do not answer with only one word. Add a short reason or example. ' +
        'Many learners are nervous, but a calm, clear answer always sounds better than ' +
        'a long, confused one.',
      questions: [
        {
          q: 'How many sentences should a good Part 1 answer have?',
          opts: ['Only one', 'Two or three', 'At least ten', 'None'],
          correct: 1,
          ex: '“A good answer has two or three sentences.”',
        },
        {
          q: 'What should you add after your basic answer?',
          opts: [
            'A long story',
            'A short reason or example',
            'A difficult word',
            'Nothing more',
          ],
          correct: 1,
          ex: '“Add a short reason or example.”',
        },
        {
          q: 'What kind of answer sounds best?',
          opts: [
            'A long, confused one',
            'A one-word answer',
            'A calm, clear one',
            'A very fast one',
          ],
          correct: 2,
          ex: '“… a calm, clear answer always sounds better than a long, confused one.”',
        },
        {
          // Paraphrase: "Do not answer with only one word."
          q: 'What advice does the text give about short answers?',
          opts: [
            'Always answer in one word',
            'Avoid giving one-word answers',
            'Never speak to the examiner',
            'Memorise long introductions',
          ],
          correct: 1,
          ex: '“Do not answer with only one word.” → tránh trả lời cụt lủn một từ.',
        },
      ],
    },

    listening: {
      title: 'A Part 1 interview',
      subtitle: 'Nghe đoạn hỏi-đáp Part 1 — điền MÔN học, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Examiner: Do you work or study? Candidate: I study. I am a second-year student. ' +
        'Examiner: What do you study? Candidate: I study computer science. ' +
        'I like it because it is creative.',
      questions: [
        {
          type: 'cloze',
          q: 'Field of study: _____',
          answer: ['computer science', 'computer-science'],
          ex: '“I study computer science.” → ngành Khoa học máy tính.',
        },
        {
          q: 'What year is the candidate in?',
          opts: ['First year', 'Second year', 'Third year', 'Final year'],
          correct: 1,
          ex: '“I am a second-year student.” → năm thứ hai.',
        },
        {
          q: 'Why does the candidate like the subject?',
          opts: ['It is easy', 'It is creative', 'It is short', 'It pays well'],
          correct: 1,
          ex: '“I like it because it is creative.” → vì nó sáng tạo.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 5 (Day 12) ─────────────────────────
  // "Ngày nạp" — mô tả căn phòng (there is/are) + nghe mô tả phòng (SỐ ĐỒ VẬT).
  '2:5': {
    reading: {
      title: 'My bedroom',
      subtitle: 'Đọc đoạn mô tả một căn phòng (73 từ) rồi trả lời câu hỏi',
      // 73 từ — luyện "there is / there are" + giới từ chỉ vị trí.
      text:
        'My bedroom is small but comfortable. There is a wooden desk near the window, ' +
        'and there are two shelves full of books above it. On the left, there is a ' +
        'narrow bed with a blue blanket. There are some photos of my family on the wall. ' +
        'In the corner, there is an old guitar that I rarely play. The room is quiet in ' +
        'the morning, so it is a good place to study.',
      questions: [
        {
          q: 'What is near the window?',
          opts: ['A bed', 'A wooden desk', 'A guitar', 'A shelf'],
          correct: 1,
          ex: '“There is a wooden desk near the window …”',
        },
        {
          q: 'How many shelves are there?',
          opts: ['One', 'Two', 'Three', 'Four'],
          correct: 1,
          ex: '“… there are two shelves full of books …” → 2 kệ.',
        },
        {
          q: 'What is in the corner of the room?',
          opts: ['A television', 'An old guitar', 'A desk', 'A window'],
          correct: 1,
          ex: '“In the corner, there is an old guitar …”',
        },
        {
          // Paraphrase: "quiet in the morning, so it is a good place to study".
          q: 'Why is the room good for studying?',
          opts: [
            'Because it is large',
            'Because it is quiet in the morning',
            'Because it has a television',
            'Because it is never used',
          ],
          correct: 1,
          ex: '“The room is quiet in the morning, so it is a good place to study.”',
        },
      ],
    },

    listening: {
      title: 'The living room',
      subtitle: 'Điền PHIẾU MÔ TẢ PHÒNG — nghe và viết đúng SỐ LƯỢNG đồ vật',
      audioUrl: null,
      script:
        'This is the living room. There are four chairs and one big table in the middle. ' +
        'There is a television on the wall. The room has two large windows.',
      questions: [
        {
          type: 'cloze',
          q: 'Number of chairs: _____',
          answer: ['four', '4'],
          ex: '“There are four chairs …” → 4.',
        },
        {
          type: 'cloze',
          q: 'Tables in the middle: _____',
          answer: ['one', '1'],
          ex: '“… and one big table in the middle.” → 1.',
        },
        {
          type: 'cloze',
          q: 'Number of windows: _____',
          answer: ['two', '2'],
          ex: '“The room has two large windows.” → 2.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 6 (Day 13) ─────────────────────────
  // "Vườn câu" — đọc về thói quen viết câu sạch lỗi + nghe thầy sửa lỗi (much/many).
  '2:6': {
    reading: {
      title: "Lan's sentence garden",
      subtitle: 'Đọc đoạn về thói quen viết câu sạch lỗi (75 từ) rồi trả lời câu hỏi',
      // 75 từ — tổng hợp tuần: thiếu động từ, "s" số nhiều, danh từ đếm được.
      text:
        'Lan keeps a small "sentence garden" in her notebook. Every day, she writes a ' +
        'few clean sentences and checks three things: the verb, the plural "s", and ' +
        'countable nouns. At first, she wrote, "My sister beautiful," and forgot the ' +
        'verb. Now she writes, "My sister is beautiful," and she is proud of it. She ' +
        'does not write many sentences each day, but each one is correct. Lan believes ' +
        'that slow, careful practice builds strong English.',
      questions: [
        {
          q: 'What three things does Lan check in each sentence?',
          opts: [
            'Spelling, length, and colour',
            'The verb, the plural "s", and countable nouns',
            'The teacher, the topic, and the date',
            'Speaking, reading, and listening',
          ],
          correct: 1,
          ex: '“… checks three things: the verb, the plural “s”, and countable nouns.”',
        },
        {
          q: 'What was wrong with "My sister beautiful"?',
          opts: [
            'It had no verb',
            'It had no subject',
            'It was too long',
            'It had a spelling mistake',
          ],
          correct: 0,
          ex: '“… and forgot the verb.” → câu thiếu động từ (đúng: My sister IS beautiful).',
        },
        {
          q: 'How many sentences does Lan write each day?',
          opts: ['Very many', 'Not many, but correct', 'None', 'Exactly fifty'],
          correct: 1,
          ex: '“She does not write many sentences each day, but each one is correct.”',
        },
        {
          // Paraphrase: "slow, careful practice builds strong English".
          q: 'What does Lan believe about practice?',
          opts: [
            'Fast practice is best',
            'Practising slowly and carefully improves her English',
            'Practice is a waste of time',
            'Only speaking matters',
          ],
          correct: 1,
          ex: '“… slow, careful practice builds strong English.” → luyện chậm và kỹ giúp giỏi lên.',
        },
      ],
    },

    listening: {
      title: 'Fixing a mistake',
      subtitle: 'Nghe thầy sửa lỗi — điền CỤM đúng, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: You wrote, "I have many homework." Remember, homework is uncountable. ' +
        'Student: So I should say "a lot of homework"? Teacher: Yes, exactly. Good correction.',
      questions: [
        {
          type: 'cloze',
          q: 'The correct phrase is: a lot of _____',
          answer: ['homework'],
          ex: '“So I should say a lot of homework?” → a lot of homework.',
        },
        {
          q: 'Why was "many homework" wrong?',
          opts: [
            'Homework is uncountable',
            'Homework is plural',
            '"Many" is not a word',
            'The spelling was wrong',
          ],
          correct: 0,
          ex: '“… homework is uncountable.” → danh từ không đếm được, không dùng “many”.',
        },
        {
          q: "What did the teacher think of the student's correction?",
          opts: ['It was wrong', 'It was good', 'It was too long', 'It was the same'],
          correct: 1,
          ex: '“Yes, exactly. Good correction.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 2 · Buổi 7 (Day 14) ─────────────────────────
  // Tổng hợp tuần — đọc bài nhìn lại tuần 2 + nghe hội thoại tổng kết (SỐ & CHI TIẾT).
  '2:7': {
    reading: {
      title: 'My second week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ hai (76 từ) rồi trả lời câu hỏi',
      // 76 từ — tổng hợp: thiếu be, much/many, sửa lỗi qua sổ lỗi.
      text:
        'This week, I learned how to build clean sentences. On Monday, I often forgot ' +
        'the verb and wrote things like "She tired." Now I always check for a verb ' +
        'first. I also learned the difference between "much" and "many," so I no longer ' +
        'say "many information." My writing is still simple, but it has fewer mistakes. ' +
        'I review my error notebook every evening. I am not perfect yet, but I am ' +
        'clearly better than last week.',
      questions: [
        {
          q: 'What did the writer often forget on Monday?',
          opts: ['The subject', 'The verb', 'The topic', 'The homework'],
          correct: 1,
          ex: '“… I often forgot the verb …” (vd “She tired” thiếu “is”).',
        },
        {
          q: 'What does the writer check first now?',
          opts: ['The spelling', 'A verb', 'The length', 'The date'],
          correct: 1,
          ex: '“Now I always check for a verb first.”',
        },
        {
          q: 'What does the writer do every evening?',
          opts: [
            'Watch television',
            'Review the error notebook',
            'Write fifty sentences',
            'Skip studying',
          ],
          correct: 1,
          ex: '“I review my error notebook every evening.”',
        },
        {
          // Paraphrase: "I am clearly better than last week."
          q: "What is the writer's overall feeling about the week?",
          opts: [
            'No progress was made',
            'There has been clear improvement',
            'English became harder',
            'The week was a waste',
          ],
          correct: 1,
          ex: '“… I am clearly better than last week.” → đã tiến bộ rõ rệt.',
        },
      ],
    },

    listening: {
      title: 'End of week review',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many grammar rules did you practise this week? ' +
        'Student: I practised about five rules. Teacher: And which one was the hardest? ' +
        'Student: Much and many. But I feel more confident now.',
      questions: [
        {
          type: 'cloze',
          q: 'Number of grammar rules practised: about _____',
          answer: ['five', '5'],
          ex: '“I practised about five rules.” → khoảng 5. Cẩn thận five (5) ≠ nine (9).',
        },
        {
          q: 'Which rule was the hardest for the student?',
          opts: ['The verb "be"', 'Much and many', 'Plural "s"', 'There is/are'],
          correct: 1,
          ex: '“… Much and many.” → khó nhất là much/many.',
        },
        {
          q: 'How does the student feel now?',
          opts: ['More confident', 'More tired', 'More nervous', 'Bored'],
          correct: 0,
          ex: '“But I feel more confident now.”',
        },
      ],
    },
  },

  // ═══════════════════════════ TUẦN 3 ═══════════════════════════
  // Trọng tâm: present simple + trạng từ tần suất, câu hỏi wh + do/does, like/love +
  // V-ing, there is/are. Chủ đề: daily routine, food, hobbies, transport. Độ khó NHÍCH
  // hơn Tuần 1–2: đoạn đọc dài hơn (~82–92 từ), câu nghe nhiều chi tiết & suy luận hơn.

  // ───────────────────────── Tuần 3 · Buổi 1 (Day 15) ─────────────────────────
  // Present simple + trạng từ tần suất — đọc về thói quen hằng ngày + nghe GIỜ & TẦN SUẤT.
  '3:1': {
    reading: {
      title: "An's daily routine",
      subtitle: 'Đọc đoạn về thói quen hằng ngày (88 từ) rồi trả lời câu hỏi',
      // 88 từ — dày đặc present simple + trạng từ tần suất (usually/always/rarely/sometimes/never).
      text:
        'An is a nursing student in Da Nang. She follows a simple routine every day. ' +
        'She usually wakes up at half past five and goes for a short run. She always ' +
        'has breakfast at home because she thinks it gives her energy. On weekdays, she ' +
        'rarely watches television; instead, she reviews her notes in the evening. She ' +
        'sometimes feels tired, but she never skips her morning exercise. An believes ' +
        'that a steady routine helps her stay calm and study better.',
      questions: [
        {
          q: 'When does An usually wake up?',
          opts: ['At five o’clock', 'At half past five', 'At six o’clock', 'At half past six'],
          correct: 1,
          ex: '“She usually wakes up at half past five …” → 5:30.',
        },
        {
          q: 'Why does she always have breakfast at home?',
          opts: [
            'Because it is cheaper',
            'Because she has no time to eat out',
            'Because she thinks it gives her energy',
            'Because her family cooks for her',
          ],
          correct: 2,
          ex: '“She always has breakfast at home because she thinks it gives her energy.”',
        },
        {
          q: 'How often does she watch television on weekdays?',
          opts: ['Always', 'Often', 'Rarely', 'Every evening'],
          correct: 2,
          ex: '“… she rarely watches television …” → hiếm khi.',
        },
        {
          // Paraphrase: "a steady routine helps her stay calm and study better".
          q: 'According to An, what does a steady routine do for her?',
          opts: [
            'It makes her very busy',
            'It keeps her relaxed and helps her learn better',
            'It wastes her free time',
            'It makes her skip exercise',
          ],
          correct: 1,
          ex: '“… a steady routine helps her stay calm and study better.” → giúp cô bình tĩnh và học tốt hơn (diễn đạt lại).',
        },
      ],
    },

    listening: {
      title: "Khanh's weekly plan",
      subtitle: 'Điền PHIẾU KẾ HOẠCH — nghe và viết đúng GIỜ và SỐ LẦN mỗi tuần',
      audioUrl: null,
      script:
        'Hello, I am Khanh. On weekdays I get up at six fifteen. ' +
        'I go to the gym three times a week. My first class starts at eight o’clock.',
      questions: [
        {
          type: 'cloze',
          q: 'Wake-up time: _____',
          answer: ['six fifteen', 'six-fifteen', '6:15', '6.15', '6 15'],
          ex: '“I get up at six fifteen.” → 6:15.',
        },
        {
          type: 'cloze',
          q: 'Gym visits per week: _____',
          answer: ['three', '3'],
          ex: '“I go to the gym three times a week.” → 3 lần.',
        },
        {
          type: 'cloze',
          q: 'First class starts at: _____ o’clock',
          answer: ['eight', '8'],
          ex: '“My first class starts at eight o’clock.” → 8 giờ.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 2 (Day 16) ─────────────────────────
  // Câu hỏi wh + do/does — đọc về cách hiểu câu hỏi Part 1 + nghe hỏi-đáp Part 1.
  '3:2': {
    reading: {
      title: 'Listen to the question word',
      subtitle: 'Đọc mẹo hiểu câu hỏi Speaking Part 1 (86 từ) rồi trả lời câu hỏi',
      // 86 từ — meta về câu hỏi wh + do/does; nhắc nghe đúng từ để hỏi.
      text:
        'Speaking Part 1 is really a short interview about your life. The examiner asks ' +
        'simple questions such as "Where do you live?" or "What do you do in your free ' +
        'time?" Many learners panic because they do not listen to the question word. ' +
        'If a question starts with "How often", you should talk about frequency. If it ' +
        'starts with "Why", you must give a reason. A clear, honest answer of two or ' +
        'three sentences is always better than a long memorised speech.',
      questions: [
        {
          q: 'What is Speaking Part 1 really about?',
          opts: [
            'A long formal test',
            'A short interview about your life',
            'A writing exercise',
            'A grammar quiz',
          ],
          correct: 1,
          ex: '“Speaking Part 1 is really a short interview about your life.”',
        },
        {
          q: 'Why do many learners panic?',
          opts: [
            'They speak too fast',
            'They do not listen to the question word',
            'They have no vocabulary',
            'They forget their name',
          ],
          correct: 1,
          ex: '“… they do not listen to the question word.”',
        },
        {
          q: 'If a question starts with "How often", what should you talk about?',
          opts: ['A place', 'A reason', 'Frequency', 'A person'],
          correct: 2,
          ex: '“If a question starts with How often, you should talk about frequency.”',
        },
        {
          // Paraphrase: "A clear, honest answer … is always better than a long memorised speech."
          q: 'What kind of answer does the text recommend?',
          opts: [
            'A long answer learned by heart',
            'A short, genuine answer',
            'A one-word answer',
            'A very fast answer',
          ],
          correct: 1,
          ex: '“A clear, honest answer of two or three sentences is always better than a long memorised speech.” → câu trả lời ngắn, thật lòng.',
        },
      ],
    },

    listening: {
      title: 'Free-time interview',
      subtitle: 'Nghe hỏi-đáp Part 1 — điền HOẠT ĐỘNG, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Examiner: What do you do in your free time? Candidate: I usually play badminton ' +
        'with my friends. Examiner: How often do you play? Candidate: About twice a week. ' +
        'Examiner: Why do you like it? Candidate: Because it helps me relax after class.',
      questions: [
        {
          type: 'cloze',
          q: 'Free-time activity: _____',
          answer: ['badminton'],
          ex: '“I usually play badminton …” → badminton.',
        },
        {
          q: 'How often does the candidate play?',
          opts: ['Every day', 'Twice a week', 'Once a month', 'At weekends only'],
          correct: 1,
          ex: '“About twice a week.” → khoảng hai lần một tuần.',
        },
        {
          q: 'Why does the candidate like it?',
          opts: [
            'It is cheap',
            'It helps him relax after class',
            'It is easy',
            'His friends pay for it',
          ],
          correct: 1,
          ex: '“Because it helps me relax after class.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 3 (Day 17) ─────────────────────────
  // Phòng từ vựng Routine/Food/Hobbies — đọc về nấu ăn + nghe PHIẾU MUA HÀNG.
  '3:3': {
    reading: {
      title: "Huy's favourite hobby",
      subtitle: 'Đọc đoạn về sở thích nấu ăn (88 từ) rồi trả lời câu hỏi',
      // 88 từ — từ vựng Food & Hobbies (eat out, homemade, be into, clear my mind).
      text:
        'Huy loves cooking, and it is his favourite hobby. He rarely eats out because he ' +
        'thinks homemade food is healthier and cheaper. Every Sunday, he goes to the ' +
        'market and buys fresh vegetables and a little meat. He often tries new recipes ' +
        'from the internet, and he is really into spicy dishes. His friends sometimes ' +
        'come over for dinner, and they always enjoy the meal. Huy says that cooking ' +
        'helps him relax and clear his mind after a busy week.',
      questions: [
        {
          q: "What is Huy's favourite hobby?",
          opts: ['Eating out', 'Cooking', 'Shopping', 'Gardening'],
          correct: 1,
          ex: '“Huy loves cooking, and it is his favourite hobby.”',
        },
        {
          q: 'Why does he rarely eat out?',
          opts: [
            'Restaurants are far away',
            'He has no friends',
            'He thinks homemade food is healthier and cheaper',
            'He cannot cook',
          ],
          correct: 2,
          ex: '“… he thinks homemade food is healthier and cheaper.”',
        },
        {
          q: 'What does he buy at the market every Sunday?',
          opts: [
            'Only rice',
            'Fresh vegetables and a little meat',
            'A lot of snacks',
            'Drinks and sweets',
          ],
          correct: 1,
          ex: '“… buys fresh vegetables and a little meat.”',
        },
        {
          // Paraphrase: "cooking helps him relax and clear his mind after a busy week".
          q: 'How does cooking affect Huy?',
          opts: [
            'It makes him tired',
            'It helps him relax and feel less stressed',
            'It costs him a lot of money',
            'It keeps him awake at night',
          ],
          correct: 1,
          ex: '“… cooking helps him relax and clear his mind …” → giúp anh thư giãn, bớt căng thẳng.',
        },
      ],
    },

    listening: {
      title: 'Dinner shopping list',
      subtitle: 'Điền PHIẾU MUA HÀNG — nghe và viết đúng SỐ LƯỢNG (đếm được & không đếm được)',
      audioUrl: null,
      script:
        'Let’s plan dinner. We need two kilos of rice and four eggs. ' +
        'Please also buy one bottle of fish sauce. We do not need much sugar today.',
      questions: [
        {
          type: 'cloze',
          q: 'Rice: _____ kilos',
          answer: ['two', '2'],
          ex: '“We need two kilos of rice …” → 2.',
        },
        {
          type: 'cloze',
          q: 'Eggs: _____',
          answer: ['four', '4'],
          ex: '“… and four eggs.” → 4.',
        },
        {
          type: 'cloze',
          q: 'Bottles of fish sauce: _____',
          answer: ['one', '1'],
          ex: '“… buy one bottle of fish sauce.” → 1. (“sugar” không đếm được → dùng “much”.)',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 4 (Day 18) ─────────────────────────
  // Phát âm & sự tự tin — đọc về âm cuối/trọng âm + nghe PHIẾU CLB nói.
  '3:4': {
    reading: {
      title: 'Why final sounds matter',
      subtitle: 'Đọc đoạn về phát âm và sự tự tin (89 từ) rồi trả lời câu hỏi',
      // 89 từ — chủ đề phát âm: final sounds, word stress, thought groups, confidence.
      text:
        'Many learners are afraid to speak because their mouth is not used to English ' +
        'sounds. Vietnamese speakers often drop final sounds, so "liked" becomes "like" ' +
        'and "books" becomes "book". This small habit can make a sentence hard to ' +
        'understand. A useful method is to read five sentences aloud every day, mark the ' +
        'thought groups, and record yourself once. You do not need a perfect accent. ' +
        'What you really need is clear final sounds, correct word stress, and the ' +
        'confidence to keep talking.',
      questions: [
        {
          q: 'Why are many learners afraid to speak?',
          opts: [
            'They have no ideas',
            'Their mouth is not used to English sounds',
            'They speak too slowly',
            'They know too many words',
          ],
          correct: 1,
          ex: '“… their mouth is not used to English sounds.”',
        },
        {
          q: 'What do Vietnamese speakers often drop?',
          opts: ['First sounds', 'Final sounds', 'Whole words', 'Question words'],
          correct: 1,
          ex: '“Vietnamese speakers often drop final sounds …” (liked → like).',
        },
        {
          q: 'What daily method does the text suggest?',
          opts: [
            'Memorise long speeches',
            'Read five sentences aloud, mark thought groups, and record once',
            'Watch films all day',
            'Speak as fast as possible',
          ],
          correct: 1,
          ex: '“… read five sentences aloud every day, mark the thought groups, and record yourself once.”',
        },
        {
          // Paraphrase: "You do not need a perfect accent. What you really need is …"
          q: 'According to the text, what matters more than a perfect accent?',
          opts: [
            'Speaking very fast',
            'Clear sounds, correct stress, and confidence',
            'Using difficult words',
            'A British accent',
          ],
          correct: 1,
          ex: '“… clear final sounds, correct word stress, and the confidence to keep talking.” → quan trọng hơn giọng chuẩn.',
        },
      ],
    },

    listening: {
      title: 'The speaking club',
      subtitle: 'Điền PHIẾU CLB — nghe và viết đúng THỨ, GIỜ và SỐ PHÒNG',
      audioUrl: null,
      script:
        'Welcome to the speaking club. We meet every Tuesday at four thirty in room nine. ' +
        'The first session focuses on final sounds. Please bring a notebook and a pen.',
      questions: [
        {
          type: 'cloze',
          q: 'Meeting day: _____',
          answer: ['Tuesday'],
          ex: '“We meet every Tuesday …” → thứ Ba.',
        },
        {
          type: 'cloze',
          q: 'Time: _____',
          answer: ['four thirty', 'four-thirty', '4:30', '4.30', '4 30', 'half past four'],
          ex: '“… at four thirty …” → 4:30.',
        },
        {
          type: 'cloze',
          q: 'Room number: _____',
          answer: ['nine', '9'],
          ex: '“… in room nine.” → phòng 9. Cẩn thận nine (9) ≠ five (5).',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 5 (Day 19) ─────────────────────────
  // "Ngày nạp" — Speaking Part 1 khung A-R-E-F: đọc bài mẫu dài + nghe phỏng vấn Part 1.
  '3:5': {
    reading: {
      title: 'The four-step answer',
      subtitle: 'Đọc bài mẫu khung trả lời Part 1 (92 từ) rồi trả lời câu hỏi',
      // 92 từ — khung Answer–Reason–Example–Feeling, đoạn liền mạch hợp ngày đọc to.
      text:
        'A strong Part 1 answer often follows four simple steps: answer, reason, example, ' +
        'and feeling. Imagine the examiner asks, "Do you like reading?" A weak reply is ' +
        'just "Yes, I do." A better reply uses the steps: "Yes, I really enjoy reading. ' +
        'It helps me relax after a long day. For example, I usually read a few pages ' +
        'before bed. It makes me feel calm." There are no difficult words in this answer, ' +
        'but there is a clear path. The examiner can follow your ideas easily, and you ' +
        'sound natural.',
      questions: [
        {
          q: 'How many steps does a strong Part 1 answer follow?',
          opts: ['Two', 'Three', 'Four', 'Five'],
          correct: 2,
          ex: '“… four simple steps: answer, reason, example, and feeling.”',
        },
        {
          q: 'What are the four steps?',
          opts: [
            'Answer, reason, example, feeling',
            'Hello, name, age, goodbye',
            'Read, write, listen, speak',
            'Who, what, when, where',
          ],
          correct: 0,
          ex: '“… answer, reason, example, and feeling.”',
        },
        {
          q: 'What is the example given in the model answer?',
          opts: [
            'Watching a film',
            'Reading a few pages before bed',
            'Going for a run',
            'Cooking dinner',
          ],
          correct: 1,
          ex: '“For example, I usually read a few pages before bed.”',
        },
        {
          // Paraphrase: "There are no difficult words … but there is a clear path."
          q: 'Why is the better answer effective even without difficult words?',
          opts: [
            'Because it is very long',
            'Because it has a clear structure the examiner can follow',
            'Because it uses rare vocabulary',
            'Because it is memorised',
          ],
          correct: 1,
          ex: '“There are no difficult words … but there is a clear path.” → nhờ có cấu trúc rõ ràng.',
        },
      ],
    },

    listening: {
      title: 'A Part 1 interview',
      subtitle: 'Điền PHIẾU PHỎNG VẤN — nghe quê quán, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Examiner: Where are you from? Candidate: I am from Hai Duong, a small city in the ' +
        'north. Examiner: Do you like your hometown? Candidate: Yes, I do, because it is ' +
        'quiet and friendly. Examiner: Would you like to live there in the future? ' +
        'Candidate: Probably not. I prefer big cities.',
      questions: [
        {
          type: 'cloze',
          q: 'Hometown: _____',
          answer: ['Hai Duong'],
          ex: '“I am from Hai Duong …” → Hải Dương.',
        },
        {
          q: 'Why does the candidate like the hometown?',
          opts: [
            'It is big and modern',
            'It is quiet and friendly',
            'It has many shops',
            'It is near the sea',
          ],
          correct: 1,
          ex: '“… because it is quiet and friendly.”',
        },
        {
          q: 'Does the candidate want to live there in the future?',
          opts: [
            'Yes, definitely',
            'Probably not — they prefer big cities',
            'Only in summer',
            'We do not know',
          ],
          correct: 1,
          ex: '“Probably not. I prefer big cities.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 6 (Day 20) ─────────────────────────
  // Ngày sản phẩm: đoạn 80 từ về một ngày — đọc bài mẫu + nghe THỜI GIAN BIỂU.
  '3:6': {
    reading: {
      title: 'A normal day in my life',
      subtitle: 'Đọc đoạn mẫu "một ngày của tôi" (90 từ) rồi trả lời câu hỏi',
      // 90 từ — bài mẫu present simple + tần suất, làm chuẩn cho sản phẩm 80 từ của Day 20.
      text:
        'This is a normal day in my life. I usually wake up at six and drink a glass of ' +
        'water. Then I get ready for school and take the bus at seven. In the morning, I ' +
        'have three classes, and I always pay attention to the teacher. At lunchtime, I ' +
        'eat with my friends in the canteen. In the afternoon, I do my homework and ' +
        'sometimes go for a walk. In the evening, I review new words. I rarely stay up ' +
        'late because I need enough sleep.',
      questions: [
        {
          q: 'What does the writer drink after waking up?',
          opts: ['A cup of coffee', 'A glass of water', 'Some milk', 'Tea'],
          correct: 1,
          ex: '“… wake up at six and drink a glass of water.”',
        },
        {
          q: 'How does the writer go to school?',
          opts: ['On foot', 'By bus', 'By bike', 'By car'],
          correct: 1,
          ex: '“… take the bus at seven.” → đi xe buýt.',
        },
        {
          q: 'What does the writer do in the evening?',
          opts: ['Watch films', 'Review new words', 'Go for a walk', 'Cook dinner'],
          correct: 1,
          ex: '“In the evening, I review new words.”',
        },
        {
          // Paraphrase: "I rarely stay up late because I need enough sleep."
          q: 'Why does the writer rarely stay up late?',
          opts: [
            'Because the writer is lazy',
            'Because the writer needs enough rest',
            'Because there is no electricity',
            'Because friends call early',
          ],
          correct: 1,
          ex: '“I rarely stay up late because I need enough sleep.” → cần nghỉ ngơi đủ.',
        },
      ],
    },

    listening: {
      title: 'A typical work day',
      subtitle: 'Điền THỜI GIAN BIỂU — nghe và viết đúng GIỜ và SỐ LẦN mỗi tuần',
      audioUrl: null,
      script:
        'On a typical day, I start work at nine in the morning. I take a lunch break at ' +
        'twelve thirty. I finish at five and go to an English class twice a week.',
      questions: [
        {
          type: 'cloze',
          q: 'Work start time: _____ o’clock',
          answer: ['nine', '9'],
          ex: '“I start work at nine in the morning.” → 9 giờ.',
        },
        {
          type: 'cloze',
          q: 'Lunch break: _____',
          answer: ['twelve thirty', 'twelve-thirty', '12:30', '12.30', '12 30', 'half past twelve'],
          ex: '“… a lunch break at twelve thirty.” → 12:30.',
        },
        {
          type: 'cloze',
          q: 'English classes per week: _____',
          answer: ['twice', 'two', '2'],
          ex: '“… an English class twice a week.” → 2 lần.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 3 · Buổi 7 (Day 21) ─────────────────────────
  // Tổng hợp tuần — đọc bài nhìn lại tuần 3 + nghe hội thoại tổng kết (SỐ & CHI TIẾT).
  '3:7': {
    reading: {
      title: 'My third week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ ba (92 từ) rồi trả lời câu hỏi',
      // 92 từ — tổng hợp: present simple + tần suất + câu hỏi Part 1 + phát âm.
      text:
        'This was my third week of English, and it was about my daily life. At the start, ' +
        'I could only say short sentences like "I study English." Now I can describe a ' +
        'whole day using frequency words such as usually, often, and rarely. I also ' +
        'learned to ask and answer simple questions in Speaking Part 1. My pronunciation ' +
        'is still not perfect, especially the final sounds, but I practise every evening. ' +
        'I am not fluent yet, but I can finally talk about myself for almost ninety ' +
        'seconds without stopping.',
      questions: [
        {
          q: 'What was the third week about?',
          opts: ['Travel', 'Daily life', 'Business', 'History'],
          correct: 1,
          ex: '“… it was about my daily life.”',
        },
        {
          q: 'What frequency words did the writer learn?',
          opts: [
            'always, never, soon',
            'usually, often, rarely',
            'here, there, now',
            'first, next, finally',
          ],
          correct: 1,
          ex: '“… using frequency words such as usually, often, and rarely.”',
        },
        {
          q: 'What is still not perfect?',
          opts: ['Grammar', 'Pronunciation, especially final sounds', 'Vocabulary', 'Reading'],
          correct: 1,
          ex: '“My pronunciation is still not perfect, especially the final sounds …”',
        },
        {
          // Paraphrase: "I can finally talk about myself for almost ninety seconds without stopping."
          q: 'What can the writer finally do at the end of the week?',
          opts: [
            'Write a long essay',
            'Speak about themselves for about 90 seconds without stopping',
            'Pass an exam easily',
            'Teach other students',
          ],
          correct: 1,
          ex: '“… I can finally talk about myself for almost ninety seconds without stopping.” → nói về bản thân ~90 giây liền mạch.',
        },
      ],
    },

    listening: {
      title: 'End of week chat',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many seconds can you speak about your day now? ' +
        'Student: About ninety seconds without stopping. Teacher: That is great progress. ' +
        'Do you feel more confident? Student: Yes, I do. Frequency words really helped me.',
      questions: [
        {
          type: 'cloze',
          q: 'Speaking time now: about _____ seconds',
          answer: ['ninety', '90'],
          ex: '“About ninety seconds without stopping.” → 90. Cẩn thận ninety (90) ≠ nineteen (19).',
        },
        {
          q: 'What does the teacher think of the progress?',
          opts: ['It is poor', 'It is great', 'It is too slow', 'It is enough'],
          correct: 1,
          ex: '“That is great progress.”',
        },
        {
          q: 'What helped the student most?',
          opts: ['Difficult words', 'Frequency words', 'Long speeches', 'Reading aloud'],
          correct: 1,
          ex: '“Frequency words really helped me.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 1 (Day 22) ─────────────────────────
  // Past simple (kể việc đã xong) — đọc chuyện quá khứ + nghe SỰ KIỆN & GIỜ đã qua.
  '4:1': {
    reading: {
      title: 'My busy Saturday',
      subtitle: 'Đọc đoạn kể lại một ngày đã qua (86 từ) rồi trả lời câu hỏi',
      // 86 từ — dày đặc past simple, cả động từ đều/bất quy tắc, dấu hiệu thời gian rõ.
      text:
        'Last Saturday was a busy day for me. I woke up early and went for a short run ' +
        'near my house. After that, I had breakfast with my family and helped my mother ' +
        'clean the kitchen. In the afternoon, I met my friend Lan at a small café, and we ' +
        'talked about our exams. We did not stay long because it started to rain. In the ' +
        'evening, I watched a movie and went to bed at ten. I did not have much free time, ' +
        'but I felt happy about the day.',
      questions: [
        {
          q: 'What did the writer do early in the morning?',
          opts: ['Watched a movie', 'Went for a short run', 'Cleaned the kitchen', 'Met a friend'],
          correct: 1,
          ex: '“I woke up early and went for a short run …”',
        },
        {
          q: 'Where did the writer meet Lan?',
          opts: ['At school', 'At a small café', 'At home', 'At the park'],
          correct: 1,
          ex: '“I met my friend Lan at a small café …”',
        },
        {
          q: 'Why did they not stay long at the café?',
          opts: ['They had no money', 'It started to rain', 'The café closed', 'They were tired'],
          correct: 1,
          ex: '“We did not stay long because it started to rain.”',
        },
        {
          // Paraphrase: "I did not have much free time, but I felt happy about the day."
          q: 'How did the writer feel about the day overall?',
          opts: [
            'Bored and tired',
            'Busy but happy',
            'Angry about the rain',
            'Worried about exams',
          ],
          correct: 1,
          ex: '“I did not have much free time, but I felt happy about the day.” → bận nhưng vui.',
        },
      ],
    },

    listening: {
      title: "Nam's weekend recap",
      subtitle: 'Điền PHIẾU SỰ KIỆN — nghe và viết đúng GIỜ và SỐ NGƯỜI đã tham gia',
      audioUrl: null,
      script:
        'Hi, I am Nam. Last Sunday, I visited my grandparents. I arrived at their house at ' +
        'two o’clock. We had lunch together, and five people joined the meal. I left at six ' +
        'in the evening.',
      questions: [
        {
          type: 'cloze',
          q: 'Arrival time: _____ o’clock',
          answer: ['two', '2'],
          ex: '“I arrived at their house at two o’clock.” → 2 giờ.',
        },
        {
          type: 'cloze',
          q: 'People at lunch: _____',
          answer: ['five', '5'],
          ex: '“… five people joined the meal.” → 5 người.',
        },
        {
          q: 'What time did Nam leave?',
          opts: ['Two o’clock', 'Five o’clock', 'Six o’clock', 'Seven o’clock'],
          correct: 2,
          ex: '“I left at six in the evening.” → 6 giờ tối.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 2 (Day 23) ─────────────────────────
  // Present continuous — đọc cảnh đang diễn ra + nghe MÔ TẢ hoạt động hiện tại.
  '4:2': {
    reading: {
      title: 'Right now at the language centre',
      subtitle: 'Đọc đoạn mô tả cảnh đang diễn ra (85 từ) rồi trả lời câu hỏi',
      // 85 từ — dày đặc present continuous (am/is/are + V-ing).
      text:
        'It is seven in the evening, and the language centre is very busy right now. In ' +
        'room one, a teacher is explaining a new grammar point, and the students are ' +
        'taking notes carefully. Outside, two boys are practising speaking near the ' +
        'window, and they are laughing at their own mistakes. In the office, the ' +
        'receptionist is answering phone calls, and she is also preparing schedules for ' +
        'next week. Everyone is working hard because the exam is coming soon.',
      questions: [
        {
          q: 'What is happening in room one?',
          opts: [
            'Students are having a break',
            'A teacher is explaining a new grammar point',
            'The teacher is asleep',
            'Students are eating lunch',
          ],
          correct: 1,
          ex: '“… a teacher is explaining a new grammar point …”',
        },
        {
          q: 'What are the two boys doing outside?',
          opts: [
            'Practising speaking and laughing',
            'Sleeping on a bench',
            'Reading textbooks quietly',
            'Waiting for a bus',
          ],
          correct: 0,
          ex: '“… two boys are practising speaking near the window, and they are laughing …”',
        },
        {
          q: 'What is the receptionist doing?',
          opts: [
            'Cleaning the office',
            'Teaching a class',
            'Answering calls and preparing schedules',
            'Reading a book',
          ],
          correct: 2,
          ex: '“… the receptionist is answering phone calls, and she is also preparing schedules …”',
        },
        {
          // Paraphrase: "Everyone is working hard because the exam is coming soon."
          q: 'Why is everyone working hard?',
          opts: [
            'Because the centre is closing',
            'Because the exam is coming soon',
            'Because it is a holiday',
            'Because a guest is visiting',
          ],
          correct: 1,
          ex: '“Everyone is working hard because the exam is coming soon.” → kỳ thi sắp đến.',
        },
      ],
    },

    listening: {
      title: 'What are you doing?',
      subtitle: 'Điền PHIẾU HOẠT ĐỘNG — nghe và viết đúng HOẠT ĐỘNG đang diễn ra',
      audioUrl: null,
      script:
        'Phone call: Hi, what are you doing right now? I am cooking dinner in the kitchen. ' +
        'My brother is doing his homework, and our cat is sleeping on the sofa.',
      questions: [
        {
          type: 'cloze',
          q: 'Speaker is: _____ dinner',
          answer: ['cooking'],
          ex: '“I am cooking dinner …” → đang nấu bữa tối.',
        },
        {
          type: 'cloze',
          q: 'Brother is doing: _____',
          answer: ['homework', 'his homework'],
          ex: '“My brother is doing his homework …”',
        },
        {
          q: 'Where is the cat sleeping?',
          opts: ['On the bed', 'On the sofa', 'Under the table', 'In the kitchen'],
          correct: 1,
          ex: '“… our cat is sleeping on the sofa.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 3 (Day 24) ─────────────────────────
  // Future (going to/will) + từ vựng Transport — đọc kế hoạch chuyến đi + nghe THÔNG BÁO chuyến đi.
  '4:3': {
    reading: {
      title: 'My trip next month',
      subtitle: 'Đọc đoạn về kế hoạch tương lai và giao thông (87 từ) rồi trả lời câu hỏi',
      // 87 từ — dày đặc going to/will + từ vựng Transport (ticket, journey, delay, destination).
      text:
        'Next month, I am going to travel to Hue with my family. We are going to book the ' +
        'train tickets this weekend because they are usually cheaper in advance. Our ' +
        'destination is a small hotel near the citadel. I think the journey will take about ' +
        'three hours, but there might be a short delay if the weather is bad. My father ' +
        'will drive us to the station early in the morning. I am really excited because I ' +
        'have never travelled by train before.',
      questions: [
        {
          q: 'Where is the writer going to travel next month?',
          opts: ['Hanoi', 'Hue', 'Da Nang', 'Sai Gon'],
          correct: 1,
          ex: '“Next month, I am going to travel to Hue with my family.”',
        },
        {
          q: 'Why are they going to book tickets this weekend?',
          opts: [
            'Because the station is closing',
            'Because tickets are usually cheaper in advance',
            'Because the train is full',
            'Because they forgot last week',
          ],
          correct: 1,
          ex: '“… because they are usually cheaper in advance.”',
        },
        {
          q: 'How long does the writer think the journey will take?',
          opts: ['One hour', 'Two hours', 'About three hours', 'A whole day'],
          correct: 2,
          ex: '“I think the journey will take about three hours …”',
        },
        {
          // Paraphrase: "I am really excited because I have never travelled by train before."
          q: 'Why is the writer excited about the trip?',
          opts: [
            'It will be a first-time train journey',
            'The hotel is very cheap',
            'The family travels every month',
            'The weather will be perfect',
          ],
          correct: 0,
          ex: '“I am really excited because I have never travelled by train before.” → lần đầu đi tàu.',
        },
      ],
    },

    listening: {
      title: 'Station announcement',
      subtitle: 'Điền PHIẾU CHUYẾN ĐI — nghe và viết đúng GIỜ, SỐ TOA và ĐIỂM ĐẾN',
      audioUrl: null,
      script:
        'Attention, please. The train to Hue will leave at nine fifteen from platform two. ' +
        'Passengers with a ticket for carriage six should board now. We are sorry for the ' +
        'short delay.',
      questions: [
        {
          type: 'cloze',
          q: 'Departure time: _____',
          answer: ['nine fifteen', 'nine-fifteen', '9:15', '9.15', '9 15'],
          ex: '“The train to Hue will leave at nine fifteen …”',
        },
        {
          type: 'cloze',
          q: 'Platform number: _____',
          answer: ['two', '2'],
          ex: '“… from platform two.” → sân ga số 2.',
        },
        {
          type: 'cloze',
          q: 'Carriage number: _____',
          answer: ['six', '6'],
          ex: '“Passengers with a ticket for carriage six …” → toa số 6.',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 4 (Day 25) ─────────────────────────
  // Luyện nói kể chuyện quá khứ — đọc mẫu chuyện chuyến đi + nghe kể chuyện QUÁ KHỨ.
  '4:4': {
    reading: {
      title: 'A trip I will never forget',
      subtitle: 'Đọc mẫu kể chuyện quá khứ (90 từ) rồi trả lời câu hỏi',
      // 90 từ — mẫu kể chuyện quá khứ dùng cho Day 25 (nói) với trình tự rõ ràng.
      text:
        'Two years ago, I went on a trip to Da Lat with my classmates. We took a bus early ' +
        'in the morning, and the journey took about seven hours. When we arrived, the ' +
        'weather was cool, and everyone felt excited. We visited a flower garden first, ' +
        'and then we had lunch near a lake. In the afternoon, we walked around the market ' +
        'and bought some souvenirs. I felt tired but very happy because I made many new ' +
        'memories with my friends that day.',
      questions: [
        {
          q: 'How did the writer travel to Da Lat?',
          opts: ['By train', 'By bus', 'By motorbike', 'By plane'],
          correct: 1,
          ex: '“We took a bus early in the morning …”',
        },
        {
          q: 'What did they do first after arriving?',
          opts: [
            'Had lunch near a lake',
            'Visited a flower garden',
            'Walked around the market',
            'Went to sleep',
          ],
          correct: 1,
          ex: '“We visited a flower garden first, and then we had lunch near a lake.”',
        },
        {
          q: 'What did they do in the afternoon?',
          opts: [
            'Went back home',
            'Walked around the market and bought souvenirs',
            'Stayed at the hotel',
            'Visited another city',
          ],
          correct: 1,
          ex: '“In the afternoon, we walked around the market and bought some souvenirs.”',
        },
        {
          // Paraphrase: "I felt tired but very happy because I made many new memories..."
          q: 'How did the writer feel at the end of the trip?',
          opts: [
            'Bored and disappointed',
            'Tired but happy about the memories',
            'Angry with friends',
            'Worried about money',
          ],
          correct: 1,
          ex: '“I felt tired but very happy because I made many new memories with my friends …”',
        },
      ],
    },

    listening: {
      title: 'Telling a story about last summer',
      subtitle: 'Điền PHIẾU CHUYẾN ĐI — nghe và viết đúng ĐỊA ĐIỂM và SỐ NGÀY',
      audioUrl: null,
      script:
        'Last summer, I visited Nha Trang with my family. We stayed there for four days. ' +
        'We swam in the sea every morning, and we tried fresh seafood every evening.',
      questions: [
        {
          type: 'cloze',
          q: 'Place visited: _____',
          answer: ['Nha Trang'],
          ex: '“I visited Nha Trang with my family.”',
        },
        {
          type: 'cloze',
          q: 'Number of days: _____',
          answer: ['four', '4'],
          ex: '“We stayed there for four days.” → 4 ngày.',
        },
        {
          q: 'What did they do every morning?',
          opts: [
            'Swam in the sea',
            'Visited a market',
            'Slept late',
            'Went shopping',
          ],
          correct: 0,
          ex: '“We swam in the sea every morning …”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 5 (Day 26) ─────────────────────────
  // Chuẩn bị truyện tranh "my worst Monday" — đọc mẫu "ngày tệ nhất" + nghe kể chuyện xui xẻo.
  '4:5': {
    reading: {
      title: 'My worst Monday',
      subtitle: 'Đọc mẫu chuyện "ngày thứ Hai tệ nhất" (88 từ) rồi trả lời câu hỏi',
      // 88 từ — mẫu trực tiếp cho nhiệm vụ "my worst Monday" (Day 26-27), past simple liên tiếp.
      text:
        'Last Monday was terrible for me. First, I woke up late because my alarm did not ' +
        'ring. Then I missed the bus, so I had to walk to school in the rain. When I ' +
        'arrived, I realised I forgot my homework at home, and my teacher was not happy. ' +
        'After that, I lost my pen during the test, and I felt very stressed. Finally, I ' +
        'got home, ate a quick dinner, and went to bed early. It was a bad day, but I ' +
        'learned to prepare my bag the night before.',
      questions: [
        {
          q: 'Why did the writer wake up late?',
          opts: [
            'The alarm did not ring',
            'The writer slept too early',
            'The phone was broken',
            'It was a holiday',
          ],
          correct: 0,
          ex: '“I woke up late because my alarm did not ring.”',
        },
        {
          q: 'How did the writer get to school after missing the bus?',
          opts: ['By taxi', 'By motorbike', 'On foot, in the rain', 'By bicycle'],
          correct: 2,
          ex: '“I missed the bus, so I had to walk to school in the rain.”',
        },
        {
          q: 'What did the writer forget at home?',
          opts: ['A pen', 'Homework', 'A phone', 'Lunch'],
          correct: 1,
          ex: '“… I realised I forgot my homework at home …”',
        },
        {
          // Paraphrase: "It was a bad day, but I learned to prepare my bag the night before."
          q: 'What lesson did the writer learn from the bad day?',
          opts: [
            'To skip school on Mondays',
            'To pack the bag the night before',
            'To buy a new alarm clock',
            'To avoid taking tests',
          ],
          correct: 1,
          ex: '“… I learned to prepare my bag the night before.” → chuẩn bị cặp từ tối hôm trước.',
        },
      ],
    },

    listening: {
      title: 'A really bad day',
      subtitle: 'Điền PHIẾU SỰ CỐ — nghe và viết đúng GIỜ và SỐ LẦN gặp sự cố',
      audioUrl: null,
      script:
        'Yesterday was awful. I woke up at eight, but my class started at eight fifteen, ' +
        'so I was late. I also lost my keys twice during the day. I felt really unlucky.',
      questions: [
        {
          type: 'cloze',
          q: 'Class start time: _____',
          answer: ['eight fifteen', 'eight-fifteen', '8:15', '8.15', '8 15'],
          ex: '“… my class started at eight fifteen …”',
        },
        {
          type: 'cloze',
          q: 'Times keys were lost: _____',
          answer: ['twice', 'two', '2'],
          ex: '“I also lost my keys twice during the day.” → 2 lần.',
        },
        {
          q: 'How did the speaker feel about the day?',
          opts: ['Lucky', 'Unlucky', 'Relaxed', 'Proud'],
          correct: 1,
          ex: '“I felt really unlucky.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 6 (Day 27) ─────────────────────────
  // Ngày sản phẩm: đoạn quá khứ 8-10 câu — đọc mẫu chuyện hoàn chỉnh + nghe kể lại có trình tự.
  '4:6': {
    reading: {
      title: 'The day I lost my phone',
      subtitle: 'Đọc mẫu đoạn quá khứ hoàn chỉnh (91 từ) rồi trả lời câu hỏi',
      // 91 từ — mẫu 8-10 câu past simple với từ nối trình tự (first, then, after that, finally).
      text:
        'Last Friday, I lost my phone, and it was a stressful experience. First, I finished ' +
        'my classes and went to the library to study. Then I put my phone on the table and ' +
        'started reading. After an hour, I packed my bag and left, but I forgot my phone ' +
        'there. When I got home, I could not find it anywhere. I called the library ' +
        'immediately, and luckily, a librarian had kept it safe. Finally, I went back and ' +
        'collected my phone before it closed. I learned to always check my bag carefully.',
      questions: [
        {
          q: 'Where did the writer leave the phone?',
          opts: ['At home', 'On a bus', 'At the library', 'In a café'],
          correct: 2,
          ex: '“… I put my phone on the table and started reading.” (tại thư viện)',
        },
        {
          q: 'What did the writer do when they could not find the phone at home?',
          opts: [
            'Bought a new phone',
            'Called the library immediately',
            'Gave up looking for it',
            'Went to the police',
          ],
          correct: 1,
          ex: '“I called the library immediately …”',
        },
        {
          q: 'Who kept the phone safe?',
          opts: ['A classmate', 'A librarian', 'A security guard', 'A stranger'],
          correct: 1,
          ex: '“… luckily, a librarian had kept it safe.”',
        },
        {
          // Paraphrase: "I learned to always check my bag carefully."
          q: 'What did the writer learn from this experience?',
          opts: [
            'To avoid libraries',
            'To always check the bag carefully',
            'To buy a phone case',
            'To study less',
          ],
          correct: 1,
          ex: '“I learned to always check my bag carefully.” → luôn kiểm tra cặp cẩn thận.',
        },
      ],
    },

    listening: {
      title: 'Retelling a past event',
      subtitle: 'Điền PHIẾU TRÌNH TỰ — nghe và viết đúng THỨ TỰ SỰ KIỆN và GIỜ',
      audioUrl: null,
      script:
        'First, I woke up at six thirty. Then I went for a jog for thirty minutes. After ' +
        'that, I had breakfast and left for work at seven forty-five.',
      questions: [
        {
          type: 'cloze',
          q: 'Wake-up time: _____',
          answer: ['six thirty', 'six-thirty', '6:30', '6.30', '6 30', 'half past six'],
          ex: '“First, I woke up at six thirty.”',
        },
        {
          type: 'cloze',
          q: 'Jog duration: _____ minutes',
          answer: ['thirty', '30'],
          ex: '“Then I went for a jog for thirty minutes.” → 30 phút.',
        },
        {
          type: 'cloze',
          q: 'Left for work at: _____',
          answer: ['seven forty-five', 'seven forty five', '7:45', '7.45', '7 45'],
          ex: '“… left for work at seven forty-five.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 4 · Buổi 7 (Day 28) ─────────────────────────
  // Tổng hợp tuần — đọc bài nhìn lại tuần 4 + nghe hội thoại tổng kết ba thì.
  '4:7': {
    reading: {
      title: 'My fourth week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ tư (91 từ) rồi trả lời câu hỏi',
      // 91 từ — tổng hợp past simple + present continuous + future, chủ đề "kiểm soát thời gian".
      text:
        'This was my fourth week of English, and it was about controlling time. I learned ' +
        'to talk about the past using verbs like went, had, and did not. I also practised ' +
        'present continuous to describe what is happening right now, such as "I am ' +
        'studying." For the future, I learned that going to is for plans, and will is for ' +
        'quick decisions or predictions. My biggest achievement was writing a short story ' +
        'about my worst Monday. I am not perfect yet, but I can finally control three ' +
        'different times in English.',
      questions: [
        {
          q: 'What was the fourth week mainly about?',
          opts: ['Controlling time', 'Food and cooking', 'Making friends', 'Grammar for exams'],
          correct: 0,
          ex: '“… it was about controlling time.”',
        },
        {
          q: 'Which verbs did the writer mention for the past?',
          opts: [
            'am, is, are',
            'went, had, did not',
            'will, going to',
            'like, love, hate',
          ],
          correct: 1,
          ex: '“I learned to talk about the past using verbs like went, had, and did not.”',
        },
        {
          q: 'According to the writer, when should we use "will"?',
          opts: [
            'For fixed plans only',
            'For quick decisions or predictions',
            'For past actions',
            'For actions happening right now',
          ],
          correct: 1,
          ex: '“… will is for quick decisions or predictions.”',
        },
        {
          // Paraphrase: "I can finally control three different times in English."
          q: 'What can the writer finally do by the end of the week?',
          opts: [
            'Write a novel',
            'Use past, present continuous, and future confidently',
            'Translate for a living',
            'Teach grammar to others',
          ],
          correct: 1,
          ex: '“… I can finally control three different times in English.” → làm chủ ba thì.',
        },
      ],
    },

    listening: {
      title: 'End of week four chat',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many sentences can you write about a past event now? ' +
        'Student: About ten sentences without stopping. Teacher: That is great progress. ' +
        'Are you going to keep practising next week? Student: Yes, I am. I will focus on irregular verbs.',
      questions: [
        {
          type: 'cloze',
          q: 'Sentences about a past event now: about _____',
          answer: ['ten', '10'],
          ex: '“About ten sentences without stopping.” → 10 câu.',
        },
        {
          q: 'What does the teacher think of the progress?',
          opts: ['It is poor', 'It is great', 'It is too slow', 'It is enough'],
          correct: 1,
          ex: '“That is great progress.”',
        },
        {
          q: 'What will the student focus on next?',
          opts: ['Irregular verbs', 'Present simple', 'Listening skills', 'Vocabulary games'],
          correct: 0,
          ex: '“I will focus on irregular verbs.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 1 (Day 29) ─────────────────────────
  // Từ nối because / so / but — đọc đoạn dùng connectors + nghe hội thoại lý do/kết quả.
  '5:1': {
    reading: {
      title: 'Why I like my new school',
      subtitle: 'Đọc đoạn dùng because/so/but (82 từ) rồi trả lời câu hỏi',
      // 82 từ — dày đặc because/so/but, chủ đề trường học/thói quen.
      text:
        'I moved to a new school last year, and I like it here because the teachers are ' +
        'friendly. The lessons are sometimes difficult, but I always ask questions when ' +
        'I do not understand. I was nervous on the first day, so I stayed quiet in class. ' +
        'Now I have several close friends, so I feel more confident. The school is far ' +
        'from my house, but I do not mind because I can read on the bus. I am happy ' +
        'because I made the right choice.',
      questions: [
        {
          q: 'Why does the writer like the new school?',
          opts: [
            'Because it is close to home',
            'Because the teachers are friendly',
            'Because the lessons are easy',
            'Because it has a bus service',
          ],
          correct: 1,
          ex: '“I like it here because the teachers are friendly.”',
        },
        {
          q: 'What did the writer do on the first day?',
          opts: ['Made many friends', 'Stayed quiet in class', 'Skipped class', 'Asked the teacher for help'],
          correct: 1,
          ex: '“I was nervous on the first day, so I stayed quiet in class.”',
        },
        {
          q: 'Why does the writer not mind the school being far from home?',
          opts: [
            'Because a friend drives them',
            'Because they can read on the bus',
            'Because the bus is fast',
            'Because they live near the bus stop',
          ],
          correct: 1,
          ex: '“… but I do not mind because I can read on the bus.”',
        },
        {
          // Paraphrase: "I am happy because I made the right choice."
          q: 'How does the writer feel about moving to the new school?',
          opts: [
            'Regretful about the decision',
            'Satisfied with the decision',
            'Confused about the decision',
            'Indifferent to the decision',
          ],
          correct: 1,
          ex: '“I am happy because I made the right choice.” → hài lòng với lựa chọn của mình.',
        },
      ],
    },

    listening: {
      title: 'A short conversation about a test',
      subtitle: 'Nghe hội thoại dùng because/so/but — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How was your test? B: It was hard, but I think I passed. A: Why do you think so? ' +
        'B: Because I studied every night this week. A: That is great. B: Yes, I was tired, ' +
        'so I went to bed early yesterday.',
      questions: [
        {
          type: 'cloze',
          q: 'B thinks the test result is good "_____ I studied every night this week."',
          answer: ['because'],
          ex: '“Because I studied every night this week.” → vì.',
        },
        {
          q: 'How did B describe the test?',
          opts: ['Easy', 'Hard, but passable', 'Cancelled', 'Too long'],
          correct: 1,
          ex: '“It was hard, but I think I passed.”',
        },
        {
          q: 'Why did B go to bed early yesterday?',
          opts: ['B had a test in the morning', 'B was tired', 'B was bored', 'B had no homework'],
          correct: 1,
          ex: '“I was tired, so I went to bed early yesterday.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 2 (Day 30) ─────────────────────────
  // Although / when / if + đại từ tham chiếu — đọc đoạn mệnh đề phụ + nghe hội thoại.
  '5:2': {
    reading: {
      title: 'My hometown, although it is small',
      subtitle: 'Đọc đoạn dùng although/when/if + đại từ (85 từ) rồi trả lời câu hỏi',
      // 85 từ — dày đặc although/when/if và đại từ tham chiếu it/they/this.
      text:
        'Although my hometown is small, I really love it. When I have free time, I like ' +
        'to walk around the old market near my house. It sells fresh fruit and vegetables ' +
        'every morning, and local people say it is the heart of the town. If visitors come ' +
        'to my hometown, I always take them there first. Although the town does not have ' +
        'many modern buildings, this makes it feel peaceful. When people ask about my ' +
        'hometown, I always smile and talk about it proudly.',
      questions: [
        {
          q: 'How does the writer feel about their hometown, although it is small?',
          opts: ['Bored', 'They love it', 'Ashamed', 'Indifferent'],
          correct: 1,
          ex: '“Although my hometown is small, I really love it.”',
        },
        {
          q: 'What does the writer like to do when they have free time?',
          opts: [
            'Stay at home',
            'Walk around the old market',
            'Visit another city',
            'Watch television',
          ],
          correct: 1,
          ex: '“When I have free time, I like to walk around the old market …”',
        },
        {
          q: 'What does "it" refer to in "local people say it is the heart of the town"?',
          opts: ['The house', 'The old market', 'The town', 'The visitor'],
          correct: 1,
          ex: '“… the old market … It sells fresh fruit and vegetables … local people say it is the heart of the town.”',
        },
        {
          // Paraphrase: "this makes it feel peaceful" (few modern buildings -> peaceful).
          q: 'According to the writer, why does the hometown feel peaceful?',
          opts: [
            'Because it has many modern buildings',
            'Because it does not have many modern buildings',
            'Because it is far from the city',
            'Because there are no visitors',
          ],
          correct: 1,
          ex: '“Although the town does not have many modern buildings, this makes it feel peaceful.”',
        },
      ],
    },

    listening: {
      title: 'Talking about a festival',
      subtitle: 'Nghe hội thoại dùng although/when/if — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Do you like the summer festival? B: Yes, although it is very crowded. A: When does ' +
        'it usually start? B: It usually starts at six in the evening. A: If I go this year, ' +
        'will you come with me? B: Yes, I will. I never miss it.',
      questions: [
        {
          type: 'cloze',
          q: 'B likes the festival "_____ it is very crowded."',
          answer: ['although'],
          ex: '“Yes, although it is very crowded.” → mặc dù.',
        },
        {
          q: 'When does the festival usually start?',
          opts: ['At five in the evening', 'At six in the evening', 'At seven in the morning', 'At noon'],
          correct: 1,
          ex: '“It usually starts at six in the evening.”',
        },
        {
          q: 'What does B say about attending the festival every year?',
          opts: ['B often forgets it', 'B never misses it', 'B dislikes it', 'B only goes sometimes'],
          correct: 1,
          ex: '“I never miss it.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 3 (Day 31) ─────────────────────────
  // Từ vựng City & Culture/Media — đọc đoạn dùng cụm từ vựng + nghe hội thoại.
  '5:3': {
    reading: {
      title: 'City life and culture',
      subtitle: 'Đọc đoạn dùng từ vựng City & Culture (84 từ) rồi trả lời câu hỏi',
      // 84 từ — dùng traffic jam, green space, festival, social media, celebrity...
      text:
        'Living in a big city has both good and bad sides. There are many facilities, but ' +
        'the traffic jam every morning makes people tired before work even starts. ' +
        'Fortunately, the city government built a new green space last year, so more ' +
        'families now spend their weekends there. Culture is also strong in the city: ' +
        'people celebrate several festivals, and young people often follow their favourite ' +
        'celebrities on social media. Although life here is busy, it offers many chances ' +
        'to learn about different cultures.',
      questions: [
        {
          q: 'What makes people tired before work starts?',
          opts: ['The green space', 'The traffic jam', 'The festivals', 'Social media'],
          correct: 1,
          ex: '“… the traffic jam every morning makes people tired before work even starts.”',
        },
        {
          q: 'What did the city government build last year?',
          opts: ['A new market', 'A new green space', 'A new school', 'A new road'],
          correct: 1,
          ex: '“… the city government built a new green space last year …”',
        },
        {
          q: 'What do young people often do on social media?',
          opts: [
            'Sell local food',
            'Follow their favourite celebrities',
            'Watch old films only',
            'Avoid festivals',
          ],
          correct: 1,
          ex: '“… young people often follow their favourite celebrities on social media.”',
        },
        {
          // Paraphrase: "it offers many chances to learn about different cultures".
          q: 'What advantage of city life does the writer mention at the end?',
          opts: [
            'It is always quiet',
            'It gives people opportunities to learn about other cultures',
            'It has no traffic problems',
            'It is cheaper than the countryside',
          ],
          correct: 1,
          ex: '“Although life here is busy, it offers many chances to learn about different cultures.”',
        },
      ],
    },

    listening: {
      title: 'Planning a weekend in the city',
      subtitle: 'Nghe hội thoại dùng từ vựng City & Culture — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Do you want to go to the green space this weekend? B: Yes, but let us avoid the ' +
        'traffic jam and leave early. A: There is also a small festival near the park. ' +
        'B: Great, I want to see it because I love local culture.',
      questions: [
        {
          type: 'cloze',
          q: 'B wants to leave early to avoid the _____.',
          answer: ['traffic jam'],
          ex: '“… let us avoid the traffic jam and leave early.”',
        },
        {
          q: 'Where are A and B planning to go?',
          opts: ['A shopping mall', 'The green space', 'A cinema', 'A restaurant'],
          correct: 1,
          ex: '“Do you want to go to the green space this weekend?”',
        },
        {
          q: 'Why does B want to see the festival?',
          opts: [
            'B has never seen a festival',
            'B loves local culture',
            'B wants to sell food there',
            'B is meeting a celebrity',
          ],
          correct: 1,
          ex: '“Great, I want to see it because I love local culture.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 4 (Day 32) ─────────────────────────
  // Quy trình viết 6 bước — đọc đoạn mô tả quy trình + nghe hội thoại về viết bài.
  '5:4': {
    reading: {
      title: 'From an idea to a sentence',
      subtitle: 'Đọc đoạn về quy trình viết 6 bước (87 từ) rồi trả lời câu hỏi',
      // 87 từ — mô tả quy trình viết: ý Việt -> câu đơn -> chi tiết -> nối ý -> sửa lỗi -> nâng nhẹ.
      text:
        'When I write in English, I follow six small steps. First, I think of my idea in ' +
        'Vietnamese because it helps me understand what I really want to say. Then, I turn ' +
        'it into one simple English sentence. After that, I add details such as a reason ' +
        'or an example, so the sentence becomes clearer. Next, I connect my ideas with ' +
        'words like because, so, or although. I always check my grammar and spelling ' +
        'before I finish. Finally, I improve one small part, but I never make it too ' +
        'complicated.',
      questions: [
        {
          q: 'What does the writer do first when writing in English?',
          opts: [
            'Check grammar',
            'Think of the idea in Vietnamese',
            'Add examples',
            'Connect ideas',
          ],
          correct: 1,
          ex: '“First, I think of my idea in Vietnamese …”',
        },
        {
          q: 'Why does the writer add details such as a reason or an example?',
          opts: [
            'To make the sentence longer only',
            'So the sentence becomes clearer',
            'Because the teacher requires it',
            'To avoid using connectors',
          ],
          correct: 1,
          ex: '“… I add details such as a reason or an example, so the sentence becomes clearer.”',
        },
        {
          q: 'What connecting words does the writer mention?',
          opts: [
            'and, or, nor',
            'because, so, although',
            'first, next, finally',
            'is, am, are',
          ],
          correct: 1,
          ex: '“Next, I connect my ideas with words like because, so, or although.”',
        },
        {
          // Paraphrase: "I improve one small part, but I never make it too complicated."
          q: 'What does the writer do at the final step?',
          opts: [
            'Rewrite the whole paragraph',
            'Make a small improvement without over-complicating it',
            'Delete the sentence completely',
            'Add many new connectors',
          ],
          correct: 1,
          ex: '“Finally, I improve one small part, but I never make it too complicated.” → cải thiện nhẹ, không làm câu quá phức tạp.',
        },
      ],
    },

    listening: {
      title: 'A student describes her writing steps',
      subtitle: 'Nghe hội thoại về quy trình viết — điền số bước và chọn đáp án',
      audioUrl: null,
      script:
        'A: How many steps do you follow when you write? B: Six steps. A: Which step do you ' +
        'find most difficult? B: Connecting my ideas, because I forget the connectors. ' +
        'A: What do you do at the end? B: I improve a small part, but I keep it simple.',
      questions: [
        {
          type: 'cloze',
          q: 'The student follows _____ steps when writing.',
          answer: ['six', '6'],
          ex: '“Six steps.”',
        },
        {
          q: 'Which step does the student find most difficult?',
          opts: ['Thinking of the idea', 'Connecting ideas', 'Checking spelling', 'Improving the sentence'],
          correct: 1,
          ex: '“Connecting my ideas, because I forget the connectors.”',
        },
        {
          q: 'What does the student do at the last step?',
          opts: [
            'Rewrite everything',
            'Improve a small part and keep it simple',
            'Add many new ideas',
            'Ask a friend to write it',
          ],
          correct: 1,
          ex: '“I improve a small part, but I keep it simple.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 5 (Day 33) ─────────────────────────
  // Khung đoạn T-S-E-F — đọc đoạn mẫu phân tích khung + nghe hội thoại.
  '5:5': {
    reading: {
      title: 'The T-S-E-F frame',
      subtitle: 'Đọc đoạn mẫu theo khung T-S-E-F (89 từ) rồi trả lời câu hỏi',
      // 89 từ — đoạn mẫu Topic-Support-Example-Feeling về đọc sách.
      text:
        'Reading is important for students because it helps them learn new words and ' +
        'ideas. When students read regularly, they understand grammar better because they ' +
        'see it used in real sentences. For example, a student who reads short stories ' +
        'every night can learn ten new words in a week without extra effort. This does ' +
        'not mean reading is the only useful activity, but it can make learning English ' +
        'much easier. I feel more confident when I read because it slowly builds my ' +
        'vocabulary and my understanding.',
      questions: [
        {
          q: 'What is the topic sentence mainly about?',
          opts: [
            'Writing is important for students',
            'Reading is important for students',
            'Speaking is important for students',
            'Listening is important for students',
          ],
          correct: 1,
          ex: '“Reading is important for students because it helps them learn new words and ideas.”',
        },
        {
          q: 'Why do students who read regularly understand grammar better?',
          opts: [
            'Because a teacher explains every rule',
            'Because they see grammar used in real sentences',
            'Because they memorise grammar books',
            'Because they take grammar tests',
          ],
          correct: 1,
          ex: '“… they understand grammar better because they see it used in real sentences.”',
        },
        {
          q: 'What example does the writer give?',
          opts: [
            'A student who watches films every night',
            'A student who reads short stories every night',
            'A student who plays games every night',
            'A student who studies grammar books every night',
          ],
          correct: 1,
          ex: '“For example, a student who reads short stories every night can learn ten new words in a week …”',
        },
        {
          // Paraphrase: "I feel more confident when I read because it slowly builds my vocabulary and my understanding."
          q: 'How does the writer feel about reading?',
          opts: [
            'Bored, because it takes too long',
            'More confident, because it builds vocabulary and understanding',
            'Worried, because it is too difficult',
            'Indifferent, because it does not help much',
          ],
          correct: 1,
          ex: '“I feel more confident when I read because it slowly builds my vocabulary and my understanding.”',
        },
      ],
    },

    listening: {
      title: 'Explaining the T-S-E-F frame',
      subtitle: 'Nghe hội thoại về khung T-S-E-F — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: What does T-S-E-F stand for? B: Topic, Support, Example, and Feeling. ' +
        'A: Which part do you find hardest to write? B: The example, because I need a real ' +
        'situation. A: And the last part? B: The feeling, so I usually keep it short.',
      questions: [
        {
          type: 'cloze',
          q: 'T-S-E-F stands for Topic, Support, Example, and _____.',
          answer: ['feeling'],
          ex: '“Topic, Support, Example, and Feeling.”',
        },
        {
          q: 'Which part does B find hardest to write?',
          opts: ['The topic', 'The support', 'The example', 'The feeling'],
          correct: 2,
          ex: '“The example, because I need a real situation.”',
        },
        {
          q: 'How does B usually write the feeling part?',
          opts: ['Very long', 'Short', 'In Vietnamese', 'With many examples'],
          correct: 1,
          ex: '“The feeling, so I usually keep it short.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 6 (Day 34) ─────────────────────────
  // Ngày sản phẩm: đoạn 100-120 từ — đọc đoạn mẫu hoàn chỉnh + nghe hội thoại phản hồi.
  '5:6': {
    reading: {
      title: 'A paragraph about my city',
      subtitle: 'Đọc đoạn mẫu 100-120 từ rồi trả lời câu hỏi',
      // 90 từ (rút gọn từ đoạn 100-120 từ mẫu) — chủ đề thành phố, dùng connectors + T-S-E-F.
      text:
        'My city is a good place to live because it offers many opportunities for young ' +
        'people. Although it is crowded, there are enough schools, hospitals, and parks ' +
        'for everyone. For example, I can study at a good university and still visit a ' +
        'green space near my house on weekends. This does not mean the city has no ' +
        'problems, but it gives people many chances to grow. I feel proud when I talk ' +
        'about my city because it keeps developing every year.',
      questions: [
        {
          q: 'Why does the writer think their city is a good place to live?',
          opts: [
            'Because it is very quiet',
            'Because it offers many opportunities for young people',
            'Because it has no traffic',
            'Because it is small',
          ],
          correct: 1,
          ex: '“My city is a good place to live because it offers many opportunities for young people.”',
        },
        {
          q: 'What example does the writer give about opportunities?',
          opts: [
            'Studying at a good university and visiting a green space',
            'Working abroad',
            'Living in the countryside',
            'Travelling every weekend',
          ],
          correct: 0,
          ex: '“For example, I can study at a good university and still visit a green space near my house on weekends.”',
        },
        {
          q: 'Does the writer think the city has no problems at all?',
          opts: [
            'Yes, it is perfect',
            'No, but it still gives many chances to grow',
            'Yes, because it is not crowded',
            'No information given',
          ],
          correct: 1,
          ex: '“This does not mean the city has no problems, but it gives people many chances to grow.”',
        },
        {
          // Paraphrase: "I feel proud when I talk about my city because it keeps developing every year."
          q: 'How does the writer feel about their city?',
          opts: [
            'Embarrassed, because it changes too fast',
            'Proud, because it keeps improving',
            'Worried, because it is too crowded',
            'Bored, because nothing changes',
          ],
          correct: 1,
          ex: '“I feel proud when I talk about my city because it keeps developing every year.”',
        },
      ],
    },

    listening: {
      title: 'Feedback on a paragraph',
      subtitle: 'Nghe hội thoại phản hồi bài viết — điền số từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How many words is your paragraph? B: About one hundred and ten words. ' +
        'A: What did you use to connect your ideas? B: Because, although, and so. ' +
        'A: Good. What will you improve next time? B: I will add a clearer example.',
      questions: [
        {
          type: 'cloze',
          q: 'The paragraph has about _____ words.',
          answer: ['one hundred and ten', '110'],
          ex: '“About one hundred and ten words.” → 110.',
        },
        {
          q: 'What connectors did B use?',
          opts: [
            'and, or, nor',
            'because, although, and so',
            'first, next, finally',
            'is, am, are',
          ],
          correct: 1,
          ex: '“Because, although, and so.”',
        },
        {
          q: 'What will B improve next time?',
          opts: ['The grammar', 'A clearer example', 'The topic sentence', 'The spelling'],
          correct: 1,
          ex: '“I will add a clearer example.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 5 · Buổi 7 (Day 35) ─────────────────────────
  // Tổng hợp + kiểm tra tuần — đọc đoạn nhìn lại tuần + nghe hội thoại tổng kết.
  '5:7': {
    reading: {
      title: 'My fifth week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ năm (90 từ) rồi trả lời câu hỏi',
      // 90 từ — tổng hợp connectors + although/when/if + T-S-E-F, chủ đề "xây dựng đoạn văn".
      text:
        'This was my fifth week of English, and it was about building a paragraph. At the ' +
        'start, I could only write short, separate sentences. Now I can connect ideas with ' +
        'because, so, but, and although, so my writing sounds much more natural. I also ' +
        'learned to use it, they, and this instead of repeating the same noun. My biggest ' +
        'achievement was writing a full paragraph using the T-S-E-F frame. I am not an ' +
        'expert yet, but I can finally turn separate ideas into one clear paragraph.',
      questions: [
        {
          q: 'What was the fifth week mainly about?',
          opts: ['Speaking fluently', 'Building a paragraph', 'Learning new tenses', 'Taking a mock test'],
          correct: 1,
          ex: '“… it was about building a paragraph.”',
        },
        {
          q: 'What connectors did the writer learn to use?',
          opts: [
            'is, am, are',
            'because, so, but, and although',
            'went, had, did not',
            'will, going to',
          ],
          correct: 1,
          ex: '“… I can connect ideas with because, so, but, and although …”',
        },
        {
          q: 'What did the writer learn to use instead of repeating the same noun?',
          opts: ['Adjectives', 'It, they, and this', 'More connectors', 'Longer sentences'],
          correct: 1,
          ex: '“I also learned to use it, they, and this instead of repeating the same noun.”',
        },
        {
          // Paraphrase: "I can finally turn separate ideas into one clear paragraph."
          q: 'What can the writer finally do by the end of the week?',
          opts: [
            'Write a full essay',
            'Combine separate ideas into one clear paragraph',
            'Translate for a living',
            'Give a formal speech',
          ],
          correct: 1,
          ex: '“… I can finally turn separate ideas into one clear paragraph.” → gộp các ý rời thành một đoạn rõ nghĩa.',
        },
      ],
    },

    listening: {
      title: 'End of week five chat',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How long is your paragraph now? Student: About one hundred and fifteen ' +
        'words. Teacher: That is great progress. Are you going to keep practising the T-S-E-F ' +
        'frame? Student: Yes, I am. I will focus on adding clearer examples next week.',
      questions: [
        {
          type: 'cloze',
          q: 'The paragraph is about _____ words long now.',
          answer: ['one hundred and fifteen', '115'],
          ex: '“About one hundred and fifteen words.” → 115.',
        },
        {
          q: 'What does the teacher think of the progress?',
          opts: ['It is poor', 'It is great', 'It is too slow', 'It is enough'],
          correct: 1,
          ex: '“That is great progress.”',
        },
        {
          q: 'What will the student focus on next?',
          opts: ['Adding clearer examples', 'Learning new tenses', 'Speaking faster', 'Memorising vocabulary lists'],
          correct: 0,
          ex: '“I will focus on adding clearer examples next week.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 1 (Day 36) ─────────────────────────
  // So sánh hơn (comparatives) + as...as — đọc đoạn so sánh + nghe hội thoại.
  '6:1': {
    reading: {
      title: 'Comparing two phones',
      subtitle: 'Đọc đoạn dùng comparatives/as...as (80 từ) rồi trả lời câu hỏi',
      // 80 từ — dày đặc comparatives và as...as, chủ đề công nghệ.
      text:
        'I am comparing my old phone with my new one before I decide what to buy next. ' +
        'My new phone is more expensive than my old one, but the camera is much better. ' +
        'The screen is bigger, so videos look clearer. However, the new phone is not as ' +
        'light as the old one, and the battery does not last as long as I expected. ' +
        'Overall, I think the new phone is more convenient for daily use, even though it ' +
        'is heavier.',
      questions: [
        {
          q: 'How does the writer describe the new phone compared to the old one in price?',
          opts: ['Cheaper', 'The same price', 'More expensive', 'Not mentioned'],
          correct: 2,
          ex: '“My new phone is more expensive than my old one …”',
        },
        {
          q: 'Why do videos look clearer on the new phone?',
          opts: ['The battery lasts longer', 'The screen is bigger', 'It is lighter', 'It is cheaper'],
          correct: 1,
          ex: '“The screen is bigger, so videos look clearer.”',
        },
        {
          q: 'What problem does the writer mention about the new phone?',
          opts: [
            'The camera is worse',
            'The battery does not last as long as expected',
            'The screen is too small',
            'It cannot make calls',
          ],
          correct: 1,
          ex: '“… the battery does not last as long as I expected.”',
        },
        {
          // Paraphrase: "the new phone is more convenient for daily use, even though it is heavier."
          q: 'What is the writer\'s overall opinion of the new phone?',
          opts: [
            'It is worse in every way',
            'It is more convenient, despite being heavier',
            'It is exactly the same as the old one',
            'It is too expensive to be useful',
          ],
          correct: 1,
          ex: '“Overall, I think the new phone is more convenient for daily use, even though it is heavier.”',
        },
      ],
    },

    listening: {
      title: 'Comparing two cities',
      subtitle: 'Nghe hội thoại dùng comparatives — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Is your hometown bigger than Ho Chi Minh City? B: No, it is much smaller and ' +
        'quieter. A: Is life there as expensive as here? B: No, it is not as expensive as ' +
        'here. A: So which place do you prefer? B: My hometown, because it is more peaceful.',
      questions: [
        {
          type: 'cloze',
          q: 'B says life in the hometown is not as _____ as in the city.',
          answer: ['expensive'],
          ex: '“It is not as expensive as here.”',
        },
        {
          q: 'How does B describe the hometown compared to Ho Chi Minh City?',
          opts: ['Bigger and busier', 'Smaller and quieter', 'The same size', 'More crowded'],
          correct: 1,
          ex: '“No, it is much smaller and quieter.”',
        },
        {
          q: 'Which place does B prefer?',
          opts: ['Ho Chi Minh City', 'The hometown', 'Neither', 'Both equally'],
          correct: 1,
          ex: '“My hometown, because it is more peaceful.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 2 (Day 37) ─────────────────────────
  // So sánh nhất + bị động cơ bản + cụm danh từ — đọc đoạn 3 mảnh Task 1 + nghe hội thoại.
  '6:2': {
    reading: {
      title: 'The busiest week of the year',
      subtitle: 'Đọc đoạn dùng superlative/passive/noun phrase (85 từ) rồi trả lời câu hỏi',
      // 85 từ — dày đặc superlative, passive, noun phrase, chủ đề số liệu học tập.
      text:
        'This chart was created by a group of students to show their study hours. Lan had ' +
        'the biggest increase in the group, and her result is now the highest of the three ' +
        'students. There was a sharp increase in her study time after Week 2. The data was ' +
        'collected every week by the teacher, and it is now stored in a shared file. Many ' +
        'students agree that time management is a serious problem, but Lan solved it with ' +
        'a simple daily plan.',
      questions: [
        {
          q: 'Who created the chart?',
          opts: ['The teacher alone', 'A group of students', 'Lan alone', 'A software program'],
          correct: 1,
          ex: '“This chart was created by a group of students …”',
        },
        {
          q: 'Whose study result is the highest of the three students?',
          opts: ['An', 'Minh', 'Lan', 'The teacher'],
          correct: 2,
          ex: '“… her result is now the highest of the three students.”',
        },
        {
          q: 'What happens to the data every week?',
          opts: [
            'It is deleted',
            'It is collected by the teacher',
            'It is ignored',
            'It is sold',
          ],
          correct: 1,
          ex: '“The data was collected every week by the teacher …”',
        },
        {
          // Paraphrase: "time management is a serious problem, but Lan solved it with a simple daily plan."
          q: 'How did Lan deal with the problem of time management?',
          opts: [
            'She ignored it completely',
            'She solved it with a simple daily plan',
            'She asked the teacher to solve it',
            'She stopped studying',
          ],
          correct: 1,
          ex: '“… time management is a serious problem, but Lan solved it with a simple daily plan.”',
        },
      ],
    },

    listening: {
      title: 'Discussing the results',
      subtitle: 'Nghe hội thoại dùng superlative/passive — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Who had the highest score in the test? B: Minh had the highest score in the ' +
        'class. A: Was the test corrected by the teacher already? B: Yes, it was corrected ' +
        'yesterday. A: That is good news for Minh.',
      questions: [
        {
          type: 'cloze',
          q: 'Minh had the _____ score in the class.',
          answer: ['highest'],
          ex: '“Minh had the highest score in the class.”',
        },
        {
          q: 'Who had the highest score in the test?',
          opts: ['A', 'B', 'Minh', 'The teacher'],
          correct: 2,
          ex: '“Minh had the highest score in the class.”',
        },
        {
          q: 'When was the test corrected?',
          opts: ['This morning', 'Yesterday', 'Last week', 'It has not been corrected'],
          correct: 1,
          ex: '“Yes, it was corrected yesterday.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 3 (Day 38) ─────────────────────────
  // Phòng từ vựng Technology + Work & Money — đọc đoạn dùng từ vựng + nghe hội thoại.
  '6:3': {
    reading: {
      title: 'My phone and my part-time job',
      subtitle: 'Đọc đoạn dùng từ vựng Technology & Work (86 từ) rồi trả lời câu hỏi',
      // 86 từ — dùng device, app, scroll, distracted, part-time, salary, save money...
      text:
        'Technology makes my daily life more convenient, but it can also be distracting. I ' +
        'use an app to track my study progress, although I sometimes scroll through social ' +
        'media for too long and get distracted. To earn extra money, I also work part-time ' +
        'at a small shop near my house. My boss is friendly, and my colleagues help me learn ' +
        'new skills. I try to save money every month, because I want to buy a better device ' +
        'for online learning.',
      questions: [
        {
          q: 'What does the writer use an app for?',
          opts: ['Playing games', 'Tracking study progress', 'Watching films', 'Ordering food'],
          correct: 1,
          ex: '“I use an app to track my study progress …”',
        },
        {
          q: 'What sometimes distracts the writer?',
          opts: [
            'Working part-time',
            'Scrolling through social media',
            'Talking to colleagues',
            'Saving money',
          ],
          correct: 1,
          ex: '“… I sometimes scroll through social media for too long and get distracted.”',
        },
        {
          q: 'Where does the writer work part-time?',
          opts: ['A restaurant', 'A small shop', 'A school', 'An office'],
          correct: 1,
          ex: '“… I also work part-time at a small shop near my house.”',
        },
        {
          // Paraphrase: "I try to save money every month, because I want to buy a better device for online learning."
          q: 'Why does the writer try to save money every month?',
          opts: [
            'To travel abroad',
            'To buy a better device for online learning',
            'To help their colleagues',
            'To pay for a new job',
          ],
          correct: 1,
          ex: '“I try to save money every month, because I want to buy a better device for online learning.”',
        },
      ],
    },

    listening: {
      title: 'Talking about a new job',
      subtitle: 'Nghe hội thoại dùng từ vựng Work & Money — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Do you like your new part-time job? B: Yes, my boss is kind and my salary is ' +
        'fair. A: What skills are you learning? B: Communication skills, because I talk to ' +
        'customers every day. A: Are you saving money too? B: Yes, a little every month.',
      questions: [
        {
          type: 'cloze',
          q: 'B is learning _____ skills at the new job.',
          answer: ['communication'],
          ex: '“Communication skills, because I talk to customers every day.”',
        },
        {
          q: 'How does B describe the boss and the salary?',
          opts: ['Strict and low', 'Kind and fair', 'Kind but unfair', 'Strict but fair'],
          correct: 1,
          ex: '“My boss is kind and my salary is fair.”',
        },
        {
          q: 'Is B saving money?',
          opts: ['No, not at all', 'Yes, a little every month', 'Yes, a lot every week', 'Not mentioned'],
          correct: 1,
          ex: '“Yes, a little every month.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 4 (Day 39) ─────────────────────────
  // Writing Task 1 Lite: mô tả số liệu — đọc đoạn mô tả số liệu + nghe hội thoại.
  '6:4': {
    reading: {
      title: 'Study hours over four weeks',
      subtitle: 'Đọc đoạn Task 1 Lite mô tả số liệu (88 từ) rồi trả lời câu hỏi',
      // 88 từ — dùng increase/rise, remain stable, reach/peak at, so sánh, chủ đề số liệu học tập.
      text:
        'The chart shows the number of hours three students spent studying English over ' +
        'four weeks. The number of hours Lan spent increased from two to five, which was ' +
        'the biggest change in the group. Minh also studied more, rising from one hour to ' +
        'three hours. In contrast, An\'s study time remained stable at four hours every ' +
        'week. In Week 4, Lan\'s study time reached the highest point among the three ' +
        'students. Overall, two students spent more time on English after four weeks, while ' +
        'one stayed the same.',
      questions: [
        {
          q: 'Whose study time had the biggest change?',
          opts: ['Minh', 'An', 'Lan', 'The teacher'],
          correct: 2,
          ex: '“The number of hours Lan spent increased from two to five, which was the biggest change …”',
        },
        {
          q: 'What happened to An\'s study time?',
          opts: ['It increased slightly', 'It remained stable at four hours', 'It decreased', 'It doubled'],
          correct: 1,
          ex: '“… An\'s study time remained stable at four hours every week.”',
        },
        {
          q: 'When did Lan\'s study time reach the highest point?',
          opts: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          correct: 3,
          ex: '“In Week 4, Lan\'s study time reached the highest point among the three students.”',
        },
        {
          // Paraphrase: "two students spent more time on English after four weeks, while one stayed the same."
          q: 'What is the overall trend described at the end?',
          opts: [
            'All three students studied less',
            'Two students studied more, and one stayed the same',
            'All three students stopped studying',
            'Only one student studied at all',
          ],
          correct: 1,
          ex: '“Overall, two students spent more time on English after four weeks, while one stayed the same.”',
        },
      ],
    },

    listening: {
      title: 'Checking the chart together',
      subtitle: 'Nghe hội thoại mô tả số liệu — điền số và chọn đáp án',
      audioUrl: null,
      script:
        'A: How many hours did Minh study in Week 4? B: Minh studied three hours in Week 4. ' +
        'A: And what about An? B: An\'s hours stayed the same, at four hours every week. ' +
        'A: So who had the biggest increase? B: Lan did, by far.',
      questions: [
        {
          type: 'cloze',
          q: 'Minh studied _____ hours in Week 4.',
          answer: ['three', '3'],
          ex: '“Minh studied three hours in Week 4.”',
        },
        {
          q: 'What happened to An\'s study hours?',
          opts: ['They increased', 'They stayed the same', 'They decreased', 'Not mentioned'],
          correct: 1,
          ex: '“An\'s hours stayed the same, at four hours every week.”',
        },
        {
          q: 'Who had the biggest increase?',
          opts: ['Minh', 'An', 'Lan', 'The teacher'],
          correct: 2,
          ex: '“Lan did, by far.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 5 (Day 40) ─────────────────────────
  // Speaking Part 1 mở rộng + Part 2 sườn — đọc đoạn mẫu mở rộng câu trả lời + nghe hội thoại.
  '6:5': {
    reading: {
      title: 'Answering Part 1 with more detail',
      subtitle: 'Đọc đoạn mẫu Speaking Part 1 mở rộng (84 từ) rồi trả lời câu hỏi',
      // 84 từ — mẫu mở rộng câu trả lời Part 1 (lý do + ví dụ) và sườn Part 2.
      text:
        'In an interview, a short answer is not enough, so I always add a reason and an ' +
        'example. When someone asks if I like using apps, I say yes, because they save me ' +
        'time, and I give an example: I use a vocabulary app every morning. For Part 2, I ' +
        'follow a simple story spine: what it is, when I got it, what I did first, what I ' +
        'did next, why it matters, and how I feel about it. This structure helps me speak ' +
        'for a full two minutes without stopping.',
      questions: [
        {
          q: 'What does the writer always add to a short answer?',
          opts: [
            'A joke',
            'A reason and an example',
            'A question back to the examiner',
            'A long list of adjectives',
          ],
          correct: 1,
          ex: '“… I always add a reason and an example.”',
        },
        {
          q: 'What example does the writer give about using apps?',
          opts: [
            'Playing games at night',
            'Using a vocabulary app every morning',
            'Watching films on an app',
            'Deleting unused apps',
          ],
          correct: 1,
          ex: '“I use a vocabulary app every morning.”',
        },
        {
          q: 'What is the last step in the writer\'s Part 2 story spine?',
          opts: ['What it is', 'When I got it', 'Why it matters', 'How I feel about it'],
          correct: 3,
          ex: '“… why it matters, and how I feel about it.”',
        },
        {
          // Paraphrase: "This structure helps me speak for a full two minutes without stopping."
          q: 'What benefit does the story spine give the writer?',
          opts: [
            'It helps them speak for two minutes without stopping',
            'It helps them write faster',
            'It helps them memorise grammar rules',
            'It helps them avoid speaking at all',
          ],
          correct: 0,
          ex: '“This structure helps me speak for a full two minutes without stopping.”',
        },
      ],
    },

    listening: {
      title: 'Practising a Part 2 answer',
      subtitle: 'Nghe hội thoại luyện Part 2 — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: What are you going to describe? B: A useful app I use every day. A: How long do ' +
        'you need to speak? B: About one to two minutes. A: What will you say first? B: What ' +
        'the app is and when I got it.',
      questions: [
        {
          type: 'cloze',
          q: 'B needs to speak for about one to _____ minutes.',
          answer: ['two'],
          ex: '“About one to two minutes.”',
        },
        {
          q: 'What is B going to describe?',
          opts: ['A useful app', 'A favourite teacher', 'A memorable trip', 'A part-time job'],
          correct: 0,
          ex: '“A useful app I use every day.”',
        },
        {
          q: 'What will B say first?',
          opts: [
            'How they feel about it',
            'What the app is and when they got it',
            'Why it matters',
            'What they did next',
          ],
          correct: 1,
          ex: '“What the app is and when I got it.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 6 (Day 41) ─────────────────────────
  // Ngày sản phẩm: biểu đồ 6-8 câu — đọc đoạn mẫu mô tả biểu đồ + nghe hội thoại form completion lite.
  '6:6': {
    reading: {
      title: 'Describing my phone-use chart',
      subtitle: 'Đọc đoạn mẫu mô tả biểu đồ 6-8 câu (89 từ) rồi trả lời câu hỏi',
      // 89 từ — mô tả biểu đồ hoàn chỉnh, dùng comparative/superlative/passive/noun phrase.
      text:
        'This chart was made to show how many hours I used my phone last week. On Monday, I ' +
        'used it for two hours, but by Friday the number had reached the highest point of ' +
        'the week, at five hours. There was a sharp increase between Wednesday and Friday. ' +
        'My weekend usage was lower than my weekday usage, and Sunday was the quietest day ' +
        'of all. Compared to Monday, Friday was much busier. Overall, my phone use is a ' +
        'growing concern that I plan to manage better next week.',
      questions: [
        {
          q: 'How many hours did the writer use the phone on Monday?',
          opts: ['One hour', 'Two hours', 'Three hours', 'Five hours'],
          correct: 1,
          ex: '“On Monday, I used it for two hours …”',
        },
        {
          q: 'Which day had the highest phone usage?',
          opts: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
          correct: 2,
          ex: '“… by Friday the number had reached the highest point of the week, at five hours.”',
        },
        {
          q: 'How does the writer describe Sunday?',
          opts: ['The busiest day', 'The quietest day', 'The same as Monday', 'Not mentioned'],
          correct: 1,
          ex: '“… Sunday was the quietest day of all.”',
        },
        {
          // Paraphrase: "my phone use is a growing concern that I plan to manage better next week."
          q: 'What does the writer plan to do about their phone use?',
          opts: [
            'Ignore it completely',
            'Manage it better next week',
            'Stop using a phone forever',
            'Buy a new phone',
          ],
          correct: 1,
          ex: '“Overall, my phone use is a growing concern that I plan to manage better next week.”',
        },
      ],
    },

    listening: {
      title: 'Filling in a short form',
      subtitle: 'Nghe hội thoại dạng form completion lite — điền từ/số và chọn đáp án',
      audioUrl: null,
      script:
        'A: What is your name, please? B: My name is Phuong, P-H-U-O-N-G. A: And how many ' +
        'hours did you use your phone on Friday? B: Five hours. A: Thank you. Which day was ' +
        'the quietest for you? B: Sunday was the quietest day.',
      questions: [
        {
          type: 'cloze',
          q: 'Name: _____',
          answer: ['Phuong'],
          ex: '“My name is Phuong, P-H-U-O-N-G.”',
        },
        {
          type: 'cloze',
          q: 'Phone use on Friday: _____ hours',
          answer: ['five', '5'],
          ex: '“Five hours.”',
        },
        {
          q: 'Which day was the quietest for B?',
          opts: ['Monday', 'Friday', 'Saturday', 'Sunday'],
          correct: 3,
          ex: '“Sunday was the quietest day.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 6 · Buổi 7 (Day 42) ─────────────────────────
  // Tổng hợp + kiểm tra tuần — đọc đoạn nhìn lại tuần + nghe hội thoại tổng kết.
  '6:7': {
    reading: {
      title: 'My sixth week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ sáu (88 từ) rồi trả lời câu hỏi',
      // 88 từ — tổng hợp comparative/superlative/passive/noun phrase + Task 1 Lite.
      text:
        'This was my sixth week, and it was my first small step into IELTS. I learned to ' +
        'compare things using comparatives and superlatives, such as cheaper and the ' +
        'biggest. I also learned basic passive sentences, like "English is spoken in many ' +
        'countries," and useful noun phrases, such as a sharp increase. My biggest ' +
        'achievement was describing a simple chart in eight clear sentences. I am not ready ' +
        'for a full IELTS test yet, but I feel more confident about numbers, charts, and ' +
        'comparisons now.',
      questions: [
        {
          q: 'What was the writer\'s first step into this week?',
          opts: ['A full IELTS test', 'A small step into IELTS', 'A speaking exam', 'A grammar exam'],
          correct: 1,
          ex: '“… it was my first small step into IELTS.”',
        },
        {
          q: 'What kind of sentence does the writer give as an example of passive voice?',
          opts: [
            'I speak English every day.',
            'English is spoken in many countries.',
            'English speaks in many countries.',
            'I am speaking English now.',
          ],
          correct: 1,
          ex: '“… basic passive sentences, like \'English is spoken in many countries.\'”',
        },
        {
          q: 'What was the writer\'s biggest achievement this week?',
          opts: [
            'Passing a mock IELTS test',
            'Describing a simple chart in eight clear sentences',
            'Memorising 100 new words',
            'Writing a full essay',
          ],
          correct: 1,
          ex: '“My biggest achievement was describing a simple chart in eight clear sentences.”',
        },
        {
          // Paraphrase: "I feel more confident about numbers, charts, and comparisons now."
          q: 'How does the writer feel by the end of the week?',
          opts: [
            'Confused about numbers and charts',
            'More confident about numbers, charts, and comparisons',
            'Bored with comparisons',
            'Ready for a full IELTS test',
          ],
          correct: 1,
          ex: '“… but I feel more confident about numbers, charts, and comparisons now.”',
        },
      ],
    },

    listening: {
      title: 'End of week six chat',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many sentences can you write to describe a chart now? Student: I can ' +
        'write eight sentences now. Teacher: That is great progress. What will you focus on ' +
        'next? Student: I will keep practising passive sentences and noun phrases.',
      questions: [
        {
          type: 'cloze',
          q: 'The student can now write _____ sentences to describe a chart.',
          answer: ['eight', '8'],
          ex: '“I can write eight sentences now.”',
        },
        {
          q: 'What does the teacher think of the progress?',
          opts: ['It is poor', 'It is great', 'It is too slow', 'It is enough'],
          correct: 1,
          ex: '“That is great progress.”',
        },
        {
          q: 'What will the student focus on next?',
          opts: [
            'Passive sentences and noun phrases',
            'Speaking faster',
            'Learning new tenses',
            'Memorising vocabulary lists',
          ],
          correct: 0,
          ex: '“I will keep practising passive sentences and noun phrases.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 1 (Day 43) ─────────────────────────
  // Mạo từ a/an/the + mệnh đề quan hệ who/which/that — đoạn mới 78 từ + hội thoại mới.
  '7:1': {
    reading: {
      title: 'A teacher who explains clearly',
      subtitle: 'Đọc đoạn dùng mạo từ + mệnh đề quan hệ (78 từ) rồi trả lời câu hỏi',
      // 78 từ — dày đặc a/an/the và who/which/that, chủ đề người/vật quen thuộc.
      text:
        'I have a teacher who explains grammar clearly. She is the teacher who helped me ' +
        'understand articles for the first time. Before, I often said "I am student" and ' +
        'forgot the word "a". Now I know that a student is one person in a general group, ' +
        'but the teacher I have this year is a specific person everyone in my class knows. ' +
        'I also bought a book which has many simple examples. The book is now the most ' +
        'useful thing on my desk.',
      questions: [
        {
          q: 'What did the teacher help the writer understand?',
          opts: ['Prepositions', 'Articles', 'Listening skills', 'Spelling'],
          correct: 1,
          ex: '“She is the teacher who helped me understand articles for the first time.”',
        },
        {
          q: 'What mistake did the writer often make before?',
          opts: [
            'Saying "I am student"',
            'Saying "I am the student"',
            'Saying "I am a students"',
            'Not mentioned',
          ],
          correct: 0,
          ex: '“Before, I often said \'I am student\' and forgot the word \'a\'.”',
        },
        {
          q: 'What did the writer buy?',
          opts: ['A dictionary', 'A book which has many simple examples', 'A notebook', 'A phone'],
          correct: 1,
          ex: '“I also bought a book which has many simple examples.”',
        },
        {
          // Paraphrase: "The book is now the most useful thing on my desk."
          q: 'How does the writer feel about the book now?',
          opts: [
            'It is not useful at all',
            'It is now the most useful thing on the desk',
            'It is too difficult to read',
            'It was a waste of money',
          ],
          correct: 1,
          ex: '“The book is now the most useful thing on my desk.”',
        },
      ],
    },

    listening: {
      title: 'Describing a favourite object',
      subtitle: 'Nghe hội thoại dùng mạo từ + mệnh đề quan hệ — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Do you have a favourite object? B: Yes, I have a pen which my father gave me. ' +
        'A: Why is it special? B: It is the pen that I use for every important exam. ' +
        'A: That sounds meaningful. B: Yes, it is a small thing, but it means a lot to me.',
      questions: [
        {
          type: 'cloze',
          q: 'B has a pen _____ his father gave him.',
          answer: ['which', 'that'],
          ex: '“I have a pen which my father gave me.”',
        },
        {
          q: 'When does B use the pen?',
          opts: ['Every day', 'For every important exam', 'Only at home', 'Never'],
          correct: 1,
          ex: '“It is the pen that I use for every important exam.”',
        },
        {
          q: 'How does B feel about the pen?',
          opts: ['It means nothing', 'It means a lot to him', 'He wants to lose it', 'He forgot about it'],
          correct: 1,
          ex: '“… it is a small thing, but it means a lot to me.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 2 (Day 44) ─────────────────────────
  // Giới từ theo cảnh sử dụng — đoạn mới 76 từ + hội thoại mới.
  '7:2': {
    reading: {
      title: 'My study desk',
      subtitle: 'Đọc đoạn dùng giới từ nơi chốn/chức năng (76 từ) rồi trả lời câu hỏi',
      // 76 từ — dày đặc in/on/under/next to/between/interested in/good at/depend on.
      text:
        'My study desk is next to the window, between my bookshelf and a small lamp. My ' +
        'notebook is on the desk, and my bag is under the chair. I am interested in English ' +
        'podcasts, so I usually listen to one in the morning. I am good at listening, but I ' +
        'am still weak in writing. My progress depends on how much I practise, not on how ' +
        'expensive my materials are.',
      questions: [
        {
          q: 'Where is the study desk located?',
          opts: [
            'Next to the door',
            'Next to the window, between the bookshelf and a lamp',
            'In the kitchen',
            'Under the bed',
          ],
          correct: 1,
          ex: '“My study desk is next to the window, between my bookshelf and a small lamp.”',
        },
        {
          q: 'Where is the writer\'s bag?',
          opts: ['On the desk', 'Under the chair', 'Next to the lamp', 'Inside the bookshelf'],
          correct: 1,
          ex: '“… my bag is under the chair.”',
        },
        {
          q: 'What is the writer good at?',
          opts: ['Writing', 'Listening', 'Speaking', 'Spelling'],
          correct: 1,
          ex: '“I am good at listening, but I am still weak in writing.”',
        },
        {
          // Paraphrase: "My progress depends on how much I practise, not on how expensive my materials are."
          q: 'What does the writer\'s progress depend on?',
          opts: [
            'How expensive the materials are',
            'How much the writer practises',
            'How new the desk is',
            'How long the podcasts are',
          ],
          correct: 1,
          ex: '“My progress depends on how much I practise, not on how expensive my materials are.”',
        },
      ],
    },

    listening: {
      title: 'Labelling the desk',
      subtitle: 'Nghe hội thoại dùng giới từ nơi chốn — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Where is your dictionary? B: It is on the desk, next to my laptop. A: And your ' +
        'shoes? B: They are under the bed. A: Are you interested in learning new words every ' +
        'day? B: Yes, I am good at remembering words when I use them in real sentences.',
      questions: [
        {
          type: 'cloze',
          q: 'The dictionary is on the desk, next to the _____.',
          answer: ['laptop'],
          ex: '“It is on the desk, next to my laptop.”',
        },
        {
          q: 'Where are B\'s shoes?',
          opts: ['On the desk', 'Under the bed', 'Next to the laptop', 'In the bag'],
          correct: 1,
          ex: '“They are under the bed.”',
        },
        {
          q: 'What is B good at?',
          opts: [
            'Remembering words when used in real sentences',
            'Finding shoes quickly',
            'Fixing laptops',
            'Reading dictionaries fast',
          ],
          correct: 0,
          ex: '“I am good at remembering words when I use them in real sentences.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 3 (Day 45) ─────────────────────────
  // Từ vựng Environment + chiến thuật đọc — tái dùng Passage 1 (The Study Corner) từ .md.
  '7:3': {
    reading: {
      title: 'The Study Corner',
      subtitle: 'Đọc Passage 1 của tuần (đoạn có sẵn trong bài học) rồi trả lời câu hỏi',
      text:
        'A study corner does not need to be large or expensive. For many students, a small ' +
        'desk, a comfortable chair, and a quiet atmosphere are enough. What matters most is ' +
        'that the place helps the learner focus. Some students decorate their study corner ' +
        'with pictures, sticky notes, or a simple calendar. These small visual reminders can ' +
        'make learning feel more personal. However, a study corner should not be too ' +
        'crowded. If there are too many objects on the desk, students may get distracted ' +
        'instead of motivated.',
      questions: [
        {
          q: 'What does a study corner NOT need to be, according to the passage?',
          opts: ['Quiet', 'Large or expensive', 'Comfortable', 'Personal'],
          correct: 1,
          ex: '“A study corner does not need to be large or expensive.”',
        },
        {
          q: 'What matters most about a study place?',
          opts: [
            'That it looks expensive',
            'That it helps the learner focus',
            'That it is far from home',
            'That it has many objects',
          ],
          correct: 1,
          ex: '“What matters most is that the place helps the learner focus.”',
        },
        {
          q: 'What do "these small visual reminders" refer to?',
          opts: [
            'Pictures, sticky notes, or a simple calendar',
            'Books and pens',
            'A comfortable chair',
            'A quiet atmosphere',
          ],
          correct: 0,
          ex: '“… pictures, sticky notes, or a simple calendar. These small visual reminders …”',
        },
        {
          // Paraphrase: "If there are too many objects on the desk, students may get distracted instead of motivated."
          q: 'Why should a study corner not be too crowded?',
          opts: [
            'Because it costs more money',
            'Because too many objects may distract students',
            'Because it looks untidy to guests',
            'Because it is against school rules',
          ],
          correct: 1,
          ex: '“If there are too many objects on the desk, students may get distracted instead of motivated.”',
        },
      ],
    },

    listening: {
      title: 'Talking about the environment',
      subtitle: 'Nghe hội thoại dùng từ vựng Environment — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: What can we do to protect the environment? B: We can reduce plastic waste and ' +
        'save energy at home. A: Is air pollution a problem in your city? B: Yes, it is a ' +
        'serious problem, especially near busy roads. A: What do schools teach about it? ' +
        'B: They teach students simple green habits, like recycling.',
      questions: [
        {
          type: 'cloze',
          q: 'B says people can reduce plastic _____ and save energy at home.',
          answer: ['waste'],
          ex: '“We can reduce plastic waste and save energy at home.”',
        },
        {
          q: 'Where is air pollution especially a problem?',
          opts: ['Near parks', 'Near busy roads', 'Near schools only', 'Not a problem at all'],
          correct: 1,
          ex: '“Yes, it is a serious problem, especially near busy roads.”',
        },
        {
          q: 'What do schools teach about the environment?',
          opts: [
            'How to drive safely',
            'Simple green habits, like recycling',
            'How to save money',
            'Nothing, it is not taught',
          ],
          correct: 1,
          ex: '“They teach students simple green habits, like recycling.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 4 (Day 46) ─────────────────────────
  // Reading True/False/Not Given — tái dùng Passage 3 (Phones and Attention) từ .md.
  '7:4': {
    reading: {
      title: 'Phones and Attention',
      subtitle: 'Đọc Passage 3 của tuần (đoạn có sẵn trong bài học) rồi trả lời câu hỏi',
      text:
        'Mobile phones are useful tools for language learners. Students can watch short ' +
        'videos, check pronunciation, save new words, and practise listening almost ' +
        'anywhere. However, phones can also damage attention. A learner may open an English ' +
        'video but then spend twenty minutes scrolling through unrelated posts. For this ' +
        'reason, some students use a simple rule: study first, scroll later. They put the ' +
        'phone on airplane mode, use only one learning app, and set a short timer. This does ' +
        'not remove all distractions, but it makes focused study more possible.',
      questions: [
        {
          q: 'According to the passage, what can phones do besides helping learners?',
          opts: ['Improve memory automatically', 'Damage attention', 'Teach grammar rules', 'Replace teachers'],
          correct: 1,
          ex: '“However, phones can also damage attention.”',
        },
        {
          q: 'What simple rule do some students use?',
          opts: ['Scroll first, study later', 'Study first, scroll later', 'Never use a phone', 'Only use social media'],
          correct: 1,
          ex: '“… some students use a simple rule: study first, scroll later.”',
        },
        {
          q: 'Is the statement "Phones remove all distractions" True, False, or Not Given?',
          opts: ['True', 'False', 'Not Given', 'Cannot decide'],
          correct: 1,
          ex: '“This does not remove all distractions …” → False, trái với văn bản.',
        },
        {
          // Paraphrase: writer's overall stance
          q: 'What is the writer\'s overall view of phones for learning?',
          opts: [
            'They are only bad for learning',
            'They are useful but can distract if not controlled',
            'They should never be used by students',
            'They are more useful than teachers',
          ],
          correct: 1,
          ex: 'Bài kết hợp cả lợi ích (useful tools) và rủi ro (damage attention) → phones useful but can distract.',
        },
      ],
    },

    listening: {
      title: 'Deciding on evidence',
      subtitle: 'Nghe hội thoại chủ đề True/False/Not Given — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How do you decide if a statement is True or False in Reading? B: I look for ' +
        'evidence in the text, not just a feeling. A: What if the text does not mention it ' +
        'at all? B: Then it is Not Given, because there is not enough information. A: That ' +
        'makes sense.',
      questions: [
        {
          type: 'cloze',
          q: 'B says a statement is Not Given when there is not enough _____.',
          answer: ['information'],
          ex: '“Then it is Not Given, because there is not enough information.”',
        },
        {
          q: 'How does B decide if a statement is True or False?',
          opts: ['By guessing', 'By looking for evidence in the text', 'By asking a friend', 'By checking the title only'],
          correct: 1,
          ex: '“I look for evidence in the text, not just a feeling.”',
        },
        {
          q: 'When is a statement Not Given?',
          opts: [
            'When the text contradicts it',
            'When the text does not mention it at all',
            'When it is obviously true',
            'When the question is too long',
          ],
          correct: 1,
          ex: '“What if the text does not mention it at all? … Then it is Not Given.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 5 (Day 47) ─────────────────────────
  // Listening micro-skills — tái dùng Script 1 (Study Club) + Script 2 (Phone Problem) từ .md.
  '7:5': {
    reading: {
      title: 'Listening micro-skills',
      subtitle: 'Đọc đoạn tóm tắt kỹ năng nghe (77 từ) rồi trả lời câu hỏi',
      // 77 từ — tóm tắt 5 micro-skills (spelling, numbers, time, prediction, paraphrase).
      text:
        'Good listening in IELTS needs small skills, not just good ears. First, learners ' +
        'practise spelling names aloud, such as W-I-L-S-O-N. Second, they practise number ' +
        'pairs that sound similar, like thirteen and thirty. Third, they learn to hear time ' +
        'phrases, such as a quarter past nine. Fourth, before listening, they predict what ' +
        'kind of answer is needed, for example a number or a place. Finally, they notice ' +
        'paraphrase, because the audio rarely uses the exact words in the question.',
      questions: [
        {
          q: 'What is the first micro-skill mentioned?',
          opts: ['Predicting answers', 'Spelling names aloud', 'Hearing time phrases', 'Noticing paraphrase'],
          correct: 1,
          ex: '“First, learners practise spelling names aloud, such as W-I-L-S-O-N.”',
        },
        {
          q: 'Which pair of numbers is given as an example?',
          opts: ['Fourteen and forty', 'Thirteen and thirty', 'Fifteen and fifty', 'Eighteen and eighty'],
          correct: 1,
          ex: '“… number pairs that sound similar, like thirteen and thirty.”',
        },
        {
          q: 'What should learners do before listening?',
          opts: [
            'Memorise the whole script',
            'Predict what kind of answer is needed',
            'Turn off the audio',
            'Write the answers first',
          ],
          correct: 1,
          ex: '“… before listening, they predict what kind of answer is needed …”',
        },
        {
          // Paraphrase: "the audio rarely uses the exact words in the question."
          q: 'Why is noticing paraphrase important?',
          opts: [
            'Because the audio always repeats the question exactly',
            'Because the audio rarely uses the exact words in the question',
            'Because paraphrase is not tested',
            'Because it makes the test shorter',
          ],
          correct: 1,
          ex: '“… the audio rarely uses the exact words in the question.”',
        },
      ],
    },

    listening: {
      title: 'Study Club',
      subtitle: 'Nghe Script 1 của tuần (đoạn có sẵn trong bài học) — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'Hi, my name is Anna. I joined an English study club last month. We meet every ' +
        'Wednesday at five thirty in the school library. Each meeting lasts about one hour. ' +
        'We usually practise speaking first, then we review useful vocabulary. I like the ' +
        'club because it is friendly and not too stressful.',
      questions: [
        {
          type: 'cloze',
          q: 'Anna joined the study club last _____.',
          answer: ['month'],
          ex: '“I joined an English study club last month.”',
        },
        {
          q: 'When do they meet?',
          opts: ['Every Monday at 5:30', 'Every Wednesday at 5:30', 'Every Friday at 6:00', 'Every day'],
          correct: 1,
          ex: '“We meet every Wednesday at five thirty in the school library.”',
        },
        {
          q: 'Why does Anna like the club?',
          opts: [
            'Because it is difficult and serious',
            'Because it is friendly and not too stressful',
            'Because it is very short',
            'Because there is no vocabulary review',
          ],
          correct: 1,
          ex: '“I like the club because it is friendly and not too stressful.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 6 (Day 48) ─────────────────────────
  // Passage 5-6 + câu tóm tắt — tái dùng Passage 5 (Short Reviews) + Script 3 (Healthy Habit).
  '7:6': {
    reading: {
      title: 'The Power of Short Reviews',
      subtitle: 'Đọc Passage 5 của tuần (đoạn có sẵn trong bài học) rồi trả lời câu hỏi',
      text:
        'Many learners review only when they forget almost everything. This makes studying ' +
        'feel painful. A better method is to review in short sessions before knowledge ' +
        'disappears completely. For example, after learning ten useful phrases on Monday, a ' +
        'student can test them again on Tuesday, Thursday, and the following week. Each ' +
        'review does not need to be long. Even five minutes can help if the student tries to ' +
        'recall the phrases without looking first. The key is not reading the same notes ' +
        'again and again, but bringing the language back from memory.',
      questions: [
        {
          q: 'When do many learners review, according to the passage?',
          opts: [
            'Only when they forget almost everything',
            'Every single day',
            'Before they even start learning',
            'Only during exams',
          ],
          correct: 0,
          ex: '“Many learners review only when they forget almost everything.”',
        },
        {
          q: 'What is the better method described in the passage?',
          opts: [
            'Reviewing once a year',
            'Reviewing in short sessions before knowledge disappears completely',
            'Never reviewing at all',
            'Reviewing only with a teacher',
          ],
          correct: 1,
          ex: '“A better method is to review in short sessions before knowledge disappears completely.”',
        },
        {
          q: 'What should the student do before looking at notes again?',
          opts: [
            'Try to recall the phrases',
            'Rewrite all the notes',
            'Skip the review',
            'Ask a friend for the answers',
          ],
          correct: 0,
          ex: '“Even five minutes can help if the student tries to recall the phrases without looking first.”',
        },
        {
          // Paraphrase: "The key is not reading the same notes again and again, but bringing the language back from memory."
          q: 'What is the key idea of the passage?',
          opts: [
            'Reading notes many times is the best method',
            'Retrieving language from memory helps more than re-reading notes',
            'Reviewing is not necessary for learning',
            'Longer reviews are always better',
          ],
          correct: 1,
          ex: '“The key is not reading the same notes again and again, but bringing the language back from memory.”',
        },
      ],
    },

    listening: {
      title: 'Healthy Habit',
      subtitle: 'Nghe Script 3 của tuần (đoạn có sẵn trong bài học) — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'Mina used to sleep very late before exams. She thought studying until midnight was ' +
        'helpful, but she often felt tired the next morning. This year, she changed her ' +
        'habit. She studies for shorter periods, takes small breaks, and goes to bed before ' +
        'eleven. She says she remembers vocabulary better now.',
      questions: [
        {
          type: 'cloze',
          q: 'Mina now goes to bed before _____ o\'clock.',
          answer: ['eleven', '11'],
          ex: '“… goes to bed before eleven.”',
        },
        {
          q: 'How did Mina feel after sleeping late before exams?',
          opts: ['Energetic', 'Tired the next morning', 'Happy', 'Not affected at all'],
          correct: 1,
          ex: '“… she often felt tired the next morning.”',
        },
        {
          q: 'What does Mina remember better now?',
          opts: ['Grammar rules', 'Vocabulary', 'Phone numbers', 'Names of teachers'],
          correct: 1,
          ex: '“She says she remembers vocabulary better now.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 7 · Buổi 7 (Day 49) ─────────────────────────
  // Tổng hợp tuần: mạo từ + giới từ + mệnh đề quan hệ + reading/listening strategy.
  '7:7': {
    reading: {
      title: 'My seventh week',
      subtitle: 'Đọc đoạn nhìn lại tuần học thứ bảy (85 từ) rồi trả lời câu hỏi',
      // 85 từ — tổng hợp articles/prepositions/relative clauses + reading/listening strategy.
      text:
        'This was my seventh week, and I focused on reading and listening with a clear ' +
        'strategy instead of panic. I practised articles, like "a student" and "the sun", ' +
        'and I used relative clauses, such as "people who explain clearly". I also reviewed ' +
        'prepositions, for example "interested in" and "good at". For reading, I learned to ' +
        'predict the topic first and find evidence before choosing an answer. For listening, ' +
        'I practised numbers, spelling, and paraphrase. I am not perfect yet, but I trust the ' +
        'evidence more than my feelings now.',
      questions: [
        {
          q: 'What did the writer focus on this week?',
          opts: [
            'Memorising word lists only',
            'Reading and listening with a clear strategy instead of panic',
            'Writing long essays',
            'Learning new songs',
          ],
          correct: 1,
          ex: '“… I focused on reading and listening with a clear strategy instead of panic.”',
        },
        {
          q: 'Which relative clause example is given?',
          opts: [
            '"people who explain clearly"',
            '"the sun is hot"',
            '"interested in music"',
            '"good at listening"',
          ],
          correct: 0,
          ex: '“… I used relative clauses, such as \'people who explain clearly\'.”',
        },
        {
          q: 'What should the writer do before choosing a reading answer?',
          opts: [
            'Guess based on feeling',
            'Predict the topic and find evidence',
            'Read the answer key first',
            'Skip the question',
          ],
          correct: 1,
          ex: '“For reading, I learned to predict the topic first and find evidence before choosing an answer.”',
        },
        {
          // Paraphrase: "I trust the evidence more than my feelings now."
          q: 'How has the writer\'s approach to answering questions changed?',
          opts: [
            'The writer now trusts feelings more than evidence',
            'The writer now trusts evidence more than feelings',
            'The writer never answers based on the text',
            'The writer stopped using strategy',
          ],
          correct: 1,
          ex: '“… but I trust the evidence more than my feelings now.”',
        },
      ],
    },

    listening: {
      title: 'End of week seven chat',
      subtitle: 'Nghe hội thoại tổng kết — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many reading questions can you answer confidently now? Student: I can ' +
        'answer ten questions from a short passage now. Teacher: That is real progress. What ' +
        'will you focus on next? Student: I will keep practising evidence-based answers and ' +
        'listening for paraphrase.',
      questions: [
        {
          type: 'cloze',
          q: 'The student can now answer _____ reading questions from a short passage.',
          answer: ['ten', '10'],
          ex: '“I can answer ten questions from a short passage now.”',
        },
        {
          q: 'What does the teacher think of the progress?',
          opts: ['It is poor', 'It is real progress', 'It is too slow', 'It is not enough'],
          correct: 1,
          ex: '“That is real progress.”',
        },
        {
          q: 'What will the student focus on next?',
          opts: [
            'Evidence-based answers and listening for paraphrase',
            'Learning new songs',
            'Writing longer essays',
            'Memorising grammar rules only',
          ],
          correct: 0,
          ex: '“I will keep practising evidence-based answers and listening for paraphrase.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 1 (Day 50) ─────────────────────────
  // Modals should/can — đoạn mới + hội thoại mới.
  '8:1': {
    reading: {
      title: 'Advice for new learners',
      subtitle: 'Đọc đoạn dùng modal should/can (79 từ) rồi trả lời câu hỏi',
      text:
        'Students should review vocabulary every day, even for just ten minutes. This habit ' +
        'can have a positive impact on confidence over time. New learners should also ' +
        'practise speaking a little every day instead of waiting until they feel ready. ' +
        'Speaking early can help beginners notice their own mistakes sooner. Some students ' +
        'think they should wait until their grammar is perfect, but this method can actually ' +
        'slow down progress. A better idea is to speak now and fix errors along the way.',
      questions: [
        {
          q: 'What should students do every day, according to the passage?',
          opts: ['Take a full grammar test', 'Review vocabulary, even for ten minutes', 'Only read grammar books', 'Avoid speaking'],
          correct: 1,
          ex: '“Students should review vocabulary every day, even for just ten minutes.”',
        },
        {
          q: 'What can speaking early help beginners do?',
          opts: ['Avoid all mistakes', 'Notice their own mistakes sooner', 'Skip grammar completely', 'Speak perfectly at once'],
          correct: 1,
          ex: '“Speaking early can help beginners notice their own mistakes sooner.”',
        },
        {
          q: 'What do some students mistakenly think they should wait for?',
          opts: ['A teacher to arrive', 'Their grammar to be perfect', 'A test date', 'More free time'],
          correct: 1,
          ex: '“Some students think they should wait until their grammar is perfect…”',
        },
        {
          // Paraphrase: "A better idea is to speak now and fix errors along the way."
          q: 'What does the passage suggest is a better approach?',
          opts: [
            'Waiting for perfect grammar before speaking',
            'Speaking now and correcting mistakes as they go',
            'Only studying grammar books',
            'Avoiding speaking practice',
          ],
          correct: 1,
          ex: '“A better idea is to speak now and fix errors along the way.”',
        },
      ],
    },

    listening: {
      title: 'Giving advice with should/can',
      subtitle: 'Nghe hội thoại dùng modal should/can — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: What should I do to improve my speaking? B: You should practise a little every ' +
        'day, even for five minutes. A: Can recording myself really help? B: Yes, it can. ' +
        'It can show you mistakes you do not notice while speaking. A: That sounds useful.',
      questions: [
        {
          type: 'cloze',
          q: 'B says A _____ practise a little every day.',
          answer: ['should'],
          ex: '“You should practise a little every day, even for five minutes.”',
        },
        {
          q: 'What can recording yourself show you, according to B?',
          opts: ['Nothing new', 'Mistakes you do not notice while speaking', 'Your exact IELTS band', 'Only pronunciation'],
          correct: 1,
          ex: '“It can show you mistakes you do not notice while speaking.”',
        },
        {
          q: 'How does A feel about the advice?',
          opts: ['Confused', 'It sounds useful', 'Annoyed', 'Not interested'],
          correct: 1,
          ex: '“That sounds useful.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 2 (Day 51) ─────────────────────────
  // Câu điều kiện loại 1 — đoạn mới + hội thoại mới.
  '8:2': {
    reading: {
      title: 'If students practise every day',
      subtitle: 'Đọc đoạn dùng câu điều kiện loại 1 (80 từ) rồi trả lời câu hỏi',
      text:
        'If students practise every day, they will improve quickly, even with a short study ' +
        'time. If English becomes too stressful, they will lose interest, so it is important ' +
        'to keep learning enjoyable. If a learner studies hard before an exam, she will feel ' +
        'more confident on the test day. If someone records their speaking every week, they ' +
        'will notice their own progress more clearly. These small habits show that steady ' +
        'effort, not sudden pressure, is what really helps learners move forward.',
      questions: [
        {
          q: 'What will happen if students practise every day?',
          opts: ['They will lose interest', 'They will improve quickly', 'They will feel bored', 'Nothing will change'],
          correct: 1,
          ex: '“If students practise every day, they will improve quickly…”',
        },
        {
          q: 'Why is it important to keep learning enjoyable?',
          opts: [
            'Because tests become easier',
            'Because if English becomes too stressful, students will lose interest',
            'Because teachers require it',
            'Because it saves money',
          ],
          correct: 1,
          ex: '“If English becomes too stressful, they will lose interest…”',
        },
        {
          q: 'What will happen if a learner studies hard before an exam?',
          opts: ['She will feel more nervous', 'She will feel more confident', 'She will forget everything', 'She will skip the exam'],
          correct: 1,
          ex: '“If a learner studies hard before an exam, she will feel more confident on the test day.”',
        },
        {
          // Paraphrase: "steady effort, not sudden pressure, is what really helps learners move forward."
          q: 'What does the passage suggest really helps learners progress?',
          opts: [
            'Sudden pressure before exams',
            'Steady, regular effort over time',
            'Studying only once a month',
            'Avoiding practice until ready',
          ],
          correct: 1,
          ex: '“…steady effort, not sudden pressure, is what really helps learners move forward.”',
        },
      ],
    },

    listening: {
      title: 'Talking about conditions',
      subtitle: 'Nghe hội thoại dùng câu điều kiện loại 1 — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: What will happen if you review your notes every night? B: If I review every ' +
        'night, I will remember new words much better. A: And if you skip a day? B: If I ' +
        'skip a day, I will just review two days together the next time. A: That is a smart ' +
        'plan.',
      questions: [
        {
          type: 'cloze',
          q: 'B says if she reviews every night, she _____ remember new words much better.',
          answer: ['will'],
          ex: '“If I review every night, I will remember new words much better.”',
        },
        {
          q: 'What will B do if she skips a day?',
          opts: ['Give up completely', 'Review two days together next time', 'Stop learning English', 'Ignore it'],
          correct: 1,
          ex: '“If I skip a day, I will just review two days together the next time.”',
        },
        {
          q: 'What does A think of B\'s plan?',
          opts: ['It is a smart plan', 'It is a bad plan', 'It will not work', 'It is too strict'],
          correct: 0,
          ex: '“That is a smart plan.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 3 (Day 52) ─────────────────────────
  // Từ vựng IELTS bridge (lead to, result in, have an impact on) — đoạn mới + hội thoại mới.
  '8:3': {
    reading: {
      title: 'Why students get distracted',
      subtitle: 'Đọc đoạn dùng từ liên hệ IELTS (81 từ) rồi trả lời câu hỏi',
      text:
        'One main reason students get distracted while studying online is their phone. ' +
        'Checking messages can lead to twenty minutes of scrolling instead of learning. This ' +
        'habit can result in slower progress, even for motivated students. Using English ' +
        'every day can have a positive impact on confidence, but only if study time is ' +
        'actually focused. A possible solution is to put the phone on airplane mode and set ' +
        'a short timer before starting any lesson.',
      questions: [
        {
          q: 'What is one main reason students get distracted while studying online?',
          opts: ['Their textbooks', 'Their phone', 'Their teacher', 'Their classroom'],
          correct: 1,
          ex: '“One main reason students get distracted while studying online is their phone.”',
        },
        {
          q: 'What can checking messages lead to?',
          opts: ['Better focus', 'Twenty minutes of scrolling instead of learning', 'Faster progress', 'More confidence'],
          correct: 1,
          ex: '“Checking messages can lead to twenty minutes of scrolling instead of learning.”',
        },
        {
          q: 'What is a possible solution mentioned in the passage?',
          opts: [
            'Studying only at night',
            'Putting the phone on airplane mode and setting a short timer',
            'Deleting all social media',
            'Studying without any breaks',
          ],
          correct: 1,
          ex: '“A possible solution is to put the phone on airplane mode and set a short timer…”',
        },
        {
          // Paraphrase: "Using English every day can have a positive impact on confidence, but only if study time is actually focused."
          q: 'According to the passage, when does using English daily really help confidence?',
          opts: [
            'Only when study time is focused, not distracted',
            'Only when using a new phone',
            'Only during exams',
            'It never helps confidence',
          ],
          correct: 0,
          ex: '“Using English every day can have a positive impact on confidence, but only if study time is actually focused.”',
        },
      ],
    },

    listening: {
      title: 'Discussing causes and solutions',
      subtitle: 'Nghe hội thoại dùng từ liên hệ IELTS — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Why do so many students forget new words? B: One main reason is that they do not ' +
        'review regularly. A: Does that result in slower progress? B: Yes, it can result in ' +
        'much slower progress. A: So what is a possible solution? B: A possible solution is ' +
        'to review each word five times in different sentences.',
      questions: [
        {
          type: 'cloze',
          q: 'B says a possible solution is to review each word _____ times in different sentences.',
          answer: ['five', '5'],
          ex: '“A possible solution is to review each word five times in different sentences.”',
        },
        {
          q: 'What is one main reason students forget new words, according to B?',
          opts: ['They study too much', 'They do not review regularly', 'They use too many apps', 'They sleep too little'],
          correct: 1,
          ex: '“One main reason is that they do not review regularly.”',
        },
        {
          q: 'What can not reviewing regularly result in?',
          opts: ['Faster progress', 'Much slower progress', 'Better memory', 'No change at all'],
          correct: 1,
          ex: '“Yes, it can result in much slower progress.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 4 (Day 53) ─────────────────────────
  // Speaking Part 2 — khung 7 bước + cue card, bản ghi 90 giây.
  '8:4': {
    reading: {
      title: 'A story about learning something difficult',
      subtitle: 'Đọc đoạn dùng khung kể chuyện Part 2 (83 từ) rồi trả lời câu hỏi',
      text:
        'I want to talk about the time when I tried to learn English pronunciation again. It ' +
        'happened last year, when I realised I could read many words but could not say them ' +
        'clearly. At first, I felt embarrassed because even simple words sounded strange. ' +
        'Then I started practising with short videos and recording my voice. It was ' +
        'difficult, but after a few weeks, I noticed small changes. This experience was ' +
        'important because it showed me that I did not need to be perfect, just consistent.',
      questions: [
        {
          q: 'What did the writer realise about their pronunciation?',
          opts: [
            'They could not read any words',
            'They could read words but could not say them clearly',
            'They spoke perfectly already',
            'They never practised before',
          ],
          correct: 1,
          ex: '“…I realised I could read many words but could not say them clearly.”',
        },
        {
          q: 'How did the writer feel at first?',
          opts: ['Proud', 'Embarrassed', 'Relaxed', 'Bored'],
          correct: 1,
          ex: '“At first, I felt embarrassed because even simple words sounded strange.”',
        },
        {
          q: 'What method did the writer use to practise?',
          opts: [
            'Reading books silently',
            'Practising with short videos and recording their voice',
            'Only listening to music',
            'Memorising a dictionary',
          ],
          correct: 1,
          ex: '“Then I started practising with short videos and recording my voice.”',
        },
        {
          // Paraphrase: "it showed me that I did not need to be perfect, just consistent."
          q: 'What lesson did this experience teach the writer?',
          opts: [
            'Perfection is required before speaking',
            'Being consistent matters more than being perfect',
            'Videos are the only useful tool',
            'Pronunciation cannot be improved',
          ],
          correct: 1,
          ex: '“…it showed me that I did not need to be perfect, just consistent.”',
        },
      ],
    },

    listening: {
      title: 'Preparing for a cue card',
      subtitle: 'Nghe hội thoại chuẩn bị Part 2 — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How do you prepare for a Part 2 cue card? B: I write seven bullet points instead ' +
        'of a full script. A: Why not write everything out? B: Because if I memorise a ' +
        'script, I sound unnatural. Bullets help me remember the story, not the exact words. ' +
        'A: That makes sense.',
      questions: [
        {
          type: 'cloze',
          q: 'B writes _____ bullet points instead of a full script.',
          answer: ['seven', '7'],
          ex: '“I write seven bullet points instead of a full script.”',
        },
        {
          q: 'Why does B avoid writing a full script?',
          opts: [
            'It takes too much paper',
            'Memorising a script makes speech sound unnatural',
            'Teachers do not allow it',
            'It is against the rules',
          ],
          correct: 1,
          ex: '“Because if I memorise a script, I sound unnatural.”',
        },
        {
          q: 'What do the bullet points help B remember?',
          opts: ['The exact words', 'The story, not the exact words', 'Nothing useful', 'Only the ending'],
          correct: 1,
          ex: '“Bullets help me remember the story, not the exact words.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 5 (Day 54) ─────────────────────────
  // Speaking Part 3 + Writing Task 2 Lite — khung General→Reason→Vietnam example→Soft conclusion.
  '8:5': {
    reading: {
      title: 'Why language learning feels hard',
      subtitle: 'Đọc đoạn dùng khung Part 3 (82 từ) rồi trả lời câu hỏi',
      text:
        'There are several reasons why some students find it hard to learn a foreign ' +
        'language, but one common reason is that they do not know how to review effectively. ' +
        'They may learn many words in one day but never use them again, so they forget ' +
        'quickly. In Vietnam, many students are also used to grammar exercises, so they can ' +
        'feel nervous when asked to speak freely. Language learning usually becomes easier ' +
        'when students practise in small steps and use the language in real situations.',
      questions: [
        {
          q: 'What is one common reason students find language learning hard?',
          opts: [
            'They do not know how to review effectively',
            'They study too many languages',
            'They have no textbooks',
            'They dislike their teachers',
          ],
          correct: 0,
          ex: '“…one common reason is that they do not know how to review effectively.”',
        },
        {
          q: 'Why do Vietnamese students often feel nervous about speaking freely?',
          opts: [
            'They are used to grammar exercises, not free speaking',
            'They dislike English',
            'They have never studied grammar',
            'They only practise speaking',
          ],
          correct: 0,
          ex: '“In Vietnam, many students are also used to grammar exercises, so they can feel nervous when asked to speak freely.”',
        },
        {
          q: 'What happens if students learn many words but never use them again?',
          opts: ['They remember forever', 'They forget quickly', 'They become fluent instantly', 'Nothing changes'],
          correct: 1,
          ex: '“They may learn many words in one day but never use them again, so they forget quickly.”',
        },
        {
          // Paraphrase: "Language learning usually becomes easier when students practise in small steps and use the language in real situations."
          q: 'According to the passage, when does language learning usually become easier?',
          opts: [
            'When students avoid speaking',
            'When students practise in small steps and use the language for real',
            'When students only memorise grammar rules',
            'When students study alone without practice',
          ],
          correct: 1,
          ex: '“Language learning usually becomes easier when students practise in small steps and use the language in real situations.”',
        },
      ],
    },

    listening: {
      title: 'Planning a Task 2 Lite paragraph',
      subtitle: 'Nghe hội thoại về khung Opinion-Reason-Example-Balance — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How do you plan a Task 2 Lite paragraph? B: I start with my opinion, then give ' +
        'one reason, then a Vietnam example. A: Do you add anything else? B: Yes, I add a ' +
        'balance sentence at the end, like a soft conclusion. A: That sounds like a clear ' +
        'structure.',
      questions: [
        {
          type: 'cloze',
          q: 'B starts the paragraph with the _____, then a reason, then an example.',
          answer: ['opinion'],
          ex: '“I start with my opinion, then give one reason, then a Vietnam example.”',
        },
        {
          q: 'What does B add at the end of the paragraph?',
          opts: ['Another opinion', 'A balance sentence, like a soft conclusion', 'A new topic', 'A question'],
          correct: 1,
          ex: '“I add a balance sentence at the end, like a soft conclusion.”',
        },
        {
          q: 'What does A think of this structure?',
          opts: ['It sounds confusing', 'It sounds like a clear structure', 'It is too long', 'It is not useful'],
          correct: 1,
          ex: '“That sounds like a clear structure.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 6 (Day 55) ─────────────────────────
  // Ngày sản phẩm — Task 2 Lite hoàn chỉnh + nói 2 phút.
  '8:6': {
    reading: {
      title: 'Learning English from a young age',
      subtitle: 'Đọc đoạn Task 2 Lite (84 từ) rồi trả lời câu hỏi',
      text:
        'Many people think students should learn English from a young age, and this can be a ' +
        'good idea if the process stays gentle. When children learn English early, they can ' +
        'become familiar with sounds and simple words through songs, stories, and games. This ' +
        'may help them feel less afraid of English later. However, if learning becomes too ' +
        'exam-focused, young learners will lose interest quickly. Early English learning ' +
        'works best when it builds confidence rather than pressure.',
      questions: [
        {
          q: 'When can learning English from a young age be a good idea?',
          opts: ['When it stays gentle', 'Only in international schools', 'Only with private tutors', 'Never'],
          correct: 0,
          ex: '“…this can be a good idea if the process stays gentle.”',
        },
        {
          q: 'How can children become familiar with English early, according to the passage?',
          opts: [
            'Through exams only',
            'Through songs, stories, and games',
            'Through long grammar lessons',
            'Through memorising word lists',
          ],
          correct: 1,
          ex: '“…they can become familiar with sounds and simple words through songs, stories, and games.”',
        },
        {
          q: 'What will happen if learning becomes too exam-focused?',
          opts: ['Young learners will love it more', 'Young learners will lose interest quickly', 'Nothing will change', 'Learners will study faster'],
          correct: 1,
          ex: '“…if learning becomes too exam-focused, young learners will lose interest quickly.”',
        },
        {
          // Paraphrase: "Early English learning works best when it builds confidence rather than pressure."
          q: 'According to the passage, when does early English learning work best?',
          opts: [
            'When it builds confidence rather than pressure',
            'When it is stressful and fast-paced',
            'When it focuses only on tests',
            'When it starts very late',
          ],
          correct: 0,
          ex: '“Early English learning works best when it builds confidence rather than pressure.”',
        },
      ],
    },

    listening: {
      title: 'Recording a two-minute talk',
      subtitle: 'Nghe hội thoại về việc ghi âm sản phẩm nói — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: Are you ready to record your two-minute talk? B: Almost. If I make a mistake, I ' +
        'will just pause and continue speaking. A: That is a good strategy. B: Yes, stopping ' +
        'completely would waste the recording, so I should keep going.',
      questions: [
        {
          type: 'cloze',
          q: 'B says if she makes a mistake, she will _____ and continue speaking.',
          answer: ['pause'],
          ex: '“If I make a mistake, I will just pause and continue speaking.”',
        },
        {
          q: 'What does A think of B\'s strategy?',
          opts: ['It is a bad idea', 'It is a good strategy', 'It will not work', 'It is confusing'],
          correct: 1,
          ex: '“That is a good strategy.”',
        },
        {
          q: 'Why does B say she should keep going after a mistake?',
          opts: [
            'Because stopping completely would waste the recording',
            'Because the teacher requires it',
            'Because she has no more time',
            'Because mistakes do not matter',
          ],
          correct: 0,
          ex: '“Yes, stopping completely would waste the recording, so I should keep going.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 7 (Day 56) ─────────────────────────
  // Ôn nhẹ phần output — shadow 5 câu mẫu hay nhất.
  '8:7': {
    reading: {
      title: 'Shadowing the best sentences',
      subtitle: 'Đọc đoạn ôn tập output (78 từ) rồi trả lời câu hỏi',
      text:
        'At the end of a busy week, it can help to slow down and review the best sentences a ' +
        'learner has produced. Shadowing these sentences, saying them aloud several times, ' +
        'can strengthen pronunciation and natural rhythm. If a learner picks five strong ' +
        'sentences, they will build a small collection of reliable language to reuse in real ' +
        'conversations. This method also builds confidence, because the learner is repeating ' +
        'something they already know is correct.',
      questions: [
        {
          q: 'What does the passage suggest doing at the end of a busy week?',
          opts: [
            'Learning completely new material',
            'Slowing down and reviewing the best sentences produced',
            'Skipping review entirely',
            'Taking a long test',
          ],
          correct: 1,
          ex: '“At the end of a busy week, it can help to slow down and review the best sentences a learner has produced.”',
        },
        {
          q: 'What can shadowing sentences strengthen?',
          opts: ['Only vocabulary size', 'Pronunciation and natural rhythm', 'Handwriting', 'Listening speed only'],
          correct: 1,
          ex: '“Shadowing these sentences… can strengthen pronunciation and natural rhythm.”',
        },
        {
          q: 'How many strong sentences does the passage suggest picking?',
          opts: ['Two', 'Five', 'Ten', 'Twenty'],
          correct: 1,
          ex: '“If a learner picks five strong sentences, they will build a small collection…”',
        },
        {
          // Paraphrase: "This method also builds confidence, because the learner is repeating something they already know is correct."
          q: 'Why does this method also build confidence?',
          opts: [
            'Because the learner repeats sentences they already know are correct',
            'Because it is a difficult challenge',
            'Because it involves new grammar',
            'Because it requires no effort',
          ],
          correct: 0,
          ex: '“This method also builds confidence, because the learner is repeating something they already know is correct.”',
        },
      ],
    },

    listening: {
      title: 'Choosing sentences to shadow',
      subtitle: 'Nghe hội thoại chọn câu để shadow — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How do you choose which sentences to shadow? B: I pick ones that sound natural ' +
        'and use grammar I have already checked. A: Does this help your speaking? B: Yes, if ' +
        'I repeat a good sentence enough times, I will remember it automatically.',
      questions: [
        {
          type: 'cloze',
          q: 'B picks sentences that sound natural and use grammar she has already _____.',
          answer: ['checked'],
          ex: '“I pick ones that sound natural and use grammar I have already checked.”',
        },
        {
          q: 'What will happen if B repeats a good sentence enough times?',
          opts: ['She will forget it', 'She will remember it automatically', 'It will become harder', 'Nothing will change'],
          correct: 1,
          ex: '“…if I repeat a good sentence enough times, I will remember it automatically.”',
        },
        {
          q: 'Does shadowing help B\'s speaking, according to the conversation?',
          opts: ['No, it does not help', 'Yes, it does', 'She is not sure', 'It only helps writing'],
          correct: 1,
          ex: '“Does this help your speaking? B: Yes…”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 8 (Day 57) ─────────────────────────
  // Mini-mock 1/7 — ôn ngữ pháp toàn khóa qua sổ lỗi.
  '8:8': {
    reading: {
      title: 'Reviewing the error notebook',
      subtitle: 'Đọc đoạn ôn tập ngữ pháp (80 từ) rồi trả lời câu hỏi',
      text:
        'If a learner reviews their error notebook regularly, they will notice the same few ' +
        'mistakes appearing again and again. This repetition is useful information, not a ' +
        'reason to feel discouraged. One main reason errors repeat is that learners see the ' +
        'correction once but never practise the correct form enough times. A possible ' +
        'solution is to turn each common error into one clear, correct sentence and read it ' +
        'aloud every day until it feels natural.',
      questions: [
        {
          q: 'What will a learner notice if they review their error notebook regularly?',
          opts: [
            'That errors are always different every time',
            'The same few mistakes appearing again and again',
            'That grammar is not important',
            'That review is a waste of time',
          ],
          correct: 1,
          ex: '“If a learner reviews their error notebook regularly, they will notice the same few mistakes appearing again and again.”',
        },
        {
          q: 'How should this repetition of errors be seen?',
          opts: ['As useful information', 'As a reason to give up', 'As a sign of failure', 'As unimportant'],
          correct: 0,
          ex: '“This repetition is useful information, not a reason to feel discouraged.”',
        },
        {
          q: 'What is one main reason errors repeat, according to the passage?',
          opts: [
            'Learners never make mistakes',
            'Learners see the correction once but do not practise it enough',
            'Learners do not use notebooks',
            'Teachers do not correct errors',
          ],
          correct: 1,
          ex: '“One main reason errors repeat is that learners see the correction once but never practise the correct form enough times.”',
        },
        {
          // Paraphrase: "turn each common error into one clear, correct sentence and read it aloud every day until it feels natural."
          q: 'What solution does the passage suggest for repeated errors?',
          opts: [
            'Ignoring the error notebook completely',
            'Turning each error into a correct sentence and repeating it daily',
            'Studying a new topic instead',
            'Only reading about grammar theory',
          ],
          correct: 1,
          ex: '“A possible solution is to turn each common error into one clear, correct sentence and read it aloud every day until it feels natural.”',
        },
      ],
    },

    listening: {
      title: 'Ten standard sentences',
      subtitle: 'Nghe hội thoại tổng ôn ngữ pháp — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How many standard sentences did you write from your error notebook? ' +
        'Student: I wrote ten sentences, one for each common mistake. Teacher: That is a ' +
        'great habit. Student: Yes, if I read them aloud every day, I will remember the ' +
        'correct forms much better.',
      questions: [
        {
          type: 'cloze',
          q: 'The student wrote _____ standard sentences, one for each common mistake.',
          answer: ['ten', '10'],
          ex: '“I wrote ten sentences, one for each common mistake.”',
        },
        {
          q: 'What does the teacher think of this habit?',
          opts: ['It is a great habit', 'It is not useful', 'It wastes time', 'It is too difficult'],
          correct: 0,
          ex: '“That is a great habit.”',
        },
        {
          q: 'What will happen if the student reads the sentences aloud every day?',
          opts: [
            'She will forget them faster',
            'She will remember the correct forms much better',
            'Nothing will change',
            'She will make more mistakes',
          ],
          correct: 1,
          ex: '“…if I read them aloud every day, I will remember the correct forms much better.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 9 (Day 58) ─────────────────────────
  // Mini-mock 2/7 — Reading, tự chấm, câu tóm tắt.
  '8:9': {
    reading: {
      title: 'Self-marking a reading passage',
      subtitle: 'Đọc đoạn ôn Reading (79 từ) rồi trả lời câu hỏi',
      text:
        'After finishing a reading passage, a learner should always self-mark their answers ' +
        'carefully. If an answer is wrong, the learner should find the exact evidence in the ' +
        'text rather than just accepting the correct letter. This process can result in a ' +
        'deeper understanding of paraphrase and reference words. A possible solution for ' +
        'repeated mistakes with True/False/Not Given questions is to underline the key words ' +
        'in the question before searching the passage.',
      questions: [
        {
          q: 'What should a learner do after finishing a reading passage?',
          opts: ['Move on immediately', 'Self-mark their answers carefully', 'Skip checking answers', 'Only check the last question'],
          correct: 1,
          ex: '“After finishing a reading passage, a learner should always self-mark their answers carefully.”',
        },
        {
          q: 'What should a learner do if an answer is wrong?',
          opts: [
            'Just accept the correct letter',
            'Find the exact evidence in the text',
            'Skip that question forever',
            'Guess again randomly',
          ],
          correct: 1,
          ex: '“If an answer is wrong, the learner should find the exact evidence in the text rather than just accepting the correct letter.”',
        },
        {
          q: 'What can this process result in?',
          opts: [
            'A deeper understanding of paraphrase and reference words',
            'Less understanding of the passage',
            'Faster reading speed only',
            'No real change',
          ],
          correct: 0,
          ex: '“This process can result in a deeper understanding of paraphrase and reference words.”',
        },
        {
          // Paraphrase
          q: 'What does the passage suggest doing before searching for True/False/Not Given answers?',
          opts: [
            'Reading the whole passage twice first',
            'Underlining the key words in the question',
            'Guessing without reading',
            'Skipping the question section',
          ],
          correct: 1,
          ex: '“…is to underline the key words in the question before searching the passage.”',
        },
      ],
    },

    listening: {
      title: 'Talking about the reading mock',
      subtitle: 'Nghe hội thoại tổng ôn Reading — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How did the reading mock go? B: I finished two passages, but I made a few ' +
        'mistakes with True/False/Not Given. A: Did you find the evidence for the wrong ' +
        'ones? B: Yes, and if I underline key words next time, I will avoid the same errors.',
      questions: [
        {
          type: 'cloze',
          q: 'B finished _____ passages during the mock.',
          answer: ['two', '2'],
          ex: '“I finished two passages, but I made a few mistakes with True/False/Not Given.”',
        },
        {
          q: 'What type of question did B struggle with?',
          opts: ['Matching headings', 'True/False/Not Given', 'Multiple choice only', 'Summary completion'],
          correct: 1,
          ex: '“I made a few mistakes with True/False/Not Given.”',
        },
        {
          q: 'What will B do next time to avoid the same errors?',
          opts: ['Skip that question type', 'Underline key words first', 'Read faster', 'Guess more often'],
          correct: 1,
          ex: '“…if I underline key words next time, I will avoid the same errors.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 10 (Day 59) ─────────────────────────
  // Mini-mock 3/7 — Listening, cặp số dễ nhầm, shadow script.
  '8:10': {
    reading: {
      title: 'Numbers that sound similar',
      subtitle: 'Đọc đoạn ôn Listening (77 từ) rồi trả lời câu hỏi',
      text:
        'Many learners confuse numbers like thirteen and thirty because the stress pattern is ' +
        'very similar. If a learner practises these pairs every week, they will hear the ' +
        'difference more easily over time. Spelling names correctly is another common ' +
        'challenge, since letters like "m" and "n" can sound alike. A possible solution is to ' +
        'shadow a short script several times, paying close attention to stress and letter ' +
        'sounds.',
      questions: [
        {
          q: 'Why do many learners confuse numbers like thirteen and thirty?',
          opts: [
            'Because they look the same when written',
            'Because the stress pattern is very similar',
            'Because they are rarely used',
            'Because they are spelled the same',
          ],
          correct: 1,
          ex: '“Many learners confuse numbers like thirteen and thirty because the stress pattern is very similar.”',
        },
        {
          q: 'What will happen if a learner practises number pairs every week?',
          opts: [
            'They will hear the difference more easily over time',
            'They will confuse them even more',
            'Nothing will change',
            'They will stop needing to listen',
          ],
          correct: 0,
          ex: '“If a learner practises these pairs every week, they will hear the difference more easily over time.”',
        },
        {
          q: 'Why can spelling names be a challenge?',
          opts: [
            'Because names are always short',
            'Because letters like "m" and "n" can sound alike',
            'Because names are never spelled aloud',
            'Because names have no letters',
          ],
          correct: 1,
          ex: '“Spelling names correctly is another common challenge, since letters like \'m\' and \'n\' can sound alike.”',
        },
        {
          // Paraphrase
          q: 'What solution does the passage suggest for these listening challenges?',
          opts: [
            'Avoiding numbers and names completely',
            'Shadowing a short script several times, focusing on stress and letters',
            'Reading a script silently once',
            'Memorising a dictionary of numbers',
          ],
          correct: 1,
          ex: '“A possible solution is to shadow a short script several times, paying close attention to stress and letter sounds.”',
        },
      ],
    },

    listening: {
      title: 'Practising tricky numbers',
      subtitle: 'Nghe hội thoại về số dễ nhầm — điền CON SỐ, hai câu sau chọn đáp án',
      audioUrl: null,
      script:
        'A: Can you say your phone number for me? B: Yes, it ends in thirteen, not thirty. A: ' +
        'Got it, thirteen. B: If we practise numbers like this every day, we will make fewer ' +
        'mistakes in the real test.',
      questions: [
        {
          type: 'cloze',
          q: 'B\'s phone number ends in _____, not thirty.',
          answer: ['thirteen', '13'],
          ex: '“Yes, it ends in thirteen, not thirty.”',
        },
        {
          q: 'What does B say will happen with daily number practice?',
          opts: [
            'They will make fewer mistakes in the real test',
            'They will forget the numbers',
            'It will not help at all',
            'They will avoid the test',
          ],
          correct: 0,
          ex: '“If we practise numbers like this every day, we will make fewer mistakes in the real test.”',
        },
        {
          q: 'What numbers are being compared in this conversation?',
          opts: ['Twelve and twenty', 'Thirteen and thirty', 'Fourteen and forty', 'Fifteen and fifty'],
          correct: 1,
          ex: '“Yes, it ends in thirteen, not thirty.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 11 (Day 60) ─────────────────────────
  // Mini-mock 4/7 — Writing, Task 1 Lite + Task 2 Lite, khung T-S-E-F.
  '8:11': {
    reading: {
      title: 'The T-S-E-F writing frame',
      subtitle: 'Đọc đoạn ôn Writing (81 từ) rồi trả lời câu hỏi',
      text:
        'A simple writing frame can help beginners organise a paragraph clearly: Topic ' +
        'sentence, Support, Example, Finish. If a learner follows this frame, they will avoid ' +
        'writing random, disconnected ideas. The topic sentence should state the main idea in ' +
        'one clear sentence. The support sentence should explain why, and the example should ' +
        'give a real situation, often from Vietnam. A possible solution for weak endings is ' +
        'to finish with a short sentence that connects back to the topic.',
      questions: [
        {
          q: 'What does the T-S-E-F frame stand for?',
          opts: [
            'Topic, Support, Example, Finish',
            'Test, Speak, Explain, Fix',
            'Topic, Speak, Evidence, Finish',
            'Time, Support, Example, Fact',
          ],
          correct: 0,
          ex: '“…Topic sentence, Support, Example, Finish.”',
        },
        {
          q: 'What will happen if a learner follows this frame?',
          opts: [
            'They will write random, disconnected ideas',
            'They will avoid writing random, disconnected ideas',
            'They will write shorter essays only',
            'They will skip the example section',
          ],
          correct: 1,
          ex: '“If a learner follows this frame, they will avoid writing random, disconnected ideas.”',
        },
        {
          q: 'What should the example sentence often include?',
          opts: [
            'A real situation, often from Vietnam',
            'A famous quotation',
            'Another topic sentence',
            'A grammar rule',
          ],
          correct: 0,
          ex: '“…the example should give a real situation, often from Vietnam.”',
        },
        {
          // Paraphrase
          q: 'What does the passage suggest doing to fix weak endings?',
          opts: [
            'Adding a new topic at the end',
            'Finishing with a sentence that connects back to the topic',
            'Ending without any conclusion',
            'Repeating the example twice',
          ],
          correct: 1,
          ex: '“A possible solution for weak endings is to finish with a short sentence that connects back to the topic.”',
        },
      ],
    },

    listening: {
      title: 'Timing the writing mock',
      subtitle: 'Nghe hội thoại về canh giờ Writing — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How much time did you spend on Task 1 Lite? B: About fifteen minutes, then the ' +
        'rest on Task 2 Lite. A: Did you use the T-S-E-F frame? B: Yes, and if I keep using ' +
        'it, my paragraphs will stay much more organised.',
      questions: [
        {
          type: 'cloze',
          q: 'B spent about _____ minutes on Task 1 Lite.',
          answer: ['fifteen', '15'],
          ex: '“About fifteen minutes, then the rest on Task 2 Lite.”',
        },
        {
          q: 'What frame did B use for writing?',
          opts: ['T-S-E-F', 'A-B-C-D', 'General-Reason-Example', 'Intro-Body-Conclusion only'],
          correct: 0,
          ex: '“Did you use the T-S-E-F frame? B: Yes…”',
        },
        {
          q: 'What does B say will happen if she keeps using the frame?',
          opts: [
            'Her paragraphs will become messier',
            'Her paragraphs will stay much more organised',
            'She will stop writing altogether',
            'Nothing will change',
          ],
          correct: 1,
          ex: '“…if I keep using it, my paragraphs will stay much more organised.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 12 (Day 61) ─────────────────────────
  // Mini-mock 5/7 — Speaking, cue card 2 phút + Part 3.
  '8:12': {
    reading: {
      title: 'Preparing the speaking mock',
      subtitle: 'Đọc đoạn ôn Speaking (80 từ) rồi trả lời câu hỏi',
      text:
        'Before a speaking mock, a learner should review the seven-step story frame and the ' +
        'General-Reason-Example-Conclusion frame for Part 3. If a learner records the full ' +
        'two-minute answer, they will be able to notice hesitation and repeated errors ' +
        'afterwards. One common problem is stopping completely after a mistake instead of ' +
        'pausing briefly and continuing. A possible solution is to practise recovering from a ' +
        'mistake by saying a simple filler and moving forward.',
      questions: [
        {
          q: 'What two frames should a learner review before a speaking mock?',
          opts: [
            'The T-S-E-F frame and a grammar chart',
            'The seven-step story frame and the Part 3 frame',
            'Only a vocabulary list',
            'A pronunciation chart only',
          ],
          correct: 1,
          ex: '“…a learner should review the seven-step story frame and the General-Reason-Example-Conclusion frame for Part 3.”',
        },
        {
          q: 'What will happen if a learner records the full two-minute answer?',
          opts: [
            'They will notice hesitation and repeated errors afterwards',
            'They will forget the recording',
            'Nothing useful will happen',
            'They will need less practice',
          ],
          correct: 0,
          ex: '“If a learner records the full two-minute answer, they will be able to notice hesitation and repeated errors afterwards.”',
        },
        {
          q: 'What is one common problem after making a mistake?',
          opts: [
            'Pausing briefly and continuing',
            'Stopping completely instead of continuing',
            'Speaking faster than before',
            'Repeating the whole answer',
          ],
          correct: 1,
          ex: '“One common problem is stopping completely after a mistake instead of pausing briefly and continuing.”',
        },
        {
          // Paraphrase
          q: 'What solution does the passage suggest for recovering from mistakes?',
          opts: [
            'Stopping the recording immediately',
            'Using a simple filler and moving forward',
            'Restarting the whole answer',
            'Avoiding difficult topics',
          ],
          correct: 1,
          ex: '“A possible solution is to practise recovering from a mistake by saying a simple filler and moving forward.”',
        },
      ],
    },

    listening: {
      title: 'After the speaking mock',
      subtitle: 'Nghe hội thoại sau bài mock Speaking — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How did the two-minute cue card go? B: Quite well, though I paused once when I ' +
        'lost my place. A: Did you continue afterwards? B: Yes, and if I keep practising ' +
        'recovery like that, I will sound calmer during the real test.',
      questions: [
        {
          type: 'cloze',
          q: 'B paused once when she _____ her place.',
          answer: ['lost'],
          ex: '“Quite well, though I paused once when I lost my place.”',
        },
        {
          q: 'What did B do after losing her place?',
          opts: ['Stopped completely', 'Continued speaking', 'Ended the recording', 'Restarted from zero'],
          correct: 1,
          ex: '“Did you continue afterwards? B: Yes…”',
        },
        {
          q: 'What does B expect from practising recovery?',
          opts: [
            'She will sound calmer during the real test',
            'She will become more nervous',
            'She will avoid speaking tests',
            'Nothing will change',
          ],
          correct: 0,
          ex: '“…if I keep practising recovery like that, I will sound calmer during the real test.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 13 (Day 62) ─────────────────────────
  // MINI-MOCK trọn gói ~90 phút — 4 kỹ năng.
  '8:13': {
    reading: {
      title: 'Doing a full mini-mock',
      subtitle: 'Đọc đoạn ôn tổng hợp 4 kỹ năng (83 từ) rồi trả lời câu hỏi',
      text:
        'A full mini-mock brings all four skills together in about ninety minutes: listening, ' +
        'reading, writing, and speaking. If a learner manages their time carefully, they will ' +
        'finish every section without rushing at the end. One main reason mock tests feel ' +
        'stressful is that learners try to be perfect instead of simply completing each ' +
        'section. A possible solution is to treat the mock as practice, not as a final judge ' +
        'of ability, and to review errors calmly afterwards.',
      questions: [
        {
          q: 'How long does a full mini-mock usually take, according to the passage?',
          opts: ['About thirty minutes', 'About ninety minutes', 'About three hours', 'About ten minutes'],
          correct: 1,
          ex: '“A full mini-mock brings all four skills together in about ninety minutes…”',
        },
        {
          q: 'What will happen if a learner manages their time carefully?',
          opts: [
            'They will rush at the end anyway',
            'They will finish every section without rushing at the end',
            'They will skip one skill completely',
            'They will need more time overall',
          ],
          correct: 1,
          ex: '“If a learner manages their time carefully, they will finish every section without rushing at the end.”',
        },
        {
          q: 'What is one main reason mock tests feel stressful?',
          opts: [
            'Learners try to be perfect instead of just completing sections',
            'Mock tests are always too easy',
            'Learners never practise beforehand',
            'There are no time limits',
          ],
          correct: 0,
          ex: '“One main reason mock tests feel stressful is that learners try to be perfect instead of simply completing each section.”',
        },
        {
          // Paraphrase
          q: 'How does the passage suggest treating the mock test?',
          opts: [
            'As a final judge of ability',
            'As practice, reviewing errors calmly afterwards',
            'As something to avoid completely',
            'As a reason to stop studying',
          ],
          correct: 1,
          ex: '“A possible solution is to treat the mock as practice, not as a final judge of ability, and to review errors calmly afterwards.”',
        },
      ],
    },

    listening: {
      title: 'Reflecting after the full mock',
      subtitle: 'Nghe hội thoại tổng kết mini-mock trọn gói — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'A: How did the full mini-mock feel overall? B: Long, but manageable, since I paced ' +
        'myself. A: Which section felt hardest? B: Writing, but if I keep using the T-S-E-F ' +
        'frame, I will improve there fastest.',
      questions: [
        {
          type: 'cloze',
          q: 'B says the mock felt long, but _____, since she paced herself.',
          answer: ['manageable'],
          ex: '“Long, but manageable, since I paced myself.”',
        },
        {
          q: 'Which section did B find hardest?',
          opts: ['Listening', 'Reading', 'Writing', 'Speaking'],
          correct: 2,
          ex: '“Which section felt hardest? B: Writing…”',
        },
        {
          q: 'What does B expect from continuing to use the T-S-E-F frame?',
          opts: [
            'She will improve fastest in writing',
            'She will stop needing to write',
            'It will make writing harder',
            'Nothing will change',
          ],
          correct: 0,
          ex: '“…if I keep using the T-S-E-F frame, I will improve there fastest.”',
        },
      ],
    },
  },

  // ───────────────────────── Tuần 8 · Buổi 14 (Day 63) ─────────────────────────
  // Nhìn lại + tự chấm band readiness + Bài kiểm tra tuần.
  '8:14': {
    reading: {
      title: 'Looking back at week zero',
      subtitle: 'Đọc đoạn tổng kết cuối khóa (82 từ) rồi trả lời câu hỏi',
      text:
        'Comparing a recent recording with the very first one from week zero can show real ' +
        'progress that is easy to forget day by day. If a learner listens carefully, they ' +
        'will notice clearer pronunciation, fewer long pauses, and more natural sentence ' +
        'connectors. One main reason this comparison matters is that daily progress feels ' +
        'small, but progress over many weeks can be large. A possible next step is to begin a ' +
        'full IELTS course with complete band descriptors and full mock tests.',
      questions: [
        {
          q: 'What can comparing a recent recording with the first one show?',
          opts: ['No real change', 'Real progress that is easy to forget day by day', 'Only mistakes', 'Nothing useful'],
          correct: 1,
          ex: '“Comparing a recent recording with the very first one from week zero can show real progress that is easy to forget day by day.”',
        },
        {
          q: 'What might a learner notice when listening carefully to both recordings?',
          opts: [
            'Clearer pronunciation, fewer pauses, more natural connectors',
            'Exactly the same speaking level',
            'Worse pronunciation than before',
            'No difference at all',
          ],
          correct: 0,
          ex: '“…they will notice clearer pronunciation, fewer long pauses, and more natural sentence connectors.”',
        },
        {
          q: 'Why does this comparison matter, according to the passage?',
          opts: [
            'Daily progress feels small, but progress over many weeks can be large',
            'Progress never really happens',
            'Comparisons are not useful',
            'Recordings are not accurate',
          ],
          correct: 0,
          ex: '“One main reason this comparison matters is that daily progress feels small, but progress over many weeks can be large.”',
        },
        {
          // Paraphrase
          q: 'What possible next step does the passage suggest?',
          opts: [
            'Stopping English study completely',
            'Beginning a full IELTS course with band descriptors and full mocks',
            'Repeating week zero again',
            'Avoiding any further tests',
          ],
          correct: 1,
          ex: '“A possible next step is to begin a full IELTS course with complete band descriptors and full mock tests.”',
        },
      ],
    },

    listening: {
      title: 'End of the foundation course',
      subtitle: 'Nghe hội thoại tổng kết cuối khóa — điền từ và chọn đáp án',
      audioUrl: null,
      script:
        'Teacher: How do you feel comparing your first recording to now? Student: Surprised — ' +
        'I sound much clearer now. Teacher: What is your band readiness level? Student: I ' +
        'think I am close to ready, around 3.5 to 4.0, and if I keep practising, I will reach ' +
        'a full IELTS course soon.',
      questions: [
        {
          type: 'cloze',
          q: 'The student feels _____ comparing the first recording to now.',
          answer: ['surprised'],
          ex: '“Surprised — I sound much clearer now.”',
        },
        {
          q: 'What band readiness level does the student mention?',
          opts: ['Around 3.5 to 4.0', 'Around 6.0 to 6.5', 'Around 8.0', 'Not ready at all'],
          correct: 0,
          ex: '“I think I am close to ready, around 3.5 to 4.0…”',
        },
        {
          q: 'What does the student expect if they keep practising?',
          opts: [
            'They will reach a full IELTS course soon',
            'They will stop learning English',
            'Nothing will change',
            'They will forget their progress',
          ],
          correct: 0,
          ex: '“…if I keep practising, I will reach a full IELTS course soon.”',
        },
      ],
    },
  },

}

/** Lấy nguồn nhập (reading/listening) cho một buổi, hoặc null nếu chưa có.
 * Nếu có bản mp3 trong manifest (sinh bằng `npm run gen:audio` hoặc thu giọng thật),
 * gắn vào listening.audioUrl để component ưu tiên phát file thay vì Web Speech. */
export function getIeltsInput(week, day) {
  const key = `${week}:${day}`
  const entry = ieltsInput[key] || null
  if (entry?.listening && !entry.listening.audioUrl && ieltsAudioManifest[key]) {
    entry.listening.audioUrl = ieltsAudioManifest[key]
  }
  return entry
}
