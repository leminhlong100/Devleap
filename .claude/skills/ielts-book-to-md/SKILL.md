---
name: ielts-book-to-md
description: >-
  Runbook END-TO-END để thêm MỘT buổi (Day) vào khóa IELTS theo sách "IELTS 4 kỹ
  năng cho người bắt đầu từ con số âm — Tập 1": số hóa ảnh trang sách + answer key
  thành IELTS/day-NN.md, chép audio vào public/, để app tự nạp, verify trong
  trình duyệt rồi commit. Dùng khi người dùng bỏ ảnh vào IELTS/DAY <n>/ (± IELTS/
  ANSWER KEY/, ± *.mp3) và nói "làm Day N", "số hóa Day N", "chuyển jpg sang md",
  "transcribe sách IELTS". Đã đúc kết toàn bộ quy trình Day 1 — gọi skill là chạy,
  KHÔNG cần prompt lại chi tiết.
---

# Thêm một Day vào khóa IELTS (theo sách)

Kiến trúc đã dựng sẵn nên **một buổi CHUẨN (ngữ pháp + từ vựng + listening + homework)
KHÔNG cần sửa code**: chỉ tạo `IELTS/day-NN.md` đúng schema + chép audio, app tự nạp
qua `import.meta.glob` trong `src/data/ieltsBook.js`, bản đồ 15 buổi tự hiện, mở khóa
tuần tự. Xem [[ielts-book-course]] để biết toàn bộ file liên quan.

## Nguyên tắc token
- Đọc mỗi ảnh **đúng MỘT lần**, ghi ngay ra `.md`; sau đó chỉ làm việc trên `.md`.
- `IELTS/day-NN.md` là **nguồn sự thật** của buổi đó.

## Đầu vào (trong repo, đã .gitignore ảnh/mp3 gốc)
- `IELTS/DAY <n>/page_*.jpg` — các trang sách của buổi (sắp theo số trang tăng dần).
- `IELTS/DAY <n>/*.mp3` — audio đi kèm (nếu có).
- `IELTS/ANSWER KEY/*.jpg` — bảng đáp án (nhiều buổi/trang). Tìm khối "DAY <n>".

## Quy trình (làm tuần tự)

### 1. Số hóa trang bài học → `IELTS/day-NN.md`
Đọc các `page_*.jpg`, transcribe **trung thành, song ngữ** theo **Schema** bên dưới.
- Bảng của sách → **bảng Markdown** (đủ cột, có hàng `---`). Giữ **IPA** nguyên văn.
- Hộp "Watch out!" → `> ⚠️ **Watch out!** …`.
- Chỉ đưa vào những `##` **thực sự có** trong buổi; cập nhật frontmatter `sections` khớp.

### 2. Nhúng ANSWER KEY vào từng bài tập
Đọc `IELTS/ANSWER KEY/*.jpg`, lấy đúng khối **DAY <n>**. Với MỖI bài có đáp án, thêm
một khối `**Answer Key**` NGAY DƯỚI đề (parser bóc tách; nhãn chấp nhận cả
`**Answer Key**` lẫn `**Answer Key:**`). Bắt buộc nhúng cho:
- **Homework I (Dịch)** → câu tiếng Anh mẫu.
- **Homework II (MCQ)** → `1. c) …` (chữ cái đáp án).
- **Homework III (Điền)** → dạng đúng của động từ; biến thể trong ngoặc, vd
  `does not understand (doesn't understand)`.
- **Listening Practice** → phần cần điền (vd họ được đánh vần trong audio: `1. Brown`).
Đáp án Homework thường trùng bản viết tay trong sách — vẫn ưu tiên **answer key chính thức**.

### 3. Chép audio sang `public/`
`cp "IELTS/DAY <n>/<file>.mp3" public/ielts/day-<n>/<ten-url-safe>.mp3` (tên không dấu,
không khoảng trắng). Trong frontmatter `audio`, mỗi mục cần `url` trỏ tới đường dẫn
public đó. **Đặt tên/nhãn để view gom đúng nhóm** (view lọc theo chuỗi trong url/file):
- Audio nghe mẫu chính (bảng chữ cái…) → tên chứa `alphabet` (khối "Nghe mẫu").
- Audio bài luyện (đánh vần tên…) → tên chứa `practice` (khối "Audio 2 — nghe & chấm").
Nếu buổi có loại audio khác, đặt tên gợi nhớ và mở rộng bộ lọc trong `IeltsBookDayView.vue`.

### 4. Kiểm tra tự động
`npx vitest run` (phải 100% pass) + `npx vite build` (phải build OK).

### 5. Verify trong trình duyệt (bắt buộc)
- `preview_start` server **devleap-guest** (port 5190, env rỗng — route khách).
- Đảm bảo đã "đăng ký": set localStorage `devleap:user:v2` → `enrolled:["ielts"]`, rồi
  vào `/courses/ielts/week/1/day/<n>` (khóa dùng week=1 cố định).
- `read_console_messages onlyErrors` = sạch. Kiểm mỗi khối render đúng; test **chấm**
  của 1–2 bài (gõ đúng→✓, gõ sai→hiện đáp án→gõ lại→ẩn).

