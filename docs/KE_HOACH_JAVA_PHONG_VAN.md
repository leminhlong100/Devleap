# Kế hoạch — Nâng khóa "Java Phỏng Vấn Cấp Tốc" thành "đủ sức pass thật"

> Đánh giá công tâm của một người phỏng vấn Java, cộng kế hoạch vá đúng những lỗ
> hổng còn lại để học viên sau 2 tuần **thật sự qua được vòng phỏng vấn** — chứ
> không chỉ "đọc thuộc 184 câu".
>
> Bối cảnh: khóa hiện tại (khóa web thứ 4) đã có ngân hàng **184 câu / 22 chủ đề**,
> cheat-sheet, lộ trình 2 tuần (`CRASH_PLAN`), **19 coding challenge chạy thật** qua
> `run-java`, kỹ năng phỏng vấn cá nhân hóa (self-intro VI+EN, 5 STAR story, HR,
> đàm phán), và **AI Mock Interview** chấm theo rubric + follow-up ladder + báo cáo
> theo chủ đề. Dữ liệu thuần ở `src/data/javaInterview.js`; mock ở
> `src/composables/useMockInterview.js` + prompt `netlify/functions/_llm.js`
> (mode `interview` / `interviewReport`).
>
> Kế hoạch này **không viết lại khóa** — chỉ vá những lỗ hổng quyết định việc pass.
> Tài liệu ôn cô đọng đã có ở `docs/ON_JAVA_2_TUAN_PHONG_VAN.md` (không trùng file này).

---

## 0. Nhận định tổng quan (công tâm)

Về **triết lý**, khóa này làm đúng nhiều thứ:

- **Bám hồ sơ thật** (Java Backend/Full-stack ~2 năm, khách Nhật): stack Struts/iBatis/
  Batch/JasperReports/FTP có riêng topic, STAR story rút thẳng từ CV.
- **Active recall thay vì đọc lướt**: có cờ "cần ôn lại" để lọc, mock ép nói ra.
- **Mock interview có chiều sâu sư phạm**: chấm theo *band điểm* (không chấm cảm tính),
  có **follow-up ladder** (điểm < 60 thì đào sâu đúng chỗ yếu), báo cáo theo chủ đề.
- **Coding chạy thật** (không phải chấm bằng mắt) — hiếm app luyện phỏng vấn làm được.

Bộ khung này **tốt hơn hẳn** kiểu "đọc 100 câu hỏi đáp rồi hy vọng".

Nhưng phải nói thẳng: **học xong khóa hiện tại KHÔNG bảo chứng pass mọi vòng.** Với vị
trí **Java Backend junior→mid ở VN / công ty khách Nhật** (đúng hồ sơ), khóa đủ sức đưa
học viên qua **vòng vấn đáp + HR**. Rủi ro nằm ở **live-coding và system design** — đúng
hai chỗ khóa còn mỏng.

### Sẵn sàng theo từng vòng phỏng vấn

| Vòng | Mức sẵn sàng | Vì sao |
| --- | --- | --- |
| Lý thuyết / vấn đáp Java | 🟢 Cao (~85%) | 184 câu/22 chủ đề, đáp án chuẩn, cheat-sheet, mock chấm rubric + follow-up. Mạnh nhất. |
| HR / behavioral | 🟢 Cao | Self-intro VI+EN, 5 STAR story, câu hỏi ngược, đàm phán lương, do/don't. |
| Live coding (DSA) | 🟡 Trung bình (~55%) | 19 bài nhưng nặng easy/medium, chỉ 2 bài hard. Thiếu tree/đệ quy/backtracking/DP/sliding window/linked list. |
| System design | 🔴 Thấp (~35%) | Chỉ có topic `scenario` (15 câu). Không có walkthrough design bài bản. |
| DevOps / hạ tầng | 🔴 Thấp | Thiếu Docker/K8s/CI-CD/Redis/observability. |

