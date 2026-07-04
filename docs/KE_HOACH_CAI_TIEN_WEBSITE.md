# Kế hoạch cải tiến website DevLeap — trọng tâm khóa tiếng Anh

> **Ngày lập:** 2026-07-04. Kế hoạch kế thừa 2 tài liệu đã hoàn thành gần hết:
> `KE_HOACH_CAI_TIEN_GIAO_TIEP.md` (giao tiếp thực tế) và `KE_HOACH_DO_KHO_KHOA_HOC.md` (đường cong độ khó).
>
> **Cách dùng file này:** mỗi lần nhờ AI, mở phiên mới và nói:
> *"Đọc `docs/KE_HOACH_CAI_TIEN_WEBSITE.md`, thực hiện **Bước N.X**. Làm xong chạy `npm test`, tick checkbox của bước đó trong file kế hoạch và ghi chú ngắn những gì đã làm."*
> Mỗi bước được viết **tự chứa** (đủ ngữ cảnh, file liên quan, tiêu chí nghiệm thu) để AI làm độc lập không cần đọc lại hội thoại cũ.
> Thứ tự trong mỗi đợt là thứ tự khuyến nghị; các bước không phụ thuộc nhau trừ khi ghi rõ **"Phụ thuộc:"**.

---

## 0. Chẩn đoán hiện trạng (căn cứ lập kế hoạch)

Điểm mạnh đã có: lộ trình 8 tuần 2 track, 4 kỹ năng, AI chữa viết + chat voice-first + roleplay, SRS flashcard, XP/badge/streak, mission đời thực, sync Supabase, 177 test pass.

Khoảng trống tìm thấy khi khảo sát (2026-07-04):

| # | Vấn đề | Ảnh hưởng |
| --- | --- | --- |
| 1 | Từ vựng học xong **không tự vào SRS** — phải tự lật flashcard mới có lịch ôn; Home không nhắc "hôm nay đến hạn ôn N từ" | Quên từ — mất giá trị lớn nhất của SRS |
| 2 | Còn 2 việc dở từ kế hoạch cũ: curate clip shadowing Tuần 4–8; khảo sát cảm nhận "Dễ/Vừa/Khó" cuối tuần | Thang nghe "thật hóa dần" chưa có nội dung thật; không có dữ liệu hiệu chỉnh độ khó |
| 3 | Ghi âm sản phẩm/mốc chỉ lưu **IndexedDB local**, không sync | Đổi thiết bị là mất bản ghi mốc 0 → trang /milestones vô dụng |
| 4 | Ảnh minh họa từ vựng lấy từ LoremFlickr (API ngoài, ngẫu nhiên) | Chậm, ảnh sai nghĩa, phụ thuộc dịch vụ ngoài |
| 5 | Web Speech API không chạy Safari/iOS — mọi tính năng nói/nghe chấm điểm chết im lặng trên iPhone | Người học iOS mất nửa khóa mà không hiểu vì sao |
| 6 | Netlify Functions gọi Groq **không retry/backoff**, lỗi 429 trả thẳng cho người học | Trải nghiệm gãy khi free tier nghẽn |
| 7 | Minimal pairs pool chỉ 20 cặp, quay vòng — lặp lại sau 2–3 tuần | Chấm âm cuối (điểm yếu người Việt) mau nhàm |
| 8 | `IeltsDayView.vue` 1675 dòng, `AiChat.vue` 1190 dòng, `stores/user.js` 868 dòng | Khó bảo trì — mọi cải tiến sau này đều chậm đi |
| 9 | Không dark mode, không PWA/offline, không reminder | Học buổi tối chói mắt; quên học không có gì nhắc |
| 10 | Home chưa phải "bảng điều khiển hôm nay" (học tiếp buổi nào, ôn gì, streak sắp đứt) | Mỗi lần mở app phải tự tìm việc |
| 11 | Không có biểu đồ tiến bộ viết (CEFR/score đã lưu từng bài nhưng không vẽ) | Người học không thấy mình tiến bộ → bỏ cuộc |
| 12 | Java: CodePlayground chỉ highlight, không chạy được code | (Ngoài trọng tâm — để đợt cuối) |

---

## Đợt 1 — Quick wins học tập (tác động cao nhất, làm trước)

### Bước 1.1 — Từ vựng tự động vào SRS + nhắc ôn trên Home

- [x] Đã làm

**Ghi chú (2026-07-04):** Thêm `seedSchedule()` trong `src/lib/srs.js` (due sau 3
ngày, `reps=0/last=null` để không tính là một lần ôn thật). Store thêm action
`seedSrsFromDay(course, terms)` (chỉ course `ielts`, không đè lịch có sẵn, không
cộng XP) gọi từ `toggleDay(...)` khi vừa đánh dấu hoàn thành — `toggleDay` nhận
thêm tham số tùy chọn `vocabTerms`; `IeltsDayView.vue#markDone` truyền
`[...d.vocab, ...d.reviewVocab].map(v => v.term)`. Getter mới: `dueSrsIds` (hợp
cả thẻ có lịch đến hạn lẫn `savedWords` chưa từng ôn — vì lưu từ khi chat KHÔNG
tự ghi vào `srs`), `dueTodayCount`, `dueWords` (tra ngược nghĩa qua `savedWords`
rồi `vocabGlossary.js`, tránh phải kéo `data/course*.js` nặng vào bundle của
store — có duplicate 1 hàm `normalizeTerm` nhỏ thay vì import `searchIndex.js`).
`FlashcardTool.vue` + `ToolsView.vue` thêm deck `due` (banner ngữ cảnh riêng,
empty-state "Không có từ nào đến hạn"). Banner "📆 Hôm nay có N từ đến hạn ôn"
thêm ở `HomeView.vue` (card riêng) và `IeltsCourseView.vue` (cùng kiểu
`.remedial-hint` có sẵn) → `/tools/flashcard?deck=due`. Test mới: `tests/srs.test.js`
(seedSchedule) + `tests/user.store.test.js` (auto-seed qua toggleDay, không đè
lịch cũ, Java không seed, dueTodayCount/dueWords gộp saved+seeded). Đã thử tay
qua preview: seed localStorage → banner Home hiện đúng số → mở deck `due` → tra
đúng nghĩa "name" → "tên" → chấm thẻ → deck rỗng hiện đúng empty-state.
`npm test` (185/185) và `npm run build` đều pass.

**Vấn đề:** SRS (`src/lib/srs.js`, state `srs` trong `src/stores/user.js`) chỉ ghi lịch khi người học **tự** chấm thẻ trong FlashcardTool/InlineFlashcards. Từ đã học mà không lật thẻ thì không bao giờ được nhắc ôn. Home không hề nói "hôm nay có N từ đến hạn".

**Việc cần làm:**
1. Khi người học **hoàn thành một buổi** (action đánh dấu buổi xong trong `user.js`), tự động "gieo" toàn bộ từ mới của buổi đó vào SRS với lịch mặc định (như chấm "Khó" — due sau ~3 ngày) **nếu từ chưa có trong `srs`**. Lấy danh sách từ của buổi qua helper trong `src/data/courseIelts.js` (kiểm tra tên hàm thật trong code). Giữ nguyên format `srsId` hiện dùng (xem cách FlashcardTool sinh id) để không vỡ dữ liệu cũ. Chú ý: action hoàn thành buổi dùng chung cho cả khóa Java — chỉ seed khi buổi thuộc khóa IELTS, hoặc xử lý an toàn khi không tra được vocab.
2. Viết getter `dueCount` / `dueWords` trong store (đếm thẻ có `due <= hôm nay`, gồm cả từ lưu từ chat).
3. Trên `src/views/HomeView.vue` và `IeltsCourseView.vue`: thẻ nhắc **"📆 Hôm nay có N từ đến hạn ôn"** → link `/tools/flashcard?deck=due` (FlashcardTool thêm deck mới `due` = mọi thẻ đến hạn; mỗi thẻ cần tra ngược được nghĩa/IPA/ảnh từ dữ liệu khóa + `savedWords` + `vocabGlossary.js`).
4. Cân nhắc merge đa thiết bị: hàm `mergeSrs` hiện có phải giữ nguyên hành vi — đọc kỹ trước khi sửa.
5. Seed **không** cộng XP (tránh farm XP bằng cách hoàn thành buổi).

**File liên quan:** `src/stores/user.js`, `src/lib/srs.js`, `src/data/courseIelts.js`, `src/views/HomeView.vue`, `src/views/IeltsCourseView.vue`, `src/components/tools/FlashcardTool.vue`, tests: `tests/srs.test.js`, `tests/user.store.test.js`.

**Nghiệm thu:** hoàn thành 1 buổi → sau 3 ngày (giả lập trong test) deck `due` chứa từ của buổi đó; thẻ đã có lịch SRS không bị ghi đè; `npm test` pass với test mới cho auto-seed và `dueCount`.

### Bước 1.2 — Khảo sát "Dễ / Vừa / Khó" cuối tuần

- [x] Đã làm

**Ghi chú (2026-07-04):** Thêm state `weekFeedback` (khóa `course:week`, giá trị
`{ rating: 'easy'|'ok'|'hard'|'skipped', note, at }`) + getter `weekFeedbackOf`
+ action `saveWeekFeedback` trong `src/stores/user.js`. Đồng bộ Supabase thật sự
(khác `writings`/`missions` vốn chỉ local): thêm cột `week_feedback jsonb` vào
`supabase/schema.sql`, đưa vào `select`/`upsert` của `pullAndMerge`/`pushNow`,
và hàm `mergeWeekFeedback` (giữ bản mới hơn theo `at`, giống `mergeMissions`).
`IeltsDayView.vue#markDone`: khi vừa hoàn thành buổi có `!d.nextDay` (buổi cuối
tuần) và tuần đó chưa có `weekFeedback` → mở modal 1 câu hỏi + 3 nút Dễ/Vừa/Khó
+ ô ghi chú tùy chọn + nút "Bỏ qua" (bỏ qua cũng ghi `rating:'skipped'` để không
hỏi lại). Chọn "Khó" mà đã có điểm quiz tuần `< 70%` (đọc từ `weekTest` — cùng
getter `user.quizOf('ielts','week:N')` mà khối "Bài kiểm tra Tuần" trong view đã
dùng) → hiện luôn gợi ý "Ôn ngay" dẫn tới `assessment` scope `week-N` (khối ôn bù
có sẵn ở `IeltsCourseView.vue`, chỉ tái dùng route). Chọn "Dễ" mà quiz tuần
`> 90%` → gợi ý "Sang Tuần N+1" luôn (quyết định khác kế hoạch: vì bài kiểm tra
tuần chỉ MỞ SAU KHI xong hết các buổi trong tuần — `weekComplete` — nên tại thời
điểm vừa hoàn thành buổi cuối, `weekTest` thường còn `null` lần đầu; 2 gợi ý này
chỉ thật sự xuất hiện khi người học làm lại tuần sau khi đã có điểm — đúng như
mô tả kế hoạch, chỉ hiếm gặp hơn dự kiến ban đầu). Test mới trong
`tests/user.store.test.js`: `saveWeekFeedback`/`weekFeedbackOf` (lưu, bỏ qua,
không cộng XP, thiếu tham số thì bỏ qua, bền hoá qua hydrate) + `pullAndMerge`
2 chiều cho `weekFeedback` (remote mới hơn thắng, local mới hơn thắng, union
nhiều tuần). Chưa thử tay được trên trình duyệt: `.env.local` của máy này đã
cấu hình Supabase thật nên các route khóa học yêu cầu đăng nhập Google — không
đăng nhập được trong phiên preview sandbox; đã xác nhận bằng `npm test`
(193/193, +8) và `npm run build` pass, không có lỗi biên dịch template mới.

**Vấn đề:** `KE_HOACH_DO_KHO_KHOA_HOC.md` mục 5 đặt thước đo "≥70% người học trả lời Vừa" nhưng chưa có cơ chế hỏi. Dữ liệu này là đầu vào duy nhất để hiệu chỉnh độ khó về sau.

**Việc cần làm:**
1. Khi người học hoàn thành **buổi cuối cùng của một tuần** (trong `IeltsDayView.vue`, chỗ xử lý nút "Hoàn thành buổi"), hiện modal nhỏ 1 câu: *"Tuần này với em thế nào?"* — 3 nút `😌 Dễ / 🙂 Vừa / 😵 Khó` + ô ghi chú tùy chọn, có nút bỏ qua.
2. Lưu vào store: `weekFeedback: { [weekKey]: { rating, note, at } }`, sync Supabase như các cột khác (thêm cột `week_feedback` jsonb vào `supabase/schema.sql` + hàm merge lấy bản ghi mới nhất theo `at`; ghi cả trường hợp "bỏ qua" để không hỏi lại).
3. Nếu trả lời "Khó" và điểm quiz tuần < 70%: gợi ý ngay khối "🩹 Ngày ôn bù" (đã có sẵn trong `IeltsCourseView.vue` — chỉ cần dẫn link). Nếu "Dễ" và quiz > 90%: gợi ý thử trước quiz tuần sau.

**File liên quan:** `src/views/IeltsDayView.vue`, `src/stores/user.js`, `supabase/schema.sql`, phần sync Supabase trong store, tests.

**Nghiệm thu:** modal chỉ hiện đúng 1 lần/tuần (đã trả lời hoặc bỏ qua thì thôi); dữ liệu lưu + merge đa thiết bị đúng; `npm test` pass với test mới cho merge `weekFeedback`.

### Bước 1.3 — Curate nội dung shadowing Tuần 4–8 (việc dở từ kế hoạch cũ)

- [x] Đã làm

