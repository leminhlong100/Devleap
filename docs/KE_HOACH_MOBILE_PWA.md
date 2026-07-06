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

- [x] Đã làm

**Ghi chú (2026-07-05):** Tên file thật: `DayView.vue` (Java, 3 mục: theory/code/interview),
`IeltsDayView.vue` (IELTS, đến 18 mục tùy buổi — `GrammarSection.vue`/`MissionSection.vue` mỗi cái
gánh 2 mục). Rail cũ chưa có scroll-spy/click-to-jump thật (status luôn "default" vì không nơi nào
set `item.status`) — phải viết mới, không chỉ đổi CSS. Cách làm: mỗi mục trong `agenda` computed có
thêm `key` string ổn định; section/component tương ứng trong template gắn `data-agenda-key="..."`
(props tự fallthrough xuống root element của child component, không cần sửa gì thêm ở hầu hết case;
riêng `GrammarSection.vue`/`MissionSection.vue` phải sửa trực tiếp vì 1 component gánh 2 mục agenda).
`src/composables/useSectionScrollSpy.js` (mới) dùng `document.querySelectorAll('[data-agenda-key]')`
+ `IntersectionObserver` (không cần template ref vì chỉ 1 buổi mount tại 1 thời điểm) để biết mục nào
đang hiện (`activeKey`) và cuộn tới 1 mục (`scrollToKey`, dùng `el.scrollIntoView` — an toàn vì đây là
hành động 1 lần do người dùng bấm, không nằm trong watcher phản hồi ngược).
`AgendaRail.vue` giờ render **2 root** (Vue 3 cho phép multi-root): `.rail-v` (dọc, giao diện cũ,
ẩn ≤720px) và `.rail-h` (thanh chip ngang mới, `position: sticky; top: 64px` dính dưới header, ẩn
>720px) — dùng chung `items`/`activeIndex` prop + emit `select`. **Bẫy đã gặp:** ban đầu dùng
`chip.scrollIntoView({inline:'center', block:'nearest'})` để tự cuộn chip active vào giữa thanh —
trình duyệt có lúc cuộn luôn CẢ TRANG để đưa chip vào khung nhìn, gây lặp vô hạn với
IntersectionObserver (cuộn trang → đổi active → cuộn lại…) làm treo hẳn tab preview. Sửa bằng cách tự
tính `track.scrollLeft` thủ công (không gọi `scrollIntoView` trên chip nữa), track có
`scroll-behavior: smooth` trong CSS để mượt.
Nút hoàn thành buổi: tạo `src/components/day/MobileCheckpointBar.vue` (thanh dính đáy, chỉ hiện
≤720px, `bottom: calc(72px + var(--safe-bottom))` — ngay trên BottomNav) nhận slot cho các nút CTA
(tái dùng đúng class `.outline-btn`/`.green-btn`/handler cũ qua slot, không viết lại logic) + hiện
"Mục x/y" (x = vị trí đang cuộn tới, không phải số mục đã hoàn thành thật — không có tín hiệu hoàn
thành theo từng mục nên dùng vị trí cuộn làm chỉ báo tiến độ đọc, trung thực hơn là giả vờ đo hoàn
thành). CTA gốc trong `.checkpoint` được thêm class `.cp-cta-desktop`, ẩn ở ≤720px (không xoá, giữ
context/text cho desktop). `.day` cộng `padding-bottom: 150px` ở ≤720px để nội dung cuối trang không
bị thanh CTA mới che. **Bẫy thứ 2:** `BackToTop.vue` (nút nổi toàn site, nằm ngoài cây component của
trang buổi học) đè lên thanh CTA mới vì offset cũ (`bottom: 84px`, tính cho BottomNav) không tính
thêm chiều cao MobileCheckpointBar — sửa bằng cách `MobileCheckpointBar` gắn/gỡ class
`body.has-mcb-bar` lúc mount/unmount, `base.css` thêm rule `body.has-mcb-bar .back-to-top { bottom:
calc(140px + var(--safe-bottom)) !important }` (dùng `!important` có chủ đích vì đây là điều phối
giữa 2 component không có quan hệ cha-con, cần thắng chắc chắn rule `:deep()` cũ trong `App.vue`).
Đã kiểm 375×812 (light + dark) bằng preview: rail ngang dính đúng dưới header, bấm chip nhảy đúng
section (đã thử tay, không treo sau khi sửa bẫy scrollIntoView), "Mục x/y" cập nhật theo scroll,
CTA bar hiện đúng nhãn khóa/mở theo `dayReady`, BackToTop không còn đè CTA. 1280×800: rail dọc + CTA
gốc giữ nguyên như cũ, không có thanh ngang/CTA trùng lặp; bonus: rail dọc giờ cũng highlight mục
đang cuộn tới (an toàn, chỉ là tô màu "current" có sẵn, không đổi hình dạng). `npm test` (383 tests)
+ `npm run build` pass. **Lưu ý cho AI làm bước sau:** lúc kiểm tra preview có tạm đổi tên
`.env.local` để test giao diện ở chế độ khách (guest mode, vì route buổi học yêu cầu đăng nhập) — đã
khôi phục lại nguyên vẹn ngay sau đó (diff sạch), nhưng **không nên lặp lại cách này**; lần sau nếu
cần xem giao diện buổi học khi chưa đăng nhập, hỏi người dùng trước hoặc đăng nhập thật qua Google.

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

