# Kế hoạch cải tiến — Nâng "Phù hợp giao tiếp thực tế" từ 6.5 → 8.5/10

> Tài liệu hành động cho khóa **Nền Tảng 8 tuần** (`Base_English/NenTang_Tuan1..8.md`) và app DevLeap.
> Chẩn đoán gốc: khóa đã giải tốt bài toán *"sản xuất tiếng Anh đúng mỗi ngày"* nhưng chưa chạm bài toán
> *"dám và quen dùng tiếng Anh với con người thật, trong tình huống thật"*.

---

## 1. Mục tiêu & thước đo

| Mục tiêu | Thước đo thành công (cuối khóa) |
| --- | --- |
| Người học **dùng** tiếng Anh ngoài app | ≥ 8 real-life mission hoàn thành (1/tuần), có bằng chứng (ảnh chụp, link, bản ghi) |
| Nói được với **người thật** | ≥ 4 buổi nói với người thật (2 tuần/lần từ Tuần 3), mỗi buổi ≥ 10 phút |
| Phản xạ trước **tình huống bất ngờ** | Vượt 3 kịch bản AI "không báo trước" (đổi đề tài, hỏi vặn, khách khó tính) |
| Nghe được **audio đời thực** | Tuần 8 nghe hiểu ≥ 60% một clip YouTube gốc tốc độ thường (đã nghe TTS chậm ở Tuần 1) |
| Dùng được trong **công việc** | 1 email thật đã gửi + 1 bản ghi self-intro phỏng vấn + 10 câu "sống sót trong họp" thuộc lòng |

**Thước đo tổng:** bản ghi âm Day 1 / Day 30 / Day 63 (đã có sẵn cơ chế "mốc 0") + nhật ký mission.

---

## 2. Nguyên tắc thiết kế

1. **Không phá xương sống hiện có** — sổ lỗi, recall đầu giờ, viết + AI chữa, ngày nạp/ngày sản phẩm giữ nguyên.
2. **Mỗi tuần ít nhất 1 lần "có rủi ro thật"** — một hành động ngôn ngữ mà kết quả không do app chấm.
3. **AI là sân tập, không phải trận đấu** — mọi kỹ năng luyện với AI phải có "trận thật" tương ứng (người thật / mission).
4. **Thật hóa dần, không sốc** — nghe/nói tăng độ khó theo thang, không ném người A1 vào hội thoại tốc độ thật.
5. **Người đi làm là persona chính** — tình huống công việc ưu tiên hơn tình huống phòng thi.

---

## 3. Năm hạng mục cải tiến (theo ưu tiên)

### 3.1 ⭐ Real-life Mission hằng tuần (nội dung — chi phí thấp, tác động cao nhất)

Thêm mục **"🌍 Mission tuần"** vào mỗi file `NenTang_TuanX.md`, gắn vào checklist Day 6 (ngày sản phẩm).
Mission phải: (a) diễn ra **ngoài app**, (b) có bằng chứng, (c) khớp trình độ tuần.

| Tuần | Mission đề xuất |
| --- | --- |
| 1 | Đổi điện thoại/1 app quen dùng sang tiếng Anh; chép lại 5 cụm nhìn thấy mỗi ngày |
| 2 | Viết 3 câu comment tiếng Anh (thật) dưới 1 video YouTube em thích |
| 3 | Nhắn tin tiếng Anh với 1 người (bạn bè/đồng nghiệp/language partner) tối thiểu 5 lượt |
| 4 | Kể lại một ngày của mình bằng voice message tiếng Anh gửi cho partner (60–90s) |
| 5 | Đăng self-intro lên 1 cộng đồng học tiếng Anh, trả lời ít nhất 1 phản hồi |
| 6 | Viết 1 email tiếng Anh THẬT (hỏi thông tin, cảm ơn, xác nhận lịch) và gửi đi |
| 7 | Gọi món / hỏi đường / mua hàng bằng tiếng Anh (hoặc roleplay video-call với partner nếu không có bối cảnh) |
| 8 | "Trận chung kết": 15 phút nói chuyện với người thật + nghe lại bản ghi mốc 0 |

