import { describe, it, expect } from 'vitest'
import { parseIeltsBookDay } from '@/data/md/parseIeltsBook'
import { getBookDay } from '@/data/ieltsBook'

const SAMPLE = `---
day: 2
title: "Reading · Writing · Speaking"
sections: [reading, writing, speaking, homework]
topicVocabulary: "Kỹ năng làm bài"
---

# Day 2 — Skills

> **Aims:** Reading / Writing / Speaking

## Reading Skills
### 1. Cấu trúc
Ba đoạn văn, 40 câu hỏi, 60 phút.

## Writing Skills
### 1. Task 2
Viết ít nhất 250 từ.

## Speaking Skills
Ba phần, 11–14 phút.

## Homework
### Bài tập 1 — Khủng hoảng 2008
- **Câu hỏi (EN):** What was the primary cause of the global financial crisis in 2008?
- **Câu hỏi (VI):** Nguyên nhân chính là gì?
- **Đoạn văn (EN):** The crisis was triggered by the collapse of the housing market.
- **Đoạn văn (VI):** Khủng hoảng bắt nguồn từ sự sụp đổ của thị trường nhà ở.
- **Từ khóa gợi ý:** primary cause · 2008 · housing market
- **Đáp án ngắn:** the collapse of the housing market | housing market collapse
- **Answer Key:** The primary cause was the collapse of the housing market in the United States.

### Bài tập 2 — Amazon
- **Câu hỏi (EN):** Which animal species is most affected by deforestation?
- **Đoạn văn (EN):** It is the jaguar that faces the greatest threat.
- **Đáp án ngắn:** jaguar | the jaguar
- **Answer Key:** Jaguar is the most affected animal species.
`

describe('parseIeltsBookDay() — Reading/Writing/Speaking + homework đọc hiểu', () => {
  const d = parseIeltsBookDay(SAMPLE)

  it('parse các mục lý thuyết Reading/Writing/Speaking thành HTML', () => {
    expect(d.reading).toContain('40 câu hỏi')
    expect(d.writing).toContain('250 từ')
    expect(d.speaking).toContain('11')
  })

  it('parse homework đọc hiểu thành mảng có đủ trường', () => {
    expect(d.homework.reading).toHaveLength(2)
    const b1 = d.homework.reading[0]
    expect(b1.n).toBe(1)
    expect(b1.title).toBe('Khủng hoảng 2008')
    expect(b1.question).toContain('primary cause')
    expect(b1.questionVi).toContain('Nguyên nhân')
    expect(b1.passage).toContain('housing market')
    expect(b1.passageVi).toContain('nhà ở')
    expect(b1.keywords).toEqual(['primary cause', '2008', 'housing market'])
    expect(b1.answer).toEqual(['the collapse of the housing market', 'housing market collapse'])
    expect(b1.model).toContain('United States')
  })

  it('bài tập không có bản dịch/từ khóa vẫn parse an toàn', () => {
    const b2 = d.homework.reading[1]
    expect(b2.answer).toContain('jaguar')
    expect(b2.passageVi).toBe('')
    expect(b2.keywords).toEqual([])
  })

  it('không có homework dịch/mcq/cloze khi buổi chỉ có bài đọc hiểu', () => {
    expect(d.homework.translate).toHaveLength(0)
    expect(d.homework.mcq).toHaveLength(0)
    expect(d.homework.cloze).toHaveLength(0)
  })
})

describe('getBookDay(2) — file day-02.md thật', () => {
  it('Day 2 có mặt với 5 bài đọc hiểu và các mục kỹ năng', () => {
    const d = getBookDay(2)
    expect(d).toBeTruthy()
    expect(d.reading).toBeTruthy()
    expect(d.writing).toBeTruthy()
    expect(d.speaking).toBeTruthy()
    expect(d.homework.reading).toHaveLength(5)
    // mỗi bài đều có đáp án chấm được + model answer
    for (const b of d.homework.reading) {
      expect(b.answer.length).toBeGreaterThan(0)
      expect(b.model.length).toBeGreaterThan(0)
      expect(b.passage.length).toBeGreaterThan(20)
    }
  })
})

