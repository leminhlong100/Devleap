# Kế hoạch cải tiến toàn diện giao diện mobile — biến DevLeap thành app học tiếng Anh PWA thật sự

> **Ngày lập:** 2026-07-05. Kế hoạch kế thừa `KE_HOACH_CAI_TIEN_WEBSITE.md` (đã xong 21/21 bước — trong đó
> Bước 4.3 đã dựng nền PWA: manifest + service worker + offline banner; Bước 4.4 đã có nhắc học qua Notification).
> Kế hoạch này tập trung vào **UX/UI mobile**: dùng trên điện thoại phải có cảm giác như một app học tiếng Anh
> native (kiểu Duolingo/Elsa), không phải "website xem trên điện thoại".
>
> **Cách dùng file này:** mỗi lần nhờ AI, mở phiên mới và nói:
> *"Đọc `docs/KE_HOACH_MOBILE_PWA.md`, thực hiện **Bước N.X**. Làm xong chạy `npm test`, kiểm tra giao diện ở
> khung 375×812 (mobile) và 1280×800 (desktop) cả light lẫn dark mode, tick checkbox của bước đó trong file kế
> hoạch và ghi chú ngắn những gì đã làm."*
> Mỗi bước được viết **tự chứa** (đủ ngữ cảnh, file liên quan, tiêu chí nghiệm thu) để AI làm độc lập.
> Thứ tự trong mỗi đợt là thứ tự khuyến nghị; các bước không phụ thuộc nhau trừ khi ghi rõ **"Phụ thuộc:"**.

---

## 0. Chẩn đoán hiện trạng (khảo sát 2026-07-05)

Nền đã có: manifest `standalone` + icon 192/512, service worker stale-while-revalidate viết tay (`public/sw.js`),
OfflineBanner, dark mode CSS variables, hamburger menu ở ≤720px, viewport meta đúng, nhắc học qua Notification.

Khoảng trống tìm thấy:

| # | Vấn đề | Ảnh hưởng trên điện thoại |
| --- | --- | --- |
| 1 | **Không có bottom navigation** — điều hướng chính nằm trong hamburger menu trên header | Mọi lần chuyển màn phải với ngón tay lên góc trên + 2 chạm; app học thật luôn có tab bar dưới |
| 2 | **Không xử lý safe-area** — thiếu `viewport-fit=cover`, không có `env(safe-area-inset-*)` ở đâu cả | iPhone tai thỏ/thanh home đè lên nút bấm dưới cùng khi chạy standalone |
| 3 | Breakpoint nhỏ nhất là 560px, nhiều component không có breakpoint nào; padding cố định 26–32px | Ở 375px: chữ tràn, thao tác chật; `AgendaRail` 268px + gap chiếm gần hết chiều ngang |
| 4 | 30+ tương tác chỉ có `:hover`, không có `:active`; nhiều tap target 38px (< 44px chuẩn); không có `touch-action: manipulation` | Bấm không có phản hồi tức thì, dễ bấm trượt, double-tap zoom ngoài ý muốn |
| 5 | Kéo-thả (QuizTool sắp xếp từ, SentenceBankPractice) là thao tác chính | Kéo-thả trên màn 375px rất khó; chuẩn mobile là **chạm để chọn** |
| 6 | Chat AI: composer không dính đáy, không xử lý bàn phím ảo (visualViewport); popover nghĩa từ định vị theo tọa độ chuột, min-width 230px | Bàn phím che ô nhập; popover tràn màn hình nhỏ |
| 7 | `100vh` dùng ở nhiều chỗ (ShadowingPlayer `calc(100vh - 130px)`) | Thanh URL mobile co giãn làm layout nhảy; chuẩn là `dvh` |
| 8 | Font chữ Google Fonts tải từ CDN (cross-origin — SW chỉ cache cùng gốc) | Offline mất font; lần đầu mở chậm |
| 9 | Manifest thiếu icon `maskable`, screenshots, shortcuts; không có install prompt (`beforeinstallprompt`), không hướng dẫn cài trên iOS | Người học không biết cài được app; icon Android bị viền trắng xấu |
| 10 | Service worker không có luồng cập nhật — deploy bản mới người dùng cũ vẫn chạy cache cũ đến khi tự reload | Sửa bug xong người học không nhận được |
| 11 | Chuyển trang chỉ có fade; không có gesture (swipe flashcard), không có haptic | Cảm giác "web", không phải "app" |
| 12 | Chưa từng audit Lighthouse mobile / thử trên thiết bị thật ở chế độ standalone | Không biết điểm nghẽn thật (mic, TTS, autoplay trong standalone iOS có luật riêng) |

**Nguyên tắc thiết kế xuyên suốt (mọi bước phải theo):**
- **Mobile-first cho màn hình học**: thiết kế cho 375px trước, desktop là bản mở rộng. Breakpoint chuẩn hóa: `≤480px` (phone), `≤720px` (phone lớn/tablet dọc — đã dùng ở header), `≥960px` (desktop).
- **Tap target ≥ 44×44px** cho mọi nút/ô bấm được; khoảng cách giữa 2 target ≥ 8px.
- **Vùng ngón cái**: hành động chính của mỗi màn (Hoàn thành buổi, Gửi chat, Chấm thẻ) phải nằm nửa dưới màn hình.
- **Chạm thay kéo**: mọi drag-drop phải có đường tap tương đương.
- **Không cài dependency mới** (triết lý repo) — gesture/bottom sheet/toast tự viết bằng CSS + pointer events.
- Mỗi bước sửa UI phải kiểm tra: 375×812 + 1280×800, light + dark (`data-theme`), và không phá desktop hiện có.

---

## Đợt 1 — App shell mobile (nền của mọi màn hình, làm trước tiên)

### Bước 1.1 — Bottom tab bar + tinh gọn header mobile

- [x] Đã làm

**Ghi chú (2026-07-05):** Tạo `BottomNav.vue` (5 tab: Trang chủ/Khóa học/Shadowing/Công cụ/Tiến bộ, active theo
`route.name` giống cách `AppHeader` đang làm — không dùng `path.startsWith` vì tên route đã đủ phân biệt cả
route con) + `useKeyboardOpen.js` (composable singleton theo pattern `useOnlineStatus`, so `visualViewport.height`
với `window.innerHeight`, ẩn tab bar khi lệch > 150px). Gắn `BottomNav` sau `AppFooter` trong `App.vue`; ẩn hẳn
`.footer` và cộng `padding-bottom` cho `.app-main` ở ≤720px; đẩy `BackToTop` lên trên tab bar bằng `:deep()`.
`AppHeader`: bỏ hẳn hamburger + nav ngang dạng dropdown (không giữ mục phụ nào vì Admin đã có sẵn trong menu
avatar và Milestones không nằm trong nav gốc) — nav ngang giờ chỉ hiện ở >720px; hiện lại chip streak (gọn) ở
mobile vì đây là yếu tố giữ lửa, XP chi tiết vẫn nằm trong dropdown avatar như cũ. Đã kiểm 375×812 (light/dark)
và 1280×800 bằng preview: tab bar + active state đúng, footer ẩn, nội dung không bị che, desktop giữ nguyên
header/2 cột cũ. `npm test` (383 tests) + `npm run build` pass.