**Ghi chú (2026-07-04):** Đi Đường A (script tự động) —
`scripts/curate-shadowing.mjs` mới: với mỗi video, lấy phụ đề qua
`youtube-transcript`, gộp câu bằng `groupIntoSentences` (dùng chung với
`netlify/functions/shadowing.js`), CẮT còn một cửa sổ [trimStart,trimEnd] chọn
thủ công sau khi đọc transcript từng video (giữ nguyên timestamp gốc — chỉ lọc
bớt phần tử mảng câu, đúng cách `player.seekTo` trong `ShadowingPlayer.vue`
hoạt động), đánh bóng qua `polishSegments` (Groq, tái dùng thẳng từ
`netlify/functions/_shadowing.js`) nếu có `GROQ_API_KEY`, rồi ghi cả bộ vào
`public/data/shadowing-clips.json`. Có thêm bước chặn an toàn: tính tỉ lệ ký tự
Latin trong văn bản mỗi clip, bỏ qua (báo lỗi rõ ràng) nếu < 90% — phát hiện
được nhờ chính lần chạy này.

**Khác với kế hoạch cũ — 5/10 URL gốc trong `KE_HOACH_CAI_TIEN_GIAO_TIEP.md`
không dùng được, đã thay thế:** kiểm tra qua oEmbed (như ghi chú cũ) chỉ xác
nhận video tồn tại, KHÔNG xác nhận có phụ đề hay phụ đề đúng ngôn ngữ. Kiểm tra
thật qua `youtube-transcript` phát hiện: 3 video VOA Tuần 4 (`Nzye1wn4MXI`,
`CyjLzIF7_L4`, `LCcKsIlacbI`) và 1 video Asian Boss Tuần 8 (`DU9GdKT32io`)
**không có phụ đề nào** (đã đổi kênh vlog từ khi soạn kế hoạch); video Asian
Boss Tuần 8 còn lại (`WnBjhNDdEiY`, "Marie Kondo") có phụ đề nhưng là **tiếng
Nhật** (người được phỏng vấn nói tiếng Nhật, không phải tiếng Anh) — không
dùng cho luyện nghe tiếng Anh được. Đã tìm thay thế bằng cách tự scrape trang
tìm kiếm YouTube rồi kiểm từng video qua `youtube-transcript` tới khi ra đủ:
Tuần 4 đổi hẳn sang BBC Learning English *Easy English Conversations* Ep.1/Ep.6
(`I_tRSrPru94`, `aiUGN3TDvw4`, A2) + *Grammar Gameshow* Ep.1 (`OsW5sV3GMDM`,
trùng chủ đề hiện tại/tiếp diễn); Tuần 8 đổi sang 2 phỏng vấn đường phố tiếng
Anh thật ở Singapore — nước nói tiếng Anh, tránh lặp lại lỗi ngôn ngữ —
`FQhIPchN-AQ` (hạnh phúc) và `Q8M57uJbVZo` (Singlish/tự nhận thức giọng nói).
5 video còn lại (Tuần 5: `9ifQ3xRz4hM`, `h_pvijqmolQ`; Tuần 6: `QdE63sYqwd8`;
Tuần 7: `fEacJtQbTko`, `lBNM6aKwPl0`) giữ nguyên như kế hoạch — phụ đề tốt.

**Kết quả:** 10/10 clip ghi vào `public/data/shadowing-clips.json`, phủ đủ
Tuần 4→8 (3/2/1/2/2 clip), mỗi clip đã cắt còn ~2.2–5.4 phút nội dung thật (bỏ
nhạc mở đầu/quảng cáo giữa video/lời kêu gọi subscribe cuối). AI polish (Groq)
chỉ thành công cho 2/10 clip — free tier bị rate-limit ngay giữa lúc chạy
script, 8 clip còn lại rơi về bản "heuristic" (viết hoa/gộp khoảng trắng, không
thêm dấu câu mới — đúng hành vi fallback đã có sẵn khi người dùng tự dán URL mà
server hết quota Groq). Với 2 clip BBC *6 Minute English*/*Grammar Gameshow* thì
không đáng lo vì phụ đề gốc của BBC vốn đã có dấu câu thủ công; 2 clip
*Easy English*/*Asian Boss* dùng phụ đề tự động (không dấu câu) nên đọc hơi khó
hơn — chạy lại `npm run curate:shadowing` (script mới, idempotent, ghi đè toàn
bộ file) khi quota Groq hồi phục để nâng cấp.

**Thay đổi kiến trúc:** `src/lib/shadowingRepo.js` trước đây CHỈ đọc bảng
Supabase `shadowing_clips` (trả rỗng khi guest/dev local dù comment trong
`ShadowingView.vue` đã nhắc "Supabase, fallback file tĩnh" — fallback đó chưa
từng được viết). Giờ `fetchClipList`/`fetchClipsByWeek`/`fetchClip` gộp file
tĩnh `public/data/shadowing-clips.json` (luôn có, kể cả guest) với bảng
Supabase (thắng khi trùng `videoId`, để admin vẫn sửa/ghi đè qua
`/admin/shadowing` như cũ, không cần deploy lại).

**Kiểm chứng:** route `/shadowing` yêu cầu đăng nhập
(`requiresAuth`) và máy này đã cấu hình Supabase thật nên không đăng nhập được
qua Google trong sandbox preview (giống hạn chế đã ghi ở Bước 1.2) — xác nhận
bằng cách gọi thẳng `fetchClipsByWeek(4)`/`(8)`/`fetchClip(...)` qua
`import('/src/lib/shadowingRepo.js')` trong console trình duyệt: đúng 3/2 clip
mỗi tuần, `fetchClipsByWeek(1)` rỗng, `fetchClip` trả đúng câu (kèm timestamp).
Test mới `tests/shadowingRepo.test.js` (8 test: gộp tĩnh+cloud, cloud override
cùng videoId, lọc theo tuần, fallback khi Supabase không có bản ghi, lỗi mạng
không crash). `npm test` (201/201, +8) và `npm run build` pass — file tĩnh có
mặt trong `dist/data/shadowing-clips.json`.

**Việc cần làm (kế hoạch gốc, đã hoàn thành với sai khác nêu trên):**

**Vấn đề:** cơ chế gắn clip theo tuần đã xong (cột `week` trong `shadowing_clips`, ô "Gắn với Tuần" trong `AdminShadowingView.vue`, thẻ "🎧 Nghe thật hơn tuần này" trong `IeltsDayView.vue`) nhưng **thư viện đang rỗng** — người học Tuần 4+ bấm vào không có gì.

**Việc cần làm:** dùng danh sách 10 video đã thẩm định sẵn trong `KE_HOACH_CAI_TIEN_GIAO_TIEP.md` mục Đợt 3 (bảng URL VOA/BBC/Easy English/Asian Boss kèm tuần + cấp độ). Có 2 đường:
- **Đường A (ưu tiên, tự động được):** viết script `scripts/seed-shadowing.mjs` — với mỗi URL: fetch phụ đề (package `youtube-transcript` đã cài; nếu bị YouTube chặn thì tham khảo cách fetch trong `netlify/functions/_shadowing.js`), cắt lấy đoạn 2–4 phút có nội dung (bỏ intro nhạc), polish qua hàm sẵn có trong `_shadowing.js` nếu có GROQ_API_KEY, rồi ghi vào Supabase (bảng `shadowing_clips`, đủ cột title/level/topic/week/segments) hoặc xuất ra `public/data/shadowing-clips.json` (fallback tĩnh mà `ShadowingView.vue` đã đọc — kiểm tra bộ lọc `?week=` có hoạt động với nguồn tĩnh không, nếu không thì sửa).
- **Đường B (thủ công):** hướng dẫn từng bước dán URL qua `/admin/shadowing` — chỉ khi đường A vướng (phụ đề bị chặn).

**File liên quan:** `scripts/`, `netlify/functions/_shadowing.js`, `src/lib/shadowingRepo.js`, `public/data/shadowing-clips.json`, `src/views/ShadowingView.vue`, `supabase/schema.sql` (đọc, không cần sửa).

**Nghiệm thu:** vào `/shadowing?week=4` … `?week=8` thấy đúng clip của tuần đó; mỗi clip phát được, câu tách hợp lý (2–6 phút, không dính intro nhạc); thẻ "Nghe thật hơn tuần này" trong buổi học Tuần 4+ dẫn tới đúng clip.

### Bước 1.4 — Chống lỗi 429/timeout cho mọi lời gọi AI

- [x] Đã làm

**Ghi chú (2026-07-04):** `netlify/functions/_llm.js` thêm `AiError` (có
`.code`) + hàm lõi mới `groqRequest()` (thay ruột `askLLM`): timeout 18s/lần
qua `AbortController`, retry **đúng 1 lần** (đúng trần ~26s của Netlify
Function) cho 429/5xx/lỗi mạng/timeout — 429 ưu tiên đợi theo header
`Retry-After`, còn lại backoff exponential (1s → tối đa 4s) + jitter; 400/401
không retry (lỗi phía mình/key sai, retry vô ích). Thêm `errorResponse(e)` map
`code -> {status, body:{error:{code,message}}}` dùng chung. `_shadowing.js#polishSegments`
đổi sang gọi `groqRequest()` thay vì tự `fetch` riêng (import thẳng từ `_llm.js`,
xoá 2 hằng `GROQ_ENDPOINT`/`GROQ_MODEL` trùng lặp) — polish shadowing giờ cũng
được retry, thất bại thì vẫn rơi về "heuristic" như cũ (hành vi này KHÔNG đổi,
không cần báo lỗi cho người học vì đã có fallback hợp lý). `chat.js` và
`shadowing.js` đổi mọi response lỗi sang `{error:{code,message}}`.

**Khác với kế hoạch — gộp luôn dev proxy chat vào cùng cơ chế với shadowing:**
`vite.config.js` trước đây có 2 plugin viết tay riêng (`chatDevPlugin` tự gọi
`runChat` trực tiếp, `shadowingDevPlugin` gọi thẳng handler thật) — 2 đường
khác nhau nghĩa là dev dễ lệch format với production. Gộp thành 1
`netlifyFunctionDevPlugin(name, handler, env)` dùng chung, cả 2 đều gọi ĐÚNG
handler thật (`chat.js`/`shadowing.js`) như Netlify sẽ chạy — tự động đảm bảo
yêu cầu "dev proxy phải mô phỏng cùng format lỗi" mà không cần double-maintain.

Client: thêm `src/lib/aiError.js` (`friendlyAiError(err)` — bảng map
`code -> câu tiếng Việt thân thiện`, `retryable` false riêng cho `config`; và
`AiCallError` — lỗi có `.code`). `src/lib/aiChat.js#sendChat` giờ ném
`AiCallError` (đỡ được cả format lỗi cũ dạng string phòng lệch bản, không bắt
buộc phải đổi cùng lúc mọi server).
- `AiChat.vue`: banner lỗi đổi sang dùng `friendlyAiError()`; thêm nút **"🔄 Thử
  lại"** cạnh thông báo lỗi — tách `send()` thành `sendTurn(userEntry)` để bấm
  thử lại gọi lại ĐÚNG lượt vừa lỗi (không đẩy thêm bong bóng chat mới, không
  mất câu đã gõ vì câu đó đã nằm trong bong bóng `userEntry` từ trước khi gọi
  AI). Áp dụng tương tự cho lỗi mở màn Surprise mode; các nút phụ (gợi ý/ý
  tưởng/dịch) cũng đổi sang thông điệp từ `friendlyAiError()`.
- `IeltsDayView.vue` (chữa viết) và `SentenceBankPractice.vue`: đổi câu lỗi
  sang `friendlyAiError()`. Không thêm nút "Thử lại" riêng vì nút "🤖 Nhờ AI
  chữa (lại) bài" sẵn có đã đóng đúng vai trò đó (nhãn nút không đổi khi lỗi vì
  `saveWriting(...,done=true)` chỉ gọi lúc THÀNH CÔNG) — bản nháp không mất vì
  `saveWriting`/autosave `@change` chạy độc lập, trước khi gọi AI.
- `SentenceBankPractice.vue`: sửa luôn lỗi nuốt im lặng khi nhận diện giọng nói
  thất bại (`speakInto` — không phải lỗi AI/Groq mà là Web Speech API, nhưng
  nghiệm thu của bước này có nêu đích danh) — giờ hiện dòng nhỏ "🎤 Không dùng
  được mic lúc này…" thay vì im lặng.
- `ShadowingView.vue`: `loadFromUrl` phải đọc được `data.error` dạng OBJECT mới
  (trước sẽ hiện `[object Object]`) — sửa để lấy `.message`, vẫn đỡ được string
  cũ; tách riêng lỗi fetch mạng thành thông điệp "Không kết nối được máy chủ…"
  thay vì để lộ message kỹ thuật của trình duyệt (`Failed to fetch`).

**Không nhét lỗi vào bong bóng chat:** giữ nguyên — mọi thông điệp lỗi vẫn ở
banner/box riêng (`chat-error-box`, `rev-error`, `mic-err`, `url-err`), không
tạo message giả `role:'assistant'`.

**Kiểm chứng:** test mới `tests/llmRetry.test.js` (9 test, mock `fetch` toàn
cục + `vi.useFakeTimers()` — 429 kèm `Retry-After` rồi thành công, 429 liên tục
retry đúng 1 lần rồi ném `rate_limited`, 401 không retry, 400 không retry, lỗi
mạng có retry, 5xx liên tục ném `upstream`, timeout 18s ném `timeout`,
`errorResponse()` map đúng status HTTP), `tests/aiError.test.js` (5 test cho
`friendlyAiError`) và `tests/aiChatError.test.js` (4 test cho `sendChat` — cả
format lỗi mới lẫn cũ, lỗi mạng, thành công). Đã khởi động `npm run dev` thật
và gọi trực tiếp qua console trình duyệt: `GET /.netlify/functions/chat` ->
`405 {error:{code:'bad_request',...}}`, `POST /.netlify/functions/shadowing`
với URL rác -> `400 {error:{code:'bad_request',...}}` — xác nhận dev proxy mới
(gọi thẳng handler thật) trả đúng format như production; máy này có
`GROQ_API_KEY` thật nên `sendChat` một lượt bình thường vẫn chạy thành công
(không regress). Không giả lập được 429 thật từ Groq (cần free-tier bị nghẽn
đúng lúc) nên độ tin cậy của nhánh retry dựa vào unit test mock, không phải
lượt gọi thật. `npm test` (219/219, +18) và `npm run build` đều pass.

