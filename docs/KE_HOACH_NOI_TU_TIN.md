# Kế hoạch — Nâng khóa "Giao Tiếp Thực Chiến" thành khóa "Nói Tự Tin"

> Đánh giá công tâm của một giáo viên tiếng Anh, cộng kế hoạch cải tiến để khóa
> thật sự tạo ra **một người dám mở miệng và được người nghe hiểu** — chứ không chỉ
> "qua được 8 Boss" bằng chữ với AI.
>
> Bối cảnh: khóa hiện tại (`docs/KE_HOACH_GIAO_TIEP_THUC_CHIEN.md`) đã hoàn thành
> toàn bộ Đợt 1–4: 8 tuần / 56 buổi / 48 scenario, roleplay voice-first + debrief
> chấm rubric + mission + Boss + Surprise/Marathon + badge/mốc ghi âm/trang tổng kết.
> Kế hoạch này **không viết lại khóa** — chỉ vá đúng những lỗ hổng còn lại.

---

## 0. Nhận định tổng quan (công tâm)

Về **triết lý**, khóa này làm đúng những thứ mà 90% app tiếng Anh làm sai:

- **Tình huống trước, ngôn ngữ sau** (task-based) — đúng cách người lớn học nói.
- **Ép nói ngay** (voice-first, mic tự bật + đồng hồ 10s) — chống "dịch thầm trong đầu".
- **Vòng phản hồi khép kín**: debrief → sổ lỗi + cụm vào SRS. Học xong có "chiến lợi phẩm".
- **Có trận thật ngoài app** (mission) — thứ quyết định việc chuyển từ "biết" sang "dám".
- **Đo tiến bộ bằng tai mình** (ghi âm mốc 0 / giữa / cuối).

Đây là bộ khung **tốt hơn hẳn** một khóa "học từ vựng + ngữ pháp rồi hy vọng nói được".

Nhưng phải nói thẳng: **hoàn thành khóa hiện tại KHÔNG bảo chứng người học nói tự tin
ngoài đời.** Có một khoảng cách thật giữa *"qua Boss trên app"* và *"đứng trước người
nước ngoài mà không đơ"*. Khoảng cách đó nằm ở 5 lỗ hổng dưới đây.

---

## 1. Chẩn đoán — 5 lỗ hổng giữa "qua Boss" và "nói tự tin"

| # | Lỗ hổng | Vì sao chí mạng với sự tự tin | Mức độ |
| --- | --- | --- | --- |
| **1** | **Phát âm / độ dễ hiểu KHÔNG được dạy và KHÔNG được chấm** trong khóa comm | Người ta mất tự tin nói vì *bị nghe không hiểu*, không phải vì sai thì quá khứ. Cả khóa chấm **chữ do máy nhận diện giọng** (Web Speech API) — mà máy tự "sửa" phát âm sai thành chữ đúng. Học viên phát âm sai bét vẫn có thể "qua Boss". Không có bài âm cuối, trọng âm, ngữ điệu, cặp tối thiểu. | 🔴 Cao nhất |
| **2** | **Trôi chảy (fluency) không được luyện cũng không được đo đúng** | Tự tin = nói *kịp*, không khựng dài. Khóa chỉ đo "phút nói" và "không im > 10s" — không đo tốc độ (WPM), độ trễ phản hồi, số lần khựng. Không có kỹ thuật xây trôi chảy (4/3/2, shadowing sâu, drill cụm phản xạ). Học viên có thể *đúng mà chậm* → nghe vẫn thiếu tự tin. | 🔴 Cao |
| **3** | **Sửa lỗi TỪNG LƯỢT làm hỏng dòng chảy và tăng lo âu** | `buildRoleplayPrompt` trả `evaluation` (câu sửa + điểm CEFR + lời phê) sau **mỗi câu**. Bị soi 20 lần/buổi + persona mặc định là "Cợt nhả/Chửi bới" → với người A2 hay ngại, đây là công thức *dập tắt* sự tự tin. Tự tin xây bằng **giao tiếp thành công**, sửa để dành lúc debrief. Thiết kế đang tự mâu thuẫn: có debrief cuối buổi nhưng vẫn soi từng câu. | 🟠 Cao |
| **4** | **Nghe hiểu thực tế quá mỏng** | Chỉ nghe giọng TTS máy đọc, một kiểu giọng, đọc rời rạc. Không có giọng thật/đa vùng (Anh–Mỹ–Úc–Ấn), không nói nối âm/nuốt âm, không dictation, không nghe-lấy-ý. Ngoài đời "tạch" đầu tiên là *không nghe kịp* — mà app đã có sẵn `ListeningDictation.vue`/`ListeningComprehension.vue` nhưng **khóa comm không dùng**. | 🟠 Trung bình–cao |
| **5** | **Không tái chế, không thích ứng, độc thoại yếu, đánh giá dễ dãi** | (a) Tình huống không xoáy lại: cà phê Tuần 1 biến mất tới Tuần 8. (b) Không thích ứng: fail hoài "câu lịch sự" cũng không được phục vụ lại; qua tuần chỉ cần đạt quiz. (c) Chỉ luyện lượt ngắn 1–3 câu; độc thoại dài (kể chuyện, giới thiệu dự án 90s) chỉ có ở tuần phỏng vấn. (d) Rubric là 4 tiêu chí nhị phân do LLM tự chấm từ *transcript chữ* → đo "làm xong việc bằng chữ", không đo "nói tự tin". | 🟡 Trung bình |