- [x] Đã làm

**Ghi chú (2026-07-05):** `AiChat.vue` dùng trong 2 ngữ cảnh khác nhau (`IeltsDayView.vue`, có
`MobileCheckpointBar` dính đáy; `ToolsView.vue` route `/tools/chat`, không có) — quyết định dùng
**`position: sticky`** (không phải `fixed`) cho `.composer-dock` (bọc `ChatComposer`): sticky tự
"dán" vào đáy màn hình trong lúc cuộn qua thẻ `.ai-chat` rồi tự cuộn đi cùng nội dung khi qua khỏi
thẻ — không cần `IntersectionObserver` để ẩn/hiện thủ công, và không đè lên các phần khác của
trang buổi học dài (nhiều `step-card` khác). Offset mặc định `bottom: calc(72px + var(--safe-bottom))`
(dán ngay trên BottomNav); khi `body.has-mcb-bar` (đang ở trang buổi học, xem `MobileCheckpointBar.vue`)
cộng thêm 56px (cùng con số đã dùng cho `BackToTop` ở Bước 2.1) → `calc(128px + var(--safe-bottom))`.
Bàn phím ảo mở: mở rộng `useKeyboardOpen.js` thêm `keyboardInset` (px chênh lệch visualViewport,
0 khi đóng) — vì `position: sticky/fixed` tính theo layout viewport trong khi bàn phím chỉ thu hẹp
visual viewport, nếu không bù trừ thì composer sẽ nằm khuất sau bàn phím trên Android/iOS (không
phải desktop DevTools nên khó thấy khi test). `AiChat.vue` ghi đè `style="bottom: keyboardInset px"`
khi `isKeyboardOpen` (đã kiểm bằng cách mock `visualViewport.height` + dispatch `resize` trong
preview — composer nhảy đúng theo px chênh lệch). Cùng lúc bàn phím mở: ẩn bớt phần đầu thẻ
(`scenario-tag`, `persona-bar`, `saved-pill`, `hint`) qua class `.kb-open` để nhường chỗ cho tin
nhắn + ô nhập (giống app nhắn tin thật thu gọn header khi gõ), và tự cuộn tin nhắn xuống cuối
(`ChatMessages` expose thêm `scrollToEnd` bên cạnh `closePop` có sẵn). `BottomNav` đã tự ẩn khi bàn
phím mở từ Bước 1.1 (`v-show="!isKeyboardOpen"`) — xác nhận vẫn đúng, không phải sửa.

Tạo `src/components/common/BottomSheet.vue` dùng chung (Teleport tới `body`, overlay mờ, kéo tay
cầm xuống >80px hoặc bấm overlay để đóng — pointer events + `setPointerCapture` tự viết, không lib).
`ChatMessages.vue`: thêm composable `src/composables/useMediaQuery.js` (singleton theo query, cùng
pattern `useOnlineStatus`/`useTheme`; export thêm `useIsMobile()` cho ngưỡng ≤720px dùng lại được ở
các bước sau) để chọn UI theo viewport **runtime** (không chỉ ẩn/hiện bằng CSS) — mobile mở
BottomSheet (nghĩa/IPA/nút 🔊 dùng lại `replay` prop có sẵn/nút Lưu từ, cỡ chữ to hơn popover cũ),
desktop giữ nguyên popover định vị theo toạ độ như cũ; cả hai dùng chung state `pop` nên không nhân
đôi logic tra/lưu từ. `ChatComposer.vue`: mic-btn 46px → 52px ở ≤720px (hành động chính voice-first).
`AiChat.vue`: `.head-tools` (4 nút Nói ngay/Đọc/Bất ngờ/Mới) thêm `flex-wrap: wrap` + `width: 100%`
ở ≤720px — 4 nút không vừa 1 hàng ở 375px, trước đây tràn ngang; giờ tự xuống 2 hàng gọn trong thẻ.