**Trong app:** thêm khối `Mission` vào `IeltsDayView` (cờ mới trong `src/lib/dayPlan.js`), có ô check + ô dán link/ghi chú bằng chứng, +XP lớn hơn task thường (cơ chế XP đã có trong store).

### 3.2 ⭐ Nói với người thật, 2 tuần/lần (quy trình — không cần code nhiều)

- Từ **Tuần 3**: lịch cố định 1 buổi/2 tuần với người thật — language exchange (Tandem, HelloTalk, Discord "English practice", Free4Talk) hoặc bạn/đồng nghiệp.
- Thêm trang hướng dẫn `docs/` hoặc mục trong tuần: kịch bản buổi nói đầu tiên (câu mở đầu, câu cứu nguy *"Sorry, could you say that again more slowly?"*, cách kết thúc lịch sự).
- **Trước buổi nói:** luyện trước với AI đúng kịch bản đó. **Sau buổi nói:** ghi 3 điều vào sổ lỗi (1 câu bí, 1 từ không nghe ra, 1 điều làm tốt).
- Trong app: checklist Day tương ứng thêm mục `[ ] Buổi nói người thật #N + ghi sổ lỗi sau buổi`.

### 3.3 ⭐ Track "Work & Life English" cho Tuần 6–8 (nội dung — thay thế mặc định IELTS)

Giữ Tuần 6–8 hiện tại thành **Track B (IELTS Bridge)** cho người có kế hoạch thi.
Viết 3 file mới làm **Track A (mặc định cho người đi làm)**:

