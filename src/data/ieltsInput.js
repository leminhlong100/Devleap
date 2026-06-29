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