**Lưu ý khi test bằng preview_eval:** dispatch nhiều sự kiện click mở/đóng BottomSheet liên tiếp
trong <200ms (nhanh hơn phản xạ người dùng thật) làm gián đoạn transition Vue giữa chừng, có lúc kẹt
class enter/leave (phần tử không gỡ khỏi DOM dù đã đóng) — đây là do ngắt animation quá nhanh bằng
script, không phải lỗi thật; test lại với thao tác đơn + chờ đủ (~500-1000ms) giữa các bước thì
mở/đóng/kéo-để-đóng đều mượt và đúng. Đã kiểm 375×812 (light/dark, cả 2 route `/tools/chat` và có
`body.has-mcb-bar` giả lập) + resize về 1280×800 (desktop giữ popover cũ, composer không sticky).
`npm test` (383 tests) + `npm run build` pass.

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

- [x] Đã làm

**Ghi chú (2026-07-05):** Đọc kỹ cả 2 file trước khi sửa — phát hiện hiện trạng đã khác mô tả gốc
của kế hoạch (viết từ đợt khảo sát ban đầu, trước khi 2 file này được viết lại):
`SentenceBankPractice.vue` **không còn** là bài kéo-thả/word-bank nữa — đã là bài "hoàn thành câu
về bản thân" (input text + mic ghi âm, AI chữa), không có phần tử `draggable`/`dragstart` nào (đã
`grep -rn "drag"` toàn `src/` xác nhận không có nơi nào dùng HTML5 drag-and-drop) — nên bài này
không cần đổi gì cho mục tiêu "chạm thay kéo", chỉ còn việc rà 375px (đã có sẵn breakpoint
560px xếp lại `.sb-row`, input đã `font-size: 16px`) — giữ nguyên. `QuizTool.vue` dạng `order`
("Sắp xếp câu") **đã là tap-to-place hoàn chỉnh từ trước** (`pickWord`/`unpickWord` qua `@click`,
không phải kéo-thả — placeholder "Kéo/chạm" trong kế hoạch gốc không khớp code thật) và chip đã đạt
`min-height: 44px`, `gap: 9px`, `touch-action: manipulation` (rule nền toàn cục cho `<button>` từ
Bước 1.3) — chỉ thiếu đúng 1 điều mục 3 yêu cầu: **animation khi bay lên/xuống** (trước đây chip
biến mất/xuất hiện tức thì, không mượt). Thêm: bọc 2 danh sách chip (`order-answer`/`order-pool`)
trong `<TransitionGroup name="chip-fly">` (built-in Vue 3, không cần import) + CSS
`chip-fly-enter/leave` (fade + `translateY` 8px + `scale(0.9)`, 0.18s) và `chip-fly-move` (FLIP tự
động của Vue cho các chip còn lại trượt mượt khi 1 chip bị lấy ra); leave-active dùng
`position: absolute` để chip đang biến mất không đẩy layout — thêm `position: relative` cho
`.order-answer`/`.order-pool` làm container định vị. Không đổi logic `pickWord`/`checkOrder` gì cả.
Mục 4 (chiều cao cố định) và mục 5 (MCQ full-width, cloze ≥16px) đã đạt sẵn từ trước (Bước 1.2/1.3) —
không cần sửa. Không làm sticky nút "Kiểm tra" vì các câu order hiện tại chỉ có 1 câu ngắn (sinh từ
1 câu ví dụ, ~5-10 từ), không đủ dài để cần sticky — nếu sau này có câu order dài hơn nhiều dòng thì
cân nhắc lại.