> **Kết luận thẳng:** khóa hiện tại là **lò luyện phản xạ tình huống bằng chữ** rất tốt,
> nhưng chưa phải **lò luyện người nói được-hiểu và nói-trôi**. Ba thứ quyết định cảm
> giác "mình nói tiếng Anh tự tin" — *phát âm dễ hiểu, nói trôi, và nghe kịp* — đang là
> ba chỗ yếu nhất. Tin tốt: 60% cách vá đã **có linh kiện sẵn trong repo**.

---

## 2. Phát hiện quan trọng — nhiều thứ đã có, chỉ chưa lắp

Rà code cho thấy app **đã xây sẵn** (cho khóa Nền Tảng/IELTS) nhưng khóa comm chưa nối:

| Linh kiện có sẵn | Làm gì | Khóa comm dùng chưa? |
| --- | --- | --- |
| `components/day/PronunciationDrill.vue` | Chấm đọc-to từng cụm (STT match) **+ cặp tối thiểu** với cơ chế "nghe nhầm thành từ khác" rất tin cậy + fallback tự-đánh-giá cho Safari | ❌ Chưa |
| `data/minimalPairs.js` (`pairsForWeek`) | Cặp tối thiểu phân bổ theo tuần, ưu tiên cặp chứa từ đang học | ❌ Chưa |
| `components/day/ListeningDictation.vue` | Nghe → gõ lại (dictation), rèn tai bắt âm | ❌ Chưa |
| `components/day/ListeningComprehension.vue` | Nghe đoạn → trả lời câu hỏi (nghe-lấy-ý) | ❌ Chưa |
| `components/day/VoiceRecorder.vue` | Ghi âm + nghe lại (đang dùng cho 3 mốc) | ⚠️ Chỉ 3 buổi |
| `lib/listen.js` / `speechRecognize.js` | STT một-lượt, có `interimResults` → tính được thời gian nói | ⚠️ Chỉ để nhập liệu |
| `_llm.js` mode `debrief` + rubric | Chấm cuối buổi theo tiêu chí | ✅ Có, nhưng rubric hẹp |

→ Phần lớn Đợt 1 & Đợt 3 bên dưới là **lắp linh kiện có sẵn vào `CommDayView.vue`**,
chi phí thấp, rủi ro thấp.

---

## 3. Nguyên tắc sửa (5 kim chỉ nam)

1. **Tái dùng trước, xây sau.** Ưu tiên nối `PronunciationDrill`, `ListeningDictation`,
   `ListeningComprehension`, `VoiceRecorder` vào khóa comm trước khi viết component mới.
2. **Giao tiếp trước, sửa sau ("communicate now, correct later").** Trong lúc nhập vai,
   AI **ngưng soi từng câu** (hoặc chỉ soi rất nhẹ, tùy chọn) để giữ dòng chảy; dồn
   toàn bộ việc chấm–sửa vào **debrief cuối buổi**. Đây là chuẩn dạy nói hiện đại.
3. **Dễ hiểu quan trọng hơn đúng ngữ pháp.** Ưu tiên số 1 là *được người nghe hiểu*:
   âm cuối, trọng âm từ, trọng âm câu, ngữ điệu câu hỏi. Ngữ pháp mịn tính sau.
4. **Đo trôi chảy, không chỉ đo "phút nói".** Thêm WPM, độ trễ phản hồi, đưa các số
   *khách quan* (điểm đọc-to, WPM, số lần "nghe nhầm") **vào context của debrief** để
   LLM chấm dựa trên dữ liệu thật thay vì đoán.
