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

- [ ] Chưa làm

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

- [ ] Chưa làm

**Vấn đề:** `src/lib/vocabImage.js` dùng LoremFlickr — ảnh ngẫu nhiên theo keyword, thường sai nghĩa, chậm, và là điểm phụ thuộc ngoài duy nhất trong màn học từ.

**Việc cần làm (chọn 1 trong 2, để AI thực hiện tự cân nhắc và ghi lại lựa chọn):**
- **Phương án A:** ảnh tĩnh tự host cho ~400 từ trong `vocabGlossary.js` — một lần chạy script tải về `public/images/vocab/` (nguồn license-safe: Openverse/Wikimedia), fallback runtime là thẻ chữ cái đầu + emoji chủ đề (không gọi mạng). Ưu điểm: offline được, không còn phụ thuộc ngoài. Nhược: phải kiểm license hàng loạt.
- **Phương án B:** giữ ảnh online nhưng đổi nguồn **đúng nghĩa + ổn định theo từ** (gợi ý: Wikimedia/Wikipedia REST API thumbnail theo term), cache URL vào localStorage (TTL dài, cache cả kết quả rỗng), `loading="lazy"` + skeleton + timeout ~3s → fallback thẻ chữ + emoji. Chấp nhận vẫn cần mạng lần đầu.
Dù phương án nào: cùng 1 từ phải luôn ra cùng 1 ảnh; nên gom logic hiển thị vào 1 component dùng chung cho `VocabCard.vue` và `FlashcardTool.vue`.

**File liên quan:** `src/lib/vocabImage.js`, `src/components/day/VocabCard.vue`, `src/components/tools/FlashcardTool.vue`, `src/data/vocabGlossary.js`, `scripts/` (nếu phương án A).

**Nghiệm thu:** tắt mạng (hoặc chặn domain ảnh) → thẻ từ vẫn hiển thị tử tế (fallback), không vỡ layout; ảnh không đổi lung tung giữa 2 lần xem cùng 1 từ; `npm test` pass.

### Bước 2.3 — Fallback tử tế khi không có Web Speech API (Safari/iOS)

- [ ] Chưa làm

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

- [ ] Chưa làm

**Vấn đề:** pool minimal pairs trong `PronunciationDrill.vue` chỉ 20 cặp cố định, quay vòng 8 cặp/tuần → lặp từ tuần 4–5. Chưa nhắm vào hệ lỗi người Việt theo chủ đề tuần.

**Việc cần làm:**
1. Tách pool ra `src/data/minimalPairs.js`, mở rộng lên ≥ 60 cặp, nhóm theo **trọng tâm âm**: âm cuối -s/-z, -ed, -t/-d, -k/-g; cặp nguyên âm i/iː, æ/e; th/t, th/s; l/n cuối từ; tổ hợp -st/-sk.
2. Gán mỗi tuần (2–8) một trọng tâm âm **khớp ngữ pháp tuần** (vd. tuần học số ít–số nhiều → -s cuối; tuần past simple → -ed; tuần cuối → tổng hợp các nhóm khó nhất). Đọc metadata tuần trong `Base_English/*.md` để khớp đúng — đường cong ngữ pháp đã chuẩn hóa theo `KE_HOACH_DO_KHO_KHOA_HOC.md` mục 3.
3. Hàm `pairsForWeek(week, learnedTerms)`: chọn 8 cặp/tuần trong nhóm trọng tâm, không lặp trong tuần, ưu tiên cặp chứa **từ vựng đã học** khi truyền vào danh sách từ của tuần.
4. Hiện tiêu đề trọng tâm trên drill: *"Tuần này: âm cuối -ed (liked ≠ like)"* + 1 dòng mẹo đặt lưỡi cho từng nhóm.

**File liên quan:** `src/components/day/PronunciationDrill.vue`, `src/data/minimalPairs.js` (mới), `src/views/IeltsDayView.vue` (truyền vocab tuần xuống), tests.

**Nghiệm thu:** tuần 2–8 mỗi tuần thấy bộ cặp khác nhau, đúng trọng tâm khai báo; không cặp nào lặp trong cùng tuần; pool ≥ 60 cặp không có cặp trùng; `npm test` pass với test cho `pairsForWeek`.

### Bước 2.5 — Biểu đồ tiến bộ viết & nói

- [ ] Chưa làm

**Vấn đề:** mỗi bài viết AI chữa đã lưu `{ cefr, score }` trong `store.writing`, mỗi phút nói đã ghi `speakingLog` — nhưng không đâu vẽ ra. Người học không **thấy** mình tiến bộ (yếu tố giữ chân số 1).

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

- [ ] Chưa làm

**Việc cần làm:** tách các khối template + logic + style tương ứng thành component trong `src/components/day/`:
- `DayHeader.vue` (banner chẩn đoán, header card, day navigation)
- `GrammarSection.vue` (lý thuyết new/review/final + gate quiz ngữ pháp)
- `WritingSection.vue` (textarea, giàn giáo, kết quả AI chữa — **khối lớn nhất, ưu tiên**)
- `MissionSection.vue` (mission tuần + real talk — cùng pattern check-off + evidence)
- `WeekTestSection.vue` (bài ôn tuần + CTA bài kiểm tra + khối ôn bù)
Props xuống, emit lên; state giữ ở store như hiện tại. Style dùng chung giữa các section (nút, section card…) nên gom vào 1 file CSS chung trong `src/components/day/` thay vì lặp lại. Mục tiêu: `IeltsDayView.vue` còn ≤ ~700 dòng, không component mới nào > 400 dòng.