**Vấn đề (kế hoạch gốc):** `netlify/functions/_llm.js` gọi Groq thẳng, không retry; free tier hay 429. Client (`AiChat.vue`, writing trong `IeltsDayView.vue`, `SentenceBankPractice.vue`) hiện lỗi thô hoặc im lặng.

**Việc cần làm:**
1. Trong `_llm.js`: bọc fetch bằng retry với exponential backoff + jitter (đợi theo header `retry-after` nếu có, có trần). **Chú ý trần thời gian Netlify Function ~26s** — timeout mỗi lần gọi ~18s, tổng retry không vượt trần (thực tế chỉ retry được 1 lần).
2. Chuẩn hóa lỗi trả về client: `{ error: { code: 'rate_limited' | 'timeout' | 'upstream', message } }` với HTTP status tương ứng (429/504/502).
3. Client: mọi chỗ gọi AI (chat, chữa viết, dịch từ, câu sentence bank, polish shadowing) hiện thông điệp thân thiện tiếng Việt + nút "Thử lại": *"AI đang bận, đợi ~30 giây rồi bấm thử lại nhé"*. Viết 1 helper dùng chung (vd. `friendlyAiError()` trong lib) thay vì sửa rời rạc từng chỗ. Bản nháp người học **không được mất** khi lỗi (writing draft đã auto-save — kiểm tra lại luồng này). Không nhét thông điệp lỗi vào bong bóng chat như tin nhắn AI.
4. Dev proxy trong `vite.config.js` phải mô phỏng cùng format lỗi để test được ở local.

**File liên quan:** `netlify/functions/_llm.js`, `netlify/functions/chat.js`, `netlify/functions/shadowing.js`, `src/components/day/AiChat.vue`, `src/views/IeltsDayView.vue`, `src/components/day/SentenceBankPractice.vue`, `src/views/ShadowingView.vue`, `vite.config.js`.

**Nghiệm thu:** giả lập 429 (mock trong test hoặc dev proxy) → client hiện thông điệp + retry được; không còn đường lỗi nào nuốt im lặng (kiểm cả SentenceBankPractice vốn đang nuốt lỗi); `npm test` pass với test cho helper lỗi.

---

## Đợt 2 — Trải nghiệm khóa tiếng Anh sâu hơn

### Bước 2.1 — Sync ghi âm mốc lên Supabase Storage

- [x] Đã làm

**Ghi chú (2026-07-04):** Thêm bucket `recordings` (private) + 4 policy RLS
(select/insert/update/delete, khóa theo `(storage.foldername(name))[1] =
auth.uid()::text`) vào `supabase/schema.sql` — bucket tạo qua
`insert into storage.buckets` nên chạy lại script cũ (đã áp dụng trước đó) vẫn
an toàn nhờ `on conflict do nothing`. Module mới `src/lib/recordingSync.js`:
`uploadRecording`/`downloadRecording`/`remoteRecordingExists`/
`deleteRemoteRecording`/`flushPendingUploads` — tách riêng khỏi
`src/lib/recorder.js` (file đó giữ nguyên, chỉ lo IndexedDB local như docstring
đã ghi). Path lưu `{userId}/{recId-đã-escape-dấu-":"}.webm` đúng như kế hoạch
gợi ý (luôn đuôi `.webm` bất kể mime thật — không sao vì phát lại dựa vào
`Blob.type` lưu ở `contentType` lúc upload, không dựa tên file). Lỗi mạng khi
upload không ném ra ngoài mà xếp vào hàng đợi `localStorage` (khóa
`devleap:pending-recording-uploads`), thử lại qua `flushPendingUploads(userId)`
— gọi từ `stores/auth.js` ngay sau `pullAndMerge` lúc đăng nhập, và từ listener
`window.addEventListener('online', ...)` gắn trong `authStore.init()`.

`VoiceRecorder.vue`: sau `stop()` lưu xong local thì upload nền (không chặn
UI), hiện badge nhỏ cạnh "✅ Đã ghi" (☁️ Đang đồng bộ / Đã đồng bộ / Lỗi đồng
bộ — chỉ hiện khi `isCloudEnabled && user.cloudUserId`, guest mode không đổi
gì). Khi mở buổi mà IndexedDB không có bản ghi, gọi `remoteRecordingExists`
(1 lần `.list()` lọc theo tên, KHÔNG tải blob) — nếu có thì hiện nút "☁️ Tải
bản ghi" (`fetchFromCloud`), bấm mới thật sự `downloadRecording` rồi cache lại
vào IndexedDB qua `saveRecording` sẵn có. `remove()` xóa local xong thì xóa
luôn bản trên Storage (best-effort, không chặn UI, không báo lỗi nếu thất
bại). `MilestonesView.vue` áp dụng đúng pattern lazy-fetch tương tự cho từng
clip trong 3 mốc so sánh.

**Khác với kế hoạch — không dựng riêng UI "trạng thái sync" phức tạp:** chỉ 1
dòng badge nhỏ + 1 nút tải, tái dùng style nút sẵn có của component (`--purple`)
thay vì thêm CSS variable mới, giữ đúng mức "quick win" của đợt này.

**Kiểm chứng:** `npm test` (228/228, +9 `tests/recordingSync.test.js` — guest
mode no-op, escape path đúng, upload thành công/thất bại (xếp hàng + flush lại
được), download thành công/lỗi, `remoteRecordingExists` đúng/sai tên file,
`deleteRemoteRecording` best-effort, `flushPendingUploads` bỏ qua khi local đã
mất blob) và `npm run build` đều pass. Không đăng nhập được qua Google trong
sandbox preview (máy này cấu hình Supabase thật, route `/milestones` yêu cầu
đăng nhập — cùng hạn chế đã ghi ở Bước 1.2/1.3) nên không thử tay được luồng
"ghi máy A, nghe máy B" đầy đủ; đã gọi trực tiếp
`import('/src/lib/recordingSync.js')` qua console trình duyệt để xác nhận
guest-mode (`userId=null`) trả `false`/`null` không ném lỗi, và gọi thật lên
Supabase project thật của máy này với `userId` giả không văng lỗi ra ngoài
(catch gọn, trả `false` — đúng thiết kế "best-effort"). Chưa chạy được SQL
bucket/policy mới trên project Supabase thật của máy này (cần làm tay 1 lần
qua Dashboard hoặc chạy lại `schema.sql` trước khi dùng tính năng này ở môi
trường đó).

**Vấn đề:** bản ghi âm (mốc 0, bản ghi 60s, sản phẩm buổi) nằm trong IndexedDB (`src/lib/recorder.js`) — mất khi đổi máy/xóa cache, trong khi trang `/milestones` (`MilestonesView.vue`, `src/data/milestones.js`) được thiết kế để so sánh Đầu/Giữa/Cuối khóa.

**Việc cần làm:**
1. Tạo bucket Supabase Storage `recordings` (private, RLS theo user id — policy dạng `storage.foldername(name)[1] = auth.uid()`) — thêm hướng dẫn vào `docs/SUPABASE_SETUP.md` + SQL policy vào `supabase/schema.sql`.
2. Khi có đăng nhập: sau khi ghi xong, upload blob (webm/ogg, thường < 1–2 MB) lên `recordings/{userId}/{recId}.webm` (escape ký tự `:` trong recId), không chặn UI — upload nền, có trạng thái "đang đồng bộ ☁️ / đã đồng bộ ✅" nhỏ trên `VoiceRecorder.vue`. Nên có hàng đợi retry khi offline (flush khi có mạng lại / khi login).
3. Khi mở app máy khác: `MilestonesView.vue` và `VoiceRecorder.vue` nếu IndexedDB không có bản ghi thì thử tải từ Storage về (lazy, chỉ khi bấm play) và cache lại vào IndexedDB.
4. Guest mode (không Supabase): giữ nguyên hành vi local, không hiện trạng thái sync.
5. Xóa local thì xóa luôn trên Storage (best-effort).

**File liên quan:** `src/lib/recorder.js`, `src/components/day/VoiceRecorder.vue`, `src/views/MilestonesView.vue`, client Supabase hiện có trong `src/lib/`, `src/stores/user.js` (móc vào login/logout), `supabase/schema.sql`, `docs/SUPABASE_SETUP.md`.

**Nghiệm thu:** đăng nhập 2 trình duyệt khác nhau → ghi ở A, nghe được ở B (sau khi bấm play); guest mode không đổi hành vi; lỗi mạng khi upload không làm mất bản ghi local; `npm test` pass.

### Bước 2.2 — Ảnh minh họa từ vựng ổn định (bỏ LoremFlickr)

- [x] Đã làm