5. **Ấm áp là mặc định của khóa này.** Đặt persona mặc định khóa comm = **Gấu bông**;
   "Cợt nhả/Chửi bới" thành tùy chọn. Tôn vinh *giao tiếp thành công* trước, sửa sau.

---

## 4. Mục tiêu & thước đo MỚI (bổ sung, không thay cái cũ)

| Mục tiêu mới | Thước đo | Đo bằng |
| --- | --- | --- |
| **Nói dễ hiểu** | ≥ 80% cụm đọc-to được máy nhận đúng; ≥ 70% cặp tối thiểu phân biệt đúng cuối khóa | `PronunciationDrill` (đã có sẵn logic) |
| **Nói trôi** | WPM tăng ≥ 30% so với mốc 0; độ trễ trung bình trước khi bật tiếng < 4s cuối khóa | Đo từ `listen.js` (thời điểm bật mic → có final text) |
| **Nghe kịp** | Dictation ≥ 70% từ đúng; nghe-lấy-ý ≥ 70% ở tuần khó nhất | `ListeningDictation` / `ListeningComprehension` |
| **Nói dài mạch lạc** | 1 độc thoại 60–90s ở mỗi khối dùng ≥ 3 từ nối (First… then… because…) | Rubric debrief mở rộng |
| **Tự tin chủ quan** | Thang tự đánh giá 1–5 "mình dám nói" tăng ≥ 2 bậc từ mốc 0 → cuối | 1 câu hỏi ở trang Tổng kết |

Giữ nguyên các thước đo cũ (8 Boss ≥ 70%, 8 mission, mock interview, 300 cụm SRS).

---

## 5. Đề cương cải tiến theo 5 trục

### Trục A — Phát âm & độ dễ hiểu *(vá lỗ hổng #1)*

- **Lắp `PronunciationDrill` vào mỗi buổi** ngay sau khối "Nạp cụm", trước khi nhập vai:
  đọc-to 6–8 cụm sống còn của buổi + cặp tối thiểu theo tuần (`pairsForWeek`).
- **Bộ cặp tối thiểu riêng cho giao tiếp** trong `minimalPairs.js`: ưu tiên lỗi người
  Việt hay mắc và *ảnh hưởng nghĩa khi giao tiếp* — âm cuối `-s/-ed`, `/θ/–/t/`
  (three–tree), `/ʃ/–/s/` (she–see), `/l/–/n/`, `/b/–/p/`, nguyên âm dài–ngắn (ship–sheep).
- **3 micro-lesson phát âm theo khối** (không phải mỗi buổi — kẻo nặng), gắn vào MD:
  - Khối 1: âm cuối + trọng âm từ (COFfee vs cofFEE).
  - Khối 2–3: trọng âm câu + nhịp (nhấn từ mang nghĩa, nuốt từ chức năng).
  - Khối 4: ngữ điệu — câu hỏi Yes/No lên giọng, WH xuống; ngữ điệu tự tin khi phỏng vấn.
- **Đưa điểm phát âm vào debrief**: truyền `pronScore` (% đọc-to đúng) + số lần "nghe
  nhầm" vào `context` của `buildDebriefPrompt`, thêm 1 dòng nhận xét "độ dễ hiểu".

### Trục B — Trôi chảy & tự động hóa *(vá lỗ hổng #2)*

- **Dạy "cụm câu giờ" (time-buying phrases) ngay Tuần 1** và nhắc lại xuyên khóa:
  *"Well, let me think…", "That's a good question.", "How do I put this…"* — đây là kỹ
  năng người nói tự tin dùng để KHÔNG im lặng mà vẫn tự nhiên. Thêm 1 nhóm cụm sống còn.
- **Kỹ thuật 4/3/2** (component nhỏ mới `FluencyRetell.vue`, tái dùng `VoiceRecorder` +
  đồng hồ): kể cùng một nội dung 3 lần, thời gian giảm dần 60→45→30s → ép trôi chảy hóa.
  Gắn 1 lần/tuần (thay khối quiz nhanh ở buổi giữa tuần).
- **Đo & hiển thị WPM và độ trễ** từ `listen.js` (đã có mốc thời gian mic). Hiện nhẹ
  trong debrief: "Bạn nói ~85 từ/phút, nhanh hơn buổi trước 💪".
