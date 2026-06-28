/**
 * NGUỒN NHẬP THẬT (Reading + Listening) cho khóa IELTS nền tảng.
 *
 * Vì sao tách riêng file: nội dung tuần (Base_English/*.md) chỉ có ngữ pháp + từ
 * vựng + checklist, KHÔNG có bài đọc/bài nghe đúng nghĩa. Tuần nền tảng vì thế
 * thiếu hẳn kỹ năng tiếp nhận (receptive input). File này bổ sung cho từng buổi:
 *  - reading:  một đoạn ngắn 60–80 từ + 2–3 câu hỏi đọc hiểu (trắc nghiệm).
 *  - listening: một đoạn hội thoại/độc thoại ngắn (tên & con số) + 2–3 câu hỏi.
 *
 * Câu hỏi dùng đúng định dạng QuizTool: { q, opts, correct, ex }.
 *
 * Audio: mặc định phát bằng Web Speech API (script). Khi có bản THU GIỌNG NGƯỜI
 * THẬT, chỉ cần đặt `audioUrl` (đường dẫn file .mp3) — component sẽ ưu tiên file.
 *
 * Khóa theo `${week}:${day}` (day = số buổi hiển thị 1..7). Hiện có Tuần 1 · Buổi 1;
 * thêm buổi khác bằng cách bổ sung khóa mới theo đúng cấu trúc.
 */

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
      ],
    },

    listening: {
      title: 'Meet Nam',
      subtitle: 'Nghe một người tự giới thiệu — chú ý TÊN và CON SỐ',
      // Phát bằng Web Speech API. Thay bằng file thu giọng thật: đặt audioUrl.
      audioUrl: null,
      script:
        'Hello. My name is Nam. I am twenty-three years old. ' +
        'I live on Tran Phu Street, at number forty-five. ' +
        'I have one brother and two sisters.',
      questions: [
        {
          q: "What is the man's name?",
          opts: ['Sam', 'Nam', 'Tom', 'Dan'],
          correct: 1,
          ex: '“My name is Nam.”',
        },
        {
          q: 'How old is he?',
          opts: ['Thirteen', 'Twenty-two', 'Twenty-three', 'Thirty-three'],
          correct: 2,
          ex: '“I am twenty-three years old.” → 23 tuổi.',
        },
        {
          q: 'How many sisters does he have?',
          opts: ['One', 'Two', 'Three', 'None'],
          correct: 1,
          ex: '“… and two sisters.” → hai chị/em gái.',
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
      ],
    },

    listening: {
      title: "Linh's weekday",
      subtitle: 'Nghe một thời gian biểu — chú ý GIỜ GIẤC và CON SỐ',
      audioUrl: null,
      script:
        'Hi, I am Linh. On weekdays, I wake up at six o’clock. ' +
        'I have breakfast at half past six. I study at the library for three hours ' +
        'every afternoon. I go to bed at eleven.',
      questions: [
        {
          q: 'What time does Linh wake up?',
          opts: ['Six o’clock', 'Half past six', 'Seven o’clock', 'Eleven'],
          correct: 0,
          ex: '“I wake up at six o’clock.”',
        },
        {
          q: 'How many hours does she study every afternoon?',
          opts: ['Two', 'Three', 'Four', 'Six'],
          correct: 1,
          ex: '“… I study at the library for three hours …”',
        },
        {
          q: 'What time does she go to bed?',
          opts: ['Ten', 'Half past six', 'Eleven', 'Six'],
          correct: 2,
          ex: '“I go to bed at eleven.”',
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
      ],
    },

    listening: {
      title: 'New student',
      subtitle: 'Nghe một bạn đăng ký lớp — chú ý TÊN và CON SỐ',
      audioUrl: null,
      script:
        'Good morning. My name is Tom Carter. My family name is Carter. ' +
        'I am in room number twelve. My class starts at nine fifteen.',
      questions: [
        {
          q: "What is the student's family name?",
          opts: ['Carver', 'Carter', 'Porter', 'Parker'],
          correct: 1,
          ex: '“My family name is Carter.”',
        },
        {
          q: 'What is his room number?',
          opts: ['Two', 'Twelve', 'Twenty', 'Nine'],
          correct: 1,
          ex: '“I am in room number twelve.”',
        },
        {
          q: 'What time does his class start?',
          opts: ['Nine o’clock', 'Nine fifteen', 'Nine fifty', 'Ten fifteen'],
          correct: 1,
          ex: '“My class starts at nine fifteen.”',
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
      ],
    },

    listening: {
      title: "Tuan's family",
      subtitle: 'Nghe một người giới thiệu gia đình — chú ý TÊN và TUỔI',
      audioUrl: null,
      script:
        'Hi! My name is Tuan. I am twenty years old. My father is Mr Hung. ' +
        'He is forty-eight. My mother is Mrs Thao. She is forty-five. ' +
        'My sister is Linh. She is sixteen.',
      questions: [
        {
          q: 'How old is Tuan?',
          opts: ['Sixteen', 'Twenty', 'Forty-five', 'Forty-eight'],
          correct: 1,
          ex: '"I am twenty years old." → Tuấn 20 tuổi.',
        },
        {
          q: "What is Tuan's father's name?",
          opts: ['Mr Thao', 'Mr Tuan', 'Mr Hung', 'Mr Linh'],
          correct: 2,
          ex: '"My father is Mr Hung." → Bố tên Hùng.',
        },
        {
          q: 'How old is his sister?',
          opts: ['Fourteen', 'Fifteen', 'Sixteen', 'Twenty'],
          correct: 2,
          ex: '"She is sixteen." → Em gái 16 tuổi.',
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
      ],
    },

    listening: {
      title: 'Hello, class!',
      subtitle: 'Nghe một bạn giới thiệu bản thân trước lớp — chú ý TÊN và CHI TIẾT',
      audioUrl: null,
      script:
        'Hello, everyone! My name is Phuong. I am from Nha Trang. ' +
        'I am eighteen years old. I like swimming and cooking. ' +
        'I do not have any brothers, but I have one sister.',
      questions: [
        {
          q: 'Where is Phuong from?',
          opts: ['Da Nang', 'Hue', 'Nha Trang', 'Can Tho'],
          correct: 2,
          ex: '"I am from Nha Trang." → Phương đến từ Nha Trang.',
        },
        {
          q: 'How old is Phuong?',
          opts: ['Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'],
          correct: 2,
          ex: '"I am eighteen years old." → Phương 18 tuổi.',
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
      ],
    },

    listening: {
      title: 'End of week chat',
      subtitle: 'Nghe hội thoại giữa thầy giáo và học viên — chú ý SỐ và CHI TIẾT',
      audioUrl: null,
      script:
        'Teacher: How many new words did you learn this week? ' +
        'Student: I learned about thirty words. Teacher: That is great! ' +
        'Do you feel better about English now? Student: Yes, I do. I am more confident.',
      questions: [
        {
          q: 'How many new words did the student learn?',
          opts: ['About thirteen', 'About twenty', 'About thirty', 'About forty'],
          correct: 2,
          ex: '"I learned about thirty words." → Khoảng 30 từ mới.',
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
}

/** Lấy nguồn nhập (reading/listening) cho một buổi, hoặc null nếu chưa có. */
export function getIeltsInput(week, day) {
  return ieltsInput[`${week}:${day}`] || null
}
