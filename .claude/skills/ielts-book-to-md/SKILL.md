---
name: ielts-book-to-md
description: >-
  Chuyển các trang ảnh (JPG) của sách "IELTS 4 kỹ năng cho người bắt đầu từ con
  số âm" thành một file Markdown chuẩn hóa cho từng Day. Dùng khi người dùng bỏ
  ảnh trang sách vào IELTS/DAY <n>/page_*.jpg và muốn số hóa nội dung để tiết
  kiệm token (đọc ảnh 1 lần → làm việc trên .md sau này). Kích hoạt khi thấy
  thư mục IELTS/DAY N chứa page_*.jpg (± audio .mp3), hoặc khi được yêu cầu
  "chuyển jpg sang md", "số hóa Day N", "transcribe sách IELTS".
---

# IELTS Book → Markdown

Số hóa **một Day** của sách *"IELTS 4 kỹ năng cho người bắt đầu từ con số âm — Tập 1"*
(Smart English) từ ảnh chụp sang một file Markdown chuẩn, để phần còn lại của
project xây nội dung khóa học từ file `.md` (rẻ token) thay vì đọc lại ảnh (đắt token).

## Nguyên tắc token
- **Đọc mỗi trang ảnh đúng MỘT lần**, ngay lập tức ghi ra `.md`. Sau đó luôn làm
  việc trên file `.md` — không bao giờ đọc lại ảnh trừ khi transcription sai/thiếu.
- File `.md` là **nguồn sự thật** (source of truth) cho Day đó.

## Đầu vào
- `IELTS/DAY <n>/page_*.jpg` — các trang sách của Day, đánh số theo trang thật
  (vd `page_5.jpg` … `page_18.jpg`). Số trang có thể không bắt đầu từ 1.
- `IELTS/DAY <n>/*.mp3` (tùy chọn) — file nghe đi kèm (vd `AUDIO 1.mp3`,
  `AUDIO 1 (chậm).mp3`, `AUDIO 2.mp3`). Ghi lại tên file, **không** transcribe âm thanh
  ở đây (script nghe lấy từ trang sách nếu có).

## Quy trình
1. Liệt kê ảnh trong `IELTS/DAY <n>/` và **sắp xếp theo số trang tăng dần**. Bỏ qua
   trang bìa/quảng cáo nếu không thuộc Day.
2. Đọc lần lượt từng trang (dùng tool Read với ảnh). Nhận diện: đây là trang
   *Hướng dẫn*, hay trang thuộc một mục của Day (Basic Grammar / Basic Vocabulary /
   Listening / Reading / Writing / Speaking / Homework). Một trang sách in tràn 2
   cột — nội dung cột phải của trang trái thường là mục kế tiếp; đọc kỹ để không sót.
3. Transcribe **trung thành**:
   - Giữ **song ngữ**: câu tiếng Anh + phần dịch tiếng Việt trong ngoặc như sách.
   - Bảng của sách → **bảng Markdown**. Giữ đúng cột (vd `Loại câu | Cấu trúc | Ví dụ`).
   - **Giữ nguyên IPA** (vd `A /eɪ/`, `Z /ziː/ (US) /zɛd/ (UK)`).
   - Hộp **"Watch out!"** / lưu ý → blockquote `> ⚠️ **Watch out!** …`.
   - Bài tập: chép **đề đầy đủ**. Nếu trong sách có chữ viết tay là đáp án của người
     học, đưa đáp án đó vào **Answer Key** ở cuối mục bài tập (ghi rõ "theo bản viết
     tay trong sách"), KHÔNG trộn đáp án vào đề.
   - Với trắc nghiệm: chép đủ các lựa chọn a/b/c; nếu có dấu tick/khoanh tay → ghi
     đáp án đã chọn vào Answer Key.
4. Không chèn kiến thức ngoài sách. Nếu chữ mờ không đọc được, ghi `[không rõ]`
   thay vì đoán.
5. Ghi ra `IELTS/day-<nn>.md` (2 chữ số, vd `day-01.md`) theo **schema** bên dưới.
6. Báo lại: đã transcribe những mục nào, thiếu trang nào (nếu có), file audio nào.

## Schema đầu ra
Chỉ đưa vào những mục **thực sự có** trong Day đó (sách không phải Day nào cũng đủ 6
kỹ năng). Dùng đúng các heading `##` dưới đây để bước wiring sau này parse được.

```markdown
---
day: 1
title: "Simple Sentences · Present Simple · Alphabet"
sections: [grammar, vocabulary, listening]   # các mục có mặt
topicVocabulary: "Social Media"
audio:
  - { file: "AUDIO 1.mp3", label: "The Alphabet" }
  - { file: "AUDIO 1 (chậm).mp3", label: "The Alphabet — chậm" }
  - { file: "AUDIO 2.mp3", label: "Practice — Names" }
sourcePages: "5-18"
---

# Day 1 — <tiêu đề>

> Aims: <mục tiêu của Day, chép từ sách>

## Basic Grammar
### <tên điểm ngữ pháp, vd "Simple Sentences">
<giải thích song ngữ>

| Công thức (Formula) | Ví dụ |
| --- | --- |
| Subject + Verb (Chủ ngữ + Động từ) | She runs. (Cô ấy chạy.) |

### <điểm ngữ pháp kế, vd "Present Simple — Positive, Negative & Questions">
... (bảng cấu trúc, Watch out!, bảng "Ứng dụng trong IELTS Writing Task 2" …)

## Basic Vocabulary
### Topic vocabulary: <chủ đề>
| Từ vựng | Nghĩa | Ví dụ |
| --- | --- | --- |
| Account (n) | Tài khoản | She created a new account on the social media site. (…) |

### Phrasal verbs
| Phrasal verb | Nghĩa | Ví dụ |
| --- | --- | --- |

### Word Formation
| Gốc | Danh từ | Động từ | Tính từ | Trạng từ |
| --- | --- | --- | --- | --- |

## Listening Skills
### <tên, vd "The Alphabet">
<bảng chữ cái + IPA; ghi rõ audio nào dùng cho phần nào>

### Practice
<đề luyện nghe, vd danh sách 1) Mr ___ … 20) Mr ___; ghi audio dùng>

## Reading Skills
...

## Writing Skills
...

## Speaking Skills
...

## Homework
### I. <tên bài, vd "Dịch sang tiếng Anh (S + V + O)">
1. <đề>
...
**Answer Key** (theo bản viết tay trong sách, nếu có):
1. <đáp án>

### II. Chọn đáp án đúng
...
```

## Kiểm tra sau khi làm
- Mọi bảng của sách đã thành bảng Markdown hợp lệ (đủ cột, có hàng `---`).
- Frontmatter `sections` khớp đúng các `##` có trong file.
- Đã liệt kê tên file audio (nếu có) trong frontmatter `audio`.
- Không còn `[không rõ]` ở chỗ có thể đọc được — nếu còn, báo người dùng chụp lại.