**Vấn đề:** Điều hướng chính (Trang chủ / Khóa học / Shadowing / Công cụ) nằm trong hamburger menu của
`AppHeader.vue` — trên điện thoại phải với lên góc trên và mất 2 chạm. App học thật luôn có tab bar dưới đáy.

**Việc cần làm:**
1. Tạo `src/components/layout/BottomNav.vue`: thanh cố định đáy màn hình, **chỉ hiện ở ≤720px** (desktop giữ nguyên header hiện tại). 4–5 tab dạng icon + nhãn ngắn: 🏠 Trang chủ (`/`), 📚 Khóa học (`/courses`), 🎧 Shadowing (`/shadowing`), 🧰 Công cụ (route công cụ — kiểm tra path thật trong `src/router/index.js`, hiện là `/tools/:tool`; nếu chưa có trang index công cụ thì trỏ tới tool mặc định hoặc thêm route `/tools`), 📈 Tiến bộ (`/progress`). Icon dùng emoji/SVG inline như phong cách repo.
2. Trạng thái active theo route (`RouterLink` + `route.path.startsWith(...)` cho route con — đang ở `/courses/ielts/week/2/day/3` thì tab Khóa học sáng). Nền `var(--surface)`, viền trên 1px, có `padding-bottom: env(safe-area-inset-bottom)` (đi cùng Bước 1.2 nhưng cứ viết sẵn — không có giá trị thì = 0).
3. Gắn vào `src/App.vue` sau `<AppFooter />`. Ở ≤720px: `main.app-main` thêm `padding-bottom` bằng chiều cao tab bar (~64px + safe-area) để nội dung không bị che; **ẩn `AppFooter`** (footer thông tin không có giá trị trên app); ẩn/di chuyển `BackToTop` lên trên tab bar.
4. Tinh gọn `AppHeader` ở ≤720px: vì điều hướng đã xuống tab bar, hamburger chỉ còn giữ mục phụ (Milestones, Admin, đổi theme…) hoặc bỏ hẳn hamburger nếu các mục phụ đã có trong menu avatar — đọc kỹ `AppHeader.vue` phần menu account trước khi quyết. Giữ lại: logo, nút tìm kiếm, streak/XP chip (cân nhắc hiện lại chip streak gọn vì đây là yếu tố giữ lửa), avatar.
5. Tab bar phải ẩn khi bàn phím ảo mở (tránh nổi lên trên bàn phím ở Android): dùng `visualViewport.height` so với `window.innerHeight` trong một composable `src/composables/useKeyboardOpen.js` (viết một lần, Bước 2.2 dùng lại).

**File liên quan:** `src/components/layout/BottomNav.vue` (mới), `src/composables/useKeyboardOpen.js` (mới), `src/App.vue`, `src/components/layout/AppHeader.vue`, `src/components/layout/AppFooter.vue`, `src/components/common/BackToTop.vue`, `src/router/index.js`.

**Nghiệm thu:** ở 375×812 thấy tab bar đáy, chuyển đủ 5 tab, active state đúng kể cả route con; footer ẩn; nội dung cuối trang không bị tab bar che; ở 1280×800 hoàn toàn không thấy tab bar và header như cũ; dark mode đúng màu; `npm test` + `npm run build` pass.

### Bước 1.2 — Safe-area, dvh, và chuẩn hóa khoảng cách/chữ cho mobile

- [x] Đã làm

**Ghi chú (2026-07-05):** `index.html` thêm `viewport-fit=cover` + 3 meta `apple-mobile-web-app-*`.
`base.css` thêm biến `--safe-top/bottom/left/right` (env với fallback 0px) và `--space-page-x:
clamp(16px, 4vw, 28px)` dùng lại thay padding cố định; `App.vue`/`BottomNav.vue` đổi sang dùng
`var(--safe-bottom)` thay vì lặp lại `env(...)`. Thêm rule toàn cục `input, textarea, select {
font-size: 16px; font-family: inherit; }` để chống iOS auto-zoom khi focus, rồi rà tay 12 chỗ có
font-size cố định < 16px đang override rule này (ChatComposer `.composer-input`, ErrorLedger
`.el-input`/`.el-fix-input`, ieltsDaySection `.write-area`, IeltsDayView `.wf-note`, ShadowingPlayer
`.sh-edit-text`, ShadowingView `.topic-select`, AdminShadowingView `.in`, SentenceBankPractice
`.sb-input`, LeaderboardTool `.name-row input`, DictionaryTool/SavedTool `.search input`) — đưa hết
về 16px. Quét `100vh` trong `src/`: chỉ có 3 chỗ (`App.vue` `.app-shell`, `AdminLayout.vue` `.admin`,
`ShadowingPlayer.vue` `.sh-list` desktop-only) — giữ dòng `100vh` cũ làm fallback, thêm dòng
`100dvh`/`calc(100dvh...)` ngay sau (trình duyệt cũ bỏ qua). Đổi padding cố định 26–32px sang
`var(--space-page-x)`/`clamp()`: `.container` (dùng chung bởi 10 view), wrapper trang `.day`
(DayView + IeltsDayView), `.assess` (AssessmentView), `.banner-inner` (Java/IeltsCourseView),
`.admin-main` (AdminLayout), `.pg` CodePlayground, và cụm `.step-card`/`.vr`/`.ai-chat` lặp giống
nhau ở 6 file (`ieltsDaySection.css`, DayView, ListeningComprehension, ReadingComprehension,
VoiceRecorder, AiChat) — mọi nơi giữ padding trên/dưới, chỉ đổi cạnh ngang. Không đổi cỡ chữ heading
(h1/h2 dùng class riêng theo từng component, không phải thẻ thuần nên rule global không có tác dụng
— để dành cho Bước 2.1/2.6 khi làm lại layout từng màn cụ thể). Đã kiểm 375×812 + 1280×800 (light +
dark) bằng preview: không còn scroll ngang ở DayView/IeltsDayView, `.day` padding-left/right giảm
từ 28px xuống 16px ở mobile và giữ 28px ở desktop, input/textarea trong trang đo được `font-size:
16px` qua `getComputedStyle`. `npm test` (383 tests) + `npm run build` pass.

**Vấn đề:** Thiếu `viewport-fit=cover` nên `env(safe-area-inset-*)` luôn = 0 → chạy standalone trên iPhone, thanh home đè lên nút dưới cùng. `100vh` gây nhảy layout khi thanh URL co giãn. Padding container 28px và cỡ chữ cố định khiến 375px chật chội.