const SAMPLE3 = `---
day: 3
title: "Pronouns · Dictation"
sections: [grammar, listening, homework]
topicVocabulary: "Education and Society"
---

# Day 3 — Pronouns

> **Aims:** Pronouns / Dictation

## Basic Grammar
### 1. Các loại đại từ
Đại từ thay cho danh từ.

## Listening Skills
### IELTS Listening Dictation là gì?
Nghe và viết lại nội dung.

### Dictation 1 — Insects (Audio 1)
> 🎧 Nghe Audio 1 và điền vào chỗ trống.

**Đoạn văn (EN):**

We live on a planet of (1)_____. They make up 70% of that of (2)_____.

Most insects will (3)_____.

**Đoạn văn (VI):**

Chúng ta sống trên hành tinh của (1)_____.

**Answer Key** (nghe & điền):
1. insects
2. humans
3. suffer

## Homework
### III. Chọn đại từ đúng
> Các đại từ có thể dùng: he, she, it, they.

1. (He / She / It) is essential for students.
2. Many people believe that (they / them) should be responsible.
**Answer Key**:
1. It
2. they
`

describe('parseIeltsBookDay() — Day 3: dictation + chọn đại từ', () => {
  const d = parseIeltsBookDay(SAMPLE3)

  it('parse dictation với đoạn EN/VI + bảng đáp án theo số', () => {
    const dict = d.listening.dictation
    expect(dict).toBeTruthy()
    expect(dict.title).toContain('Dictation 1')
    expect(dict.en).toContain('(1)_____')
    expect(dict.en).toContain('planet of')
    expect(dict.vi).toContain('hành tinh')
    expect(dict.answers[1]).toBe('insects')
    expect(dict.answers[2]).toBe('humans')
    expect(dict.answers[3]).toBe('suffer')
    // note (hướng dẫn) và intro (lý thuyết) đều có mặt
    expect(dict.note).toContain('Audio 1')
    expect(d.listening.intro).toContain('Nghe và viết lại')
    // không lẫn Answer Key vào đoạn VI
    expect(dict.vi).not.toContain('insects')
  })

  it('parse "Chọn đại từ" thành câu MCQ cho QuizTool (chỗ trống + phương án + đáp án đúng)', () => {
    expect(d.homework.choice).toHaveLength(2)
    const c1 = d.homework.choice[0]
    expect(c1.q).toBe('_____ is essential for students.')
    expect(c1.opts).toEqual(['He', 'She', 'It'])
    expect(c1.correct).toBe(2) // It
    const c2 = d.homework.choice[1]
    expect(c2.opts).toEqual(['they', 'them'])
    expect(c2.correct).toBe(0) // they
  })
})

const SAMPLE5 = `---
day: 5
title: "Countable Nouns · Remote Work · Dictation 2"
sections: [grammar, vocabulary, listening, homework]
topicVocabulary: "Remote Work"
---

# Day 5 — Nouns

> **Aims:** Countable & Uncountable / Remote Work / Dictation 2

## Basic Grammar
### 1. Lý thuyết
Danh từ đếm được và không đếm được.

## Listening Skills
### Practice 1 — Multitasking (Audio 5)
> 🎧 Nghe Audio 5 và điền vào chỗ trống.

**Đoạn văn (EN):**

With life (1)_____ more demanding, there's only one way to (2)_____.

**Đoạn văn (VI):**

Khi cuộc sống ngày càng (1)_____ nhiều đòi hỏi.

**Answer Key** (nghe & điền):
1. getting
2. cope

### Practice 2 — Nghe & chọn đáp án đúng (Audio 5)
> 🎧 Nghe tiếp và chọn đáp án đúng.

1. But when attention is _____, we miss things.
   a) focused · b) overloaded · c) balanced
2. And the _____ is nearly always that we perform tasks less well.
   a) cause · b) effect · c) result

**Answer Key**:
1. b) overloaded
2. c) result

## Homework
### Điền vào chỗ trống — dạng đúng của danh từ
Xác định đếm được / không đếm được rồi điền.

1. I need to find a new _____ (job) because my current one is boring.
2. There are several empty _____ (office) available for rent.

**Answer Key**:
1. job
2. offices

### Dịch sang tiếng Anh
1. Tôi cần đặt máy tính mới của mình. (set up)
2. Bạn có thể bật đèn không? (turn on)

**Answer Key**:
1. I need to set up my new computer.
2. Can you turn on the lights?
`