**Cách kiểm tra (vì `/tools/quiz` yêu cầu đã hoàn thành ≥1 bài mới có quiz thật — chưa có tài khoản
guest với dữ liệu sẵn):** tạm sửa 2 dòng trong `ToolsView.vue` (`quizQs` trả về 1 câu `order` mẫu +
tắt điều kiện hiện `LessonPicker`) để xem trực tiếp trong preview, **rồi phục hồi nguyên vẹn bằng
`git checkout -- src/views/ToolsView.vue` ngay sau khi test xong** (đã xác nhận diff sạch) — không
lặp lại cách sửa `.env.local` đổi guest mode như Bước 2.1 từng làm. Đã thử trên 375×812: chạm từng
từ trong "kho từ" bay đúng vào ô đáp án theo đúng thứ tự bấm, chạm từ trong ô đáp án trả lại kho
(chưa thử lại lần này nhưng logic `unpickWord` không đổi), khi xếp đủ từ nút "Kiểm tra" bật sáng,
bấm ra "✓ Chính xác!" viền xanh + cộng điểm/tiến trình đúng; không có chip nào "kẹt" giữa chừng dù
bấm nhiều lần liên tục. **Bẫy gặp khi test:** dispatch nhiều `.click()` liên tiếp trong cùng 1 lần
gọi JS (cùng tick đồng bộ) làm các chip bị chấm sai từ vì mỗi `@click="pickWord(i)"` đóng gói `i`
tại thời điểm render gần nhất — bắn nhiều click trước khi Vue kịp patch DOM giữa các lần khiến nhiều
lần gọi dùng chung 1 index cũ (giống hệt bẫy đã ghi ở Bước 2.2 với BottomSheet); test lại bằng cách
mỗi lần bấm là 1 lời gọi riêng (đảm bảo Vue flush giữa các lần) thì đúng hoàn toàn — đây là hạn chế
của cách test bằng script, không phải lỗi thật khi người dùng bấm tay. Cũng đã kiểm 1280×800 + light
mode: layout/màu vẫn đúng, không có gì vỡ. `npm test` (383 tests) + `npm run build` pass.

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

- [x] Đã làm

**Ghi chú (2026-07-05):** Tách composable `src/composables/useSwipe.js`: hàm thuần
`swipeState(dx, width)` (progress/ratio/direction/committed theo ngưỡng 30%,
`tests/useSwipe.test.js` 6 case) + `useSwipe({enabled, onCommit})` bọc Pointer
Events (`setPointerCapture`, không lib) tái dùng được cho gesture ngang khác sau
này. `FlashcardTool.vue` dùng `useIsMobile()` (có sẵn từ Bước 2.2) để chỉ bật
layout full-screen ở ≤720px: thêm `.fc-topbar` (progress bar mỏng + "Đang ôn
x/y", tính theo vị trí index/total — không có tín hiệu "đã ôn" riêng biệt nên
dùng vị trí như `MobileCheckpointBar` đã làm ở Bước 2.1), `.card-3d` cao
`max(380px, calc(100dvh - 380px))`. Nút chấm 4 mức: **không** đặt `position:
fixed` bên trong `.card-3d` (phần tử có `transform: rotateY(...)` tạo containing
block riêng — `fixed` bên trong sẽ bám theo thẻ chứ không phải màn hình, bẫy CSS
điển hình) — tách thành block `.fc-mobile-actions` là **sibling** của `.stage`,
`v-if="isMobile && flipped"`, tái dùng đúng `GRADE_BTNS`/`grade()`/`previewLabel`
(không nhân đôi logic, chỉ nhân đôi ~10 dòng markup nút); ẩn `.grade-cta`/
`.grade-label` gốc trong thẻ ở ≤720px bằng CSS. Vuốt: gắn 4 handler pointer lên
`.card-wrap`, chỉ bật khi `flipped` (đúng yêu cầu); trái → `grade('again')`,
phải → `grade('easy')`; nhãn màu `.fc-swipe-hint` hiện dần theo `ratio` lúc kéo;
dưới ngưỡng thì `dx` về 0 (CSS transition, thẻ "bật lại"); qua ngưỡng thì bay
hẳn ra ngoài (`dx = ±width*1.3`) trước khi `reset()` đưa về 0 khi đổi thẻ, cho
cảm giác thẻ mới trượt vào thay vì giật cục. Chặn việc `click` "ảo" sau khi thả
tay vô tình lật ngược thẻ bằng cờ `swipe.hasDragged`.

