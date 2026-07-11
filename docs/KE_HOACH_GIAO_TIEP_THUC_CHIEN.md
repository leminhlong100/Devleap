# Kế hoạch — Khóa "Giao Tiếp Thực Chiến" (khóa độc lập thứ 3, 8 tuần)

> Khóa mới lấp thẻ `comm` "Tiếng Anh Giao Tiếp" đang gắn **SẮP RA MẮT** trong `src/data/courses.js`.
> Khác biệt cốt lõi so với Nền Tảng: **roleplay AI bằng giọng nói là trục của mỗi buổi** —
> học để nhập vai, không phải học rồi (may ra) nhập vai.

**Các quyết định thiết kế đã chốt:**

| Câu hỏi | Quyết định |
| --- | --- |
| Quan hệ với Nền Tảng 8 tuần | **Khóa độc lập** — ai vào học cũng được, không cần học Nền Tảng trước |
| Bối cảnh | Cả 4: đời sống · kết bạn quốc tế · công việc IT/văn phòng · phỏng vấn & sự nghiệp |
| Cấu trúc | **4 khối × 2 tuần**, độ trang trọng tăng dần (đời sống → phỏng vấn) |
| Thời lượng | 8 tuần × 7 buổi = 56 buổi, ~60'/buổi |
| Đầu vào | **A2 trở lên** (biết câu đơn giản, ~500–1000 từ); ai chưa tới A2 được gợi ý học Nền Tảng trước |
| Trục mỗi buổi | **Roleplay AI voice-first** (nạp cụm 15' → nhập vai 25' → debrief 10') |
| Mức đầu tư app | **Tái dùng tối đa**: parser, dayPlan, chat engine roleplay, SRS, mission, XP/streak, Supabase sync |

---

## 1. Mục tiêu & thước đo

Người học A2 sau 8 tuần **xử lý được tình huống thật trong 4 bối cảnh mà không chuẩn bị trước**.

| Mục tiêu | Thước đo thành công (cuối khóa) |
| --- | --- |
| Phản xạ tình huống | Vượt 8 "Boss tuần" (roleplay có twist, AI chấm rubric ≥ 70%) |
| Sống sót khi bất ngờ | Vượt "Marathon" Tuần 8: 3 tình huống ngẫu nhiên liên tiếp không báo trước |
| Dùng ngoài app | ≥ 8 mission thật hoàn thành (1/tuần, có bằng chứng — cơ chế mission sẵn có) |
| Nói đủ lượng | ≥ 20 phút nói/tuần (đo bằng speaking streak sẵn có trong `user.js`) |
| Phỏng vấn được | 1 bản ghi mock interview 15' + self-intro 90s nghe rõ tiến bộ so với mốc 0 |
| Vốn cụm câu | ≥ 300 cụm sống còn vào SRS, ≥ 70% ở trạng thái "nhớ" cuối khóa |

**Mốc so sánh:** ghi âm mốc 0 (buổi 1) / giữa khóa (Tuần 4 Boss) / cuối khóa (Final Boss) — tái dùng `MilestonesView` + `src/data/milestones.js`.

---

## 2. Nguyên tắc thiết kế

1. **Tình huống trước, ngôn ngữ sau** — mỗi buổi bắt đầu bằng "hôm nay bạn phải sống sót qua chuyện gì", cụm câu/ngữ pháp chỉ nạp đúng thứ tình huống cần. Không dạy ngữ pháp rời.
2. **Nói là mặc định, gõ là fallback** — roleplay voice-first (mic mở sẵn + đồng hồ 10s, cơ chế đã có trong `AiChat.vue`).
3. **Hai hiệp mỗi trận** — hiệp 1 bám kịch bản đã học; hiệp 2 AI tung **twist** (đổi đề tài, hỏi vặn, gây khó) để tạo phản xạ. Twist ghi sẵn trong nội dung MD, người học không thấy trước.
4. **Mỗi buổi kết thúc bằng chiến lợi phẩm** — debrief: 3 lỗi chính vào sổ lỗi + cụm hay vào SRS. Không có buổi nào "nói xong là xong".
5. **Sân tập AI phải có trận thật** — mỗi tuần 1 mission ngoài app + Tuần 8 có buổi người thật (tái dùng cơ chế mission/realTalk).
6. **Không phá hạ tầng** — format MD tương thích `parseIelts.js` (chỉ thêm 1 section mới), view tái dùng component sẵn có, store thêm namespace `comm`.

---

## 3. Khung một buổi 60' (giống nhau cả khóa — dễ thành thói quen)

| Phút | Khối | Nội dung | Tái dùng |
| --- | --- | --- | --- |
| 0–5 | 🔁 Recall | Ôn 5–8 cụm buổi trước qua flashcard SRS | `FlashcardDeck` + `srs.js` |
| 5–20 | 📥 Nạp | 8–10 cụm sống còn của tình huống + nghe hội thoại mẫu (TTS) + shadow nhanh 2 câu | khối vocab/listening + `speak.js` |
| 20–45 | 🎭 Thực chiến | Roleplay AI voice-first: hiệp 1 bám kịch bản (10') → hiệp 2 twist (10–15') | `useChatEngine` + `mode: 'roleplay'` |
| 45–55 | 📋 Debrief | AI tổng kết theo rubric: 3 lỗi → sổ lỗi, 3 câu nâng cấp → SRS | mode `debrief` (mới, Đợt 2) |
| 55–60 | ✅ Quiz | Quiz nhanh cụm câu của buổi (chọn nghĩa · điền cụm · xếp câu) | `buildDayVocabQuiz` sẵn có |

Ngày 6 mỗi tuần: thay hiệp roleplay bằng **🌍 Mission thật** (chuẩn bị với AI → làm ngoài app → ghi bằng chứng).
Ngày 7 mỗi tuần: **Boss tuần** — roleplay tổng hợp cả tuần có chấm rubric + quiz tuần.

---

## 4. Đề cương 8 tuần — 4 khối × 2 tuần

### Khối 1 · Đời sống hằng ngày (Tuần 1–2) — "Sống sót nơi công cộng"

**Tuần 1 — Phản xạ sống còn**

| Buổi | Tình huống roleplay | Cụm trọng tâm |
| --- | --- | --- |
| 1 | Chào hỏi & small talk với người lạ (thang máy, xếp hàng) | mở chuyện, thời tiết, kết thúc lịch sự |
| 2 | Gọi món ở quán cà phê / nhà hàng | order, hỏi món, yêu cầu đặc biệt, tính tiền |
| 3 | Mua sắm — hỏi giá, size, đổi trả | How much, Do you have…, refund/exchange |
| 4 | Hỏi đường & đi phương tiện công cộng | chỉ đường, xác nhận lại, mua vé |
| 5 | **Chiến lược cứu nguy** khi không hiểu | "Sorry, could you slow down?", paraphrase, xác nhận |
| 6 | 🌍 Mission: gọi món/mua hàng thật bằng tiếng Anh (hoặc đặt đồ ăn app tiếng Anh + đọc to đơn) | — |
| 7 | 👑 Boss: "Một ngày ở thành phố lạ" — chuỗi 3 cảnh nối nhau + quiz tuần | tổng hợp |

**Tuần 2 — Du lịch & dịch vụ**

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Check-in sân bay & qua an ninh |
| 2 | Nhận phòng khách sạn + yêu cầu/phàn nàn về phòng |
| 3 | Khám bệnh / mua thuốc — mô tả triệu chứng |
| 4 | Sự cố: mất đồ, trễ chuyến, khiếu nại lịch sự |
| 5 | Gọi điện thoại đặt bàn/đặt lịch (không thấy mặt — nghe khó hơn) |
| 6 | 🌍 Mission: đổi điện thoại + 1 app sang tiếng Anh, chép 10 cụm nhìn thấy |
| 7 | 👑 Boss: "Chuyến đi trục trặc" — hành trình có 2 sự cố ngẫu nhiên + quiz tuần |

### Khối 2 · Kết bạn quốc tế (Tuần 3–4) — "Từ xã giao thành bạn"

**Tuần 3 — Làm quen & kể chuyện**

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Tự giới thiệu có màu sắc (không chỉ name/age/job) |
| 2 | Hỏi làm quen + **follow-up questions** (kỹ năng duy trì hội thoại) |
| 3 | Kể một kỷ niệm/câu chuyện bản thân (quá khứ, trình tự) |
| 4 | Nói về sở thích, gu phim/nhạc/game — phản ứng "Me too / Really?" |
| 5 | Active listening: khen, đồng cảm, hỏi sâu thêm |
| 6 | 🌍 Mission: viết 3 comment tiếng Anh thật dưới video/bài viết em thích |
| 7 | 👑 Boss: buổi language exchange đầu tiên (AI đóng vai partner tò mò) + quiz tuần |

**Tuần 4 — Duy trì & quan điểm** *(bật Surprise mode từ tuần này)*

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Chat online: nhắn tin làm quen, viết tự nhiên (viết + nói) |
| 2 | Gửi voice message: kể lại một ngày trong 60–90s |
| 3 | Video call đầu tiên: xử lý im lặng ngượng, đổi đề tài |
| 4 | Nêu quan điểm + đồng ý/không đồng ý nhẹ nhàng |
| 5 | Chủ đề văn hóa: cái nên hỏi, cái nên tránh; xin lỗi khi lỡ lời |
| 6 | 🌍 Mission: nhắn tin/voice message tiếng Anh với 1 người thật ≥ 5 lượt |
| 7 | 👑 Boss GIỮA KHÓA: video call 10' AI liên tục đổi đề tài + **ghi âm mốc giữa** + quiz tuần |

### Khối 3 · Công việc IT/văn phòng (Tuần 5–6) — "Sống sót 8 tiếng ở công ty"

**Tuần 5 — Teamwork hằng ngày**

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Daily standup: hôm qua/hôm nay/blocker trong 60s |
| 2 | Báo cáo tiến độ & xin trợ giúp khi kẹt task |
| 3 | Hỏi rõ requirement — clarify mà không sợ "hỏi ngu" |
| 4 | Chat Slack/Teams: ngắn gọn, đúng mức trang trọng (viết + nói) |
| 5 | Xin nghỉ phép, deal deadline, từ chối khéo khi quá tải |
| 6 | 🌍 Mission: viết standup thật của em hôm nay bằng tiếng Anh, gửi vào nhóm/ghi âm |
| 7 | 👑 Boss: "Một ngày làm việc" — standup → bị hỏi vặn về task → chat xác nhận + quiz tuần |

**Tuần 6 — Họp & trình bày**

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Small talk trước họp với đồng nghiệp/khách nước ngoài |
| 2 | Xin phát biểu, ngắt lời lịch sự, câu "sống sót trong họp" |
| 3 | Trình bày ngắn 2 phút về task/giải pháp của mình |
| 4 | Bị hỏi vặn trong họp — trả lời khi chưa chắc, hẹn trả lời sau |
| 5 | Đưa & nhận feedback (review công việc) không mất lòng |
| 6 | 🌍 Mission: nói ≥ 1 câu tiếng Anh thật trong họp, HOẶC gửi 1 email/chat công việc thật |
| 7 | 👑 Boss: cuộc họp với khách khó tính (twist kép) + quiz tuần |

### Khối 4 · Phỏng vấn & sự nghiệp (Tuần 7–8) — "Trận đấu lớn"

**Tuần 7 — Phỏng vấn**

| Buổi | Tình huống roleplay |
| --- | --- |
| 1 | Self-intro 90 giây (khung STAR-lite) |
| 2 | Walk through project: kể về dự án đã làm |
| 3 | Strengths / weaknesses + câu behavioral (teamwork, conflict) |
| 4 | Xử lý câu không biết trả lời + hỏi ngược interviewer |
| 5 | Nói về mục tiêu nghề nghiệp, lý do nhảy việc, lương (mức chạm nhẹ) |
| 6 | 🌍 Mission: ghi âm self-intro 90s, gửi cho 1 người thật/đăng cộng đồng xin nhận xét |
| 7 | 👑 Boss: mock interview 15' liền mạch, AI chấm rubric từng phần + quiz tuần |

**Tuần 8 — Tổng duyệt & Final Boss**

| Buổi | Nội dung |
| --- | --- |
| 1 | Ôn xoay bối cảnh 1–2 (Surprise mode: không biết trước gặp cảnh nào) |
| 2 | Ôn xoay bối cảnh 3–4 (Surprise mode) |
| 3 | **Error drill**: minh oan sổ lỗi — roleplay lại đúng các cảnh từng sai nhiều |
| 4 | **Marathon**: 3 tình huống ngẫu nhiên liên tiếp, không nghỉ, không báo trước |
| 5 | Mock interview lần 2 + đàm phán offer nhẹ |
| 6 | 🌍 Mission chung kết: 15 phút nói với người thật (cơ chế realTalk sẵn có) |
| 7 | 🏆 **Final Boss**: nghe lại mốc 0 / giữa / cuối cạnh nhau, tự chấm rubric, nhận badge + quiz cuối khóa |

---

## 5. Format file nội dung — `Comm_English/ThucChien_TuanN.md`

Giữ tương thích `parseIelts.js` (tái dùng parser), **chỉ thêm 1 section mới `## 🎭 Tình huống thực chiến`**:

```markdown
# Tuần 1 — Phản xạ sống còn (Sống sót nơi công cộng)

## 🎯 Mục tiêu & Trọng tâm tuần
### Nhịp học hằng ngày
| Day | Nhiệm vụ chính | Sản phẩm nhỏ | Ôn tập |
| --- | --- | --- | --- |
| 1 | Roleplay: small talk với người lạ | Bản ghi hiệp 2 | — |
…

## 📖 Ngữ pháp trọng tâm
### Câu hỏi Yes/No & WH trong giao tiếp nhanh
(1–2 điểm/tuần, chỉ thứ tình huống cần — nhẹ hơn hẳn Nền Tảng)

## 🗂️ Phòng từ vựng
### Cụm sống còn: Gọi món
**Từ chính:** order, menu, takeaway, bill, …
**Cụm dùng được:**
- Could I get a…, please?
- Is it possible to…?
**Câu nối với IELTS:**
- I'd like a coffee to go, please.

## 🎭 Tình huống thực chiến
### Tình huống 1.2 — Gọi món ở quán cà phê
**Vai AI:** Nhân viên quán cà phê thân thiện nhưng nói hơi nhanh.
**Bối cảnh:** Bạn vào quán lần đầu, muốn gọi 1 đồ uống + 1 món ăn nhẹ, mang đi.
**Nhiệm vụ của bạn:**
- Gọi được món với 1 yêu cầu đặc biệt (ít đường / không đá…)
- Hỏi giá và xác nhận lại đơn
- Kết thúc lịch sự
**Twist hiệp 2:** Món bạn gọi đã hết — nhân viên gợi ý món khác và hỏi ngược lại bạn.
**Rubric:** hoàn thành nhiệm vụ · dùng ≥ 3 cụm đã học · phản xạ twist không im lặng > 10s · lịch sự đúng mức
**Hội thoại mẫu:**
- A: Hi there! What can I get you today?
- B: Could I get a latte, please? Less sugar if possible.
…

## 📅 Lịch học 7 ngày
### Day 1 (Thứ 2) — Small talk với người lạ
- [ ] Ôn flashcard cụm hôm trước (5')
- [ ] Học cụm sống còn + nghe hội thoại mẫu (15')
- [ ] 🎭 Roleplay 2 hiệp: Tình huống 1.1 (25')
- [ ] Debrief: ghi 3 lỗi vào sổ + lưu cụm hay (10')
- [ ] Quiz nhanh (5')
…

## ✅ Quiz tuần 1
(format quiz tuần sẵn có)
```

**Quy ước map buổi ↔ tình huống:** `Tình huống N.D` = Tuần N, Buổi D. Ngày không có roleplay (mission/boss đặc thù) thì checklist tự nói lên điều đó — `dayPlan.js` đã bắt cờ theo từ khóa.

---

## 6. Kiến trúc kỹ thuật — tái dùng gì, thêm gì

| Hạng mục | Tái dùng | Thêm mới |
| --- | --- | --- |
| Parse nội dung | `parseIelts.js` nguyên vẹn cho các section cũ | Hàm `parseScenarios()` đọc section 🎭 → `week.scenarios[]` (chỉ chạy khi section tồn tại — file Nền Tảng không đổi) |
| Course data | Pattern `courseIelts.js` (weeks, statuses, progress, chunk) | `src/data/courseComm.js` + `getCommDay()` ghép checklist ngày + scenario `N.D` + cụm câu |
| Views | Toàn bộ component con: AiChat, FlashcardDeck, QuizTool, khối vocab/listening, mission, realTalk | `CommCourseView.vue` (bản đồ tuần) + `CommDayView.vue` (lắp khối theo `dayPlan`) + route `/comm` |
| Roleplay | `mode: 'roleplay'` + `context.scenario` đã hỗ trợ trong `_llm.js`/`aiChat.js` | (a) truyền scenario CỐ ĐỊNH của buổi thay vì random; (b) trường `twist` — system prompt lệnh AI tung twist sau ~5 lượt; (c) bỏ điều kiện unlock Tuần 4 riêng cho khóa comm (kịch bản biết trước nên an toàn từ buổi 1) |
| Debrief | Khung evaluation từng lượt đã có trong roleplay prompt | `mode: 'debrief'` trong Netlify Function: nhận cả transcript → JSON {3 lỗi, 3 câu nâng cấp, điểm rubric 0–100}; nút "Kết thúc & nhận xét" trong AiChat |
| Tiến độ | `progressSlice` đã tách theo khóa (`completed.java/ielts`) | namespace `completed.comm` + đồng bộ Supabase (cột/JSON hiện có của bảng `progress`) |
| SRS | `srs.js` + deck saved words | nút "Lưu cụm vào ôn tập" ở debrief → deck `?deck=comm` |
| Gamification | XP, streak học, speaking streak, mission, realTalk | Badge mới: "Qua Boss đầu tiên", "Marathon sống sót", "Mock interview hoàn thành" (catalog `badges.js` + `missionStats.js`) |
| Đo mốc | `MilestonesView` + `milestones.js` | khai báo 3 mốc ghi âm của khóa comm (Buổi 1.1 / Boss 4.7 / Final Boss 8.7) |
| Thẻ khóa | `courses.js` | mở khóa thẻ `comm`: `routeName: 'comm'`, 8 tuần / 56 buổi, `active: true, locked: false` |
| Tests | Vitest suite sẵn có | test `parseScenarios`, `getCommDay` (map N.D), rubric JSON schema, dayPlan cho checklist comm |

---

## 7. Backlog triển khai

### Đợt 1 — Xương sống chạy end-to-end (khung app + Tuần 1)

Mục tiêu: học trọn được Tuần 1 trên app thật.

- [x] Viết `Comm_English/ThucChien_Tuan1.md` đủ 7 buổi theo format mục 5 (7 tình huống + cụm + twist + rubric + hội thoại mẫu + lịch 7 ngày + quiz tuần) — *thực tế 6 scenario: 1.1–1.5 + Boss 1.7; buổi 6 là mission (không scenario)*
- [x] `parseScenarios()` — file mới `src/data/md/parseComm.js` (bọc `parseIeltsWeek` + `parseScenarios`) + unit test `tests/parseComm.test.js`
- [x] `src/data/courseComm.js`: nạp `Comm_English/*.md`, `getCommDay()` ghép scenario theo quy ước N.D (tái dùng `getIeltsDay(…, commWeeksData)`) + unit test `tests/courseComm.test.js`
- [x] Route `/courses/comm`, `/courses/comm/week/:w/day/:d` + `CommCourseView.vue` (bản đồ) + `CommDayView.vue` (roleplay là trục buổi)
- [x] Roleplay theo kịch bản buổi: `getCommDay` đóng gói `scenario.brief` (kèm twist hiệp 2) → `context.fixedScenario` → `useChatEngine` tự vào vai + bỏ unlock Tuần 4 cho khóa comm (`unlockedRoleplay` true khi có fixedScenario)
- [x] `completed.comm` trong `progressSlice` (state/applyDefaults/nextLesson) + hợp nhất trong `syncSupabase.js` + mở thẻ `comm` trong `courses.js` (routeName `comm`, active, locked:false)

> **Đợt 1 XONG** (2026-07-10): học trọn Tuần 1 trên app thật. Còn nợ Đợt 2: `mode:'debrief'` (chấm rubric 3 lỗi/3 câu nâng cấp), lưu điểm Boss + sổ lỗi, "Lưu cụm vào ôn tập" → SRS deck comm, quiz tuần soft-gating, và `ThucChien_Tuan2.md`.

### Đợt 2 — Debrief thành chiến lợi phẩm + khối 1 trọn vẹn (Tuần 2)

- [x] `mode: 'debrief'` trong `netlify/functions/_llm.js` (`buildDebriefPrompt`): transcript + rubric buổi → JSON {score, rubric[], errors[], upgrades[], summary}; `debriefTurn` trong `aiChat.js`; `runDebrief`/`saveUpgrade` + state trong `useChatEngine.js`; nút "📋 Kết thúc & nhận xét" + panel kết quả trong `AiChat.vue` (chỉ hiện khi có `fixedScenario`)
- [x] Lưu debrief: 3 lỗi → `ErrorLedger` (localStorage `comm-debrief-w{w}-d{n}`, hiện thành bài tự sửa); điểm rubric buổi Boss → `recordQuiz('comm', 'boss:N', score, 100, 0.7)` (tái dùng `quizScores`, tự đồng bộ Supabase); "＋ Lưu" câu nâng cấp → `saveWord` chủ đề "Giao tiếp thực chiến" (SRS deck `saved`, đồng bộ sẵn) — *deviation: dùng deck `saved` gom theo chủ đề thay vì deck `?deck=comm` riêng*
- [x] Viết `ThucChien_Tuan2.md` (Du lịch & dịch vụ: sân bay, khách sạn+phàn nàn, khám bệnh, khiếu nại sự cố, gọi điện; scenario 2.1–2.5 + Boss 2.7; buổi 6 mission)
- [x] Quiz tuần khóa comm: `quizSets.js` nhận `comm` (dùng `week.weekQuiz`); route `assessment` thêm `comm`; `AssessmentView` hỗ trợ comm; `CommDayView` có khối "Bài kiểm tra Tuần" ở buổi Boss; soft gating đã sẵn (CommCourseView + computeCommStatuses dùng `quizPassed('comm','week:N')`)

> **Đợt 2 XONG** (2026-07-10): debrief chấm rubric + lưu 3 lỗi/3 câu nâng cấp, điểm Boss, quiz tuần + soft gating, Tuần 2. Unit test: `tests/debriefPrompt.test.js` (prompt + runChat stub), `tests/quizSets.test.js` (comm). Còn nợ: đi thử trọn khối 1 với AI thật (chỉnh độ khó/twist theo cảm nhận), và Đợt 3 (nội dung Tuần 3–8).

### Đợt 3 — Nội dung khối 2–4 (Tuần 3–8)

- [x] Viết `ThucChien_Tuan3.md` + `Tuan4.md` (kết bạn; Tuần 4 bật Surprise mode + ghi âm mốc giữa ở Boss 4.7). Mỗi tuần: 5 roleplay (N.1–N.5) + Boss N.7 + buổi 6 mission, đúng khuôn Tuần 1–2.
- [x] Viết `ThucChien_Tuan5.md` + `Tuan6.md` (công việc IT: standup/báo tiến độ/clarify/chat/deal deadline + họp & trình bày)
- [x] Viết `ThucChien_Tuan7.md` (phỏng vấn) — Boss 7.7 mock interview 15' (system prompt lệnh AI chấm rubric từng phần)
- [x] Viết `ThucChien_Tuan8.md` (tổng duyệt) + chế độ **Marathon** buổi 8.4 (scenario multi-cảnh nối liên tục, tái dùng engine như Boss 2.7 — không cần sửa engine)
- [x] **Surprise mode kỹ thuật** (dùng cho 8.1/8.2/8.4): trường `**Surprise:** Có` trong MD → `parseScenarios` set `surprise`; `getCommDay` phơi `scenario.surprise`; `scenarioBrief` thêm lệnh "SURPRISE MODE: vào vai ngay, không xướng tên cảnh"; `CommDayView` che 🤖 Vai AI / 📍 Bối cảnh / 🎯 Nhiệm vụ (chỉ hiện panel 🎲 "tình huống bí mật") khi `surprise && !done`, lộ lại sau khi hoàn thành.

> **Đợt 3 XONG** (2026-07-10): đủ nội dung 8 tuần / 56 buổi / 48 scenario. Unit test mở rộng `tests/courseComm.test.js` (8 tuần × 6 scenario = 56 buổi; cờ surprise 8.1/8.2/8.4 + brief chứa "SURPRISE MODE"). Toàn bộ 442 test pass; guest & auth dev server compile sạch (không lỗi transform). *Deviation:* Surprise mode làm ở tầng cờ + che UI (không đổi tiêu đề buổi) thay vì "ẩn tiêu đề"; Marathon là 1 scenario multi-cảnh, không cần engine mới. Còn nợ: đi thử week 8 với AI thật để chỉnh độ khó Surprise/Marathon.

### Đợt 4 — Đo lường, giữ chân, hoàn thiện

- [x] 3 badge mới `COMM_BADGES` trong `badges.js` (Boss đầu tiên · Marathon · Mock interview) + điều kiện suy từ store trong `src/lib/commStats.js` (`commBadgeStats`: `bossesPassed` từ `quizScores` khóa `comm:boss:N`, `marathonDone` = `isDone('comm',8,4)`, `mockInterviewDone` = `quizPassed('comm','boss:7')`)
- [x] Mốc ghi âm khóa comm trong `milestones.js` (`COMM_MILESTONES` 1.1 / 4.7 / 8.7, `commMilestoneOf`); `CommDayView` gắn `VoiceRecorder` (recId `comm:W:D`) ở đúng 3 buổi mốc — *deviation: hiện ở trang Tổng kết khóa comm, KHÔNG dồn vào `MilestonesView` (view đó gắn chặt khóa IELTS)*
- [x] `CommSummaryView.vue` + route `/courses/comm/summary` (link từ footer bản đồ `CommCourseView`): bảng điểm 8 Boss (`commBossScores`) + vốn cụm SRS đã "nhớ" (`commSrsSummary`, reps ≥ 2, chủ đề "Giao tiếp thực chiến") + nghe lại 3 mốc ghi âm (tái dùng `recordingSync`) + huy hiệu khóa
- [x] Search index thêm nội dung comm (`searchIndex.js`: 56 bài học `comm-day` + tình huống roleplay thành term); test mở rộng `tests/searchIndex.test.js` + mới `tests/commStats.test.js` (badge/boss/SRS/milestones)

> **Đợt 4 XONG** (2026-07-10): 3 badge khóa + 3 mốc ghi âm + trang tổng kết cuối khóa + search index comm. Toàn bộ **453 test pass**; `npm run build` sạch (mọi view biên dịch được). Deviation: mốc ghi âm & huy hiệu khóa comm sống ở `CommSummaryView` riêng (không nhét vào `MilestonesView` vốn IELTS-scoped); "nhớ" định nghĩa = thẻ SRS `reps ≥ 2`. **→ Toàn bộ kế hoạch (Đợt 1–4) đã hoàn thành.**

---

## 8. Rủi ro & cách né

| Rủi ro | Cách né |
| --- | --- |
| A2 vào roleplay bị "đứng hình" | Hiệp 1 luôn bám đúng cụm vừa nạp; AI được lệnh nói chậm, câu ngắn, gợi ý khi học viên im > 10s; nút Hint sẵn có |
| Twist quá khó gây nản | Twist khai báo trong MD (kiểm soát biên tập được), CEFR mục tiêu ghi trong system prompt; Tuần 1–3 twist nhẹ (hết món, hỏi lại), Tuần 4+ mới đổi đề tài |
| AI chấm rubric thất thường | Rubric là 3–4 tiêu chí nhị phân đơn giản (làm được/không) thay vì thang điểm mịn; JSON schema validate ở client, lỗi parse → không lưu điểm, chỉ hiện nhận xét |
| Groq free tier quá tải (roleplay dài hơn chat thường) | Debrief chỉ gọi 1 lần/buổi; transcript gửi đi cắt còn ~20 lượt cuối; giữ cơ chế aiError + retry sẵn có |
| Nội dung 8 tuần × 7 tình huống là khối lượng viết lớn | Viết theo đợt, mỗi đợt đi thử thật rồi mới viết tiếp; format tình huống có khuôn cố định (Vai/Bối cảnh/Nhiệm vụ/Twist/Rubric) nên viết nhanh dần |
| Trùng dẫm với Nền Tảng Track A (Tuần 6–8 Work) | Chấp nhận giao nhau chủ đề nhưng khác phương pháp (Nền Tảng: học khung → viết; Thực Chiến: nhập vai nói); ghi rõ ở mô tả khóa để người học chọn đúng |
| View mới lệch trải nghiệm với IeltsDayView | CommDayView lắp đúng các component con đang dùng, chỉ khác thứ tự khối (roleplay là trung tâm); không viết component mới trừ khối Tình huống |

---

## 9. Định nghĩa "xong"

Khóa coi là hoàn thành khi một người học A2 đi hết 8 tuần trình ra được:
**8 Boss tuần đã vượt (rubric ≥ 70%) + 8 mission thật + 1 bản ghi mock interview 15' + bản ghi Final Boss nghe rõ tiến bộ so với mốc 0** —
tức là gặp tình huống thật ở quán ăn, trong cuộc gọi với bạn nước ngoài, trong phòng họp hay phòng phỏng vấn, phản xạ đầu tiên là **nói**, không phải dịch thầm trong đầu.
