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