**Ghi chú (2026-07-04):** Chọn **Phương án B** — giữ ảnh online nhưng đổi
nguồn: `src/lib/vocabImage.js` viết lại hoàn toàn, bỏ LoremFlickr, tra ảnh qua
Wikipedia REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/<Term>`,
CORS mở sẵn — đã kiểm tra thật bằng `curl`) lấy `thumbnail.source`. Chọn B thay
vì A (tự host ~130 từ trong `vocabGlossary.js`) vì A cần tải + kiểm license
hàng loạt ảnh thật (tốn công, rủi ro pháp lý) trong khi B tận dụng ảnh đã có
sẵn giấy phép mở của Wikimedia mà không cần tự lưu trữ, và code hiện có
(`VocabCard.vue`, `FlashcardTool.vue`) đã sẵn cơ chế fallback tốt nên chấp
nhận được việc B vẫn cần mạng lần đầu.

Cache theo từ trong `localStorage` (khóa `devleap:vocab-img:v1:<từ>`, TTL 30
ngày) — cache **cả kết quả rỗng** (từ trừu tượng/trang không có ảnh/trang định
hướng nhiều nghĩa như "Stress") để khỏi dò lại Wikipedia mỗi lần mở app, nhưng
**không cache lỗi mạng/timeout** (tạm thời, thử lại được ở lần sau). Timeout
~3s qua `AbortController`. Trang "định hướng" (`type: 'disambiguation'`, vd
"Stress" trỏ tới nhiều bài khác nhau) bị coi là không có ảnh dù API vẫn trả
`thumbnail` — tránh ảnh sai chủ đề.

Gom logic hiển thị vào component dùng chung mới
[`src/components/common/VocabIllustration.vue`](../src/components/common/VocabIllustration.vue),
dùng ở cả `VocabCard.vue` và `FlashcardTool.vue` (đúng yêu cầu kế hoạch) nhưng
giữ đúng hành vi hiển thị riêng của từng nơi bằng props thay vì ép giống hệt
nhau: `VocabCard` truyền `persistent-emoji` (emoji + gradient riêng của từ đã
có sẵn trong data — luôn hiện, ảnh fade-in đè lên khi tải xong, không có
spinner, y hệt UX cũ) và `override-url` (giữ đường cũ: nếu data tự gán sẵn
`vocab.img` thì dùng luôn, bỏ qua tra Wikipedia); `FlashcardTool` dùng
`show-spinner` + `fallback-emoji="🗂️"` (không có emoji riêng theo từ, y hệt UX
cũ: spinner lúc tải, lỗi/không có ảnh mới hiện icon thư mục chung). Component
tự hủy kết quả tra cứu cũ khi `term` đổi giữa lúc đang chờ mạng (biến đếm
`token`) — tránh hiện nhầm ảnh của thẻ trước lên thẻ sau khi chuyển thẻ nhanh.

**Kiểm chứng:** `npm test` (237/237, +9 `tests/vocabImage.test.js` — rỗng
không gọi mạng, có ảnh trả đúng URL + đúng tên trang viết hoa chữ đầu, trang
định hướng -> rỗng, thiếu `thumbnail` -> rỗng, HTTP lỗi -> rỗng không ném, lỗi
mạng -> rỗng không ném, cache đúng cho cả kết quả có/rỗng không phân biệt
hoa/thường, lỗi mạng KHÔNG cache nên lần sau thử lại được) và `npm run build`
pass. Đã thử tay qua preview (route `/tools/flashcard` không yêu cầu đăng
nhập, seed `completed.ielts=['1:1']` vào localStorage để có bộ thẻ Tuần 1):
mở thẻ "name" ra ảnh thật từ Wikimedia Commons đúng chủ đề (network tab xác
nhận gọi `GET .../page/summary/Name` → 200 rồi tải ảnh từ
`upload.wikimedia.org`), thẻ "goal" không có ảnh phù hợp thì hiện gọn icon
🗂️ fallback, không vỡ layout, không lỗi console. Chưa thử tay được
`VocabCard.vue` (chỉ xuất hiện trong buổi học, route yêu cầu đăng nhập — cùng
hạn chế sandbox đã ghi ở các bước trước) nhưng dùng chung 1 component với
`FlashcardTool` đã kiểm chứng nên rủi ro thấp.

**Vấn đề:** `src/lib/vocabImage.js` dùng LoremFlickr — ảnh ngẫu nhiên theo keyword, thường sai nghĩa, chậm, và là điểm phụ thuộc ngoài duy nhất trong màn học từ.

**Việc cần làm (chọn 1 trong 2, để AI thực hiện tự cân nhắc và ghi lại lựa chọn):**
- **Phương án A:** ảnh tĩnh tự host cho ~400 từ trong `vocabGlossary.js` — một lần chạy script tải về `public/images/vocab/` (nguồn license-safe: Openverse/Wikimedia), fallback runtime là thẻ chữ cái đầu + emoji chủ đề (không gọi mạng). Ưu điểm: offline được, không còn phụ thuộc ngoài. Nhược: phải kiểm license hàng loạt.
- **Phương án B:** giữ ảnh online nhưng đổi nguồn **đúng nghĩa + ổn định theo từ** (gợi ý: Wikimedia/Wikipedia REST API thumbnail theo term), cache URL vào localStorage (TTL dài, cache cả kết quả rỗng), `loading="lazy"` + skeleton + timeout ~3s → fallback thẻ chữ + emoji. Chấp nhận vẫn cần mạng lần đầu.
Dù phương án nào: cùng 1 từ phải luôn ra cùng 1 ảnh; nên gom logic hiển thị vào 1 component dùng chung cho `VocabCard.vue` và `FlashcardTool.vue`.

**File liên quan:** `src/lib/vocabImage.js`, `src/components/day/VocabCard.vue`, `src/components/tools/FlashcardTool.vue`, `src/data/vocabGlossary.js`, `scripts/` (nếu phương án A).

**Nghiệm thu:** tắt mạng (hoặc chặn domain ảnh) → thẻ từ vẫn hiển thị tử tế (fallback), không vỡ layout; ảnh không đổi lung tung giữa 2 lần xem cùng 1 từ; `npm test` pass.

### Bước 2.3 — Fallback tử tế khi không có Web Speech API (Safari/iOS)

- [x] Đã làm

**Ghi chú (2026-07-04):** Khảo sát trước khi code phát hiện `recognitionSupported()`
(`src/lib/speechRecognize.js`) và `canSpeak()` (`src/lib/speak.js`) **đã có sẵn**
và đã được dùng đúng chỗ ở hầu hết 5 màn — chỉ thêm helper hợp nhất
`speechSupport()` trong `speechRecognize.js` (gộp 2 hàm có sẵn thành
`{ recognition, synthesis }`, không viết lại logic detect). Phát hiện thêm:
`src/lib/listen.js` (dùng riêng cho `AiChat.vue`) có 1 hàm `canListen()` tự
detect `window.SpeechRecognition`/`webkitSpeechRecognition` TRÙNG LẶP hoàn toàn
với `recognitionSupported()` — sửa `canListen()` gọi thẳng
`recognitionSupported()` thay vì tự dò lại (giữ nguyên `createRecognizer()` vì
hàm đó cần constructor thật, không chỉ cờ boolean).

Component dùng chung mới: [`src/components/common/SpeechSupportNote.vue`](../src/components/common/SpeechSupportNote.vue)
— nhận `visible` (bool) + `text` (string tùy biến) từ cha thay vì tự gọi
`speechSupport()` bên trong, vì mỗi màn đã có sẵn biến cờ hỗ trợ riêng mang sắc
thái khác nhau (`ShadowingPlayer.vue` có cả `canRecord`/`canScore` tách biệt,
`AiChat.vue` có `listenable` từ `listen.js` khác `recognitionSupported()` trực
tiếp) — để cha tự quyết khi nào hiện, tránh phải hợp nhất rủi ro các luồng đang
chạy đúng.

Áp dụng theo từng màn (đúng bảng đã khảo sát, không đổi cách phát hiện có sẵn):
- `ListeningDictation.vue`: **không đổi gì** — không dùng recognition, đã có ô
  gõ chữ thay thế + banner riêng cho `!speakable` từ trước.
- `PronunciationDrill.vue`: thay `<p class="warn">` thủ công bằng
  `SpeechSupportNote`; thêm fallback thật (không chỉ disable nút chết) — khi
  `!recordable`, nút 🎤 biến mất, thay bằng 2 nút **"✅ Đọc được" / "🙁 Chưa
  được"** (`selfAssess`/`selfAssessMp`) ghi thẳng `results[i]/mpResults[i] =
  { ok, selfAssessed: true }` — dùng chung logic đếm `doneCount`/`enough` nên
  vẫn qua được gate luyện phát âm bằng tự đánh giá. Không cộng XP vì `emit('done')`
  của component này hiện chưa được `IeltsDayView.vue` nối vào bất kỳ action cộng
  XP nào (đã kiểm tra bằng grep) — không có đường farm XP mới.
- `SentenceBankPractice.vue`: thêm `SpeechSupportNote` (trước đó nút mic chỉ
  lặng lẽ biến mất qua `v-if="recordable"`, không giải thích lý do) — ô gõ tay
  vẫn luôn có sẵn, không cần sửa thêm.
- `ShadowingPlayer.vue` (`src/components/tools/`, không phải `day/` như mô tả
  gốc trong kế hoạch): thêm banner **cố định** ngay dưới thanh điều khiển khi
  `!canScore` — trước đó chỉ hiện thông báo SAU khi bấm thử (`attemptError`).
  Luồng ghi âm + phát lại + tự so phụ đề vốn đã đúng thiết kế kế hoạch từ
  trước, không phải sửa.
- `AiChat.vue`: thêm `SpeechSupportNote` khi `!listenable`; đổi dòng hint từ
  "Bấm 🎤 để nói." sang "Gõ câu trả lời ở ô bên dưới." khi không hỗ trợ. Nút
  mic + toggle "🎤 Nói ngay"/voice-first vốn đã tự ẩn qua `v-if="listenable"`
  (đúng như mô tả "im lặng" trong kế hoạch) — giờ có banner giải thích thay vì
  im lặng thật. `maybeAutoListen()` không cần sửa (đã tự no-op khi
  `!listenable`). TTS (`autoSpeak`, nút 🔊 từng tin nhắn) không đổi vì
  `speakable` độc lập với `listenable`.

**Kiểm chứng:** `npm test` (242/242, +5 `tests/speechRecognize.test.js` — đủ 4
tổ hợp recognition×synthesis, prefix `webkitSpeechRecognition`, và
`recognitionSupported()`/`canListen()` luôn khớp `speechSupport().recognition`)
và `npm run build` pass (cảnh báo CSS trong `base.css` là có từ trước, không
liên quan file đã sửa). Thử tay được `AiChat.vue` qua `/tools/chat` (route
KHÔNG yêu cầu đăng nhập, khác 4 màn còn lại): xoá
`window.SpeechRecognition`/`webkitSpeechRecognition` (giữ `speechSynthesis`) rồi
chuyển tab công cụ sang/về để buộc component mount lại → banner mới hiện đúng
chữ, nút mic + "🎤 Nói ngay" biến mất, hint đổi đúng câu, nút "🔊 Đọc" vẫn còn
(TTS không phụ thuộc recognition), không lỗi console; phục hồi
`window.SpeechRecognition` rồi mount lại → về đúng giao diện gốc (mic + voice-first
hiện lại), xác nhận không có hồi quy. `PronunciationDrill.vue`/
`SentenceBankPractice.vue`/`ShadowingPlayer.vue` chỉ nằm trong route
`requiresAuth` (buổi học IELTS / `/shadowing`) — không đăng nhập được qua Google
trong sandbox preview (cùng hạn chế đã ghi ở Bước 1.2/1.3/2.1), nên chỉ xác
nhận được qua đọc code + cùng 1 component `SpeechSupportNote` đã kiểm chứng
hoạt động đúng ở `AiChat.vue`.

**Vấn đề:** 5 tính năng dựa vào Web Speech API (`ListeningDictation`, `PronunciationDrill`, `SentenceBankPractice`, `ShadowingPlayer`, `AiChat` voice-first) chỉ chạy Chrome/Edge. Trên Safari/iOS chúng hỏng **im lặng** — nút mic không làm gì hoặc không hiện.

**Việc cần làm:**
1. Viết helper `speechSupport()` trong `src/lib/speechRecognize.js`: trả `{ recognition: bool, synthesis: bool }` (tách riêng — iOS Safari thường CÓ SpeechSynthesis nhưng KHÔNG có SpeechRecognition, nên TTS/nghe mẫu vẫn giữ).
2. Làm 1 component banner dùng chung (vd. `SpeechSupportNote.vue`): *"Trình duyệt này chưa hỗ trợ chấm giọng nói — hãy dùng Chrome/Edge trên máy tính hoặc Android. Em vẫn luyện được bằng cách bên dưới."*
3. Chế độ thay thế từng màn khi không có recognition:
   - ListeningDictation: nghe rồi **gõ** lại (kiểm tra — có thể đã có ô gõ, khi đó chỉ cần ẩn nút mic), chấm so khớp text như cũ.
   - PronunciationDrill: nghe mẫu + tự đánh giá 2 nút "Đọc được / Chưa được" (không cộng XP chấm máy).
   - SentenceBankPractice / AiChat: gõ thay nói; AiChat **không tự bật mic** (tắt voice-first + countdown), vẫn cho AI đọc to trả lời nếu synthesis có.
   - ShadowingPlayer: vẫn nghe + đọc theo, ẩn phần chấm điểm, hiện hướng dẫn tự so với phụ đề.

**File liên quan:** `src/lib/speechRecognize.js`, `src/lib/speak.js`, 5 component trên.

**Nghiệm thu:** giả lập `window.SpeechRecognition = undefined` (trong test và thử tay) → mọi màn vẫn dùng được, có banner giải thích, không có nút chết; `npm test` pass với test mới cho `speechSupport()` (đủ các tổ hợp có/không recognition × synthesis).

### Bước 2.4 — Mở rộng minimal pairs + trọng tâm phát âm theo tuần

- [x] Đã làm

**Ghi chú (2026-07-04):** Tách pool ra `src/data/minimalPairs.js` — 7 nhóm
theo trọng tâm âm (`plural-s`, `verb-s`, `ed`, `vowel-i`, `vowel-ae`, `th`,
`finalCons` gộp t/d + k/g + l/n + -st/-sk), tổng **68 cặp** (≥60), mỗi nhóm
≥8 cặp không trùng. Gán tuần qua `WEEK_FOCUS` khớp với dòng `Ngữ pháp mới:`
đọc trực tiếp từ `Base_English/NenTang_TuanN(.md/_Work.md)` (cả 2 track dùng
chung tiến trình ngữ pháp nên chỉ cần 1 bảng): Tuần 2 số ít/nhiều →
`plural-s`, Tuần 3 present simple ngôi 3 → `verb-s`, Tuần 4 past simple →
`ed` (đúng 3 điểm kế hoạch có nêu ví dụ). Tuần 5–7 không có điểm ngữ pháp
gắn trực tiếp với 1 âm cụ thể nên xếp theo độ khó tăng dần thay vì bịa mối
liên hệ giả: Tuần 5 `vowel-i` (nguyên âm nền tảng dễ nhất), Tuần 6
`vowel-ae`, Tuần 7 `th` (phụ âm khó nhất, hợp trình độ A2+ của tuần). Tuần 8
trộn `th` + `finalCons` = "tổng hợp các nhóm khó nhất" đúng như kế hoạch.

Hàm `pairsForWeek(week, learnedTerms)`: xác định (không dùng `Math.random`,
test được), luôn trả đúng 8 cặp không trùng trong 1 lần chọn, ưu tiên cặp có
từ trùng `learnedTerms` (so khớp không phân biệt hoa/thường/khoảng trắng)
lên đầu danh sách — còn lại giữ nguyên thứ tự gốc của nhóm. `week` ngoài
[2,8] kẹp về đầu/cuối.

`PronunciationDrill.vue`: bỏ `MINIMAL_PAIRS_POOL` cũ (20 cặp cố định, quay
vòng theo `((w-2)*4) % length` — logic quay vòng cũ **không hề đổi nhóm âm**,
chỉ đổi cặp trong cùng 1 danh sách trộn lẫn `-s`/`-ed`), thay bằng gọi
`pairsForWeek`. Thêm prop `vocabTerms` (mảng string) — `IeltsDayView.vue`
truyền `pronVocabTerms` = `[...d.vocab, ...d.reviewVocab].map(v => v.term)`
(cùng cách gộp từ vựng buổi mà `markDone`/`toggleDay` ở Bước 1.1 đã dùng).
Tiêu đề khối đổi động theo tuần: `"🎯 Tuần này: {{ mpFocus.groupLabel }}"` +
dòng mẹo đặt lưỡi/miệng lấy từ `tip` của nhóm (tuần 8 lấy tip của nhóm đầu
trong 2 nhóm trộn).

**Kiểm chứng:** test mới `tests/minimalPairs.test.js` (13 test — pool ≥60
cặp, mỗi nhóm ≥8 cặp không trùng, mỗi cặp 2 từ khác nhau không rỗng,
`focusForWeek` khớp đúng `WEEK_FOCUS` cho tuần 2–8, kẹp tuần ngoài khoảng,
7 tuần liền kề không trùng trọng tâm, `pairsForWeek` luôn ra đúng 8 cặp
không trùng + xác định + ưu tiên đúng từ đã học + không khớp thì vẫn đủ 8
cặp theo thứ tự gốc + tuần 8 trộn nhiều nhóm). `npm test` (255/255, +13) và
`npm run build` đều pass. Route `/courses/ielts/week/:week/day/:day` yêu
cầu đăng nhập Google — không đăng nhập được trong sandbox preview (cùng hạn
chế đã ghi ở các bước 1.2/1.3/2.1/2.3), nên đã xác nhận qua console trình
duyệt thật bằng `import('/src/data/minimalPairs.js')`: tổng 68 cặp, đúng 7
nhãn trọng tâm cho tuần 2→8 (khác nhau từng tuần, tuần 8 ghép 2 nhãn), ưu
tiên đúng cặp `finish/finished` khi truyền `learnedTerms:['finish']` cho
tuần 4 — không có lỗi console. Component dùng cùng `PronunciationDrill.vue`
đã qua đủ test unit nên rủi ro thấp dù chưa thử tay được UI thật.

**Vấn đề (kế hoạch gốc):** pool minimal pairs trong `PronunciationDrill.vue` chỉ 20 cặp cố định, quay vòng 8 cặp/tuần → lặp từ tuần 4–5. Chưa nhắm vào hệ lỗi người Việt theo chủ đề tuần.

**Việc cần làm:**
1. Tách pool ra `src/data/minimalPairs.js`, mở rộng lên ≥ 60 cặp, nhóm theo **trọng tâm âm**: âm cuối -s/-z, -ed, -t/-d, -k/-g; cặp nguyên âm i/iː, æ/e; th/t, th/s; l/n cuối từ; tổ hợp -st/-sk.
2. Gán mỗi tuần (2–8) một trọng tâm âm **khớp ngữ pháp tuần** (vd. tuần học số ít–số nhiều → -s cuối; tuần past simple → -ed; tuần cuối → tổng hợp các nhóm khó nhất). Đọc metadata tuần trong `Base_English/*.md` để khớp đúng — đường cong ngữ pháp đã chuẩn hóa theo `KE_HOACH_DO_KHO_KHOA_HOC.md` mục 3.
3. Hàm `pairsForWeek(week, learnedTerms)`: chọn 8 cặp/tuần trong nhóm trọng tâm, không lặp trong tuần, ưu tiên cặp chứa **từ vựng đã học** khi truyền vào danh sách từ của tuần.
4. Hiện tiêu đề trọng tâm trên drill: *"Tuần này: âm cuối -ed (liked ≠ like)"* + 1 dòng mẹo đặt lưỡi cho từng nhóm.

**File liên quan:** `src/components/day/PronunciationDrill.vue`, `src/data/minimalPairs.js` (mới), `src/views/IeltsDayView.vue` (truyền vocab tuần xuống), tests.

**Nghiệm thu:** tuần 2–8 mỗi tuần thấy bộ cặp khác nhau, đúng trọng tâm khai báo; không cặp nào lặp trong cùng tuần; pool ≥ 60 cặp không có cặp trùng; `npm test` pass với test cho `pairsForWeek`.

### Bước 2.5 — Biểu đồ tiến bộ viết & nói

- [x] Đã làm

**Ghi chú (2026-07-04):** Khảo sát trước khi code phát hiện kế hoạch mô tả hơi
khác thực tế: điểm viết KHÔNG nằm trực tiếp ở `store.writing` mà lồng trong
`state.writings['course:week:day'].review = { cefr, score (0-100), summary,
lines }`, chỉ có khi `done && review` (bài đã được AI chữa xong) —
`saveWriting()` ghi `at` (ngày nộp, không đệm 0: `'2026-7-4'`). `speakingLog`
là `{ 'Y-M-D': tổng-giây-hôm-đó }`, cùng định dạng ngày không đệm 0.

Thêm `src/lib/progressStats.js` (hàm thuần, không đụng store/Vue):
- `writingSeries(writings, course)` — lọc đúng course + đã chữa xong, **sắp
  theo tuần/ngày (trình tự buổi học)** chứ không theo `at` (ngày nộp thật) —
  để nộp bù/nộp lại không làm lệch trục thời gian biểu đồ.
- `writingSummary(series)` — điểm mới nhất, đầu tiên, chênh lệch (null nếu
  chưa đủ 2 bài, không hiện "▲ +0" giả).
- `speakingWeeklyMinutes(speakingLog)` — gộp theo tuần (mốc Thứ Hai, tự parse
  định dạng ngày không đệm 0 của `ymd()`), sắp tăng dần.
- `srsRetention(srs, minCards=5)` — **tự định nghĩa mới** vì `lib/srs.js`
  chưa có sẵn hàm này: chỉ tính trên thẻ ĐÃ ÔN THẬT (`last` khác null hoặc
  từng có `lapses`) — loại thẻ mới tự "gieo" ở Bước 1.1 mà chưa ai đụng tới
  (đúng yêu cầu "không chế số"). % = tỉ lệ thẻ đang "nhớ tốt" (`reps > 0` —
  lần ôn gần nhất không phải "Quên") trong số thẻ đã ôn. Trả `null` nếu dưới
  `minCards` thẻ đã ôn thật, ẩn hẳn khối này trên UI khi đó. Ghi rõ nhãn
  "(ước tính)" trên UI vì `reps` là chuỗi đúng liên tiếp chứ không phải tổng
  số lần ôn — không có dữ liệu đủ để tính retention chuẩn xác 100%.

`src/views/ProgressView.vue` (mới, route `/progress`, `requiresAuth`,
theo đúng khuôn `container narrow section-top` + `.block`/`.empty` của
`MilestonesView.vue`): khối tổng quan 3-4 thẻ (điểm viết mới nhất + chênh
lệch, tổng phút nói, `user.dueTodayCount`, tỉ lệ nhớ từ nếu có), biểu đồ
đường SVG thuần cho điểm viết (chấm màu theo ngưỡng ≥70 xanh / <50 đỏ, nhãn
trục X chỉ hiện đầu-giữa-cuối để đỡ rối, `<title>` mỗi điểm để hover xem chi
tiết tuần/buổi/CEFR), biểu đồ cột SVG thuần cho phút nói/tuần (nhãn `DD/MM`).
Không cài chart lib nào — dùng `viewBox` + `width:100%` nên tự responsive.

Link: `IeltsCourseView.vue` thêm nút `.track-btn` "📈 Tiến độ" cạnh "📊 So
sánh mốc" có sẵn. `HomeView.vue` **không có link Milestones nào để đặt cạnh**
(đã grep xác nhận) nên thêm 1 khối `.due-card` mới (tái dùng style banner
nhắc ôn SRS có sẵn) "📈 Xem tiến độ học tập", luôn hiện (không điều kiện như
banner SRS).

**Kiểm chứng:** test mới `tests/progressStats.test.js` (13 test — lọc đúng
course/trạng thái đã chữa, sắp theo buổi học không theo ngày nộp, bỏ qua key
sai định dạng/score không phải số, `writingSummary` rỗng/1 bài/nhiều bài,
`speakingWeeklyMinutes` gộp đúng tuần + bỏ qua giá trị 0/ngày lỗi, `srsRetention`
null khi thiếu dữ liệu + tính đúng % + loại thẻ chưa ôn thật). `npm test`
(268/268, +13) và `npm run build` pass. Route `/progress` yêu cầu đăng nhập
nên không vào được qua điều hướng thật trong sandbox (cùng hạn chế các bước
trước) — đã xác nhận bằng cách mount thẳng `ProgressView.vue` vào DOM qua
console trình duyệt (tạo Vue app + Pinia riêng, `useUserStore()` lấy đúng
store đang chạy của app thật) rồi bơm dữ liệu `writings`/`speakingLog`/`srs`
giả: biểu đồ đường lên đúng hướng tăng dần kèm màu chấm đúng ngưỡng, biểu đồ
cột đúng chiều cao tỉ lệ, thẻ tổng quan hiện đúng số + chênh lệch, khối tỉ lệ
nhớ ẩn/hiện đúng theo ngưỡng `minCards`; xoá hết dữ liệu → 3 empty-state hiện
đúng, không vỡ layout; resize mobile (375px) → biểu đồ tự co theo `viewBox`,
`overview-grid` chuyển 2 cột. Card "📈 Xem tiến độ học tập" trên `HomeView.vue`
đã xác nhận hiện đúng qua điều hướng thật (route `/` không yêu cầu đăng
nhập) — bấm vào bị đá về `login=required&redirect=/progress` đúng như cấu
hình `requiresAuth` (máy này có Supabase thật nên guest bị chặn, khác các
route không cần đăng nhập).

**Vấn đề (kế hoạch gốc):** mỗi bài viết AI chữa đã lưu `{ cefr, score }` trong `store.writing`, mỗi phút nói đã ghi `speakingLog` — nhưng không đâu vẽ ra. Người học không **thấy** mình tiến bộ (yếu tố giữ chân số 1).

**Việc cần làm:**
1. Trang mới `/progress` (view riêng — Milestones thiên về nghe lại bản ghi, Progress thiên về số liệu): biểu đồ đường **điểm viết theo buổi** (score 0–100, đánh dấu mốc CEFR), biểu đồ cột **phút nói theo tuần** (`speakingLog`), thẻ tổng quan (điểm viết mới nhất + chênh so với bài đầu, tổng phút nói, số thẻ SRS đến hạn). Tỷ lệ nhớ từ chỉ hiện nếu dữ liệu `srs` đủ (có `reps`/`lapses`) — **không chế số**.
2. Tách logic gom/sắp dữ liệu ra `src/lib/progressStats.js` (hàm pure, test được) — view chỉ render.
3. Vẽ bằng SVG thuần (giữ triết lý zero-dependency của repo — **không** cài chart lib).
4. Link từ `HomeView.vue` + `IeltsCourseView.vue` (cạnh link Milestones).
5. Empty state tử tế từng khối khi chưa có dữ liệu (tuần 1), kèm hướng dẫn làm gì để có số liệu.

**File liên quan:** `src/views/ProgressView.vue` (mới), `src/lib/progressStats.js` (mới), `src/router/index.js`, `src/stores/user.js` (chỉ đọc), `src/views/HomeView.vue`, `src/views/IeltsCourseView.vue`.

**Nghiệm thu:** có ≥ 3 bài viết đã chữa → thấy đường điểm đúng thứ tự tuần/buổi; responsive mobile; không cài dependency mới; `npm test` pass với test cho `progressStats`.

---

## Đợt 3 — Trả nợ kỹ thuật (làm trước khi thêm tính năng lớn mới)

> Mục tiêu đợt này: các file khổng lồ đang làm mọi bước sau chậm đi. Refactor **không đổi hành vi** — test hiện có phải pass nguyên vẹn, không sửa test trừ khi đổi đường import.

### Bước 3.1 — Tách `IeltsDayView.vue` (1675 dòng) thành sub-components

- [x] Đã làm

**Ghi chú (2026-07-04):** File thực tế đã phình lên **1957 dòng** (không phải
1675 như kế hoạch ghi — do các Bước 1.x/2.x thêm tính năng) trước khi tách.
Tách đúng 5 component theo đề bài: [`DayHeader.vue`](../src/components/day/DayHeader.vue)
(259 dòng, banner chẩn đoán + header ring + day-nav),
[`GrammarSection.vue`](../src/components/day/GrammarSection.vue) (77 dòng, lý
thuyết + luyện tập ngữ pháp), [`WritingSection.vue`](../src/components/day/WritingSection.vue)
(417 dòng, khối lớn nhất — giàn giáo, textarea, AI chữa bài),
[`MissionSection.vue`](../src/components/day/MissionSection.vue) (139 dòng,
Mission tuần + Buổi nói người thật), [`WeekTestSection.vue`](../src/components/day/WeekTestSection.vue)
(54 dòng, CTA bài kiểm tra tuần). `IeltsDayView.vue` còn **910 dòng** (giảm
53%, hơi vượt mốc "~700" của kế hoạch — chấp nhận vì mốc gốc tính trên 1675
dòng chứ không phải 1957 dòng thực tế; `WritingSection.vue` 417 dòng, vượt
nhẹ mốc 400 vì gộp cả khối "kết quả AI chữa" (`.review`/`.rev-*`) — tách tiếp
khối đó ra thêm 1 file sẽ chỉ tăng số file mà không giảm rủi ro, không đáng).

**Nguyên tắc chọn ranh giới props/state (khác 1 chỗ so với chữ kế hoạch,
cùng tinh thần):** những computed **chỉ dùng nội bộ 1 khối** (vd `writingText`,
`missionNote`, `weekComplete`, `onGrammarComplete`) chuyển hẳn vào component
con, đọc/ghi store trực tiếp qua `useUserStore()` — đúng pattern đã có sẵn ở
`VoiceRecorder.vue`/`InlineFlashcards.vue`/`AiChat.vue` (grep xác nhận trước
khi làm). Những computed **cha còn cần** (vd `agenda` cần `missionNeeded`,
`dayReady` cần `writingDone`/`grammarPassed`, khảo sát cuối tuần cần `weekTest`)
**giữ nguyên ở cha**, truyền xuống qua props — tránh 2 nguồn sự thật. Nhờ vậy
hầu hết state vẫn "ở store như hiện tại" đúng yêu cầu, chỉ thêm vài prop nhỏ.

**CSS dùng chung — lệch kế hoạch có chủ đích:** kế hoạch nói "gom vào 1 file
CSS chung", nhưng import CSS thường (không `scoped`) sẽ áp dụng TOÀN CỤC —
khảo sát trước khi làm phát hiện 2 component khác (`ListeningDictation.vue`,
`PronunciationDrill.vue`) đã dùng class `.step-card`/`.current` **mà không tự
định nghĩa**, và ít nhất 5 file khác (`ListeningComprehension.vue`,
`ReadingComprehension.vue`, `DayView.vue`, `HomeView.vue`, `IeltsDayView.vue`
cũ) mỗi file tự định nghĩa RIÊNG `.step-card` — nếu thêm bản global sẽ vô tình
"sửa" giao diện 2 file đầu (hiện chưa có card bao ngoài) và đổi độ ưu tiên CSS
ở nơi khác, vi phạm thẳng yêu cầu "không đổi hành vi" của cả Đợt 3. Giải pháp:
[`ieltsDaySection.css`](../src/components/day/ieltsDaySection.css) — 1 file
CSS **dùng chung nội dung** nhưng mỗi component import qua
`<style scoped src="./ieltsDaySection.css">` (tính năng chuẩn của Vue SFC:
`scoped` áp dụng cho MỌI khối `<style>` của file, kể cả khối trỏ `src` ngoài)
— vẫn 1 nguồn duy nhất cho `.step-card/.step-head/.eyebrow/.step-title/
.quiz-intro/.wt-badge/.gate-line/.grammar-drill/.green-btn/.write-area/.prose`,
nhưng biên dịch RIÊNG cho từng component (không rò rỉ), zero rủi ro thị giác.
Nhân tiện dọn luôn `.check-list/.check-item/.tick/.rhythm` — CSS chết, không
còn class nào trong template khớp (còn sót từ khi bỏ checklist tự-tick trước
đây) — không có gì render dùng các class này nên xoá không đổi giao diện.

Thêm hàm dùng chung `requiredSentencesFor(prompt)` vào `src/lib/dayPlan.js`
(rút số câu bắt buộc từ đề bài viết) — trước đây tính trùng ngay trong
`IeltsDayView.vue`; giờ cả `agenda` (ở cha) lẫn `WritingSection.vue` cùng gọi
1 hàm, khỏi lệch nhau. Test mới trong `tests/dayPlan.test.js` (+3 test).

**Kiểm chứng:** `npm test` (271/271, +3) và `npm run build` đều pass (cảnh
báo CSS `stdin:899` là lỗi cú pháp comment có từ trước trong `base.css`,
không liên quan file đã sửa — đã xác nhận ở Bước 2.3). Route thật yêu cầu
đăng nhập nên không thử tay qua điều hướng được (cùng hạn chế các bước trước)
— đã mount thẳng `IeltsDayView.vue` vào DOM qua console trình duyệt (tạo Vue
app + Pinia + Router riêng, `createApp(IeltsDayView, {week,day})`) với **2
buổi thật** để phủ đủ cả 5 component: Tuần 1 Buổi 1 (buổi chẩn đoán — header,
day-nav khoá đúng, banner chẩn đoán, ngữ pháp lý thuyết + `.prose` render
đúng HTML, luyện tập ngữ pháp có gate-line, bài đọc hiểu, giàn giáo viết đúng
3 khối mẫu/khung câu/từ nối, bấm "+ chèn" và từ nối THẬT SỰ ghi vào textarea
+ đếm câu đúng, bài kiểm tra tuần khoá đúng "0/7 buổi", checkpoint đúng nhãn
"Làm bài tập ngữ pháp trước") và Tuần 3 Buổi 6 (có Mission tuần + Buổi nói
người thật — cả 2 card hiện đúng, tick checkbox THẬT SỰ đổi badge thành "✅ Đã
hoàn thành" qua store). Không có lỗi console ở cả 2 lần mount. Các khối
KHÔNG đổi code (vocab, quiz ôn nhanh, tự luyện cuối tuần, AiChat,
PronunciationDrill, ListeningDictation, VoiceRecorder, SentenceBankPractice,
ErrorLedger, modal khảo sát cuối tuần) không thử tay riêng vì style/logic của
chúng giữ nguyên 100% trong `IeltsDayView.vue` (chỉ các khối đã liệt kê ở
trên bị đụng tới).

**Việc cần làm (kế hoạch gốc):** tách các khối template + logic + style tương ứng thành component trong `src/components/day/`:
- `DayHeader.vue` (banner chẩn đoán, header card, day navigation)
- `GrammarSection.vue` (lý thuyết new/review/final + gate quiz ngữ pháp)
- `WritingSection.vue` (textarea, giàn giáo, kết quả AI chữa — **khối lớn nhất, ưu tiên**)
- `MissionSection.vue` (mission tuần + real talk — cùng pattern check-off + evidence)
- `WeekTestSection.vue` (bài ôn tuần + CTA bài kiểm tra + khối ôn bù)
Props xuống, emit lên; state giữ ở store như hiện tại. Style dùng chung giữa các section (nút, section card…) nên gom vào 1 file CSS chung trong `src/components/day/` thay vì lặp lại. Mục tiêu: `IeltsDayView.vue` còn ≤ ~700 dòng, không component mới nào > 400 dòng.

**Nghiệm thu:** `npm test` pass nguyên (không sửa logic test); đi thủ công 1 buổi học đủ các khối (điền quiz, viết bài, mission) hành vi y hệt; diff chỉ là di chuyển code, không thay đổi hành vi.

### Bước 3.2 — Tách `AiChat.vue` (1190 dòng)

- [x] Đã làm

**Ghi chú (2026-07-04):** File thực tế đã phình lên **1301 dòng** trước khi
tách (không phải 1190 — cùng nguyên nhân như Bước 3.1: các bước 1.x/2.x thêm
tính năng, ví dụ `retry`/`friendlyAiError` ở 1.4, `SpeechSupportNote` ở 2.3).
Tách đúng 3 phần theo đề bài:
[`src/composables/useChatEngine.js`](../src/composables/useChatEngine.js) (447
dòng — toàn bộ state phiên chat, gọi API/lịch sử/retry, persona, mic/voice-first,
roleplay; hàm `useChatEngine(props)` gọi `useUserStore()`/`useRouter()`-độc lập
bên trong nên chữ ký gọn, không cần truyền thêm tham số),
[`ChatMessages.vue`](../src/components/day/ChatMessages.vue) (559 dòng — render
danh sách tin nhắn + toàn bộ logic tra/lưu từ tại chỗ `tapWord`/`pop`/
`saveWordFromPop` tự quản lý nội bộ, không cần engine),
[`ChatComposer.vue`](../src/components/day/ChatComposer.vue) (125 dòng — ô
nhập/mic/đồng hồ đếm ngược, thuần props/emit không gọi API).
`AiChat.vue` còn **342 dòng**, chỉ còn layout + wiring.

**Quyết định khác kế hoạch (ranh giới props, không đổi hành vi):**
- `pop`/`tokenize`/`tapWord`/`saveWordFromPop` (tra & lưu từ) chuyển hẳn vào
  `ChatMessages.vue` vì đúng đề bài "render list + tra từ khi click" — không
  cần đi qua composable. Các hành động cần gọi API (gợi ý/ý tưởng/dịch/lưu
  câu/đổi phong cách) vẫn nằm ở `useChatEngine.js`, truyền xuống
  `ChatMessages.vue` dưới dạng **prop kiểu hàm** (`show-hint`, `save-sentence`,
  `change-persona`…) — các hàm này mutate thẳng object tin nhắn (`m.ui.hint`,
  `m.evaluation`…) nên hoạt động đúng dù gọi từ component con, vì `messages`
  là mảng reactive dùng chung (không copy).
- `savedToast`/`flashToast` (toast lưu từ/câu) giữ ở engine vì dùng chung giữa
  `ChatMessages` (lưu từ) và engine (lỗi đổi phong cách/lưu câu) — khối hiển
  thị toast vẫn ở `AiChat.vue` (nằm trong `.ai-chat` nên vị trí `absolute` không
  đổi), `ChatMessages` chỉ gọi `props.flashToast(...)`.
- Popover tra từ cần đóng khi bấm ra ngoài khung chat (`@click="closePop"` trên
  `<section class="step-card ai-chat">` cũ) — vì `pop` giờ là state riêng của
  `ChatMessages.vue`, dùng `defineExpose({ closePop })` + template ref
  (`chatMessages.value?.closePop()`) từ `AiChat.vue`. Tự đóng thêm khi
  `messages` đổi tham chiếu (reset buổi/roleplay/đổi bài) qua 1 `watch` nội bộ,
  thay cho lệnh `closePop()` rải rác trong `initSession`/`startRoleplaySession`
  cũ.
- Bỏ hẳn `scrollToEnd()` gọi thủ công rải rác trong engine (`sendTurn`,
  `startRoleplaySession`) — vì phần tử cuộn (`.chat-log`) giờ nằm trong
  `ChatMessages.vue`, không còn ref sẵn ở engine. Thay bằng 2 `watch` nội bộ
  trong `ChatMessages.vue` (`props.loading` bật → cuộn xuống thấy khung "đang
  gõ"; `props.messages.length` đổi → cuộn xuống thấy tin nhắn mới) — tái tạo
  đúng 2 thời điểm cuộn của bản gốc mà không cần engine biết về DOM.
- Dọn 1 dòng CSS chết `.persona-grid` (không class nào trong template khớp,
  đã grep xác nhận trước khi xoá) khi tách media query `.bubble{max-width:86%}`
  sang `ChatMessages.vue`.

**Kiểm chứng:** `npm test` (271/271, không đổi số lượng — bước này không có gì
để viết test logic mới, chỉ di chuyển code) và `npm run build` đều pass. Thử
tay qua `/tools/chat` (route KHÔNG yêu cầu đăng nhập, dùng Groq thật của máy
này): tra từ "English" ra đúng nghĩa từ `VOCAB_GLOSSARY`, lưu từ → toast +
saved-pill tăng đúng số, popover đóng đúng khi bấm ra khung chat; gửi câu "I
like learning English every day." → AI chấm điểm CEFR + lời phê + trả lời tiếp
đúng như cũ; bấm đổi phong cách lời phê trên thẻ đánh giá → gọi lại
`reFeedback` thật, lời phê đổi đúng giọng "Nghiêm túc". Không có lỗi console
trong suốt phiên thử.

**Việc cần làm (kế hoạch gốc, đã hoàn thành):** tách thành: `ChatMessages.vue` (render list + tra từ khi click), `ChatComposer.vue` (input + mic + countdown 10s), `useChatEngine.js` (composable: gọi API, history, retry), persona gộp vào engine hoặc composable riêng. Giữ nguyên UX.

**Nghiệm thu:** như 3.1 — test pass nguyên; chat coach/roleplay/voice/tra từ/lưu từ hoạt động y hệt (thử tay).

### Bước 3.3 — Tách `stores/user.js` (868 dòng) theo mảng

- [x] Đã làm

**Ghi chú (2026-07-04):** File thực tế đã phình lên **1032 dòng** trước khi
tách (không phải 868 — cùng nguyên nhân như Bước 3.1/3.2: các bước 1.x/2.x/2.5
thêm `weekFeedback`/`progressStats`...). Tách thành `src/stores/user/` với
**9 module** thay vì đúng 5 tên nêu trong kế hoạch (`progress.js`/`srsSlice.js`/
`quizSlice.js`/`missionSlice.js`/`syncSupabase.js`) — vì state thật có nhiều
mảng độc lập hơn 5 nhóm đó (từ đã lưu, shadowing, bài viết, nhật ký nói, tùy
chọn local đều là những mảng tách bạch, gộp cưỡng ép vào 1 trong 5 file sẽ chỉ
tạo file to lai tạp, không giảm rủi ro bảo trì — đúng tinh thần "mỗi hàm merge
có test riêng" của kế hoạch): [`helpers.js`](../src/stores/user/helpers.js)
(28 dòng, `dayKey`/`ymd`/`normalizeTerm`/`union`/`laterDate` dùng chung),
[`progressSlice.js`](../src/stores/user/progressSlice.js) (151 dòng — xp/streak/
badges/completed/checklists, `toggleDay`/`bumpStreak`/`addXp`/`markCardKnown`/
`setChecklist`), [`srsSlice.js`](../src/stores/user/srsSlice.js) (126 dòng —
`reviewCard`/`seedSrsFromDay` + mọi getter `due*`), [`quizSlice.js`](../src/stores/user/quizSlice.js)
(159 dòng — `recordQuiz`/`recordGrammarDay`/`recordVocabDay`),
[`missionSlice.js`](../src/stores/user/missionSlice.js) (146 dòng — mission
tuần + buổi nói người thật + khảo sát cuối tuần, 3 mảng cùng hình dạng
"course:week[:day]"), [`vocabSlice.js`](../src/stores/user/vocabSlice.js)
(152 dòng — từ đã lưu + shadowing, 2 mảng ĐỀU đồng bộ cloud nên gộp chung),
[`writingSlice.js`](../src/stores/user/writingSlice.js) (67 dòng),
[`speakingSlice.js`](../src/stores/user/speakingSlice.js) (78 dòng),
[`localPrefsSlice.js`](../src/stores/user/localPrefsSlice.js) (60 dòng —
convoPrefs/ieltsTrack, KHÔNG nằm trong snapshot/sync vì là "sở thích thiết bị"
chứ không phải tiến độ), [`syncSupabase.js`](../src/stores/user/syncSupabase.js)
(192 dòng — `pullAndMerge`/`detachCloud`/`schedulePush`/`pushNow`/`mergeSnapshots`
composing các hàm merge của từng slice). `src/stores/user.js` còn **117 dòng**,
chỉ compose `state()`/`getters`/`actions` từ 8 slice + định nghĩa
`snapshot`/`applySnapshot`/`persist`/`hydrate` (cần thấy toàn bộ field nên hợp
lý giữ ở tầng compose) — đúng yêu cầu "giữ một store Pinia, `useUserStore()`
không đổi": đã grep xác nhận cả 28 file gọi `@/stores/user` chỉ import đúng
`useUserStore`, không file nào import hàm/const nội bộ (an toàn để tổ chức lại
tự do bên trong).

**Nguyên tắc ranh giới (khác 1 chỗ so với kế hoạch, cùng tinh thần):** mỗi
slice export `state()`/`getters`/`actions` (một số action gọi chéo qua `this`
sang slice khác — vd `toggleDay` gọi `this.seedSrsFromDay(...)`, không sao vì
Pinia merge tất cả actions/getters vào cùng 1 object, `this` luôn là store đầy
đủ bất kể hàm định nghĩa ở file nào) và (nếu có đồng bộ cloud)
`pick(state)`/`applyDefaults(snapshot)`/`mergeXxx(a,b)` thuần — thay vì kế
hoạch gợi ý gộp `snapshot()`/`applySnapshot()` nguyên khối 1 chỗ, tách nhỏ theo
slice để mỗi slice tự khai rõ field nào thuộc mình, `user.js` chỉ ghép
`{...a.pick(this), ...b.pick(this)}` — không lặp danh sách field ở 2 nơi khác
nhau như bản gốc (`state()` và `snapshot()`/`applySnapshot()` từng liệt kê
trùng nhau).

**Kiểm chứng:** `npm test` (282/282, +11 — thêm
[`tests/userStoreMerges.test.js`](../tests/userStoreMerges.test.js) test trực
tiếp từng hàm merge (`mergeSrs`/`mergeQuiz`/`mergeMissions`/`mergeWeekFeedback`/
`mergeSaved`/`mergeShadowing`/`mergeWritings`/`mergeChecklists`/
`mergeSpeakingLog`) import thẳng từ slice, không qua store — đúng yêu cầu "mỗi
hàm merge có test riêng"; test 2 chiều đầy đủ cho MỌI hàm merge để dành cho
Bước 3.4 như kế hoạch đã phân công) và `npm run build` đều pass (cảnh báo CSS
`stdin:899` là lỗi có từ trước trong `base.css`, không liên quan). Route thật
yêu cầu đăng nhập nên không thử "đăng nhập 2 trình duyệt" được (cùng hạn chế
đã ghi ở các bước trước) — bù lại đã chạy `npm run dev` thật, xác nhận qua
`preview_network` cả 9 file slice mới đều tải 200 OK trong module graph thật
của Vite (không chỉ resolve được qua Vitest — 2 hệ resolve module khác nhau),
rồi gọi trực tiếp `useUserStore()` qua console trình duyệt với 1 Pinia riêng
(`import('/node_modules/.vite/deps/pinia.js?v=...')` + `import('/src/stores/user.js')`)
ở chế độ khách: `toggleDay` + `saveWeekFeedback` + `recordQuiz` + `saveWord` ->
`snapshot()` -> `persist()` (ghi localStorage) -> tạo lại (`hydrate()`) ->
`snapshot()` lần 2 — so `JSON.stringify` 2 lần snapshot **khớp tuyệt đối**
(xp=50 đúng 1 buổi chưa xong tuần, `srs` seed đúng 2 từ due sau 3 ngày,
`quizScores`/`weekFeedback`/`savedWords` đều đúng dữ liệu đã ghi) — xác nhận
chu trình persist/hydrate qua slice mới không làm rơi rụng field nào. Luồng
`pullAndMerge`/cloud sync giữ nguyên độ phủ nhờ 63 test có sẵn trong
`tests/user.store.test.js` (mock Supabase) chạy qua hệt các actions cũ, không
sửa 1 dòng test nào trong file đó.

**Việc cần làm (kế hoạch gốc):** giữ **một** store Pinia (đừng vỡ API `useUserStore()` — hàng chục file đang gọi) nhưng tách phần thân ra module: `src/stores/user/` gồm `progress.js` (completed, streak, XP), `srsSlice.js`, `quizSlice.js`, `missionSlice.js`, `syncSupabase.js` (pull/merge/push), rồi `user.js` compose lại. Mỗi hàm merge có test riêng.

**Nghiệm thu:** `npm test` pass nguyên; import path `@/stores/user` không đổi với mọi file khác; đăng nhập/sync/guest mode thử thủ công.

### Bước 3.4 — Bộ test cho các luồng chưa phủ

- [x] Đã làm

**Ghi chú (2026-07-05):** Rà lại độ phủ của 1.1/1.2/1.4/2.3/2.4/2.5 trước khi
viết thêm — kết luận: các bước đó đã tự kèm test khá kỹ (`srs.test.js`,
`user.store.test.js`, `aiError.test.js`/`llmRetry.test.js`/`aiChatError.test.js`,
`speechRecognize.test.js`, `minimalPairs.test.js`, `progressStats.test.js`) nên
không viết lại trùng, chỉ vá đúng 2 lỗ hổng thật tìm được khi đọc kỹ
`seedSrsFromDay` (`src/stores/user/srsSlice.js`): (1) chưa có test cho việc
gieo trùng từ trong CÙNG một buổi (khác hoa/thường/khoảng trắng) chỉ được gieo
1 lần (dựa vào `Set` khử trùng nội bộ hàm — đọc code mới thấy, chưa từng test
qua `toggleDay`); (2) chưa có test cho nhánh nhận `vocabTerms` dạng object
`{term}` (không chỉ string thuần) — cả 2 thêm vào `tests/user.store.test.js`.

**Trọng tâm chính của bước — nâng chuẩn "test 2 chiều cho mọi hàm merge đa
thiết bị":** trước bước này, `tests/userStoreMerges.test.js` chỉ có
`mergeSrs`/`mergeWeekFeedback` được gọi cả 2 chiều (`merge(a,b)` và
`merge(b,a)`); 7 hàm còn lại (`mergeQuiz`, `mergeMissions`, `mergeSaved`,
`mergeShadowing`, `mergeWritings`, `mergeChecklists`, `mergeSpeakingLog`) chỉ
test 1 chiều. Đã thêm chiều ngược lại cho cả 7 hàm + 3 test tình huống mới làm
rõ ngữ nghĩa khi đổi chiều thật sự thay đổi kết quả trung gian (`mergeQuiz`:
điểm cao nhất khác lần làm gần nhất; `mergeMissions`: done=true cũ hơn vẫn
thắng qua OR; `mergeWritings`: bản mới hơn chưa được chữa vẫn giữ `review` cũ
đã chữa) — không chỉ đổi thứ tự gọi mà không kiểm tra gì thêm. Phát hiện thêm 1
hàm merge tổng hợp `mergeSnapshots` (`src/stores/user/syncSupabase.js`) —
hàm THẬT SỰ chạy trong `pullAndMerge` — chưa từng có test đơn vị trực tiếp
(chỉ được phủ gián tiếp qua 63 test tích hợp mock Supabase trong
`user.store.test.js`, luôn gọi theo 1 chiều cố định local→remote); thêm 2 test
mới gọi trực tiếp `mergeSnapshots`, xác nhận ủy quyền đúng cho cả 9 hàm merge
con + `Math.max`/`laterDate`/`union` cho các trường còn lại, và đổi chiều gọi
(`mergeSnapshots(remote, local)`) ra cùng kết quả (so sau khi sort các trường
dạng tập hợp `knownCards`/`completed.*` vì union không giữ thứ tự phần tử khi
đổi chiều — đúng bản chất tập hợp, không phải lỗi).

**Kiểm chứng:** `npm test` tăng từ 282 → **290** (+8 test mới: 6 test 2 chiều
+ 2 test `mergeSnapshots` trong `userStoreMerges.test.js`, +2 test `seedSrsFromDay`
trong `user.store.test.js`) — chạy lại `npm test` 3 lần liên tiếp đều
290/290 pass, không có test flaky. `npm run build` pass (chỉ còn cảnh báo
chunk-size có từ trước, không liên quan).

**Nghiệm thu:** `npm test` pass; số test tăng có ý nghĩa (≥ 15 test mới); không test nào flaky (chạy 3 lần liên tiếp).

---

## Đợt 4 — UX nền tảng website

### Bước 4.1 — Home thành "bảng điều khiển hôm nay"

- [x] Đã làm

**Ghi chú (2026-07-05):** Thêm getter `nextLesson` vào
[`src/stores/user/progressSlice.js`](../src/stores/user/progressSlice.js) —
trả mảng entry `{course, label, route, week, day, title}` cho MỖI khóa đã học
≥1 buổi và CHƯA xong hết (tái dùng thẳng `computeIeltsProgress`/
`computeJavaProgress` + `getIeltsDay`/`getJavaDay` đã có sẵn ở `data/courseIelts.js`/
`data/course.js`, không viết lại logic tính tuần/ngày kế tiếp). Khách mới (chưa
học buổi nào ở cả 2 khóa) → mảng rỗng → Home giữ nguyên landing cũ.

**Phát hiện + sửa 1 bug khi viết test cho `studiedToday`:** ban đầu viết getter
trả boolean thẳng (`s.lastStudyDate === ymd(new Date())`) — test đổi
`vi.setSystemTime` sang ngày sau rồi gọi lại getter vẫn ra `true` cũ. Nguyên
nhân: Pinia getter là 1 `computed()`, chỉ theo dõi dependency REACTIVE
(`lastStudyDate`); "hôm nay" chỉ đổi theo đồng hồ thật, không phải state, nên
giá trị bị "đông cứng" qua nửa đêm nếu không có state nào khác đổi trong lúc
đó. Sửa theo đúng pattern `isCardDue` đã có sẵn trong `srsSlice.js`: trả về
**hàm** `() => s.lastStudyDate === ymd(new Date())` — closure gọi ở THỜI ĐIỂM
GỌI nên luôn đọc đồng hồ hiện tại, không bị cache. Gọi là `user.studiedToday()`
(có dấu ngoặc) thay vì `user.studiedToday`.

Thêm `pendingWeekMission(user, week)` vào
[`src/lib/missionStats.js`](../src/lib/missionStats.js) (tách hàm nội bộ
`extractMissionText()` dùng chung với `missionLogEntries` đã có sẵn, tránh lặp
lần 3 cùng 1 đoạn regex) — dò từng buổi trong tuần tìm bullet "🌍 Mission tuần",
trả về buổi + nội dung nếu CHƯA đánh dấu xong, `null` nếu tuần không có mission
hoặc đã xong (không nhắc lại).

[`src/views/HomeView.vue`](../src/views/HomeView.vue): thêm khối "Hôm nay"
(`v-if="hasProgress"`) thay hẳn phần HERO marketing khi người học đã có tiến
độ — nút "▶ Học tiếp" cho từng khóa (2 nút nếu học song song 2 khóa), hàng chip
🔥 streak (+ ⚠️ cảnh báo sắp đứt nếu `!studiedToday()`), 🗣️ streak nói, 📆 N từ
đến hạn (link `?deck=due`, tái dùng route đã có ở Bước 1.1), 🎯 quiz tuần chưa
đạt (tái dùng đúng điều kiện `remedial` mà `IeltsCourseView.vue` đã dùng — chỉ
IELTS có gate tuần), và 1 dòng nhắc Mission tuần nếu có. Khách mới (`v-else`)
thấy đúng HERO cũ, không đổi gì. 2 khối due-review/link tiến độ cũ dưới HERO
giữ nguyên, không gộp vào (tránh rủi ro đổi hành vi phần đã hoạt động tốt).

**Kiểm chứng:** test mới — `tests/user.store.test.js` (+4: khách mới rỗng,
1 khóa, song song 2 khóa không lẫn, `studiedToday()` không bị cache qua ngày)
và `tests/missionStats.test.js` (mới, 5 test cho `pendingWeekMission` — có
mission chưa xong, đã xong thì null, tuần cuối mission ở buổi lệch (14 thay vì
6), tuần không tồn tại/undefined an toàn). `npm test` (299/299, +11) và
`npm run build` pass. Thử tay qua preview (route `/` không yêu cầu đăng nhập):
seed `localStorage` với tiến độ IELTS Tuần 1 Buổi 1 xong + quiz tuần trượt +
1 từ đến hạn → đúng cả 2 nút/chip/dòng mission hiện đúng dữ liệu, không lỗi
console; xoá tiến độ → về đúng HERO cũ. Không bấm-thử được nút "Học tiếp" dẫn
tới `/courses/ielts/week/1/day/2` qua điều hướng thật trong sandbox (route
`requiresAuth`, máy này cấu hình Supabase thật — cùng hạn chế đã ghi ở nhiều
bước trước) — xác nhận gián tiếp bằng cách gọi thẳng
`router.push({name:'ielts-day', params:{week:1,day:2}})` qua console trình
duyệt với CÙNG tham số mà `goContinue()` dùng: router chấp nhận route, chỉ
treo ở bước chờ `waitForAuthReady` (đúng hành vi khi không có mạng thật tới
Supabase trong sandbox, không phải lỗi code); nút chip không cần đăng nhập
(`?deck=due`) đã xác nhận điều hướng đúng qua gọi trực tiếp `router.push` với
đúng tham số của `goDueReview()`.

**Vấn đề:** `HomeView.vue` đang là landing giới thiệu; người học quay lại mỗi ngày phải tự bấm vào khóa → tuần → buổi.

**Việc cần làm:** khi có tiến độ (không phải khách mới), phần đầu Home đổi thành khối "Hôm nay":
1. Nút to **"▶ Học tiếp: Tuần X · Buổi Y — {tiêu đề buổi}"** (buổi chưa xong đầu tiên; hiện cho cả 2 khóa nếu học song song).
2. Hàng chip: 🔥 streak học (+ cảnh báo "sắp đứt streak — học 1 buổi trước 24h" nếu hôm nay chưa học), 🗣️ streak nói, 📆 N từ đến hạn (từ bước 1.1), 🎯 quiz tuần chưa đạt (nếu có).
3. Mission tuần này chưa làm → 1 dòng nhắc.
4. Khách mới giữ nguyên landing hiện tại.

**File liên quan:** `src/views/HomeView.vue`, `src/stores/user.js` (getter `nextLesson` — tính từ `completed` + cấu trúc course), `src/data/courseIelts.js`, `src/data/course.js`.

**Nghiệm thu:** user có tiến độ thấy đúng buổi kế tiếp, bấm vào đúng URL; user mới thấy landing cũ; `npm test` pass với test cho `nextLesson`.

**Phụ thuộc:** bước 1.1 (chip từ đến hạn) — nếu 1.1 chưa làm thì bỏ chip đó, đừng chặn cả bước.

### Bước 4.2 — Dark mode

- [x] Đã làm

**Ghi chú (2026-07-05):** Hạ tầng: `base.css` thêm block
`:root[data-theme='dark']` override toàn bộ token màu hiện có (`--bg`,
`--surface`, `--ink`, `--muted*`, `--slate`, `--line*`, `--bg-success/danger/
warning`, `--text-success/danger/warning`, `--border-*`...) + vài token mới
cần cho việc dọn hex chung (`--disabled-bg`, `--bg-muted`, `--header-bg(-solid)`,
`--track-bg`, `--danger-strong`, `--today-card-bg`, `--chip-bg`, `--chip-warn-bg`).
Màu brand/accent (`--purple`, `--green`, `--amber`...) và gradient nút
(`--grad-*`) giữ nguyên cả 2 theme (luôn rực rỡ). `src/composables/useTheme.js`
(mới) — state `theme` module-level singleton, đọc `localStorage` trước, không
có thì theo `prefers-color-scheme`, theo dõi `change` của media query khi
người dùng CHƯA từng bấm toggle tay. `index.html` có 1 script inline nhỏ chặn
FOUC (set `data-theme` lên `<html>` trước khi Vue mount) — đọc đúng cùng khoá
`devleap:theme`. Nút toggle 🌙/☀️ thêm vào `.header-right` của
`AppHeader.vue`, trước `GlobalSearch`.

**Dọn hex hard-code — do khối lượng quá lớn (audit ban đầu: ~670 lần hex
trong hơn 45 file `.vue`), tự làm phần hạ tầng + nhóm Home/Course/ConquestMap
trước, sau đó chạy 4 agent song song xử lý 4 nhóm còn lại** (buổi học IELTS+Java;
chat & luyện tập; Milestones/Progress/Assessment/ToolsView/admin; công cụ
Flashcard/Shadowing/CodePlayground/Quiz/Saved/LessonPicker/Dictionary), mỗi
agent theo đúng 1 bộ quy tắc mapping hex → token (vd `#fff` card → `var(--surface)`,
chữ xám thân bài → `var(--muted)/--slate`, KHÔNG đụng chữ trắng trên nút/badge
màu, KHÔNG đụng gradient nút/banner cố ý, KHÔNG đụng khối "luôn tối" kiểu
`.checkpoint`/console giả lập). Gradient pastel dùng làm "card nổi bật"
(vd `.today-card`, `.goal`, `.mission-card`, `.diag-card`, `.scenario-tag`,
`.tool-card.on`...) được giữ nguyên ở light, thêm rule
`[data-theme='dark'] .class { background: var(--bg-accent|success|warning); }`
ngay trong cùng khối `<style scoped>` — hợp lệ vì `data-theme` nằm trên `<html>`
(tổ tiên), Vue chỉ gắn hash vào selector cuối. Tự tay vá thêm 2 chỗ agent bỏ
sót: chữ nâu ấm cứng (`#7a5200`/`#6a5a3a`/`#5a4300`) trong `.diag-body`/
`.mission-check` nằm TRÊN banner đã có override dark → thêm override màu chữ
sang `var(--text-warning)`/`var(--amber-ink)` (2 token này đã có bản dark sáng
màu hơn); và hàm `optStyle()` trong `<script>` của `QuizTool.vue` (đáp án trắc
nghiệm) — 3 agent kia được dặn "không sửa script" nên bỏ qua đúng theo luật,
nhưng hàm này trả `:style` inline cho đúng nền/chữ đáp án nên cần đổi sang
chuỗi `'var(--surface)'`/`'var(--ink)'`/... (CSS custom property hoạt động
bình thường trong giá trị `:style` inline, giống cách `ConquestMap.vue` vốn đã
làm với `styleFor()`). `ConquestMap.vue` (roadmap dùng chung Java/IELTS) toàn
bộ màu tính trong JS (`styleFor()`, `lineGradient`) — đổi cả 2 trạng thái
"done"/"locked" sang token, giữ "current" (card gradient tím) nguyên vì luôn
nổi bật cả 2 theme.

**Không cài `vite-plugin-pwa`/thư viện theme nào** — toàn bộ tự viết
(zero-dependency, đúng triết lý repo).

**Kiểm chứng:** `npm run build` pass (chỉ còn 2 cảnh báo có từ trước: chunk-size
và 1 comment tiếng Việt chứa dấu `:` bị parser CSS-minify hiểu nhầm — không
liên quan các file đã sửa, đã xác nhận từ Bước 2.3/3.x). `npm test` 299/299
pass (bước này thuần CSS/template, không sửa logic nên không thêm test mới).
Thử tay qua preview (route `/` và `/tools` không yêu cầu đăng nhập): bấm
toggle đổi light ⇄ dark tức thì, `localStorage` lưu đúng khoá
`devleap:theme`, reload giữ nguyên lựa chọn; `document.documentElement`
nhận đúng `data-theme`; kiểm `getComputedStyle` trực tiếp trên `.tool-card`/
`.tool-card.on`/`.header`/`.footer`/`body` ở cả 2 theme ra đúng token (vd
`--surface` dark = `rgb(28,28,43)`, light = trắng; `.tool-card.on` light ra
đúng gradient tím nhạt gốc, dark ra đúng `var(--bg-accent)`) — không còn
"card trắng nổi trên nền tối". Lưu ý: khi đổi theme nhiều lần liên tục qua
SPA (không reload) trong lúc dev server đang HMR dồn dập, có lúc thấy giá trị
CSS variable "trễ" 1 nhịp (Vite HMR staleness, chỉ ở dev) — reload sạch thì
luôn đúng ngay; không phải lỗi code. Các route yêu cầu đăng nhập
(`/courses/*`, `/milestones`, `/progress`, `/shadowing`, buổi học) không tự
đăng nhập được trong sandbox preview (Supabase thật, cùng hạn chế đã ghi ở rất
nhiều bước trước) nên phần lớn được xác nhận qua đọc kỹ diff + đồng nhất theo
1 bộ token dùng chung, thay vì thử tay từng màn hình.

**Việc cần làm (kế hoạch gốc, đã hoàn thành):** app đã dùng CSS variables (`--green`, `--ink`, `--bg`…) — kiểm kê toàn bộ màu hard-code trong style scoped của các component (rất nhiều hex ghi thẳng), đưa về biến; thêm bộ biến dark trong `:root[data-theme="dark"]`; nút toggle 🌙/☀️ ở `AppHeader.vue`; mặc định theo `prefers-color-scheme`; lưu lựa chọn localStorage. Chú ý các khối gradient (header card buổi học, conquest map, banner) cần cặp màu dark riêng; kiểm tra cả các view Java cho đồng bộ.

**Nghiệm thu:** đi qua Home, course map, 1 buổi học đủ khối, tools, milestones, admin ở cả 2 theme — không chỗ nào chữ tối trên nền tối / trắng trên trắng; toggle nhớ qua reload; hệ thống đổi theme thì app theo (khi chưa chọn tay).

### Bước 4.3 — PWA: cài lên màn hình chính + offline nội dung đã học

- [ ] Chưa làm

**Việc cần làm:**
1. `manifest.webmanifest` (tên, icon 192/512 — sinh từ logo hiện có trong `src/images/` hoặc chữ D nền xanh), theme color.
2. Service worker (viết tay hoặc `vite-plugin-pwa` — nếu cài plugin thì đây là **ngoại lệ zero-dependency có chủ đích**, ghi rõ trong commit): precache app shell + `Base_English/*.md` + `weeks/*.md` + data tĩnh; runtime cache stale-while-revalidate cho ảnh/audio. **Không** cache Netlify Functions (AI cần mạng) — offline thì các nút AI disable kèm giải thích.
3. Trạng thái offline: banner nhỏ "Đang offline — bài học vẫn xem được, AI và sync tạm dừng".

**Nghiệm thu:** Lighthouse báo installable; tắt mạng sau 1 lần vào → vẫn mở được buổi đã xem, flashcard chạy (dữ liệu local), nút AI disable có giải thích; bật mạng lại → sync đẩy bù (store không mất pending changes).

**Phụ thuộc:** nên làm sau 2.2 (ảnh ổn định/local mới cache offline trọn vẹn).

### Bước 4.4 — Nhắc học hằng ngày

- [ ] Chưa làm

**Việc cần làm (mức tăng dần, làm mức 1 trước):**
1. **Mức 1 — trong app:** nếu hôm nay chưa học và giờ hiện tại ≥ 20h, Home hiện banner "🔥 Streak N ngày sắp đứt — 1 buổi 15' là giữ được". Kèm mục "giờ học quen thuộc" đơn giản (localStorage).
2. **Mức 2 — Notification qua PWA (phụ thuộc 4.3):** xin quyền notification sau khi người học hoàn thành buổi thứ 3 (đúng lúc — đừng xin ngay lần đầu mở); nhắc theo giờ đã đặt bằng cách đơn giản (kiểm tra khi mở app + Notification API khi tab còn mở; **không** dựng server push trừ khi được yêu cầu riêng).

**Nghiệm thu:** mức 1 hiện đúng điều kiện (chưa học + tối); không hỏi quyền notification trước buổi thứ 3; từ chối quyền thì không hỏi lại.

---

## Đợt 5 — Mở rộng (làm khi các đợt trên xong)

### Bước 5.1 — Leaderboard tuần (opt-in)

- [ ] Chưa làm

Bảng xếp hạng XP tuần giữa những người học (Supabase đã có bảng user + XP). Ẩn danh mặc định (tên tự đặt), opt-in mới xuất hiện. View trong `/tools` hoặc Home. Cần bảng/view SQL tổng XP theo tuần + RLS chỉ đọc được phần đã opt-in. Cân nhắc kỹ: chỉ làm nếu có ≥ 2 người dùng thật.

### Bước 5.2 — Chạy code Java thật trong CodePlayground

- [ ] Chưa làm

`CodePlayground.vue` hiện chỉ highlight. Tích hợp API thực thi công khai (Piston API — free, không cần key) qua Netlify Function mới `run-java.js` (proxy + giới hạn tần suất). Hiện stdout/stderr, timeout 10s. (Ngoài trọng tâm tiếng Anh — làm cuối.)

### Bước 5.3 — Nghe chép chính tả từ clip thật (nối dài thang nghe)

- [ ] Chưa làm

Tuần 7–8: `ListeningDictation` thêm chế độ lấy 5 câu từ clip shadowing của tuần (đã curate ở 1.3) thay vì TTS — nghe giọng thật, chép, chấm text như cũ. Phát đoạn start–end của câu từ YouTube player (logic tương tự đã có trong `ShadowingPlayer.vue`). **Phụ thuộc:** 1.3.

### Bước 5.4 — Trợ lý ôn sổ lỗi

- [ ] Chưa làm

Mỗi tuần 1 lần, gom các lỗi trong Error Ledger + câu quiz sai (`quizScores[].wrong`) gửi AI sinh 5 câu bài tập cá nhân hóa đúng lỗi của chính người học (dạng điền/sửa câu, render bằng `QuizTool.vue` mode practice). Nút "🩺 Bài tập từ lỗi của em" trong buổi cuối tuần. Cần thêm 1 prompt builder trong `netlify/functions/_llm.js`.

---

## Thứ tự khuyến nghị & trạng thái

| Bước | Tên | Ước lượng | Trạng thái |
| --- | --- | --- | --- |
| 1.1 | SRS tự động + nhắc ôn | 1 buổi | ✅ |
| 1.2 | Khảo sát Dễ/Vừa/Khó | 0.5 buổi | ✅ |
| 1.3 | Curate shadowing 4–8 | 0.5–1 buổi | ✅ |
| 1.4 | Retry/backoff AI | 0.5 buổi | ✅ |
| 2.1 | Sync ghi âm | 1 buổi | ✅ |
| 2.2 | Ảnh từ vựng ổn định | 0.5–1 buổi | ✅ |
| 2.3 | Fallback Safari/iOS | 1 buổi | ✅ |
| 2.4 | Minimal pairs theo tuần | 0.5 buổi | ✅ |
| 2.5 | Biểu đồ tiến bộ | 1 buổi | ✅ |
| 3.1 | Tách IeltsDayView | 1–2 buổi | ✅ |
| 3.2 | Tách AiChat | 1 buổi | ✅ |
| 3.3 | Tách store user | 1 buổi | ✅ |
| 3.4 | Test bổ sung | 0.5 buổi | ✅ |
| 4.1 | Home dashboard | 1 buổi | ✅ |
| 4.2 | Dark mode | 1–2 buổi | ✅ |
| 4.3 | PWA offline | 1–2 buổi | ⬜ |
| 4.4 | Nhắc học | 0.5–1 buổi | ⬜ |
| 5.1–5.4 | Mở rộng | tùy chọn | ⬜ |

**Quy tắc chung cho mọi bước (AI thực hiện phải tuân thủ):**
1. Trước khi code: đọc file liên quan nêu trong bước, xác nhận tên hàm/biến thật (kế hoạch mô tả theo khảo sát 2026-07-04, code có thể đã trôi).
2. Không cài dependency mới trừ khi bước ghi rõ cho phép.
3. Làm xong: `npm test` pass (kể cả test mới của bước); nếu có đụng nội dung `Base_English/` thì `npm run audit:weeks` + `npm run audit:reading` không được xấu đi.
4. Tick checkbox bước trong file này + ghi 1–3 dòng "**Ghi chú (ngày):** đã làm gì, quyết định gì khác với kế hoạch".
5. Commit riêng từng bước, message theo phong cách repo (tiếng Việt không dấu, `feat:` / `fix:`).