### 6. Commit (chỉ khi user yêu cầu)
Stage: `IELTS/day-NN.md`, `public/ielts/day-<n>/*.mp3`, mọi file `src/` đã sửa, và
skill nếu có đổi. Ảnh/mp3 gốc trong `IELTS/` đã bị `.gitignore` bỏ (giữ `.md`; không
đụng `public/ielts`). Commit message tiếng Việt không dấu, kết bằng
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Push chỉ khi user nói.

## Schema `IELTS/day-NN.md`
```markdown
---
day: 2
title: "…"
sections: [grammar, vocabulary, listening, homework]   # đúng các ## có mặt
topicVocabulary: "…"
audio:
  - { file: "AUDIO 1.mp3", label: "…", url: "/ielts/day-2/xxx.mp3" }
sourcePages: "…"
---

# Day 2 — <tiêu đề>

> **Aims:** …

## Basic Grammar
### <tên điểm ngữ pháp>
<giải thích song ngữ + bảng công thức/cấu trúc; Watch out! → blockquote>

## Basic Vocabulary
### Topic vocabulary: <chủ đề>
| Từ vựng | Nghĩa | Ví dụ |
| --- | --- | --- |
| Account (n) | Tài khoản | She created a new account… (Cô ấy…) |
### Phrasal verbs
| Phrasal verb | Nghĩa | Ví dụ |
### Word Formation
| Gốc | Danh từ | Động từ | Tính từ | Trạng từ |

## Listening Skills
### <tên, vd "The Alphabet">
| Chữ | IPA | Chữ | IPA | Chữ | IPA |   ← nếu là bảng chữ cái
<văn xuôi giới thiệu>
### Practice
1. Mr _____
…
**Answer Key** (họ được đánh vần…):
1. Brown

## Homework
### I. Dịch sang tiếng Anh
1. …
**Answer Key**:
1. She creates an account.
### II. Chọn đáp án đúng
1. …
   a) … · b) … · c) …
**Answer Key**:
1. c) …
### III. Điền vào chỗ trống …
1. … _____ (go) …
**Answer Key**:
1. goes
```

## Mỗi mục thành hoạt động gì (quy ước UX đã chốt — BẮT học viên làm trên web)
Áp dụng qua `IeltsBookDayView.vue` (đã render generic; thường KHÔNG phải sửa):
- **Grammar** → hiển thị bảng (v-html) + **QuizTool cloze** từ Homework III (CỔNG bắt buộc ≥70%).
- **Topic vocab / Phrasal / Word Formation** → mỗi nhóm có **VocabCard/bảng** + **InlineFlashcards** (SRS, prop `limit`) để HỌC THUỘC, không xem suông.
- **Listening (alphabet)** → nghe mẫu (audio + ô bấm nghe) + **TypedCheckList listen-mode** "nghe chữ cái → gõ" (CỔNG bắt buộc) + **Audio 2** = TypedCheckList graded theo answer key.
- **Phát âm** → **PronunciationCheck** (STT `recognizeOnce` + `scoreTranscript`, `continuous=false` an toàn — xem [[speech-recognition-continuous-bug]]); đúng hết tự đánh dấu. Không bắt buộc (STT không có ở mọi trình duyệt).
- **Homework I (Dịch)** → **TypedCheckList** graded (gõ→chấm; sai hiện đáp án; gõ lại ẩn) — CỔNG bắt buộc.
- **Homework II (MCQ)** → **QuizTool** (ôn nhanh, không bắt buộc).
- **KHÔNG gắn AI chat** cho buổi trình độ thấp (Day 1 đã bỏ).
- **Cổng hoàn thành buổi** = grammar cloze ≥70% **+** listening drill **+** dịch (đều tự chấm, lưu qua quizSlice: `gday` / `day:N:listen` / `day:N:translate`).

## Khi CẦN sửa code (buổi có mục mới)
Kiến trúc render sẵn grammar/vocab/listening-alphabet/homework. Nếu buổi có thêm:
- **Reading passage + câu hỏi** → tái dùng `ReadingComprehension.vue`.
- **Listening hiểu (không phải alphabet)** → tái dùng `ListeningComprehension.vue` + nới bộ lọc audio.
- **Writing/Speaking task** → thêm khối mới trong `IeltsBookDayView.vue`.
Thêm khóa parse tương ứng trong `parseIeltsBook.js` nếu mục đó chưa được bóc tách.

## Checklist hoàn tất
- [ ] `day-NN.md` đủ mục, mọi bảng hợp lệ, IPA giữ nguyên, `sections` khớp.
- [ ] Answer key đã nhúng cho Homework I/II/III **và** Listening Practice.
- [ ] Audio ở `public/ielts/day-<n>/`, frontmatter có `url`.
- [ ] `vitest` pass + `vite build` OK.
- [ ] Verify trình duyệt: không lỗi console, các bài chấm đúng.
- [ ] (nếu user yêu cầu) commit đúng file, push khi được nói.