- **Đồng hồ 10s thành thang trượt**: Tuần 1–2 = 15s, Tuần 3–5 = 12s, Tuần 6–8 = 8s;
  cho phép tắt hẳn. Người mới không bị đồng hồ dồn thành đơ (đúng thứ nó định chống).

### Trục C — Nghe hiểu thực tế *(vá lỗ hổng #4)*

- **Lắp `ListeningDictation`** (1–2 câu chốt của hội thoại mẫu) vào khối nạp cụm.
- **Lắp `ListeningComprehension`** ở buổi Boss: nghe đoạn hội thoại dài hơn → 2–3 câu hỏi.
- **Đa dạng giọng đọc**: `speak.js` chọn ngẫu nhiên giọng khả dụng (Anh/Mỹ/Úc) theo buổi
  + nút chỉnh tốc độ (0.8x/1.0x) để tập nghe nhanh dần.
- **Nút "🐢 Nói chậm lại" ngay trong roleplay**: người học được chủ động xin AI nói chậm/
  nhắc lại — vừa luyện đúng chiến lược cứu nguy, vừa giảm hoảng khi nghe không kịp.

### Trục D — Phản hồi & tâm lý tự tin *(vá lỗ hổng #3)*

- **Chế độ "chỉ giao tiếp" khi nhập vai**: thêm `context.deferCorrection` → `buildRoleplayPrompt`
  trả `evaluation: null` (không soi), AI chỉ đóng vai + đối thoại. Toàn bộ chấm dồn vào
  debrief. Mặc định BẬT cho khóa comm; ai muốn soi từng câu thì tắt.
- **Persona mặc định khóa comm = Gấu bông** (ấm áp). Roast là tùy chọn có cảnh báo.
- **Tín hiệu "được hiểu"**: sau mỗi lượt hiện chip nhẹ 🟢 "Người nghe hiểu bạn" khi câu
  đạt — khen *giao tiếp thành công* thay vì chỉ chỉ lỗi. (Suy từ việc AI phản hồi đúng ý.)
- **Debrief đóng khung tự tin**: 1 điều làm tốt → 1 điều sửa (không dội 3 lỗi cùng lúc
  lên người ngại); thêm 2 câu "mẹo vượt lo âu khi nói" theo tình huống.
- **1 câu tự đánh giá "mình dám nói" (1–5)** đầu khóa & cuối khóa → hiện tiến bộ ở Tổng kết.

### Trục E — Tái chế, thích ứng, độc thoại, đánh giá đúng *(vá lỗ hổng #5)*

- **Xoáy lại (spiral)**: Boss mỗi khối kéo lại 1 cảnh của khối trước (Boss Tuần 4 có 1
  cảnh đời sống; Boss Tuần 6 có 1 cảnh kết bạn…). Đưa "cảnh ôn" vào brief scenario.
- **Phục vụ lại chỗ yếu (thích ứng nhẹ)**: nếu 1 buổi có rubric < 70% hoặc sổ lỗi lặp 1
  dạng lỗi, chèn "🔁 Cảnh phục thù" ở buổi mission — roleplay lại đúng cảnh từng tạch.
- **Độc thoại dài mỗi khối**: 1 buổi/khối có nhiệm vụ nói 60–90s liền mạch (kể một ngày,
  kể kỷ niệm, giới thiệu dự án, tự giới thiệu) + dạy từ nối. Chấm bằng rubric mạch lạc.
- **Rubric giàu hơn** (chuẩn CEFR nói): thêm 2 chiều **Trôi chảy** và **Độ dễ hiểu** cạnh
  "làm xong việc" — và *đưa số khách quan* (WPM, điểm phát âm) vào context để LLM bớt đoán.

---

## 6. Kiến trúc — tái dùng gì / thêm gì