> **Kết luận thẳng:** khóa hiện tại là **lò luyện vấn đáp + HR rất tốt**, nhưng chưa
> phải **lò luyện live-coding và design**. Ba thứ nâng tỉ lệ pass nhất — *coding đủ
> dạng, mock có code, và một chỉ số "đã sẵn sàng chưa"* — đang là ba chỗ yếu nhất.

---

## 1. Chẩn đoán — các lỗ hổng giữa "đọc thuộc" và "pass thật"

| # | Lỗ hổng | Vì sao ảnh hưởng tới việc pass | Mức độ |
| --- | --- | --- | --- |
| **1** | **Coding challenge thiếu dạng bài & chiều sâu.** 19 bài nhưng chỉ 2 hard (Merge Intervals, LRU). Không có linked list, tree/BST, đệ quy/backtracking, sliding window, two-pointer (dạng có tên), DP (ngoài Fibonacci vòng lặp), sorting. | Screen DSA là nơi rớt nhiều nhất. Học viên gặp "reverse linked list" hay "valid BST" sẽ đơ dù thuộc lý thuyết. | 🔴 Cao nhất |
| **2** | **Mock interview thuần vấn đáp — không có coding trong buổi.** `useMockInterview` chỉ hỏi–chấm bằng chữ. | Phỏng vấn thật trộn "code + vừa code vừa bị hỏi/giải thích". Học viên chưa được tập diễn cảnh đó → bối rối khi vào thật. | 🔴 Cao |
| **3** | **Không có mô phỏng áp lực thời gian.** Không đồng hồ, không chế độ "phone screen 30'". | Áp lực thời gian là biến số thật làm hỏng câu trả lời. Luyện không giờ giấc → ảo giác sẵn sàng. | 🟠 Trung bình–cao |
| **4** | **"Cần ôn lại" chỉ là cờ lọc local, chưa phải SRS.** `toggleReviewQuestion` chỉ thêm id vào set để lọc. Repo đã có SM-2 thật ở `src/lib/srs.js` (dùng cho flashcard tiếng Anh) nhưng khóa Java chưa tái dùng. | Không có lịch ôn giãn cách → câu yếu không nổi lại đúng lúc sắp quên. Ôn kém hiệu quả trong 2 tuần vàng. | 🟠 Trung bình |
| **5** | **Không có "Readiness meter" tổng hợp.** `saveInterviewResult` chỉ giữ `bestScore` + trung bình trượt theo topic + báo cáo gần nhất. | Học viên không trả lời được câu quan trọng nhất: *"tôi đã sẵn sàng đi phỏng vấn chưa?"*. Không biết còn hổng topic nào để dồn sức. | 🟠 Trung bình |
| **6** | **Một số topic quan trọng mỏng.** JVM (4), Generics (4), Testing (5), Design Patterns/`solid` (5), Microservice (5). | Đây là chỗ interviewer hay đào 1–2 câu; mỏng thì dễ hết câu để luyện, gặp câu lạ là hụt. | 🟡 Thấp–trung bình |
| **7** | **Thiếu chủ đề hạ tầng thực tế.** Không có Docker/K8s/CI-CD/Redis/gRPC/API versioning/logging/observability. | Screen hiện đại hay hỏi lướt "deploy thế nào / cache ở đâu / log/monitor ra sao". Trả lời trống là mất điểm "thực chiến". | 🟡 Thấp–trung bình |
| **8** | **Chỉ 1 bài "đọc code / tìm bug".** Mới có `debug` xóa phần tử khi đang lặp. | Nhiều công ty cho đọc đoạn code tìm lỗi thay vì code from scratch. Dạng này gần như chưa luyện. | 🟡 Thấp |

> **Tin tốt:** phần lớn cách vá **tái dùng linh kiện có sẵn** — `run-java`/`_codeRunner.js`
> cho coding trong mock, `src/lib/srs.js` cho SRS thật, `saveInterviewResult` +
> `topicScores` đã có sẵn để tính readiness. Chủ yếu là **thêm dữ liệu + lắp ráp**,
> rủi ro thấp.