**Việc cần làm:**
1. `index.html`: viewport meta thêm `viewport-fit=cover`; thêm `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="default">`, `<meta name="apple-mobile-web-app-title" content="Devleap">`.
2. `src/assets/styles/base.css`: khai báo biến `--safe-bottom: env(safe-area-inset-bottom, 0px)` (và top/left/right nếu cần) để component dùng thống nhất. Các phần tử dính đáy (BottomNav từ 1.1, các nút sticky sau này) cộng thêm `var(--safe-bottom)`.
3. Quét toàn bộ `100vh`/`calc(100vh...)` trong `src/` (ít nhất: `App.vue` `.app-shell`, `ShadowingPlayer.vue`, modal/gate nếu có) → đổi sang `100dvh` kèm fallback: viết trước `min-height: 100vh;` rồi `min-height: 100dvh;` ngay dòng sau (trình duyệt cũ bỏ qua dòng sau).
4. Chuẩn hóa khoảng cách mobile trong `base.css`: `.container` padding 28px → `clamp(16px, 4vw, 28px)`. Heading dùng `clamp()`: h1 `clamp(24px, 6vw, 32px)`, h2 `clamp(20px, 5vw, 24px)`… Rà các view có padding cố định lớn (`CodePlayground.vue` 32px, DayView 26–28px) — đổi sang biến/clamp tương tự. **Không** giảm cỡ chữ nội dung bài đọc dưới 15px.
5. Chống zoom ngoài ý muốn khi focus input trên iOS: mọi `input/textarea/select` phải có `font-size ≥ 16px` — rà và sửa trong `base.css` bằng rule chung.

**File liên quan:** `index.html`, `src/assets/styles/base.css`, `src/App.vue`, `src/components/tools/ShadowingPlayer.vue`, `src/components/tools/CodePlayground.vue`, các view có padding cố định (grep `padding:` với giá trị ≥ 24px trong `src/views/`).

**Nghiệm thu:** DevTools iPhone 14 Pro (có notch): nội dung + nút đáy không bị vùng home đè (kiểm bằng bật "show media queries"/screenshot); không còn `100vh` trần nào trong `src/` (grep = 0 kết quả, trừ dòng fallback đứng cạnh `100dvh`); focus vào ô chat không bị zoom; `npm run build` pass.

### Bước 1.3 — Chuẩn tương tác cảm ứng toàn site (tap target, :active, touch-action)

- [x] Đã làm

**Ghi chú (2026-07-05):** `base.css` thêm rule nền `button, a, [role='button'] { touch-action: manipulation;
-webkit-tap-highlight-color: transparent; }` (an toàn, không đổi hình dạng) + utility `.tappable` (`:active { transform:
scale(0.96); opacity: 0.85; }`, dùng khi hover cũ chỉ là lift/scale đơn giản) + `:focus-visible` outline `var(--purple)`
cho button/a/[role=button]/input/textarea/select/.tappable. Không đặt `:active` scale toàn cục cho mọi `<a>`/`<button>`
vì nhiều nơi đã có transform hover riêng (translateY, scale icon…) — chồng thêm sẽ đá nhau; thay vào đó đi qua toàn bộ
104 rule `:hover` trong 38 file (`grep -rn ":hover" src/`), wrap từng rule vào `@media (hover: hover) { ... }` (chặn
trạng thái hover "dính" trên cảm ứng khi trình duyệt mô phỏng hover lúc chạm) và thêm `:active` tương ứng ngay sau —
tái dùng đúng hiệu ứng hover cũ (đổi màu nền/viền) hoặc viết riêng khi hover là transform (vd. `.green-btn:hover
{translateY(-2px)}` → active `translateY(-1px) scale(0.98)`). Bump vùng chạm ≥44px cho các nút icon nhỏ nêu trong kế
hoạch: `AppHeader` `.theme-toggle`/`.account-btn`/`.signin-btn` (38px, mở rộng bằng `::after{inset:-3px}` giữ nguyên
icon), `BackToTop` (đã đạt), `AiChat` `.tool-toggle`, `ChatComposer` `.mic-btn`/`.send-btn`, `ChatMessages`
`.wordchip`/`.speak-mini` (`::after` mở hit-area), `InlineFlashcards` `.ifc-reveal`/`.ifc-grade`, `PronunciationDrill`
`.pd-btn`, `ReadingComprehension` `.rc-listen`, `VocabCard` `.speak`/`.speak-ex` (`::after`), `VoiceRecorder`
`.vr-suggest li`, `WritingSection` `.wt-model li` (cả hai đều clickable qua `@click`, thêm `min-height:44px` +
`:active` tint), và các nút nhỏ tương tự phát hiện thêm ở nhóm Tools (`SavedTool` `.mini` 30→44px, `ShadowingPlayer`
`.sh-ctrl`/`.sh-mic` 40→44px, `LessonPicker` `.wg-all`/`.wg-toggle`, `QuizTool` `.chip`, `CodePlayground`
`.reset`/`.run`, `LeaderboardTool` `.study-btn`). `AdminShadowingView` `.mini`/`.op` (padding 5-6px) cố tình bỏ qua vì
sẽ phá layout bảng dày — trang quản trị ưu tiên desktop. Việc chia theo 4 nhóm file độc lập (Layout/Day/Tools/
Views+Admin) làm song song; xác nhận lại bằng script Node quét toàn bộ `:hover` theo độ sâu ngoặc `{}` để đảm bảo
100% nằm trong `@media(hover:hover)` — sau khi xử lý, quét chỉ còn 2 dòng "vi phạm" là comment tiếng Việt chứa chữ
"hover", không phải CSS thật. Đã kiểm 375×812 + 1280×800 (dark mode) bằng preview: `touch-action: manipulation` áp
dụng đúng, `.theme-toggle` có `::after{inset:-3px}` mở vùng chạm, bottom nav ẩn đúng ở desktop, không scroll ngang.
`npm test` (383 tests) + `npm run build` pass.

**Vấn đề:** 30+ chỗ chỉ có `:hover` (danh sách: `BackToTop`, `AiChat` `.tool-toggle`, `ChatComposer` `.mic-btn/.send-btn`, `ChatMessages` `.wordchip/.speak-mini`, `InlineFlashcards` `.ifc-reveal/.ifc-grade`, `PronunciationDrill` `.pd-btn`, `ReadingComprehension` `.rc-listen`, `VocabCard` `.speak/.speak-ex`, `VoiceRecorder` `.vr-suggest li`, `WritingSection` `.wt-model li`…). Trên cảm ứng, hover không tồn tại → bấm không có phản hồi. Nhiều nút icon 38px < chuẩn 44px.

**Việc cần làm:**
1. `base.css` thêm quy tắc nền: `button, a, [role="button"] { touch-action: manipulation; }` (bỏ trễ double-tap-zoom); `-webkit-tap-highlight-color: transparent` + tự vẽ phản hồi bằng `:active`.
2. Tạo pattern dùng chung trong `base.css`: class tiện ích `.tappable` (hoặc rule cho các class nút sẵn có) với `:active { transform: scale(0.96); opacity: 0.85; transition: ... }`. Sau đó đi từng component trong danh sách trên: bọc hiệu ứng hover hiện có vào `@media (hover: hover) { ... }` và thêm `:active` tương ứng cho cảm ứng. Không cần đổi logic — chỉ CSS.
3. Tăng tap target lên ≥44px cho các nút icon nhỏ: avatar/theme-toggle trên header (38px), `.speak-mini`, `.wordchip` (thêm padding, hit area có thể to hơn hình vẽ bằng `padding` hoặc pseudo-element `::after` phủ rộng). Danh sách từ (`.vr-suggest li`, `.wt-model li`) tăng `min-height: 44px`.
4. Thêm `:focus-visible` outline (dùng `var(--purple)`) cho các phần tử trên — vừa a11y vừa cho bàn phím bluetooth.
5. `GlobalSearch` (Ctrl+K): xác nhận nút kính lúp trên header vẫn mở được search trên mobile và ô input tự focus khi mở (mobile không có Ctrl+K).