describe('parseIeltsBookDay() — Day 5: dictation + nghe MCQ + điền danh từ + dịch', () => {
  const d = parseIeltsBookDay(SAMPLE5)

  it('Practice 1 -> dictation (đoạn EN/VI + đáp án theo số)', () => {
    expect(d.listening.dictation).toBeTruthy()
    expect(d.listening.dictation.en).toContain('(1)_____')
    expect(d.listening.dictation.answers[1]).toBe('getting')
    expect(d.listening.dictation.answers[2]).toBe('cope')
  })

  it('Practice 2 -> listening.mcq (chỗ trống + phương án + đáp án đúng theo chữ cái)', () => {
    expect(d.listening.mcq).toHaveLength(2)
    const m1 = d.listening.mcq[0]
    expect(m1.opts).toEqual(['focused', 'overloaded', 'balanced'])
    expect(m1.correct).toBe(1) // b) overloaded
    expect(d.listening.mcq[1].correct).toBe(2) // c) result
    // MCQ nghe KHÔNG lẫn vào phần fill-in đánh vần
    expect(d.listening.practice).toHaveLength(0)
  })

  it('Homework "Điền dạng đúng của danh từ" -> cloze (cổng ngữ pháp)', () => {
    expect(d.homework.cloze).toHaveLength(2)
    expect(d.homework.cloze[0].answer).toContain('job')
    expect(d.homework.cloze[1].answer).toContain('offices')
    expect(d.homework.translate).toHaveLength(2)
    expect(d.homework.translate[0].answer).toContain('I need to set up my new computer.')
  })
})

describe('getBookDay(5) — file day-05.md thật', () => {
  it('Day 5 có grammar, dictation 19 chỗ trống, nghe MCQ 13 câu, điền danh từ 12 + dịch 10', () => {
    const d = getBookDay(5)
    expect(d).toBeTruthy()
    expect(d.grammar.length).toBeGreaterThan(0)
    expect(Object.keys(d.listening.dictation.answers)).toHaveLength(19)
    expect(d.listening.dictation.answers[19]).toBe('capacity')
    expect(d.listening.mcq).toHaveLength(13)
    // mọi câu MCQ nghe đều có đáp án đúng nằm trong danh sách phương án
    for (const m of d.listening.mcq) {
      expect(m.opts.length).toBe(3)
      expect(m.correct).toBeGreaterThanOrEqual(0)
    }
    expect(d.homework.cloze).toHaveLength(12)
    expect(d.homework.translate).toHaveLength(10)
    // cổng ngữ pháp dùng cloze (không phải chọn đại từ)
    expect(d.homework.choice).toHaveLength(0)
  })
})

describe('getBookDay(6) — file day-06.md thật', () => {
  it('Day 6 có Reading/Writing/Speaking, 4 bài flow-chart + 6 câu điền mở bài + từ vựng bài đọc', () => {
    const d = getBookDay(6)
    expect(d).toBeTruthy()
    expect(d.reading).toContain('Flow-chart')
    expect(d.writing).toContain('paraphrase')
    expect(d.speaking).toContain('WH-Questions')
    // Reading practice = 4 câu flow-chart (đọc hiểu, chấm được, có model + đoạn văn)
    expect(d.homework.reading).toHaveLength(4)
    expect(d.homework.reading[0].answer).toContain('firm')
    expect(d.homework.reading[3].answer).toContain('feedback')
    for (const b of d.homework.reading) {
      expect(b.answer.length).toBeGreaterThan(0)
      expect(b.model.length).toBeGreaterThan(0)
      expect(b.passage.length).toBeGreaterThan(20)
    }
    // Homework viết = điền paraphrase mở bài -> cloze (cổng bắt buộc)
    expect(d.homework.cloze).toHaveLength(6)
    expect(d.homework.cloze[0].answer).toContain('physical education')
    expect(d.homework.cloze[5].answer).toContain('traffic congestion')
    // buổi kỹ năng: không có dịch/mcq/chọn-đại-từ và không có Basic Grammar
    expect(d.homework.translate).toHaveLength(0)
    expect(d.homework.choice).toHaveLength(0)
    expect(d.grammar).toHaveLength(0)
    // từ vựng bài đọc (Useful Vocabulary) -> VocabCard
    expect(d.vocabCards.length).toBe(37)
  })
})