---

## 2. Nguyên tắc sửa (kim chỉ nam)

1. **Tái dùng trước, xây sau.** Ưu tiên nối `_codeRunner.js`, `src/lib/srs.js`, `topicScores`
   có sẵn thay vì viết mới.
2. **Dữ liệu thuần, test được.** Mọi bổ sung vào `javaInterview.js` giữ dạng data thuần +
   helper thuần, thêm test ở `tests/javaInterview.test.js` (đúng chuẩn repo hiện tại).
3. **Đòn bẩy pass là ưu tiên.** Làm trước thứ nâng tỉ lệ đậu nhiều nhất (coding, mock có code),
   sau mới tới nội dung mở rộng.
4. **Không phá luồng đang chạy.** Thêm mode/tab mới cạnh cái cũ, không sửa vỡ mock hiện tại.
5. **Đo được sự sẵn sàng.** Kết thúc kế hoạch phải có 1 con số trả lời "sẵn sàng chưa".

---

## 3. Kế hoạch theo đợt

### 🔴 Đợt 1 — Vá coding challenge (đòn bẩy lớn nhất)

Mục tiêu: đủ **dạng bài** hay gặp ở live-coding, không chỉ "nhiều bài".

- **B1.1** Thêm ~12–15 `CODING_CHALLENGES` chạy thật, phủ các dạng còn thiếu:
  linked list (reverse, phát hiện chu trình), tree/BST (insert, duyệt in-order, valid BST),
  đệ quy/backtracking (subsets/permutations), sliding window (longest substring no-repeat),
  two-pointer (container with most water), DP cơ bản (climb stairs / coin change),
  sorting (quicksort hoặc mergesort). Mỗi bài đủ `starter` + `hints` như hiện tại.
- **B1.2** Thêm trường `pattern` cho mỗi challenge (vd `'two-pointer'`, `'dp'`, `'tree'`)
  và helper `challengesByPattern(pattern)` (thuần, test được) để lọc luyện theo dạng.
- **B1.3** Thêm 2–3 bài "đọc code / tìm bug" (mở rộng dạng `debug` sẵn có).
- **B1.4** Cập nhật `INTERVIEW_TOTALS.challenges` + test ở `tests/javaInterview.test.js`
  (đếm số bài, mỗi bài có `starter`/`prompt`, `challengesByPattern` lọc đúng).
- **B1.5** UI `JavaPrepView.vue`: thêm bộ lọc theo `pattern` ở tab coding.

### 🔴 Đợt 2 — Mock interview mạnh hơn

Mục tiêu: mock giống phỏng vấn thật (có code + có giờ).

- **B2.1** Mode "có coding" trong mock: chèn 1–2 bài code vào buổi; học viên gõ code,
  chấm bằng `_codeRunner.js`, rồi AI nhận output + code để nhận xét (rubric mới trong
  `_llm.js`, hoặc mode phụ `interviewCode`).
- **B2.2** Timed mode: cấu hình 30' / 45' / 60' + đồng hồ đếm ngược trong `useMockInterview`
  (thêm state `deadline`, tự `finish()` khi hết giờ).