**File liên quan:** `src/assets/styles/base.css` + toàn bộ component liệt kê ở "Vấn đề" (grep `:hover` trong `src/components/` và `src/views/` để không sót).

**Nghiệm thu:** grep `:hover` trong `src/` → mọi kết quả đều nằm trong `@media (hover: hover)` hoặc có `:active` đi kèm; đo (preview_inspect) các nút icon chính ≥44px; bấm nút trên khung mobile thấy phản hồi scale ngay; `npm run build` pass.

---

## Đợt 2 — Làm lại từng màn hình học cho mobile (giá trị chính)

### Bước 2.1 — Màn hình buổi học (DayView + AgendaRail): bỏ sidebar, hành động chính dính đáy

- [ ] Đã làm

**Phụ thuộc:** Bước 1.1, 1.2.

**Vấn đề:** Layout buổi học là 2 cột `grid-template-columns: 268px 1fr` (`DayView.vue` ~dòng 392), rail chỉ bỏ sticky ở ≤900px chứ không đổi hình dạng — trên 375px rail chiếm gần hết chiều ngang hoặc đẩy nội dung xuống rất sâu. Nút "Hoàn thành buổi" nằm cuối trang dài, khó thấy tiến độ đang ở bước nào.

**Việc cần làm:**
1. Đọc kỹ `src/views/DayView.vue` (hoặc `IeltsDayView.vue`/`JavaDayView.vue` — xác nhận tên file thật sau đợt tách file) và `src/components/day/AgendaRail.vue`.
2. Ở ≤720px: bỏ cột rail; `AgendaRail` biến thành **thanh bước học ngang dính dưới header** (sticky top): dãy chip/dot cuộn ngang (`overflow-x: auto`, ẩn scrollbar, `scroll-snap`), mỗi chip là 1 mục trong buổi (Vocab, Nghe, Nói…), chip hiện tại sáng, bấm chip cuộn tới section tương ứng (giữ nguyên logic anchor/scroll hiện có của rail). Tự động cuộn chip active vào giữa khi người học cuộn trang qua section mới (nếu rail đã có scroll-spy thì tái dùng).
3. Nút hành động chính của buổi ("✅ Hoàn thành buổi" / "Buổi tiếp theo") ở ≤720px: đưa vào **thanh dính đáy** (trên BottomNav hoặc thay BottomNav trong màn học — khuyến nghị: nằm ngay trên BottomNav, nền mờ `backdrop-filter`), kèm chỉ số tiến độ nhỏ ("5/7 mục"). Desktop giữ vị trí cũ.
4. Giảm padding `.day` (26px 28px → clamp như Bước 1.2) và rà các section con của buổi học ở 375px: `VocabCard` (IPA không đè chữ), `PronunciationDrill` (danh sách dài — cân nhắc gom nhóm/collapse), `ListeningDictation`, `WritingSection` — chỉ sửa CSS overflow/wrap, không đổi logic.

**File liên quan:** `src/views/*DayView*.vue`, `src/components/day/AgendaRail.vue`, `src/components/day/DayHeader.vue`, các section con nêu trên, `src/assets/styles/base.css`.

**Nghiệm thu:** 375×812 mở 1 buổi IELTS: không có scroll ngang toàn trang; thấy thanh bước học ngang, bấm chip nhảy đúng section; nút hoàn thành buổi luôn nhìn thấy không cần cuộn xuống đáy; desktop 1280px giữ nguyên 2 cột như cũ; `npm test` pass.

### Bước 2.2 — Chat AI như app nhắn tin: composer dính đáy, bàn phím ảo, bottom sheet nghĩa từ

- [ ] Đã làm

**Phụ thuộc:** Bước 1.1 (composable `useKeyboardOpen`), 1.2.

**Vấn đề:** `AiChat.vue`/`ChatComposer.vue`/`ChatMessages.vue`: composer không dính đáy màn hình, bàn phím ảo mở lên che ô nhập; popover nghĩa từ (chạm vào từ để lưu) định vị theo `clientX` với `min-width 230px` — tràn màn nhỏ và khó bấm.

**Việc cần làm:**
1. Ở ≤720px, khối chat chuyển thành layout "app nhắn tin": vùng tin nhắn `flex: 1` cuộn riêng, `ChatComposer` dính đáy (sticky/fixed, cộng `var(--safe-bottom)`); khi bàn phím mở (composable `useKeyboardOpen` + `visualViewport` resize) thì composer nằm sát mép bàn phím và vùng tin nhắn tự cuộn xuống tin cuối. Ẩn BottomNav khi bàn phím mở (đã làm ở 1.1 — xác nhận chạy đúng trong màn chat).
2. Tạo `src/components/common/BottomSheet.vue` dùng chung: tấm trượt từ đáy lên, overlay mờ, kéo xuống/bấm overlay để đóng (pointer events tự viết, không cài lib), có `padding-bottom: var(--safe-bottom)`. Desktop (>720px) tự động render dạng popover/modal giữa như cũ nếu cần.
3. `ChatMessages.vue`: ở ≤720px, chạm vào từ → mở BottomSheet (nghĩa, IPA, nút 🔊, nút "Lưu từ") thay cho popover theo tọa độ. Desktop giữ popover.
4. Nút mic (`ChatComposer`): tăng lên ≥52px (hành động chính của chat voice-first), trạng thái đang ghi phải rõ (pulse animation), đặt cạnh ô nhập trong tầm ngón cái.
5. Rà `AiChat.vue` phần chọn kịch bản/roleplay ở 375px (dropdown/toggle không tràn).

**File liên quan:** `src/components/day/AiChat.vue`, `src/components/day/ChatComposer.vue`, `src/components/day/ChatMessages.vue`, `src/components/common/BottomSheet.vue` (mới), `src/composables/useKeyboardOpen.js`.

**Nghiệm thu:** 375×812: gõ chat — ô nhập luôn nhìn thấy trên bàn phím (giả lập bằng thu `visualViewport`/resize), tin mới tự cuộn xuống; chạm 1 từ trong tin nhắn AI → bottom sheet hiện nghĩa + lưu từ hoạt động như cũ (kiểm tra store `savedWords`); desktop popover như cũ; `npm test` pass (nếu popover có test thì cập nhật).

### Bước 2.3 — Quiz & luyện câu: chạm thay kéo-thả

- [ ] Đã làm

**Vấn đề:** `QuizTool.vue` dạng sắp xếp từ ("Kéo/chạm các từ") và `SentenceBankPractice.vue` dựa trên kéo-thả/bank từ — trên màn 375px kéo-thả rất khó, dễ cuộn trang nhầm.