| File mới | Nội dung chính |
| --- | --- |
| `Base_English/NenTang_Tuan6_Work.md` — **Email & Chat công việc** | 3 khung email (request / confirm / apologize+propose), chat Teams/Slack, mức trang trọng; ngày sản phẩm: 1 email thật đã gửi (Mission 6) |
| `Base_English/NenTang_Tuan7_Work.md` — **Họp & Small talk** | 10 câu sống sót trong họp (*"Could you go over that again?"*, *"Let me get back to you on that."*), small talk trước họp, nghe 1 đoạn meeting chậm + dictation |
| `Base_English/NenTang_Tuan8_Work.md` — **Phỏng vấn + Final Boss** | Self-intro phỏng vấn 90s (khung STAR-lite), trả lời điểm mạnh/yếu; Day 62–63: trận chung kết (15' người thật + so bản ghi mốc 0 + tự chấm rubric) |

Cấu trúc file giữ đúng format hiện tại (Mục tiêu tuần → Ngữ pháp → Phòng từ vựng → Khung mẫu → Checklist 7 ngày → Quiz) để `parseIelts.js` đọc được không cần sửa parser. Chọn track: thêm cấu hình trong store/course data.

**Bỏ/thu nhỏ ở Track B:** Task 1 Lite (mô tả biểu đồ) dồn từ 2 ngày xuống 1 ngày — kỹ năng chỉ dùng trong phòng thi.

### 3.4 AI hội thoại "có bất ngờ" + voice-first (tính năng app)

Hiện `AiChat.vue` xoay quanh chủ đề bài học và người học biết trước đề. Bổ sung:

1. **Chế độ "Tình huống bất ngờ" (Surprise mode)** — thêm `mode: 'roleplay'` vào Netlify Function chat:
   AI nhận 1 kịch bản ngẫu nhiên (khách hàng khó tính, người hỏi đường vội, đồng nghiệp hỏi vặn về task,
   người phỏng vấn), **chủ động đổi đề tài giữa chừng** và không cho biết trước câu hỏi.
   Mở khóa từ Tuần 4. Mỗi tuần 1 lần trong checklist.
2. **Voice-first**: mặc định mở micro (lib `speechRecognize.js` + `speak.js` đã có sẵn), gõ chữ chỉ là fallback;
   thêm đếm giờ "trả lời trong 10 giây" để ép phản xạ, không soạn câu trước trong đầu.
3. **Đo lường**: lưu số lượt thoại + thời gian nói vào progress store để streak nói riêng biệt với streak học.

### 3.5 Thang nghe "thật hóa dần" + chấm âm cuối trung thực (nội dung + app)

**Thang nghe theo giai đoạn:**

| Tuần | Chất liệu | Nguồn trong app |
| --- | --- | --- |
| 1–3 | TTS chậm, script viết sẵn (như hiện tại) | `ListeningDictation`, `ListeningComprehension` |
| 4–6 | Podcast/kênh cho learner, tốc độ 0.8–1.0 | thêm bài shadowing curate qua `AdminShadowingView` (pipeline YouTube đã có) |
| 7–8 | Clip YouTube gốc tốc độ thường, giọng đa dạng | mục tiêu: hiểu ≥ 60% ý chính, chấp nhận không nghe hết từ |

**Chấm phát âm trung thực:**
- `pronounceScore.js` chỉ so khớp TỪ (LCS trên transcript) — Web Speech API tự "sửa" âm cuối nên điểm cao ảo.
- Việc cần làm: (a) hiển thị chú thích ngay dưới điểm shadowing: *"Điểm này đo đúng từ, KHÔNG đo âm cuối/ngữ điệu"*;
  (b) thêm bài **cặp tối thiểu** (minimal pairs: `like/liked`, `book/books`, `work/works`) vào `PronunciationDrill` —
  nhận dạng phân biệt được 2 từ khác nhau nên chấm âm cuối theo cách này là tin được;
  (c) giữ nghi thức "tự nghe lại bản ghi + checklist 4 tiêu chí" của Day 6 làm kênh chấm chính cho ngữ điệu.

---

## 4. Tích hợp vào lịch tuần (delta so với hiện tại)

Mỗi tuần chỉ **thêm ≤ 20 phút** so với checklist hiện có (giữ trần 60–75'/ngày, mission làm ngoài giờ học):

| Ngày | Thêm gì |
| --- | --- |
| Day 4 (giữa tuần) | 1 lượt AI Surprise mode (10') — từ Tuần 4 |
| Day 6 (ngày sản phẩm) | 🌍 Mission tuần (ngoài app) + check bằng chứng |
| Day 7 (tổng hợp) | Ghi 3 dòng "sổ lỗi đời thực" từ mission/buổi nói vào Error Ledger |
| 2 tuần/lần (từ Tuần 3) | Buổi nói người thật, thay cho 1 phần khối AI chat của ngày đó |

---

## 5. Backlog triển khai

### Đợt 1 — Nội dung thuần, không cần code (làm ngay)

- [x] Viết mục "🌍 Mission tuần" + tiêu chí bằng chứng vào 8 file `Base_English/NenTang_TuanX.md`
- [x] Thêm mục buổi nói người thật vào checklist Day tương ứng (Tuần 3, 5, 7, 8)
- [x] Viết guide "Buổi nói người thật đầu tiên" (câu cứu nguy, kịch bản, nơi tìm partner) — `docs/BUOI_NOI_NGUOI_THAT.md`
- [x] Thêm chú thích trung thực về điểm shadowing (1 dòng text trong `ShadowingPlayer.vue`)

### Đợt 2 — Tính năng app nhỏ (1–2 buổi code mỗi mục)

- [x] Cờ `mission` trong `dayPlan.js` + khối Mission trong `IeltsDayView.vue` (check + ghi chú bằng chứng + XP — `useUserStore().saveMission`)
- [x] `mode: 'roleplay'` (Surprise) trong Netlify Function + nút trong `AiChat.vue`, mở khóa từ Tuần 4
- [x] Bài minimal pairs trong `PronunciationDrill.vue` (8 cặp/tuần xoay vòng từ Tuần 2)
- [x] Voice-first mặc định + đồng hồ 10s trong `AiChat.vue`

### Đợt 3 — Nội dung lớn + track (1–2 tuần)

- [x] Viết `NenTang_Tuan6_Work.md`, `NenTang_Tuan7_Work.md`, `NenTang_Tuan8_Work.md` (Track A) — email/chat công việc, họp & small talk, phỏng vấn + Final Boss; cùng format nên `parseIelts.js` không cần sửa
- [x] Cơ chế chọn Track A/B (`src/data/courseIelts.js` lọc file theo hậu tố `_Work.md`, pref lưu `localStorage` + `useUserStore().ieltsTrack`/`setIeltsTrack()`, toggle ở banner `IeltsCourseView.vue`), mặc định Track A — đổi track cần tải lại trang
- [x] Curate 6–8 bài shadowing "bán thực" (Tuần 4–6) và 4 clip gốc (Tuần 7–8) — **xong ở `KE_HOACH_CAI_TIEN_WEBSITE.md` Bước 1.3**: script `scripts/curate-shadowing.mjs` tự lấy phụ đề (`youtube-transcript`), cắt đoạn, polish qua Groq, ghi 10/10 clip vào `public/data/shadowing-clips.json` (fallback tĩnh, không cần dán tay qua `/admin/shadowing` nữa) — danh sách video đã dùng:

  | Tuần | Cấp độ | Tiêu đề | URL | Kênh | Vì sao phù hợp |
  | --- | --- | --- | --- | --- | --- |
  | 4 | A2 | Everyday Grammar: Grammar and the Passing Seasons | https://www.youtube.com/watch?v=Nzye1wn4MXI | VOA Learning English | 1 người nói, kịch bản chậm rõ, chủ đề đơn giản — mở đầu bán thực |
  | 4 | A2 | Everyday Grammar: If and Whether, Part 1 | https://www.youtube.com/watch?v=CyjLzIF7_L4 | VOA Learning English | Giải thích ngữ pháp tốc độ chậm, ngắn gọn |
  | 4–5 | A2/B1 | Everyday Grammar TV: Grammar and Libraries, Part 1 | https://www.youtube.com/watch?v=LCcKsIlacbI | VOA Learning English | Hội thoại kịch bản ngắn, chủ đề nhẹ nhàng, phát âm rõ |
  | 5 | B1 | Learning multiple languages | https://www.youtube.com/watch?v=9ifQ3xRz4hM | BBC Learning English | Format "6 Minute English" 2 host, tốc độ vừa, chủ đề đời thường |
  | 5 | B1 | Why read books, not screens? | https://www.youtube.com/watch?v=h_pvijqmolQ | BBC Learning English | Chủ đề gần gũi, từ mới được nêu rõ trong bài |
  | 6 | B1/B2 | Why are we all so stressed? | https://www.youtube.com/watch?v=QdE63sYqwd8 | BBC Learning English | Chủ đề/từ vựng khó hơn 1 chút — cầu nối B1→B2 |
  | 7 | B1/B2 | Asking FRIENDS in BRIGHTON How They Met (Easy English 182) | https://www.youtube.com/watch?v=fEacJtQbTko | Easy English | Phỏng vấn đường phố Anh thật, nhiều giọng, tốc độ tự nhiên |
  | 7 | B1/B2 | Indians Try Their Best American Accent (Street Interview) | https://www.youtube.com/watch?v=lBNM6aKwPl0 | Asian Boss | Giọng Ấn Độ thật, không kịch bản, đa dạng accent |
  | 8 | B2 | Do the Chinese Care about Learning English Anymore? | https://www.youtube.com/watch?v=DU9GdKT32io | Asian Boss | Phỏng vấn đường phố thật, tốc độ tự nhiên, pha trộn giọng bản ngữ/không bản ngữ |
  | 8 | B2 | What The Japanese Think Of Marie Kondo | https://www.youtube.com/watch?v=WnBjhNDdEiY | Asian Boss | Nội dung không kịch bản, tốc độ bản ngữ, quan điểm thật |

  **Lưu ý:** clip VOA dài ~2 phút (hơi ngắn nhưng vừa mức A2), clip BBC ~6-7 phút, clip Tuần 7–8 dài 9–15 phút (dài hơn khung lý tưởng 2-6') — vì phụ đề lấy nguyên từ YouTube nên phải dùng trọn tập; sau khi "Tạo bài" ở Admin, dùng thao tác Gộp/Tách/Xóa câu có sẵn để cắt còn một đoạn vừa cho 1 buổi shadowing. Độ tin cậy phụ đề: cao với VOA/BBC/Easy English (có chính sách phụ đề thủ công), trung bình-cao với Asian Boss (kênh luôn gắn phụ đề tiếng Anh cho video phỏng vấn) — chưa kiểm tra trực tiếp danh sách phụ đề từng video.
- [x] Thang nghe: gắn nguồn audio theo tuần vào manifest — cơ chế đã xong, chờ nội dung thật ở trên:
  - `shadowing_clips` có thêm cột `week` (1-8, nullable) — `supabase/schema.sql`
  - `AdminShadowingView.vue` có ô "Gắn với Tuần" khi soạn/sửa một clip
  - `shadowingRepo.js` có `fetchClipsByWeek(week)`; `ShadowingView.vue` nhận `?week=N` để lọc sẵn thư viện
  - `src/data/ieltsListeningStage.js` khai báo 3 giai đoạn (TTS Tuần 1-3 / bán thực Tuần 4-6 / clip gốc Tuần 7-8)
  - `IeltsDayView.vue` hiện thẻ "🎧 Nghe thật hơn tuần này" (buổi có luyện nghe hoặc buổi cuối tuần, Tuần 4+) dẫn sang `/shadowing?week=N`

### Đợt 4 — Đo lường & giữ chân

- [x] Streak nói (số phút nói/tuần) tách khỏi streak học, hiển thị ở Home — `speakingLog`/`speakingStreak` trong `user.js`, đo bằng cách bấm giờ lúc mic mở/tắt ở `AiChat.vue`, hiện ở `HomeView.vue`
- [x] Trang "So sánh mốc": nghe lại Đầu / Giữa / Cuối khóa cạnh nhau + nhật ký mission — `src/views/MilestonesView.vue` (route `/milestones`, link từ banner `IeltsCourseView.vue`), chọn 3 mốc ghi âm tiêu biểu qua `src/data/milestones.js` thay vì hard-code "Day 1/30/63" (số ngày ghi âm thật do nội dung tuần quyết định)
- [x] Badge riêng cho mission ("Ra khỏi app lần đầu", "4 buổi người thật", "Email thật đã gửi") — catalog `src/data/badges.js` + tính điều kiện qua `src/lib/missionStats.js`; thêm cơ chế đánh dấu **Buổi nói người thật** (`realTalks` trong `user.js`, khối check-off trong `IeltsDayView.vue`) vì trước đó mục này chỉ là text checklist, không đo được để tính badge "4 buổi người thật"

---

## 6. Rủi ro & cách né

| Rủi ro | Cách né |
| --- | --- |
| Người học sợ, bỏ qua mission/buổi nói | Mission tuần 1–2 cực nhẹ (không cần nói với ai); luyện trước với AI đúng kịch bản; XP thưởng lớn |
| Không tìm được partner | Guide liệt kê 4–5 kênh cụ thể; fallback = voice message một chiều gửi bạn bè |
| Thêm việc → quá tải → bỏ cuộc | Mission thay thế (không cộng dồn) 1 task trong ngày sản phẩm; giữ trần 75'/ngày |
| AI roleplay chữa sai / lệch trình độ | Kịch bản roleplay khai báo CEFR mục tiêu trong system prompt; giới hạn Tuần 4+ khi đã có nền câu |
| Track A/B làm phình nội dung phải bảo trì | Track B giữ nguyên file cũ, không viết lại; chỉ thêm 3 file Track A cùng format parser |

---

## 7. Định nghĩa "xong"

Kế hoạch coi là hoàn thành khi một người học đi hết 8 tuần có thể trình ra:
**8 bằng chứng mission + 4 buổi nói người thật + 1 email thật + bản ghi Day 63 nghe rõ tiến bộ so với Day 1** —
tức là tiếng Anh đã rời khỏi app và đi vào đời sống của họ.
