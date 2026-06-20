# Devleap — Nền tảng học lập trình & tiếng Anh

Ứng dụng web học tập (Vue 3 + Vite). Giao diện được dựng theo bản design Claude Design,
học theo lộ trình tuần/ngày với gamification (XP, streak, level, huy hiệu).

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production -> dist/
npm run preview  # xem thử bản build
```

## Cấu trúc thư mục

```
src/
├── main.js                  # khởi tạo app, Pinia, Router
├── App.vue                  # khung layout (header + router-view + footer)
├── router/index.js          # định nghĩa route các màn hình
├── stores/
│   └── user.js              # Pinia: XP, streak, level, thẻ đã thuộc (lưu localStorage)
├── assets/styles/
│   └── base.css             # design tokens (CSS variables), reset, animation
├── components/
│   ├── layout/              # AppHeader, AppFooter
│   ├── common/              # MascotLogo, ProgressRing
│   ├── course/              # ConquestMap (bản đồ chinh phục dùng chung Java/IELTS)
│   ├── day/                 # AgendaRail, VocabCard
│   └── tools/               # FlashcardTool, CodePlayground, QuizTool, DictionaryTool
├── views/
│   ├── HomeView.vue         # Trang chủ (hero, value props, how-it-works, khóa nổi bật)
│   ├── CoursesView.vue      # Thư viện khóa học
│   ├── JavaCourseView.vue   # Lộ trình Java 12 tuần (bản đồ)
│   ├── DayView.vue          # Chi tiết một ngày học Java
│   ├── IeltsCourseView.vue  # Lộ trình IELTS 8 tuần
│   ├── IeltsDayView.vue     # Chi tiết một ngày học IELTS
│   └── ToolsView.vue        # Khu công cụ (chọn & hiển thị 1 trong 4 công cụ)
└── data/                    # LỚP DỮ LIỆU MẪU (sẽ thay bằng parse từ MD)
    ├── courses.js           # khóa học, danh sách tuần, giai đoạn
    ├── lessons.js           # chi tiết ngày học (vocab, lý thuyết, agenda...)
    └── tools.js             # flashcard, quiz, từ điển, code mặc định
```

## Bản đồ route

| Đường dẫn                              | Màn hình                  |
| -------------------------------------- | ------------------------- |
| `/`                                    | Trang chủ                 |
| `/courses`                             | Thư viện khóa học         |
| `/courses/java`                        | Lộ trình Java (bản đồ)    |
| `/courses/java/week/:week/day/:day`    | Ngày học Java             |
| `/courses/ielts`                       | Lộ trình IELTS (bản đồ)   |
| `/courses/ielts/week/:week/day/:day`   | Ngày học IELTS            |
| `/tools` · `/tools/:tool`              | Khu công cụ học           |

## Nguồn dữ liệu bài học

Hiện các view đọc dữ liệu mẫu trong `src/data/`. Bước tiếp theo: thay lớp này bằng
nội dung parse runtime từ Markdown:

- `weeks/tuan-01..12.md` — khóa Java (sẽ chuyển từ HTML-in-MD sang **Markdown thuần**
  để đồng bộ với khóa English và các khóa sau).
- `Base_English/NenTang_Tuan1..8.md` — khóa IELTS/Tiếng Anh nền tảng (Markdown thuần).

Thư viện `marked` đã được cài sẵn để parse Markdown khi triển khai bước này.

## Bản design gốc

`Devleap - Nền tảng học lập trình-handoff/` chứa bản mockup HTML/CSS gốc (đã .gitignore).
Đây là nguồn tham chiếu pixel cho giao diện.