**Việc cần làm:**
1. Đọc kỹ implementation hiện tại của 2 component (xác nhận đã có đường "chạm" chưa — placeholder ghi "Kéo/chạm").
2. Chuẩn hóa mô hình **tap-to-place**: chạm 1 từ ở bank → từ bay lên vị trí tiếp theo của câu trả lời; chạm từ trong câu trả lời → trả về bank. Đây là hành vi chính trên mọi thiết bị (giống Duolingo); kéo-thả (nếu đang có) chỉ còn là bonus trên desktop.
3. Chip từ: `min-height: 44px`, khoảng cách ≥8px, `touch-action: manipulation`, animation ngắn khi bay lên/xuống (CSS transition với FLIP đơn giản hoặc chỉ fade — không cài lib).
4. Vùng đáp án cố định chiều cao tối thiểu (không nhảy layout khi thêm từ), nút "Kiểm tra" nằm dưới cùng trong tầm ngón cái (sticky nếu câu hỏi dài).
5. `QuizTool` các dạng khác (MCQ, cloze): đáp án dạng nút to bản full-width ở ≤480px, ô cloze `font-size ≥ 16px`.

**File liên quan:** `src/components/tools/QuizTool.vue`, `src/components/day/SentenceBankPractice.vue`, tests hiện có của quiz (`tests/` — grep `QuizTool`/`quiz`).

**Nghiệm thu:** 375×812: hoàn thành 1 câu sắp xếp từ chỉ bằng chạm (mô phỏng click), không thể cuộn trang nhầm khi thao tác; chấm điểm/XP như cũ; `npm test` pass.

### Bước 2.4 — Flashcard SRS full-screen + cử chỉ vuốt

- [ ] Đã làm

**Vấn đề:** `FlashcardTool.vue`/`InlineFlashcards.vue` là màn dùng hàng ngày (ôn SRS) nhưng vẫn là "card trong trang web". App thẻ thật: thẻ chiếm trọn màn, chạm để lật, vuốt/hoặc nút to để chấm.

**Việc cần làm:**
1. Ở ≤720px, `FlashcardTool` chuyển sang layout full-screen: thẻ chiếm phần lớn viewport (`min-height` theo `dvh`), thanh tiến độ mỏng trên đầu (đã ôn x/y), 3–4 nút chấm (Lại/Khó/Ổn/Dễ — theo grade SM-2 hiện có trong `src/lib/srs.js`) dàn hàng ngang **to bản dính đáy** (≥52px cao, cộng safe-area).
2. Thêm cử chỉ vuốt bằng pointer events (tự viết, không lib): vuốt trái = grade thấp nhất, vuốt phải = grade cao nhất (mapping ghi rõ trên UI bằng nhãn màu hiện dần theo hướng kéo); kéo chưa đủ ngưỡng (~30% bề ngang) thì thẻ bật về. Vuốt chỉ hoạt động sau khi đã lật thẻ. Nút bấm vẫn là đường chính — vuốt là bổ sung.
3. Chạm vào thẻ để lật (đã có thì giữ); đảm bảo nút 🔊 phát âm trên thẻ ≥44px và không trùng vùng chạm-lật.
4. `InlineFlashcards` (trong buổi học): chỉ cần rà 375px (nút grade đủ to, không tràn) — không cần full-screen.
5. Logic SRS/XP giữ nguyên tuyệt đối — chỉ thay lớp trình bày; nếu tách phần gesture ra `src/composables/useSwipe.js` thì viết test cho hàm tính ngưỡng/hướng.

**File liên quan:** `src/components/tools/FlashcardTool.vue`, `src/components/day/InlineFlashcards.vue`, `src/composables/useSwipe.js` (mới, nếu tách), `src/lib/srs.js` (chỉ đọc), tests SRS hiện có.

**Nghiệm thu:** 375×812 mở `/tools/flashcard?deck=due`: thẻ full màn, lật bằng chạm, chấm bằng nút và bằng vuốt đều ghi đúng lịch SRS (kiểm localStorage/store như test cũ); desktop giữ nguyên; `npm test` pass.

### Bước 2.5 — Shadowing & nghe chép: video dính trên, điều khiển trong tầm ngón cái

- [ ] Đã làm

**Vấn đề:** `ShadowingPlayer.vue` dùng 2 cột ở ≥960px, `max-height: calc(100vh - 130px)`; ở mobile danh sách câu và nút điều khiển (play/tốc độ/ghi âm) rải rác — vừa xem video vừa bấm rất khó. `ListeningDictation.vue` chưa có xử lý mobile.

**Việc cần làm:**
1. `ShadowingPlayer` ở ≤720px: video (YouTube iframe) **dính trên đỉnh** (sticky top, tỉ lệ 16:9), phần dưới là danh sách câu cuộn riêng; câu đang phát tự cuộn vào giữa. Đổi `100vh` → `dvh` (nếu Bước 1.2 chưa quét tới file này).
2. Cụm điều khiển (⏯️, tốc độ, lặp câu, 🎙️ ghi âm) gom thành **thanh điều khiển dính đáy** ở mobile, nút ≥48px. Menu tốc độ đổi thành hàng nút ngang hoặc BottomSheet (tái dùng component Bước 2.2) thay vì menu absolute dễ tràn.
3. `ListeningDictation`: ô gõ chép chính tả ≥16px; cụm nút phát/chậm/lặp đặt ngay trên ô gõ (không phải trên đầu trang) để bàn phím mở vẫn thấy; rà 375px không tràn.
4. Kiểm tra hồi quy điểm WPM/logic chấm không đổi (chỉ CSS/bố cục).

**File liên quan:** `src/components/tools/ShadowingPlayer.vue`, `src/views/ShadowingView.vue`, `src/components/day/ListeningDictation.vue`, `src/components/common/BottomSheet.vue`.

**Nghiệm thu:** 375×812: video luôn nhìn thấy khi cuộn danh sách câu; mọi nút điều khiển bấm được bằng 1 ngón cái ở nửa dưới màn; không còn scroll ngang; desktop 2 cột như cũ; `npm test` pass.

### Bước 2.6 — Quét nốt các màn còn lại: Home, Courses, Tools, Progress, Leaderboard, CodePlayground, Assessment

- [ ] Đã làm

**Phụ thuộc:** nên làm cuối Đợt 2 (các pattern BottomSheet/sticky/clamp đã có sẵn để tái dùng).

**Vấn đề:** Các màn còn lại chưa được rà 375px: `HomeView` (dashboard nhiều card), `CoursesView` (cột ≥960px), `ToolsView` (lưới tool), `ProgressView` (biểu đồ SVG có thể tràn), `LeaderboardTool` (bảng), `CodePlayground` (editor + console cạnh nhau, padding 32px), `AssessmentView`, `MilestonesView`, `GlobalSearch`.