**Nghiệm thu:** `npm test` pass nguyên (không sửa logic test); đi thủ công 1 buổi học đủ các khối (điền quiz, viết bài, mission) hành vi y hệt; diff chỉ là di chuyển code, không thay đổi hành vi.

### Bước 3.2 — Tách `AiChat.vue` (1190 dòng)

- [ ] Chưa làm

**Việc cần làm:** tách thành: `ChatMessages.vue` (render list + tra từ khi click), `ChatComposer.vue` (input + mic + countdown 10s), `useChatEngine.js` (composable: gọi API, history, retry), persona gộp vào engine hoặc composable riêng. Giữ nguyên UX.

**Nghiệm thu:** như 3.1 — test pass nguyên; chat coach/roleplay/voice/tra từ/lưu từ hoạt động y hệt (thử tay).

### Bước 3.3 — Tách `stores/user.js` (868 dòng) theo mảng

- [ ] Chưa làm

**Việc cần làm:** giữ **một** store Pinia (đừng vỡ API `useUserStore()` — hàng chục file đang gọi) nhưng tách phần thân ra module: `src/stores/user/` gồm `progress.js` (completed, streak, XP), `srsSlice.js`, `quizSlice.js`, `missionSlice.js`, `syncSupabase.js` (pull/merge/push), rồi `user.js` compose lại. Mỗi hàm merge có test riêng.

**Nghiệm thu:** `npm test` pass nguyên; import path `@/stores/user` không đổi với mọi file khác; đăng nhập/sync/guest mode thử thủ công.

### Bước 3.4 — Bộ test cho các luồng chưa phủ

- [ ] Chưa làm

**Việc cần làm:** viết test bổ sung cho những gì các bước trước đã thêm và các lỗ hổng sẵn có: auto-seed SRS (1.1), merge `weekFeedback` (1.2), format lỗi AI + helper (1.4), `speechSupport()` fallback (2.3), `pairsForWeek` (2.4), `progressStats` (2.5) — nếu các bước đó đã tự kèm test thì rà lại độ phủ. Nâng chuẩn: **mọi hàm merge đa thiết bị trong store phải có test 2 chiều** (A mới hơn B, và B mới hơn A).

**Nghiệm thu:** `npm test` pass; số test tăng có ý nghĩa (≥ 15 test mới); không test nào flaky (chạy 3 lần liên tiếp).

---

## Đợt 4 — UX nền tảng website

### Bước 4.1 — Home thành "bảng điều khiển hôm nay"

- [ ] Chưa làm

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

- [ ] Chưa làm

**Việc cần làm:** app đã dùng CSS variables (`--green`, `--ink`, `--bg`…) — kiểm kê toàn bộ màu hard-code trong style scoped của các component (rất nhiều hex ghi thẳng), đưa về biến; thêm bộ biến dark trong `:root[data-theme="dark"]`; nút toggle 🌙/☀️ ở `AppHeader.vue`; mặc định theo `prefers-color-scheme`; lưu lựa chọn localStorage. Chú ý các khối gradient (header card buổi học, conquest map, banner) cần cặp màu dark riêng; kiểm tra cả các view Java cho đồng bộ.

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
| 2.1 | Sync ghi âm | 1 buổi | ⬜ |
| 2.2 | Ảnh từ vựng ổn định | 0.5–1 buổi | ⬜ |
| 2.3 | Fallback Safari/iOS | 1 buổi | ⬜ |
| 2.4 | Minimal pairs theo tuần | 0.5 buổi | ⬜ |
| 2.5 | Biểu đồ tiến bộ | 1 buổi | ⬜ |
| 3.1 | Tách IeltsDayView | 1–2 buổi | ⬜ |
| 3.2 | Tách AiChat | 1 buổi | ⬜ |
| 3.3 | Tách store user | 1 buổi | ⬜ |
| 3.4 | Test bổ sung | 0.5 buổi | ⬜ |
| 4.1 | Home dashboard | 1 buổi | ⬜ |
| 4.2 | Dark mode | 1–2 buổi | ⬜ |
| 4.3 | PWA offline | 1–2 buổi | ⬜ |
| 4.4 | Nhắc học | 0.5–1 buổi | ⬜ |
| 5.1–5.4 | Mở rộng | tùy chọn | ⬜ |

**Quy tắc chung cho mọi bước (AI thực hiện phải tuân thủ):**
1. Trước khi code: đọc file liên quan nêu trong bước, xác nhận tên hàm/biến thật (kế hoạch mô tả theo khảo sát 2026-07-04, code có thể đã trôi).
2. Không cài dependency mới trừ khi bước ghi rõ cho phép.
3. Làm xong: `npm test` pass (kể cả test mới của bước); nếu có đụng nội dung `Base_English/` thì `npm run audit:weeks` + `npm run audit:reading` không được xấu đi.
4. Tick checkbox bước trong file này + ghi 1–3 dòng "**Ghi chú (ngày):** đã làm gì, quyết định gì khác với kế hoạch".
5. Commit riêng từng bước, message theo phong cách repo (tiếng Việt không dấu, `feat:` / `fix:`).