const SAMPLE7 = `---
day: 7
title: "Adjectives & Adverbs · Remote Work · Listening Part 1"
sections: [grammar, vocabulary, listening, homework]
topicVocabulary: "Remote Work"
---

# Day 7 — Adjectives & Adverbs

> **Aims:** Adjectives & Adverbs / Remote Work / Listening Part 1

## Basic Grammar
### 1. Lý thuyết
Tính từ bổ nghĩa cho danh từ; trạng từ bổ nghĩa cho động từ.

## Basic Vocabulary
### Topic vocabulary: Remote Work — Tính từ (Adjectives)
| Từ vựng | Nghĩa | Ví dụ |
| --- | --- | --- |
| Flexible (adj) | Linh hoạt | I like flexible hours. (Tôi thích giờ làm việc linh hoạt.) |
| Convenient (adj) | Thuận tiện | Working from home is convenient. (Làm việc từ xa rất thuận tiện.) |

### Trạng từ (Adverbs)
| Từ vựng | Nghĩa | Ví dụ |
| --- | --- | --- |
| Effectively (adv) | Một cách hiệu quả | I can work effectively at home. (Tôi có thể làm việc hiệu quả ở nhà.) |
| Remotely (adv) | Từ xa | I can connect with my team remotely. (Tôi có thể kết nối với đội của mình từ xa.) |

### Adjective Phrases (Cụm tính từ)
| Từ vựng | Nghĩa | Ví dụ |
| --- | --- | --- |
| Dependent on | Phụ thuộc vào | Many employees are dependent on technology. (Nhiều nhân viên phụ thuộc vào công nghệ.) |
| Reliant on | Dựa vào | Many workers are reliant on internet connectivity. (Nhiều nhân viên dựa vào kết nối internet.) |

## Listening Skills
### Listening Part 1 — dạng bài
Nghe điền thông tin vào mẫu ghi chú.

### Bài luyện — Wayside Camera Club (Audio 8)
> 🎧 Nghe Audio 8 và điền vào chỗ trống.

**Đoạn văn (EN):**

Home address: 52 (1)_____ Street, Peacetown

Type of membership: (4)_____ membership (£30)

**Đoạn văn (VI):**

Địa chỉ nhà: 52 (1)_____ Street, Peacetown

**Answer Key** (nghe & điền):
1. Marrowfield
4. Full

## Homework
### I. Dịch sang tiếng Anh
1. Giờ làm việc của tôi linh hoạt. (Flexible)
2. Rất tiện lợi khi có một siêu thị gần nhà tôi. (Convenient)

**Answer Key**:
1. My working hours are flexible.
2. It's convenient to have a supermarket near my house.

### Điền vào chỗ trống bằng cụm tính từ
1. After the training, I felt more _____ the software. (thoải mái với)
2. He is _____ public transportation for his commute. (phụ thuộc vào)

**Answer Key**:
1. comfortable with
2. reliant on
`

describe('parseIeltsBookDay() — Day 7: adjectives/adverbs + phrases + listening form + phrase-cloze', () => {
  const d = parseIeltsBookDay(SAMPLE7)

  it('parse 3 nhóm từ vựng: tính từ (words), trạng từ (adverbs), cụm tính từ (phrases)', () => {
    expect(d.vocab.words).toHaveLength(2)
    expect(d.vocab.words[0].term).toBe('Flexible')
    expect(d.vocab.words[0].pos).toBe('adj')
    expect(d.vocab.adverbs).toHaveLength(2)
    expect(d.vocab.adverbs[0].term).toBe('Effectively')
    expect(d.vocab.adverbs[1].term).toBe('Remotely')
    expect(d.vocab.phrases).toHaveLength(2)
    expect(d.vocab.phrases[0].term).toBe('Dependent on')
    expect(d.vocab.phrases[0].vi).toBe('Phụ thuộc vào')
  })

  it('Listening form completion -> dictation (chỗ trống theo số + đáp án)', () => {
    expect(d.listening.dictation).toBeTruthy()
    expect(d.listening.dictation.en).toContain('(1)_____')
    expect(d.listening.dictation.answers[1]).toBe('Marrowfield')
    expect(d.listening.dictation.answers[4]).toBe('Full')
    expect(d.listening.intro).toContain('mẫu ghi chú')
  })

  it('Homework: dịch (translate) + điền cụm tính từ (cloze, đáp án nhiều từ)', () => {
    expect(d.homework.translate).toHaveLength(2)
    expect(d.homework.translate[0].answer).toContain('My working hours are flexible.')
    expect(d.homework.cloze).toHaveLength(2)
    expect(d.homework.cloze[0].answer).toContain('comfortable with')
    expect(d.homework.cloze[1].answer).toContain('reliant on')
    // đáp án cụm là nhiều từ (có khoảng trắng) -> view dùng nhãn "điền cụm từ"
    expect(d.homework.cloze.every((c) => c.answer.some((a) => /\s/.test(a)))).toBe(true)
  })
})