**Việc cần làm:**
1. Đi từng view ở 375×812 (cả dark mode), sửa CSS: lưới card → 1 cột; bảng leaderboard → hàng dạng card hoặc bảng thu gọn (hạng + tên + XP, bỏ cột phụ); biểu đồ tiến bộ SVG co theo `width: 100%` + `viewBox` (không tràn); `GlobalSearch` mở dạng full-screen ở mobile (ô input to, kết quả list 44px/hàng).
2. `CodePlayground`: ≤720px xếp dọc editor trên / console dưới, padding 32px → clamp; editor CodeMirror `font-size ≥ 14px`, cuộn ngang trong editor (không phải cả trang); nút "▶ Chạy" sticky trong tầm ngón cái. (Java là track phụ trên mobile — chỉ cần dùng được, không cần tối ưu sâu.)
3. `HomeView`: thứ tự card trên mobile theo mức khẩn: "Học tiếp buổi X" → "N từ đến hạn ôn" → streak/XP → còn lại. Card hành động chính full-width, CTA ≥48px.
4. `AssessmentView`/`WeekTestSection`: câu hỏi + đáp án full-width, nút nộp sticky đáy.
5. Ghi lại (trong ghi chú bước) những màn nào đã đạt sẵn không cần sửa — để lần audit sau khỏi lặp.

**File liên quan:** `src/views/HomeView.vue`, `src/views/CoursesView.vue`, `src/views/ToolsView.vue`, `src/views/ProgressView.vue` (xác nhận tên thật), `src/views/AssessmentView.vue`, `src/views/MilestonesView.vue`, `src/components/tools/LeaderboardTool.vue`, `src/components/tools/CodePlayground.vue`, `src/components/layout/GlobalSearch.vue` (xác nhận tên thật).

**Nghiệm thu:** đi hết các route chính ở 375×812 không màn nào có scroll ngang hoặc chữ/nút tràn; screenshot từng màn để so; `npm test` + `npm run build` pass.

---

## Đợt 3 — PWA "cài được, sống được": install, update, offline sâu

### Bước 3.1 — Hoàn thiện manifest + luồng cài đặt (install prompt + hướng dẫn iOS)

- [ ] Đã làm

**Vấn đề:** Manifest thiếu icon `maskable` (Android mới sẽ crop icon `any` vào khung tròn — viền trắng xấu), thiếu `screenshots`/`shortcuts`. Không bắt `beforeinstallprompt` nên không bao giờ chủ động mời cài; iOS không có `beforeinstallprompt` — cần hướng dẫn thủ công "Chia sẻ → Thêm vào MH chính".

**Việc cần làm:**
1. Tạo icon maskable (nội dung nằm trong safe zone 80% giữa): `public/icons/icon-maskable-192.png`, `icon-maskable-512.png` (sinh từ icon hiện có bằng script canvas/sharp chạy 1 lần trong scratchpad — không thêm dependency vào repo; commit file PNG kết quả). Thêm vào manifest với `"purpose": "maskable"` (giữ bản `any` riêng).
2. Manifest bổ sung: `"categories": ["education"]`, `"screenshots"` (chụp 2–3 màn ở 390×844, `form_factor: "narrow"` — lưu `public/screenshots/`), `"shortcuts"`: "Học tiếp" → `/courses`, "Ôn flashcard" → `/tools/flashcard?deck=due`.
3. Tạo `src/composables/useInstallPrompt.js`: bắt `beforeinstallprompt` (chặn default, giữ event), expose `canInstall` + `promptInstall()`; phát hiện đã cài (`display-mode: standalone` media query hoặc `navigator.standalone` iOS) thì không mời nữa.
4. UI mời cài **đúng lúc**: card nhỏ trên `HomeView` ("📲 Cài Devleap vào màn hình chính — mở nhanh, học offline") chỉ hiện khi: chưa standalone + (Android/desktop: có `beforeinstallprompt`; iOS Safari: hiện hướng dẫn 2 bước bằng BottomSheet có hình mũi tên nút Share). Chỉ mời sau khi người học đã hoàn thành ≥1 buổi (đọc store — tránh làm phiền khách mới), và "Để sau" thì 7 ngày sau mới hỏi lại (localStorage).
5. Viết test cho logic hiển thị nhắc cài (đủ điều kiện/đã cài/đã từ chối) — tách logic thuần ra hàm để test được.

**File liên quan:** `public/manifest.webmanifest`, `public/icons/`, `public/screenshots/` (mới), `src/composables/useInstallPrompt.js` (mới), `src/views/HomeView.vue`, `src/components/common/BottomSheet.vue`, tests mới.

**Nghiệm thu:** Lighthouse PWA installable pass; DevTools Application → Manifest không cảnh báo maskable; card mời cài hiện đúng điều kiện và prompt bật được trên Chrome Android (hoặc desktop Chrome); iOS fallback hiện hướng dẫn; `npm test` pass.

### Bước 3.2 — Luồng cập nhật service worker ("Có bản mới — Tải lại")

- [ ] Đã làm

**Vấn đề:** `public/sw.js` dùng `CACHE_VERSION = 'devleap-v1'` cố định + `skipWaiting()` ngay khi install — deploy bản mới, tab đang mở vẫn chạy JS cũ mà không hề biết; cache cũ chỉ bị dọn khi đổi tên version thủ công.

**Việc cần làm:**
1. Sửa `sw.js`: **bỏ** `skipWaiting()` tự động trong `install`; thay bằng lắng nghe message `{type: 'SKIP_WAITING'}` từ trang. Giữ `clients.claim()` ở activate.
2. Tự động hóa version: trong `vite.config.js` viết plugin nhỏ (closeBundle) copy/ghi `sw.js` vào `dist/` với `CACHE_VERSION` thay bằng timestamp/hash build (chuỗi placeholder `__BUILD_ID__` trong sw.js). Dev mode không đăng ký SW (đã đúng — chỉ PROD).
3. `src/main.js` (chỗ đăng ký SW): theo dõi `registration.updatefound` → khi worker mới `installed` và `navigator.serviceWorker.controller` tồn tại → hiện **toast** "✨ Có bản cập nhật — Tải lại" (tạo `src/components/common/UpdateToast.vue` hoặc tái dùng pattern toast sẵn có nếu repo đã có); bấm → `postMessage SKIP_WAITING` + lắng nghe `controllerchange` → `location.reload()`. Kiểm tra update định kỳ khi app mở lại từ background (`visibilitychange` → `registration.update()`).
4. Cẩn thận vòng reload vô hạn (chỉ reload 1 lần nhờ cờ trong biến module).

**File liên quan:** `public/sw.js`, `vite.config.js`, `src/main.js`, `src/components/common/UpdateToast.vue` (mới).

**Nghiệm thu:** build 2 lần liên tiếp ra 2 `CACHE_VERSION` khác nhau trong `dist/sw.js`; mô phỏng update (serve dist, sửa file, build lại, refresh) thấy toast và bấm tải lại nhận bản mới; không reload lặp; `npm run build` + `npm test` pass.

### Bước 3.3 — Offline sâu hơn: self-host font, precache dữ liệu học, trạng thái offline từng tính năng

- [ ] Đã làm

**Vấn đề:** Font Plus Jakarta Sans tải từ Google CDN (cross-origin — SW hiện chỉ cache cùng gốc) → offline mất font, FOUT mỗi lần mở. Bài học chỉ mở được offline nếu **đã từng mở** (stale-while-revalidate); buổi kế tiếp chưa mở lần nào thì offline không học được. Khi offline, các nút cần mạng (AI, chạy Java, leaderboard) mới chỉ có banner chung.