| Hạng mục | Tái dùng | Thêm mới |
| --- | --- | --- |
| Phát âm | `PronunciationDrill.vue`, `minimalPairs.js` (`pairsForWeek`) **nguyên vẹn** | Lắp vào `CommDayView`; bổ sung cặp tối thiểu "giao tiếp" + tham số chọn theo buổi |
| Nghe | `ListeningDictation.vue`, `ListeningComprehension.vue` | Lắp vào `CommDayView`; MD comm thêm mục "🎧 Nghe" (câu/đoạn + câu hỏi) |
| Trôi chảy | `VoiceRecorder.vue`, `listen.js` (mốc thời gian) | `FluencyRetell.vue` (4/3/2); hàm đo WPM/độ trễ trong `useChatEngine` |
| Bỏ soi từng lượt | `buildRoleplayPrompt` | Cờ `deferCorrection` → `evaluation: null`; toggle trong `AiChat` |
| Chấm giàu hơn | `buildDebriefPrompt` + mode `debrief` | Nhận `pronScore`, `wpm`, `confusions`; rubric +2 chiều (trôi chảy, dễ hiểu) |
| Giọng & tốc độ | `speak.js` | Chọn giọng đa vùng theo buổi + nút tốc độ 0.8x/1.0x |
| Tâm lý | persona sẵn có | Mặc định `gaubong` cho comm; chip "được hiểu"; câu tự đánh giá 1–5 |
| Nội dung | 8 file `Comm_English/*.md` | Thêm mục 🎧 Nghe + 🗣️ Phát âm-khối + 🎤 Độc thoại + cụm "câu giờ" + cảnh xoáy lại |
| Đo mốc | `VoiceRecorder` + trang Tổng kết | WPM/độ trễ/điểm phát âm & thang tự tin vào `CommSummaryView` |
| Tests | Vitest suite | Test `pairsForWeek` cho comm, đo WPM, `deferCorrection` (evaluation null), rubric mở rộng |

Không phá hạ tầng: `CommDayView` chỉ thêm khối; MD giữ tương thích `parseCommWeek`
(thêm section mới, parser cũ bỏ qua nếu vắng); Groq vẫn text-only nên **không cố chấm
phát âm bằng LLM** — dùng đối chiếu STT (đã chứng minh trong `PronunciationDrill`).

---

## 7. Backlog triển khai (5 đợt, ưu tiên theo tác động lên "nói tự tin")

### Đợt 1 — Phát âm & độ dễ hiểu *(tác động cao nhất, chi phí thấp nhờ tái dùng)*

- [ ] Lắp `PronunciationDrill` vào `CommDayView` (sau khối nạp cụm): items = cụm sống còn
      của buổi; truyền `week` + `vocabTerms` để bật cặp tối thiểu.
- [ ] Bổ sung cặp tối thiểu "giao tiếp" vào `minimalPairs.js` (âm cuối, th/t, sh/s, l/n,
      b/p, dài–ngắn) + bảo đảm `pairsForWeek` phủ Tuần 1–8 khóa comm.
- [ ] Viết 3 micro-lesson phát âm theo khối (mục "## 🗣️ Phát âm trọng tâm" trong MD
      khối 1/2-3/4) — parser thêm `parsePronunciation()` (an toàn khi vắng).
- [ ] Đưa `pronScore` + `confusions` vào `context` debrief; thêm dòng nhận xét "độ dễ hiểu".
- [ ] Test: `pairsForWeek` cho tuần comm; parser mục phát âm.

### Đợt 2 — Trôi chảy & tự động hóa

- [ ] Thêm nhóm cụm "câu giờ / giữ nhịp" vào Tuần 1 MD + nhắc lại ở review vocab các tuần.
- [ ] `FluencyRetell.vue` (4/3/2, tái dùng `VoiceRecorder` + đồng hồ) + gắn 1 buổi/tuần.
- [ ] Đo WPM & độ trễ trong `useChatEngine` (từ mốc mic của `listen.js`); hiện nhẹ ở debrief.
- [ ] Đồng hồ trả lời thành thang trượt theo tuần (15→12→8s) + cho tắt.
- [ ] Test: hàm tính WPM; thang đồng hồ theo tuần.

### Đợt 3 — Nghe hiểu thực tế *(tái dùng linh kiện có sẵn)*

- [ ] Lắp `ListeningDictation` (1–2 câu chốt) vào khối nạp cụm; MD thêm mục "## 🎧 Nghe".
- [ ] Lắp `ListeningComprehension` ở buổi Boss (đoạn + 2–3 câu hỏi).
- [ ] `speak.js`: chọn giọng đa vùng theo buổi + nút tốc độ 0.8x/1.0x.
- [ ] Nút "🐢 Nói chậm lại / nhắc lại" trong `AiChat` khi đang roleplay.
- [ ] Test: parser mục 🎧 Nghe; chọn giọng ổn định (không random vỡ test).

### Đợt 4 — Phản hồi & tâm lý tự tin

- [ ] Cờ `deferCorrection` trong `buildRoleplayPrompt` (evaluation null) + toggle "Chỉ trò
      chuyện / Vừa trò chuyện vừa soi" trong `AiChat`; mặc định BẬT cho khóa comm.