describe('getBookDay(7) — file day-07.md thật', () => {
  it('Day 7 có grammar, 10 tính từ + 10 trạng từ + 10 cụm tính từ, dictation 10 ô, dịch 10 + cloze 10', () => {
    const d = getBookDay(7)
    expect(d).toBeTruthy()
    expect(d.grammar.length).toBeGreaterThan(0)
    expect(d.vocabCards).toHaveLength(10)
    expect(d.vocab.adverbs).toHaveLength(10)
    expect(d.vocab.phrases).toHaveLength(10)
    expect(Object.keys(d.listening.dictation.answers)).toHaveLength(10)
    expect(d.listening.dictation.answers[1]).toBe('Marrowfield')
    expect(d.listening.dictation.answers[10]).toBe('dark')
    expect(d.homework.translate).toHaveLength(10)
    expect(d.homework.cloze).toHaveLength(10)
    expect(d.homework.cloze[0].answer).toContain('comfortable with')
    expect(d.homework.cloze[8].answer).toContain('dependent on')
    // buổi ngữ pháp: không dùng chọn-đại-từ
    expect(d.homework.choice).toHaveLength(0)
  })
})

describe('splitReadingTranslation — giấu bản dịch bài đọc mặc định', () => {
  const SAMPLE_READ = `---
day: 99
title: "Reading test"
sections: [reading]
---

# Day 99

## Reading Skills
### 2. Reading Passage — Ants
**A** The ants are tiny and usually nest between rocks.

> **Bản dịch (tham khảo):**
> **A** Những con kiến rất nhỏ và thường làm tổ giữa các khe đá.

### 3. Questions 1–5
Match each statement with Nigel Franks.
`
  const d = parseIeltsBookDay(SAMPLE_READ)

  it('reading (body) giữ đoạn EN + bảng câu hỏi, KHÔNG còn bản dịch', () => {
    expect(d.reading).toContain('usually nest between rocks')
    expect(d.reading).toContain('Nigel Franks')
    expect(d.reading).not.toContain('Bản dịch')
    expect(d.reading).not.toContain('Những con kiến rất nhỏ')
  })

  it('readingVi chứa bản dịch (để bọc trong <details> ẩn mặc định)', () => {
    expect(d.readingVi).toContain('Những con kiến rất nhỏ')
    // đã bỏ dòng tiêu đề "**Bản dịch…**"
    expect(d.readingVi).not.toContain('tham khảo')
  })

  it('buổi không có blockquote dịch: readingVi rỗng, reading nguyên vẹn', () => {
    const d2 = parseIeltsBookDay(SAMPLE)
    expect(d2.readingVi).toBe('')
    expect(d2.reading).toContain('40 câu hỏi')
  })
})

describe('getBookDay(10) — file day-10.md thật: tách bản dịch bài đọc', () => {
  it('reading body có đoạn EN + bảng người, bản dịch nằm ở readingVi', () => {
    const d = getBookDay(10)
    expect(d).toBeTruthy()
    expect(d.reading).toContain('nest between rocks')
    expect(d.reading).toContain('Nigel Franks') // bảng câu hỏi vẫn còn
    expect(d.reading).not.toContain('Những con kiến rất nhỏ') // bản dịch đã tách ra
    expect(d.readingVi).toContain('Những con kiến rất nhỏ')
  })
})

describe('parseWriting — tách đề bài + ẩn bài mẫu', () => {
  const SAMPLE_WRITE = `---
day: 98
title: "Writing test"
sections: [writing]
---

# Day 98

## Writing Skills
### 1. Writing Task 2 — Opinion: viết Kết bài
Ở buổi này ta học cách viết Kết bài.

> **Đề bài mẫu (Remote Work):** *Some people believe that working from home is more beneficial. To what extent do you agree?*
> *(Một số người tin rằng làm việc tại nhà tốt hơn.)*

### 2. Sample essay 1 — Phản đối
| Phần | Câu tiếng Anh | Bản dịch |
| --- | --- | --- |
| Introduction | Many people work from home. | Nhiều người làm việc tại nhà. |

### 3. Sample essay 2 — Ủng hộ
| Phần | Câu tiếng Anh | Bản dịch |
| --- | --- | --- |
| Introduction | Today, many employees prefer working from home. | Ngày nay nhiều nhân viên thích làm tại nhà. |
`
  const d = parseIeltsBookDay(SAMPLE_WRITE)

  it('rút đề bài (prompt) từ blockquote "Đề bài", bỏ markdown', () => {
    expect(d.writingTask).toBeTruthy()
    expect(d.writingTask.prompt).toContain('working from home is more beneficial')
    expect(d.writingTask.prompt).not.toContain('*')
  })

  it('lý thuyết (writing) giữ phần dạy, KHÔNG còn bài mẫu', () => {
    expect(d.writing).toContain('viết Kết bài')
    expect(d.writing).not.toContain('Many people work from home')
    expect(d.writing).not.toContain('Today, many employees prefer')
  })

  it('bài mẫu nằm ở writingSamples (để ẩn tới khi nộp)', () => {
    expect(d.writingSamples).toContain('Many people work from home')
    expect(d.writingSamples).toContain('Today, many employees prefer')
  })
})