**Việc cần làm:**
1. Self-host font: tải file woff2 (các weight 400–800 đang dùng) về `public/fonts/`, viết `@font-face` với `font-display: swap` trong `base.css`, xóa `<link>` Google Fonts + preconnect khỏi `index.html`. SW sẽ tự cache vì giờ là cùng gốc.
2. Precache dữ liệu học tối thiểu để "offline vẫn học được buổi kế": sau khi app load xong (idle, `requestIdleCallback`), chủ động `fetch` trước các asset của **buổi kế tiếp** (chunk route + file MD tuần hiện tại — xem cách route học lazy-load chunk trong `src/router/index.js` và MD được import thế nào; nếu MD bundle sẵn trong chunk thì chỉ cần warm chunk) — viết `src/lib/prefetchNextLesson.js` + gọi từ `HomeView`/store. SW hiện có sẽ tự giữ các request này.
3. Trạng thái offline từng tính năng (tái dùng `useOnlineStatus`): nút cần mạng (gửi chat AI, chấm viết, chạy Java, leaderboard, đăng nhập) khi offline → disabled + nhãn "🔌 Cần mạng" (pattern đã dùng ở `WritingSection` — nhân rộng). TTS/ghi âm local vẫn chạy offline bình thường.
4. Kiểm tra `speak.js` (Web Speech TTS) offline: voice local có thể không có trên một số máy — bọc try/catch + thông báo nhẹ thay vì chết im (nếu Bước 2.3 kế hoạch cũ đã làm fallback Safari thì chỉ cần xác nhận).

**File liên quan:** `index.html`, `public/fonts/` (mới), `src/assets/styles/base.css`, `src/lib/prefetchNextLesson.js` (mới), `src/router/index.js` (chỉ đọc), các component có nút cần mạng, `public/sw.js` (chỉ đọc — không cần sửa).

**Nghiệm thu:** DevTools Network offline sau khi mở Home: font vẫn đúng (không rơi về serif), mở được buổi **kế tiếp** chưa từng mở; các nút AI disabled có nhãn rõ; `npm run build` pass và bundle không còn request tới `fonts.googleapis.com` (grep dist).

### Bước 3.4 — Badge app + nâng cấp nhắc học cho standalone

- [ ] Đã làm

**Vấn đề:** Nhắc học hiện chỉ bắn Notification khi tab đang mở (`src/lib/studyReminder.js`). Khi đã cài PWA, có thêm 2 công cụ nhẹ không cần server: **Badging API** (chấm số trên icon app — số từ đến hạn ôn) và notification bắn lúc mở app. Web Push thật (server đẩy khi app đóng) cần VAPID + backend — để **tùy chọn** cuối kế hoạch, không bắt buộc.

**Việc cần làm:**
1. `src/lib/appBadge.js`: wrapper `navigator.setAppBadge(n)` / `clearAppBadge()` (feature-detect, silent fail). Gọi khi app mở/khi `dueTodayCount` thay đổi (watch trong store hoặc `App.vue`): badge = số từ đến hạn ôn; về 0 thì clear. Viết test cho hàm quyết định số badge.
2. `studyReminder.js`: khi chạy standalone (`display-mode: standalone`), lời nhắc buổi tối hiện thêm **in-app card** trên Home (không chỉ Notification — notification trong standalone iOS không khả dụng); nội dung gộp: streak + số từ đến hạn.
3. (Ghi chú cho tương lai, KHÔNG làm trong bước này: Web Push qua Netlify Function + bảng `push_subscriptions` Supabase — chỉ làm khi có nhu cầu thật, tách thành kế hoạch riêng.)

**File liên quan:** `src/lib/appBadge.js` (mới), `src/lib/studyReminder.js`, `src/composables/useStudyReminder.js`, `src/App.vue` hoặc store, `tests/studyReminder.test.js`, test mới cho badge.

**Nghiệm thu:** giả lập `dueTodayCount = 3` → `setAppBadge(3)` được gọi (spy trong test); về 0 → clear; máy không hỗ trợ API không lỗi console; `npm test` pass.

---

## Đợt 4 — Cảm giác app thật + kiểm định trên thiết bị

### Bước 4.1 — Chuyển động & haptic mức app

- [ ] Đã làm

**Vấn đề:** Chuyển route chỉ có fade chung; thao tác đúng/sai trong quiz không có phản hồi xúc giác. Mức "cảm giác app" còn thiếu một lớp polish.

**Việc cần làm:**
1. Transition điều hướng có hướng ở ≤720px: đi sâu (Home → Course → Day) slide-in từ phải, quay lại slide-out — xác định hướng bằng `meta.depth` trên route hoặc so sánh độ sâu path trong guard, đổi tên transition động trong `App.vue`. Desktop giữ fade. Tôn trọng `prefers-reduced-motion` (tắt slide, giữ fade nhanh).
2. `src/lib/haptics.js`: wrapper `navigator.vibrate` (feature-detect): gõ nhẹ 10ms khi chấm flashcard/đáp án đúng, rung kép ngắn khi sai, rung nhẹ khi hoàn thành buổi/lên streak. Gắn vào các điểm chấm điểm sẵn có (QuizTool, FlashcardTool, đánh dấu buổi xong). Có toggle tắt trong phần cài đặt/menu nếu repo đã có chỗ đặt (không thì mặc định bật, iOS tự bỏ qua vì không hỗ trợ vibrate — silent fail).
3. Skeleton loading cho các view lazy-load (thay màn trắng khi mạng chậm): component `SkeletonBlock.vue` đơn giản (nền gradient shimmer CSS) dùng ở Home/Course trong lúc `Suspense`/`onMounted` chưa xong — chỉ thêm nếu thực tế có flash trắng khi throttle Slow 3G, không bày vẽ thừa.

**File liên quan:** `src/App.vue`, `src/router/index.js`, `src/lib/haptics.js` (mới), `src/components/tools/QuizTool.vue`, `src/components/tools/FlashcardTool.vue`, chỗ đánh dấu hoàn thành buổi.

**Nghiệm thu:** ở khung mobile, điều hướng vào sâu/lùi có slide đúng hướng, `prefers-reduced-motion` tắt được; haptic gọi đúng chỗ (spy test cho hàm quyết định pattern rung); desktop không đổi; `npm test` pass.

### Bước 4.2 — Kiểm định mic/TTS/audio ở chế độ standalone thật

- [ ] Đã làm

**Vấn đề:** PWA standalone có luật riêng về media: iOS standalone từng khác Safari thường về `MediaRecorder`/`getUserMedia`/Web Speech; autoplay audio cần user gesture; YouTube iframe trong standalone có thể hành xử khác. Nếu nói/nghe (giá trị cốt lõi của app) chết trong standalone thì mọi bước trên vô nghĩa — phải kiểm định và vá có chủ đích.