**Bẫy đã gặp khi test bằng preview (quan trọng, có thể tái diễn nếu sửa lại
component này sau):** ban đầu dùng `watch(card, () => swipe.reset())` để đưa vị
trí kéo về 0 khi đổi thẻ — sai, vì bộ `deck=due` là **computed phản ứng theo
store**: `grade()` gọi `user.reviewCard()` làm `props.cards` (từ `dueWords`
getter) co lại *ngay lập tức* (nextTick), kích hoạt `watch(props.cards,
buildQueue)` reset `index=0` **trước khi** `setTimeout(advance, 280)` của chính
`grade()` kịp chạy — `advance()` chạy sau đó với `total` đã giảm, có thể ra lại
**đúng index cũ trỏ đúng đối tượng thẻ cũ** (identity giữ nguyên vì `savedWords`
trả thẳng reference, không tạo object mới) → Vue `watch(card, ...)` dùng so
sánh `===`, thấy giá trị "không đổi" nên **không** bắn lại, thẻ vừa bay ra khỏi
màn hình bị bỏ quên ở vị trí đó vĩnh viễn (màn hình trắng, thẻ nằm ngoài khung
nhìn bên trái) — tái hiện được ổn định bằng cách chấm liên tiếp cho tới khi
due-deck co còn 1 thẻ. Sửa bằng cách bỏ watcher, gọi thẳng `swipe.reset()` ở
mọi nơi thực sự đổi trạng thái hiển thị (`buildQueue`, `advance`, `prev`) thay
vì suy luận qua so sánh giá trị.
Tiện thể phát hiện thêm 1 bẫy **đã tồn tại từ trước** (không phải do đợt này gây
ra, chưa sửa vì ngoài phạm vi bước này): cùng cơ chế due-deck co lại nói trên
khiến `advance()` có thể **nhảy qua mất 1 thẻ** khi tổng số due giảm đúng lúc
`setTimeout` đang chờ (index cũ + 1, modulo theo total MỚI, không phải total
lúc bắt đầu đếm) — đã báo cáo riêng qua task nền, xem ghi chú cuối bước.
Cũng áp dụng lại đúng mẫu `body.has-mcb-bar` của Bước 2.1: `BackToTop` (nằm
ngoài cây component) bị `.fc-mobile-actions` đè lên vì offset mặc định (84px)
không tính thêm chiều cao thanh chấm điểm mới — thêm class `body.has-fc-actions`
(toggle qua `watchEffect`, gỡ ở `onUnmounted`) + rule tương ứng trong
`base.css` (`bottom: calc(160px + var(--safe-bottom)) !important`).
Đã kiểm bằng preview ở 375×812 (light + dark, seed dữ liệu `savedWords`/`srs`
thẳng vào `localStorage['devleap:user:v2']` để có thẻ due mà không cần đăng
nhập — dữ liệu này chỉ nằm trong trình duyệt phiên preview, không đụng file
repo nên không cần khôi phục gì): full-screen đúng, progress bar cập nhật, lật
bằng chạm, vuốt trái/phải đều chấm đúng mức + ghi đúng lịch SRS (kiểm qua
`known-count` giảm/giữ nguyên đúng theo mức chấm), kéo dưới ngưỡng bật lại đúng
vị trí không mất thẻ, không còn màn hình trắng sau bẫy trên; dark mode màu/độ
tương phản đúng; BackToTop không còn bị đè. 1280×800: card giữ nguyên dạng cũ,
không có progress bar/thanh chấm điểm mobile/nhãn vuốt nào lộ ra, nút chấm vẫn
nằm trong thẻ như trước. `InlineFlashcards.vue`: không sửa gì — đọc lại code
xác nhận đã đạt sẵn từ các bước trước (`.ifc-grade` `min-height: 44px`,
`.ifc-grades` 3 cột `gap: 10px`, đã có breakpoint `≤560px` giảm cỡ chữ) nên bỏ
qua việc dựng lại đăng nhập/guest-mode chỉ để xác nhận lại điều đã biết — đúng
lưu ý "không nên lặp lại cách sửa `.env.local`" ghi ở Bước 2.1.
`npm test` (395 tests, +6 mới cho `useSwipe`) + `npm run build` pass.

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

- [x] Đã làm