- [ ] Persona mặc định khóa comm = `gaubong`; chip nhẹ 🟢 "được hiểu"; debrief đóng khung
      1-tốt-1-sửa + mẹo vượt lo âu.
- [ ] Câu tự đánh giá "mình dám nói" (1–5) đầu & cuối khóa; hiện tiến bộ ở `CommSummaryView`.
- [ ] Test: `deferCorrection` cho evaluation null; persona mặc định theo khóa.

### Đợt 5 — Tái chế, thích ứng, độc thoại, đánh giá đúng

- [ ] Boss mỗi khối kéo lại 1 cảnh khối trước (thêm "cảnh ôn" vào brief scenario).
- [ ] "🔁 Cảnh phục thù" ở buổi mission khi tuần có rubric < 70% / lỗi lặp (suy từ store).
- [ ] 1 buổi độc thoại 60–90s/khối + dạy từ nối; rubric mạch lạc.
- [ ] Rubric debrief +2 chiều (trôi chảy, dễ hiểu) có số khách quan; cập nhật `commStats`
      + `CommSummaryView` (WPM, điểm phát âm, thang tự tin).
- [ ] Test: rubric mở rộng; điều kiện "cảnh phục thù"; thống kê Tổng kết mới.

> **Thứ tự cố ý:** Đợt 1–2 (phát âm + trôi chảy) đánh trúng thứ quyết định cảm giác tự
> tin và tận dụng tối đa linh kiện có sẵn → làm trước. Đợt 3–4 mở rộng tai và hạ lo âu.
> Đợt 5 nâng chất lượng đánh giá. Mỗi đợt tự chạy được, đi thử với AI thật rồi mới sang đợt sau.

---

## 8. Rủi ro & cách né

| Rủi ro | Cách né |
| --- | --- |
| Buổi 60' bị nhồi quá nhiều khối (phát âm + nghe + roleplay + độc thoại) | Không phải khối nào cũng mỗi buổi: phát âm-khối 3 lần/khóa; dictation ngắn 1–2 câu; 4/3/2 & độc thoại 1 buổi/tuần. Roleplay vẫn là trục. |
| STT sai/thiếu (Safari/iOS không có SpeechRecognition) | `PronunciationDrill` đã có fallback tự-đánh-giá; WPM chỉ hiện khi đo được, không chặn tiến độ. |
| LLM không nghe được âm thật → chấm phát âm ảo | KHÔNG chấm phát âm bằng LLM. Điểm phát âm đến từ đối chiếu STT (client), chỉ *đưa số* cho LLM tham khảo khi viết nhận xét. |
| Bỏ soi từng lượt làm người học tưởng mình nói đúng hết | Debrief cuối buổi soi kỹ; chip "được hiểu" chỉ khen giao tiếp, không khẳng định ngữ pháp đúng. |
| Đổi persona mặc định làm mất chất "lầy" đang là điểm nhận diện | Chỉ đổi *mặc định của khóa comm*; 4 persona vẫn còn, chọn 1 chạm. |
| Groq quota (thêm lượt gọi) | Phát âm/nghe/4-3-2 chạy client, không gọi LLM. deferCorrection còn *giảm* tải (bỏ evaluation mỗi lượt). |

---

## 9. Định nghĩa "xong" mới (khắt khe hơn, đúng mục tiêu "nói tự tin")

Khóa đạt mục tiêu khi một người A2 sau 8 tuần trình ra được — **cạnh mốc 0 để thấy tiến bộ**:

- ✅ 8 Boss ≥ 70% **+ điểm độ-dễ-hiểu và trôi-chảy đều tăng** (không chỉ "làm xong việc").
- ✅ Phát âm: ≥ 80% cụm đọc-to máy nhận đúng; ≥ 70% cặp tối thiểu phân biệt đúng.
- ✅ Trôi chảy: WPM cuối khóa tăng ≥ 30% so mốc 0; độ trễ trung bình < 4s.
- ✅ Nghe: dictation & nghe-lấy-ý ≥ 70% ở tuần khó nhất.
- ✅ 1 độc thoại 60–90s/khối mạch lạc + 8 mission thật + mock interview 15'.
- ✅ Thang tự đánh giá "mình dám nói" tăng ≥ 2 bậc.

Tức là: gặp người nước ngoài, phản xạ đầu tiên là **nói** — và **người ta hiểu ngay,
không phải hỏi lại "sorry?".** Đó mới là *nói tự tin*.