- **B2.3** Preset buổi: "Phone screen nhanh" (5 câu, 20') và "Full loop" (nhiều chủ đề, có code).
- **B2.4** Test cho logic thời gian/chọn bài code (phần thuần, tách khỏi Vue).

### 🟠 Đợt 3 — SRS thật + Readiness dashboard

Mục tiêu: ôn đúng chỗ, và trả lời được "sẵn sàng chưa".

- **B3.1** Nối câu "cần ôn lại" vào SM-2 (`src/lib/srs.js`): mỗi câu thành 1 thẻ có lịch;
  thêm chế độ "Ôn theo lịch" bốc câu tới hạn. Đồng bộ Supabase (cột riêng, giống `srs`).
- **B3.2** **Readiness meter**: helper thuần tính 1 chỉ số 0–100 từ
  (a) `bestScore` mock, (b) tỉ lệ coding đã giải / theo pattern, (c) % câu đã "nắm" theo topic
  (từ `topicScores` + cờ review). Kèm gợi ý "dồn sức topic X" (topic điểm thấp nhất).
- **B3.3** Thẻ/mục "Độ sẵn sàng" trên trang khóa: hiển thị chỉ số + 2–3 việc nên làm tiếp.
- **B3.4** Test cho công thức readiness (đầu vào cố định → điểm cố định).

### 🟡 Đợt 4 — Mở rộng nội dung

Mục tiêu: bịt các topic mỏng và thêm chiều thực chiến.

- **B4.1** Thêm topic **System Design** (`design`): 6–8 walkthrough có khung trả lời
  (rate limiter, URL shortener, ước lượng dung lượng/QPS, cache/Redis, idempotency nâng cao,
  thiết kế API phân trang). Dạng "có gợi ý bước", không chỉ câu hỏi trống.
- **B4.2** Làm dày topic mỏng: +câu cho JVM, Generics, Testing, Patterns, Microservice
  (mục tiêu mỗi topic ≥ 7–8 câu).
- **B4.3** Thêm câu chủ đề hạ tầng: Docker/container, CI-CD cơ bản, Redis/cache,
  logging/observability, REST vs gRPC, API versioning (có thể gộp vào topic mới `infra`).
- **B4.4** Cập nhật `CHEATSHEET` + `CRASH_PLAN` (chèn buổi design/infra vào lộ trình 2 tuần).

---

## 4. Thứ tự ưu tiên & lý do

1. **Đợt 1 (coding)** — chỗ rớt nhiều nhất, đòn bẩy pass cao nhất, chi phí thấp (thêm data + test).
2. **Đợt 2 (mock có code + giờ)** — biến mock thành bản diễn tập sát thật.
3. **Đợt 3 (SRS + readiness)** — tối ưu hiệu quả 2 tuần ôn và trả lời "sẵn sàng chưa".
4. **Đợt 4 (nội dung)** — quan trọng nhưng là "làm dày", ít khẩn hơn 3 đợt trên.

> Có thể dừng sau Đợt 1–2 và đã tạo ra khác biệt lớn về tỉ lệ pass live-coding.

---

## 5. Bảng tiến độ

| Đợt | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Vá coding challenge (dạng bài + pattern + đọc-code-tìm-bug) | ☐ Chưa làm |
| 2 | Mock có coding + timed mode + preset buổi | ☐ Chưa làm |
| 3 | SRS thật cho câu hỏi + Readiness meter/dashboard | ☐ Chưa làm |
| 4 | System Design + làm dày topic mỏng + hạ tầng | ☐ Chưa làm |

---

## 6. File liên quan

- Dữ liệu khóa: `src/data/javaInterview.js` (QUESTION_BANK, CODING_CHALLENGES, CRASH_PLAN, INTERVIEW_SKILLS).
- Mock engine: `src/composables/useMockInterview.js`; client wrapper `src/lib/javaInterview.js`.
- Prompt AI: `netlify/functions/_llm.js` (mode `interview` / `interviewReport`).
- Chạy code: `netlify/functions/_codeRunner.js`, `src/lib/runJava.js`.
- Lưu tiến độ: `src/stores/user/localPrefsSlice.js` (`saveInterviewResult`, `toggleReviewQuestion`, `topicScores`).
- SRS tái dùng: `src/lib/srs.js`.
- View: `src/views/JavaPrepView.vue`, `src/views/MockInterviewView.vue`.
- Test: `tests/javaInterview.test.js`.
- Tài liệu ôn (không trùng): `docs/ON_JAVA_2_TUAN_PHONG_VAN.md`.