**Ghi chú (2026-07-06):** `ShadowingPlayer.vue`: ở ≤720px, `.sh-video` chuyển
`position: sticky; top: 64px` (dưới header, cùng chuẩn `AgendaRail`'s `.rail-h`).
**Bẫy quan trọng:** containing block của phần tử sticky là khối cha GẦN NHẤT của
nó trong luồng — video nằm trong `.sh-left` (chỉ gồm video+panel+tổng kết, NGẮN
hơn nhiều so với `.sh-right`/danh sách 58 câu bên dưới); nếu giữ nguyên cấu trúc,
video sẽ "nhả" dính ngay khi cuộn hết `.sh-left`, biến mất trước khi cuộn hết
danh sách — sai hoàn toàn mục tiêu "video luôn thấy khi cuộn danh sách". Sửa bằng
`@media (max-width:720px) { .sh-left { display: contents; } }`: gỡ `.sh-left`
khỏi cây layout (không mất style vì nó vốn không có style riêng ngoài sticky ở
desktop), biến video/panel/tổng kết thành item ngang hàng với `.sh-right` trong
`.sh-stage` (flex column) — containing block của video giờ là `.sh-stage`, trải
dài hết toàn bộ nội dung nên sticky đúng suốt quá trình cuộn. Gỡ `margin-top`
riêng của `.sh-panel`/`.sh-clip-sum`/`.sh-congrats` (đổi về 0) vì `.sh-stage` đã
có `gap:18px` áp cho các item ngang hàng mới, tránh cộng dồn khoảng cách.
Cụm điều khiển (prev/play/next/lặp/tốc độ) bọc trong `.sh-ctrl-group` mới, ẩn ở
≤720px (chỉ giữ chip IPA trong `.sh-controls`); thay bằng `.sh-mobile-bar` dính
đáy (`position:fixed; bottom:calc(72px + var(--safe-bottom))`, cùng pattern
`MobileCheckpointBar`/`.fc-mobile-actions` các bước trước) gồm prev/play-pause/
next/lặp/tốc độ/🎤 nói thử — tái dùng nguyên hàm `step`/`replay`/`pause`/`attempt`/
`stopAttempt`, chỉ nhân đôi markup nút. Nút mic tròn cũ trong `.sh-current` ẩn ở
mobile (trùng nút mic mới trong bar). Menu tốc độ: giữ dropdown absolute cũ cho
desktop, thêm `BottomSheet` (component có sẵn từ Bước 2.2) cho mobile — dropdown
absolute mở xuống dưới sẽ tràn/khuất khi nút nằm trong thanh dính đáy sát mép
màn hình dưới. Thêm `body.has-shp-bar` (mount/unmount) + rule đẩy `BackToTop` lên
`calc(140px + var(--safe-bottom))` ở base.css, cùng cơ chế 3 bước trước.
`scrollToActive()`: bản mobile không còn `.sh-list` overflow riêng (đã gỡ rule cũ
`max-height:56vh` vì giờ page cuộn xuyên suốt) nên hàm cũ (tính delta theo
`list.scrollTop`) sẽ không tác dụng gì — thêm nhánh: còn overflow nội bộ (desktop
≥960px, `.sh-list` vẫn `max-height/overflow-y:auto` như cũ) thì giữ cách tính cũ;
không còn overflow (mobile) thì dùng `row.scrollIntoView({block:'center'})` cuộn
cả trang — an toàn vì `activeId` chỉ đổi do người dùng bấm, không có
IntersectionObserver phản hồi ngược (khác bẫy scrollIntoView đã gặp ở Bước 2.1).
`ListeningDictation.vue`: `.ld-input` font-size 14px→16px (bị bỏ sót ở đợt rà
16px của Bước 1.2 vì component này không có mặt trong danh sách hôm đó); `.ld-play`/
`.ld-check` thêm `min-height:44px` + `touch-action:manipulation`; `.ld-controls`
thêm `flex-wrap:wrap` phòng tràn; `.ld-real-video` đổi từ width cố định 220px
sang `width:100%; max-width:320px` cho dễ nhìn hơn ở mobile. Không đổi vị trí cụm
nút phát/chậm/lặp vì đã đúng yêu cầu từ trước (nằm ngay trên input, không phải
đầu trang).
**Đã kiểm bằng preview** ở chế độ khách — Supabase đang bị tắt tạm thời trong
`.env.local` để test (nhớ bật lại khi cần đồng bộ cloud thật): 375×812 light+dark —
video dính đúng vị trí xuyên suốt khi cuộn qua cả 58 câu, thanh dính đáy hoạt
động (prev/play/next/lặp/tốc độ mở BottomSheet đúng/mic), không scroll ngang,
BackToTop không bị che. 1280×800 — layout 2 cột giữ nguyên y hệt cũ (sticky cả
cột trái, dropdown tốc độ mở đúng vị trí, không có thanh mobile nào lộ ra).
**Không xác nhận trực tiếp được `ListeningDictation` trên UI thật** (không tìm
được nhanh buổi học có kích hoạt phần "nghe-chép" ở tài khoản khách trong thời
gian hợp lý — phần này chỉ xuất hiện ở một số buổi cụ thể tùy nội dung MD) —
đã rà kỹ code, thay đổi chỉ là CSS chuẩn (font-size/min-height) giống hệt pattern
đã áp dụng thành công cho 12 component khác ở Bước 1.2. `npm test` (390 tests) +
`npm run build` pass.

**Vấn đề:** `ShadowingPlayer.vue` dùng 2 cột ở ≥960px, `max-height: calc(100vh - 130px)`; ở mobile danh sách câu và nút điều khiển (play/tốc độ/ghi âm) rải rác — vừa xem video vừa bấm rất khó. `ListeningDictation.vue` chưa có xử lý mobile.

**Việc cần làm:**
1. `ShadowingPlayer` ở ≤720px: video (YouTube iframe) **dính trên đỉnh** (sticky top, tỉ lệ 16:9), phần dưới là danh sách câu cuộn riêng; câu đang phát tự cuộn vào giữa. Đổi `100vh` → `dvh` (nếu Bước 1.2 chưa quét tới file này).
2. Cụm điều khiển (⏯️, tốc độ, lặp câu, 🎙️ ghi âm) gom thành **thanh điều khiển dính đáy** ở mobile, nút ≥48px. Menu tốc độ đổi thành hàng nút ngang hoặc BottomSheet (tái dùng component Bước 2.2) thay vì menu absolute dễ tràn.
3. `ListeningDictation`: ô gõ chép chính tả ≥16px; cụm nút phát/chậm/lặp đặt ngay trên ô gõ (không phải trên đầu trang) để bàn phím mở vẫn thấy; rà 375px không tràn.
4. Kiểm tra hồi quy điểm WPM/logic chấm không đổi (chỉ CSS/bố cục).

**File liên quan:** `src/components/tools/ShadowingPlayer.vue`, `src/views/ShadowingView.vue`, `src/components/day/ListeningDictation.vue`, `src/components/common/BottomSheet.vue`.

**Nghiệm thu:** 375×812: video luôn nhìn thấy khi cuộn danh sách câu; mọi nút điều khiển bấm được bằng 1 ngón cái ở nửa dưới màn; không còn scroll ngang; desktop 2 cột như cũ; `npm test` pass.

### Bước 2.6 — Quét nốt các màn còn lại: Home, Courses, Tools, Progress, Leaderboard, CodePlayground, Assessment

- [x] Đã làm

**Ghi chú (2026-07-06):** Đi từng view ở 375×812 (light + dark) bằng preview thật (server
`devleap`, guest mode — Supabase vẫn tắt tạm trong `.env.local` như các bước trước đã ghi chú,
không đổi gì thêm). Kết quả: **hầu hết các màn đã đạt sẵn** nhờ nền `clamp()`/breakpoint đã làm
ở Bước 1.2/1.3 áp dụng toàn cục — không phải làm lại từ đầu như dự đoán ban đầu của kế hoạch.
Cụ thể từng màn (không màn nào có scroll ngang — xác nhận bằng
`document.documentElement.scrollWidth === 375` ở mọi trang):
- `HomeView.vue`: đã đạt — `.features-grid`/`.steps-grid`/`.feat-card` tự sập 1 cột ở ≤560-900px,
  hero/today-card không tràn dù padding cố định (chữ tự xuống dòng). Không sửa.
- `CoursesView.vue`: đã đạt — `.grid` 3→2→1 cột đúng breakpoint, filter chip wrap, card đọc
  được hết. Không sửa.
- `JavaCourseView.vue`/`IeltsCourseView.vue` (route `/courses/java`, `/courses/ielts` — không có
  tên trong danh sách gốc của bước nhưng là màn "khóa học" người dùng thấy ngay sau CoursesView,
  nên kiểm luôn cho trọn bộ): đã đạt sẵn — timeline dọc + card tự co, stat card 2 cột, không tràn.
  Không sửa.
- `ShadowingView.vue` (trang chọn chủ đề trước khi vào `ShadowingPlayer` — khác với player đã
  làm ở Bước 2.5): đã đạt — ô dán link YouTube + nút tải xếp hàng gọn, chip cấp độ A1-C2 wrap 2
  hàng, lưới video 1 cột. Không sửa.
- `ToolsView.vue`: đã đạt — `.tool-grid` 2 cột sẵn ở ≤460px (ẩn mô tả, thu icon — làm từ trước).
  Banner ngữ cảnh (`.ctx-banner`) wrap đúng. Không sửa.
- `LeaderboardTool.vue`: đã đạt — trạng thái khách (khóa) và form opt-in/tên hiển thị đọc tốt ở
  375px; `.row` (rank/tên/XP) dùng flex + ellipsis nên không tràn dù tên dài. **Chưa xác nhận trực
  tiếp** bảng xếp hạng có dữ liệu thật trên UI (Supabase tắt nên `cloudReady` luôn false ở máy
  test) — đã đọc kỹ code, cấu trúc giống hệt pattern đã kiểm ở các list khác.
- `CodePlayground.vue`: layout đã đạt (`.pg-grid` xếp dọc ≤760px, padding đã `clamp()` từ Bước
  1.2, nút Chạy/Đặt lại ≥44px). **Sửa 1 chỗ thật:** `CodeEditor.vue` font-size CodeMirror đang
  `13.5px` — dưới ngưỡng "≥14px" nghiệm thu của bước này — đổi thành `14px`
  ([CodeEditor.vue:56](src/components/tools/CodeEditor.vue:56)). Không thêm sticky cho nút Chạy:
  nút đã nằm ngay dưới console (không phải cuộn xa), và kế hoạch gốc tự ghi chú Java là "track
  phụ trên mobile — chỉ cần dùng được, không cần tối ưu sâu" nên không đánh đổi thêm diện tích
  màn hình cố định cho một thanh sticky ít giá trị ở đây.
- `ProgressView.vue`: đã đạt — `.overview-grid` 4→2 cột ở ≤800px, biểu đồ SVG có `viewBox` +
  `width:100%` nên tự co, không tràn dù chưa có dữ liệu thật để xem đồ thị đầy (đã đọc code xác
  nhận cơ chế co giãn đúng).
- `MilestonesView.vue`: đã đạt — `.clip-grid`/`.badge-grid` 3→1 cột ở ≤800px, audio player
  `width:100%`.
- `AssessmentView.vue`: đã đạt — `.assess` dùng `var(--space-page-x)` từ Bước 1.2; đã seed tạm
  `completed.java` vào `localStorage['devleap:user:v2']` trong phiên preview (không đụng file
  repo) để mở khóa bài kiểm tra Tuần 1 và xem thật giao diện câu hỏi — `QuizTool` bên trong đã
  đúng chuẩn full-width từ Bước 2.3.
- `GlobalSearch.vue`: đã có breakpoint ≤860/720px (thu nút thành icon, giảm padding overlay).
  **Quyết định khác kế hoạch gốc:** kế hoạch đề nghị mở "dạng full-screen" ở mobile, nhưng bảng
  lệnh hiện tại (card giữa màn, `max-height: min(72vh,620px)`, bo góc) đã đọc được đầy đủ, không
  tràn, mỗi dòng kết quả đủ cao để chạm — đổi sang full-bleed thật sẽ mất thẩm mỹ "command
  palette" mà không giải quyết vấn đề thật nào; giữ nguyên.
- Đã kiểm dark mode cho Home/Courses/Tools/Progress/GlobalSearch — màu sắc/tương phản đúng theo
  biến `--surface`/`--ink` sẵn có, không có vùng nào bị lệch theme.

`npm test` (390 tests) + `npm run build` pass (không có lỗi mới; cảnh báo chunk >500kB đã có từ
trước, để dành cho Bước 4.3).

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
| 2.1 | DayView + AgendaRail mobile | 1–2 buổi | ✅ |
| 2.2 | Chat như app nhắn tin | 1–2 buổi | ✅ |
| 2.3 | Quiz chạm thay kéo | 1 buổi | ✅ |
| 2.4 | Flashcard full-screen + vuốt | 1 buổi | ✅ |
| 2.5 | Shadowing/nghe chép mobile | 1 buổi | ✅ |
| 2.6 | Quét nốt các màn còn lại | 1–2 buổi | ✅ |
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
