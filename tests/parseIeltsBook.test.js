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