**Việc cần làm:**
1. Lập **checklist kiểm thử thủ công** vào `docs/MOBILE_TEST_CHECKLIST.md`: trên (a) Android Chrome đã cài PWA, (b) iPhone Safari đã Add to Home Screen — đi qua: ghi âm VoiceRecorder, chấm phát âm PronunciationDrill, TTS VocabCard/flashcard, nghe chép ListeningDictation, video ShadowingPlayer, chat voice, đăng nhập Google OAuth (redirect trong standalone hay bật ra Safari?), đồng bộ Supabase khi mở lại app.
2. Vá các lỗi phát hiện được theo nguyên tắc: mọi tiếng động chỉ phát sau user gesture; `getUserMedia` fail → hiện hướng dẫn cấp quyền mic theo nền tảng (component thông báo sẵn có từ bước fallback Safari của kế hoạch cũ — tái dùng); OAuth trong standalone iOS nếu kẹt → mở tab ngoài với deep-link quay lại.
3. Những gì không vá được (giới hạn nền tảng) ghi rõ vào checklist + hiện thông báo trung thực cho người học (pattern "tính năng này cần mở trong Safari" đã có từ bước 2.3 kế hoạch cũ).

**File liên quan:** `docs/MOBILE_TEST_CHECKLIST.md` (mới), các component media nêu trên tùy lỗi tìm thấy.

**Nghiệm thu:** checklist có kết quả ✅/⚠️ cho từng mục trên ít nhất 1 thiết bị thật mỗi hệ (nhờ chủ repo thao tác nếu AI không có thiết bị — bước này cần người); mọi ⚠️ đều có ghi chú nguyên nhân + thông báo trong app; `npm test` pass.

### Bước 4.3 — Hiệu năng mobile + Lighthouse ≥ 90

- [ ] Đã làm

**Vấn đề:** Chưa từng đo Lighthouse mobile. Mạng 4G yếu + máy Android tầm trung là môi trường thật của app học. YouTube iframe, ảnh minh họa từ vựng, chunk lớn có thể kéo điểm xuống.

**Việc cần làm:**
1. Chạy Lighthouse (mobile, cả PWA category) trên bản build production (serve `dist/`), ghi điểm gốc vào ghi chú bước.
2. Xử lý theo thứ tự tác động: lazy-load YouTube iframe (facade — chỉ load iframe khi bấm play, hiện thumbnail trước); `loading="lazy"` + kích thước cố định cho ảnh từ vựng (tránh CLS); kiểm tra route-level code splitting đã bật đủ (grep `import(` trong router); font đã self-host từ 3.3 (preload woff2 chính); nén icon/screenshot PNG.
3. Kiểm tra bundle: `npm run build` xem cảnh báo chunk > 500kB — nếu có, tách bằng dynamic import (dữ liệu khóa học nặng chỉ load ở route cần).
4. Mục tiêu: Performance ≥ 85, PWA installable pass, Accessibility ≥ 90 (các bước 1.3/2.x đã cải thiện contrast/focus/tap size — vá nốt gì Lighthouse chỉ ra).

**File liên quan:** `src/components/tools/ShadowingPlayer.vue` (facade YouTube), `src/lib/vocabImage.js` + chỗ render ảnh, `src/router/index.js`, `vite.config.js`, `index.html`.

**Nghiệm thu:** báo cáo Lighthouse mobile sau-so-với-trước ghi trong ghi chú bước, đạt mục tiêu số ở mục 4; không tính năng nào hỏng (`npm test` pass, đi lại các luồng chính trên preview).

### Bước 4.4 — Tổng kiểm thử mobile + chốt kế hoạch

- [ ] Đã làm

**Phụ thuộc:** toàn bộ các bước trước.

**Việc cần làm:**
1. Đi lại toàn bộ luồng học chính ở 375×812 + 414×896 + iPad 768px, light + dark: onboarding → Home → học 1 buổi IELTS đủ các section → chat AI → flashcard due → shadowing → quiz tuần → xem tiến bộ → leaderboard. Screenshot từng màn.
2. Đối chiếu từng dòng bảng chẩn đoán mục 0 — mục nào còn dở ghi rõ, mục nào xong tick.
3. Cập nhật `docs/MOBILE_TEST_CHECKLIST.md` lần cuối; cập nhật bảng trạng thái dưới đây; ghi các việc để lại cho tương lai (Web Push, TWA đóng gói lên Play Store bằng Bubblewrap — chỉ ghi chú, không làm).

**Nghiệm thu:** bảng trạng thái đầy đủ; không mục nào trong bảng chẩn đoán mục 0 còn bỏ ngỏ không lời giải thích; `npm test` + `npm run build` pass.

---

## Thứ tự khuyến nghị & trạng thái

| Bước | Tên | Ước lượng | Trạng thái |
| --- | --- | --- | --- |
| 1.1 | Bottom tab bar + header gọn | 1 buổi | ✅ |
| 1.2 | Safe-area, dvh, spacing/chữ | 0.5–1 buổi | ✅ |
| 1.3 | Chuẩn cảm ứng (:active, 44px) | 1 buổi | ✅ |
| 2.1 | DayView + AgendaRail mobile | 1–2 buổi | ⬜ |
| 2.2 | Chat như app nhắn tin | 1–2 buổi | ⬜ |
| 2.3 | Quiz chạm thay kéo | 1 buổi | ⬜ |
| 2.4 | Flashcard full-screen + vuốt | 1 buổi | ⬜ |
| 2.5 | Shadowing/nghe chép mobile | 1 buổi | ⬜ |
| 2.6 | Quét nốt các màn còn lại | 1–2 buổi | ⬜ |
| 3.1 | Manifest + install prompt | 1 buổi | ⬜ |
| 3.2 | Luồng update SW | 0.5–1 buổi | ⬜ |
| 3.3 | Offline sâu + self-host font | 1 buổi | ⬜ |
| 3.4 | Badge + nhắc học standalone | 0.5 buổi | ⬜ |
| 4.1 | Chuyển động & haptic | 0.5–1 buổi | ⬜ |
| 4.2 | Kiểm định media standalone | 0.5 buổi + thiết bị thật | ⬜ |
| 4.3 | Hiệu năng + Lighthouse | 1 buổi | ⬜ |
| 4.4 | Tổng kiểm thử + chốt | 0.5 buổi + thiết bị thật | ⬜ |

**Quy tắc chung cho mọi bước (AI thực hiện phải tuân thủ):**
1. Trước khi code: đọc file liên quan nêu trong bước, xác nhận tên hàm/biến/file thật (kế hoạch mô tả theo khảo sát 2026-07-05, code có thể đã trôi — đặc biệt sau đợt tách `IeltsDayView`/`AiChat`/store của kế hoạch trước).
2. Không cài dependency mới trừ khi bước ghi rõ cho phép. Gesture/sheet/toast tự viết.
3. Mọi thay đổi UI kiểm tra ở **375×812 và 1280×800, cả light lẫn dark mode** (dev server + preview resize). Desktop không được xấu đi.
4. Làm xong: `npm test` pass (kể cả test mới của bước) + `npm run build` pass.
5. Tick checkbox bước trong file này + ghi "**Ghi chú (ngày):** đã làm gì, quyết định gì khác với kế hoạch".
6. Commit riêng từng bước, message theo phong cách repo (tiếng Việt không dấu, `feat:` / `fix:`).