describe('getBookDay(10) — writing thật: đề bài + bài mẫu tách riêng', () => {
  it('có writingTask.prompt; bài mẫu ra khỏi lý thuyết', () => {
    const d = getBookDay(10)
    expect(d.writingTask?.prompt).toContain('working from home')
    // 2 bài Sample essay đã tách sang writingSamples
    expect(d.writingSamples).toContain('Many people today work from home')
    expect(d.writing).not.toContain('Many people today work from home')
    expect(d.writing).toContain('Kết bài') // lý thuyết còn nguyên
  })
})

describe('parseSpeaking — tách câu hỏi + ẩn câu trả lời mẫu', () => {
  const SAMPLE_SPEAK = `---
day: 97
title: "Speaking test"
sections: [speaking]
---

# Day 97

## Speaking Skills
### 1. Speaking Part 1 — Habitual Questions
Dạng hỏi về thói quen.

> **Câu hỏi mẫu:** *"How often do you exercise?"* (Bạn tập thể dục thường xuyên như thế nào?)

> **Ví dụ mẫu:** *"I exercise **three times a week**. I usually go to the gym."*

### 2. Cụm từ mẫu
| Cụm từ | IPA | Tiếng Việt |
| --- | --- | --- |
| I try to exercise regularly. | /.../ | Tôi cố gắng tập đều. |
`
  const d = parseIeltsBookDay(SAMPLE_SPEAK)

  it('rút câu hỏi (prompt) bỏ ngoặc dịch + markdown', () => {
    expect(d.speakingTask).toBeTruthy()
    expect(d.speakingTask.prompt).toBe('How often do you exercise?')
  })

  it('rút câu trả lời mẫu (sample) và GỠ khỏi lý thuyết', () => {
    expect(d.speakingTask.sample).toContain('I exercise three times a week')
    expect(d.speaking).not.toContain('I exercise three times a week') // đã ẩn
    expect(d.speaking).toContain('Dạng hỏi về thói quen') // lý thuyết còn
    expect(d.speaking).toContain('Cụm từ mẫu') // bảng cụm từ còn
  })
})

describe('getBookDay(10) — speaking thật: câu hỏi + câu mẫu tách riêng', () => {
  it('có speakingTask.prompt & sample; câu mẫu ẩn khỏi lý thuyết', () => {
    const d = getBookDay(10)
    expect(d.speakingTask?.prompt).toContain('How often do you exercise')
    expect(d.speakingTask?.sample).toContain('three to four times a week')
    expect(d.speaking).not.toContain('it helps me stay fit and relieve stress')
  })
})

describe('getBookDay(3) — file day-03.md thật', () => {
  it('Day 3 có grammar, dictation 22 chỗ trống, và homework dịch/mcq/chọn-đại-từ', () => {
    const d = getBookDay(3)
    expect(d).toBeTruthy()
    expect(d.grammar.length).toBeGreaterThan(0)
    const dict = d.listening.dictation
    expect(dict).toBeTruthy()
    expect(Object.keys(dict.answers)).toHaveLength(22)
    expect(dict.answers[22]).toBe('himself')
    expect(d.homework.translate).toHaveLength(22)
    expect(d.homework.mcq).toHaveLength(10)
    expect(d.homework.choice).toHaveLength(10)
    // mọi câu chọn đại từ đều có đáp án đúng nằm trong danh sách phương án
    for (const c of d.homework.choice) {
      expect(c.opts.length).toBeGreaterThanOrEqual(2)
      expect(c.correct).toBeGreaterThanOrEqual(0)
    }
    // mcq: đáp án đúng khớp answer key (câu 1 = Catch up)
    expect(d.homework.mcq[0].opts[d.homework.mcq[0].correct]).toBe('Catch up')
  })
})
