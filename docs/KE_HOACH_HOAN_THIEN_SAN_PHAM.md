# Kế hoạch Hoàn Thiện Sản Phẩm — "Lớp vỏ trải nghiệm"

> Ngày lập: 2026-07-11. Sau khi rà soát toàn bộ codebase và 11 tài liệu kế hoạch cũ.

## 0. Bối cảnh & phát hiện

DevLeap đã là một nền tảng **trưởng thành về nội dung và lõi kỹ thuật**:

- 4 khóa hoàn chỉnh: Java 12 tuần, IELTS 8 tuần, Giao Tiếp Thực Chiến, Java Phỏng Vấn — tất cả các `KE_HOACH_*` khóa học/nội dung đều đã xong.
- Khóa **"Nói Tự Tin"** thực chất **đã được lắp code** (commit `2fc13a1`): `PronunciationDrill`, `FluencyRetell`, `ListeningDictation`, `ListeningComprehension`, `MonologueTask`, `deferCorrection` đều đã wired vào `CommDayView.vue`. → `KE_HOACH_NOI_TU_TIN.md` chỉ **chưa tick lại checkbox**, không phải chưa làm.
- Lõi kỹ thuật chắc: PWA + offline sâu, code splitting, Supabase sync, SRS SM-2, AI tutor có retry, 60 file test logic.

**Nhưng lớp "trải nghiệm người dùng vòng ngoài" còn yếu.** Đây là trọng tâm của kế hoạch này. Các lỗ hổng đã xác minh trực tiếp trong code:

| # | Lỗ hổng | Mức | Bằng chứng |
|---|---|---|---|
| 1 | Không có global error boundary | **CAO** | `grep onErrorCaptured/errorHandler` = 0 kết quả — 1 view lỗi có thể trắng cả app |
| 2 | Accessibility yếu | **CAO** | ~21 `aria-label` toàn dự án; nhiều `<div @click>` tương tác chính (HomeView due-card, chips) không dùng bàn phím được |
| 3 | Không có trang Hồ sơ/Cài đặt | **T.BÌNH-CAO** | Không có `ProfileView/SettingsView`; cài đặt rải 4–5 chỗ (HomeView, LeaderboardTool, AiChat) |
| 4 | Không có luồng quên/đặt lại mật khẩu | **T.BÌNH-CAO** | `auth.js` chỉ có signIn/signUp/OAuth/signOut |
| 5 | Onboarding gần như không có | **T.BÌNH** | Khách chỉ thấy hero rồi bị `requiresAuth` chặn; không tour/học thử/checklist |
| 6 | SEO/share yếu | **T.BÌNH** | `document.title`/`useHead` = 0; không OG/Twitter card |
| 7 | Study reminder chỉ khi tab mở | **T.BÌNH** | Không có push server/SW — không nhắc được đúng lúc người dùng chưa mở app |
| 8 | Không có analytics | **THẤP-T.BÌNH** | Không đo được hoàn thành buổi / điểm rơi rụng |
| 9 | Không export/import dữ liệu học | **THẤP-T.BÌNH** | Người dùng không tự sao lưu được |
| 10 | Thiếu test component/E2E | **THẤP** | 60 test là logic thuần; chỉ 1 `render.test.js` |

**Việc vận hành còn treo (không phải code):**
- Chạy migration SQL trên Supabase thật: `site_config`, `course_access`, bucket/policy `recordings`.
- Kiểm định trên thiết bị thật: mic/TTS/audio standalone, Lighthouse mobile ≥ 90, facade YouTube (3 bước cuối `KE_HOACH_MOBILE_PWA.md`).

---

## 1. Nguyên tắc

- **Không đụng nội dung khóa học** — nội dung đã tốt. Chỉ làm lớp vỏ.
- Mỗi bước phải **tự chứa, testable, không phá vỡ luồng hiện có**. Chạy `npm test` xanh sau mỗi bước.
- Ưu tiên theo **tác động ÷ công sức**: chống-vỡ & a11y trước (rẻ, ảnh hưởng mọi người dùng), social/analytics sau.
- Tôn trọng quyền riêng tư: analytics tự-host hoặc không cookie; không đưa dữ liệu cá nhân ra bên thứ ba.

---

## 2. Kế hoạch theo đợt

### Đợt 1 — Vững & không vỡ (ưu tiên cao nhất, công sức thấp) ✅ ĐÃ XONG (2026-07-11)

> Tóm tắt đã làm:
> - **1.1** `AppErrorBoundary.vue` (onErrorCaptured, tự xóa lỗi khi đổi route, nút "Thử lại"/"Tải lại") bọc `<RouterView>` trong `App.vue`; `app.config.errorHandler` trong `main.js`. Test: `tests/errorBoundary.test.js`.
> - **1.2** `sendPasswordReset()` + `updatePassword()` trong `auth.js`; link "Quên mật khẩu?" + form gửi email trong `LoginGate.vue`; route/trang công khai `/reset-password` (`ResetPasswordView.vue`). Test: `tests/authPasswordReset.test.js`.
> - **1.3** Chuyển `<div/span @click>` chính sang `<button>` (due-card, chip-link, feat-card, see-all ở `HomeView`; thẻ khóa + bộ lọc ở `CoursesView`); `aria-label`/`aria-expanded` cho nút menu tài khoản (`AppHeader`); focus + Esc + `role="dialog"` cho `BottomSheet`; Esc toàn cục cho command palette (`GlobalSearch`).

- **1.1 Global error boundary.** Thêm `app.config.errorHandler` trong `main.js` (log + báo cáo mềm) và component `AppErrorBoundary.vue` (dùng `onErrorCaptured`) bọc `<RouterView>` trong `App.vue`. Fallback UI: "Đã có lỗi, tải lại phần này" + nút reload route + giữ nguyên layout (nav vẫn dùng được). Test: mount 1 child ném lỗi → thấy fallback, app không trắng.
- **1.2 Quên/đặt lại mật khẩu.** Thêm `resetPasswordForEmail()` + `updatePassword()` vào `auth.js`; UI "Quên mật khẩu?" ở form đăng nhập; trang/route xử lý callback đặt lại. Test store logic.
- **1.3 Accessibility cốt lõi.** Chuyển các phần tử tương tác chính từ `<div @click>` sang `<button>` (hoặc `role="button"` + `tabindex="0"` + `@keydown.enter/space`): due-card & chips ở `HomeView.vue`, thẻ khóa ở `CoursesView.vue`, các card điều hướng. Thêm `aria-label` cho nút icon. Focus-trap + `Esc` cho modal/bottom-sheet (search palette, AiChat sheet). Mục tiêu: điều hướng bàn phím xuyên suốt các luồng chính.

### Đợt 2 — Hồ sơ & cài đặt tập trung ✅ ĐÃ XONG (2026-07-11)

> Tóm tắt đã làm:
> - **2.1** `ProfileView.vue` (route `/profile`, link "👤 Hồ sơ & cài đặt" trong menu tài khoản `AppHeader.vue`): tên hiển thị (`auth.updateDisplayName`), theme (`useTheme`), giờ nhắc học (`useStudyReminder`), quyền thông báo trình duyệt, opt-in + tên leaderboard (`leaderboardSlice`), persona AI mặc định khóa Nền Tảng (`PERSONAS`/`setConvoPrefs`). Giọng đọc TTS không có tùy chọn thủ công trong code hiện tại (tự chọn giọng en-US/en-GB) nên không đưa vào — không phải bỏ sót, chỉ là chưa có hạ tầng để gom.
> - **2.2** Hiển thị email + nhà cung cấp đăng nhập (Google/email, đọc `app_metadata.provider` mới thêm vào `auth.js`); nút "Đổi mật khẩu" (gửi lại email reset, ẩn với tài khoản Google); "Đặt lại tiến độ" xác nhận 2 bước (ghi đè cloud về mặc định qua `pushNow()` rồi `clearLocalProgress()` + tải lại trang). Không tự xóa tài khoản (đúng nguyên tắc đã đề ra).
> - **2.3** `src/lib/dataExport.js` (`buildExportPayload`/`parseImportPayload`) tái dùng `user.snapshot()`/`applySnapshot()`; nút xuất file JSON tải xuống; nhập file có xác nhận "Hợp nhất" (`mergeSnapshots`) hoặc "Ghi đè hoàn toàn". Test: `tests/dataExport.test.js` (round-trip + lỗi định dạng), `tests/authProfile.test.js` (đổi tên hiển thị).

- **2.1 Trang `/profile` (hoặc `/settings`).** Một nơi gom: tên hiển thị, theme (đã có `useTheme`), giờ nhắc học, quyền thông báo, opt-in leaderboard, persona AI mặc định, ngôn ngữ giọng đọc. Đọc/ghi qua store `user` + `auth`.
- **2.2 Quản lý tài khoản & dữ liệu.** Lắp UI cho `clearProgress.js` (đặt lại tiến độ, có xác nhận 2 bước); hiển thị email/nhà cung cấp đăng nhập; nút đăng xuất; link đổi mật khẩu (từ 1.2). **Không** tự xóa tài khoản (thao tác nhạy cảm — hướng dẫn thay vì tự làm).
- **2.3 Export/Import dữ liệu học.** Xuất JSON (tiến độ + SRS + saved words + điểm quiz) để sao lưu; nhập lại có xác nhận merge/ghi đè. Test round-trip serialize.

### Đợt 3 — Thu hút & giữ chân người mới ✅ ĐÃ XONG (2026-07-12)

> Tóm tắt đã làm:
> - **3.1** Bỏ qua "học thử 1 buổi" cho khách (quyết định có chủ ý — không đổi mô hình truy cập hiện tại). Đã làm: tour 3–4 bước ở trang chủ (`OnboardingTour.vue` + `useOnboardingTour`, tái dùng `BottomSheet`, dismiss vĩnh viễn qua localStorage, tôn trọng `prefers-reduced-motion` sẵn có ở `base.css`); checklist khởi động sau đăng nhập đầu (`useOnboardingChecklist` + thẻ ở `HomeView.vue` — 3 bước: chọn khóa/hoàn thành buổi đầu/bật nhắc học, ẩn khi xong hoặc bấm "Ẩn đi"). Logic thuần ở `src/lib/onboarding.js`, test `tests/onboarding.test.js`.
> - **3.2** `usePageMeta.js` đặt `document.title` + meta description/OG/Twitter theo `route.meta.title`/`description` (khai ở từng route trong `router/index.js`), gọi 1 lần ở `App.vue`. Thẻ OG/Twitter mặc định thêm vào `index.html`. Bỏ qua prerender (không cần thiết ở quy mô hiện tại). Test: `tests/usePageMeta.test.js`.
> - **3.3** Web push THẬT (không chỉ cải thiện local): VAPID keys + `public/sw.js` thêm `push`/`notificationclick`; `src/lib/webPush.js` + `src/composables/usePushReminder.js` (đăng ký/hủy `PushManager`, lưu Supabase); bảng `push_subscriptions` + RLS trong `supabase/schema.sql`; Netlify Scheduled Function `netlify/functions/send-study-reminders.js` (chạy mỗi giờ, giả định múi giờ VN UTC+7, dùng `web-push` + service role) gửi khi streak sắp đứt đúng giờ ưa thích, tự dọn subscription hết hạn (404/410). Toggle "Nhắc học kể cả khi app đã đóng" ở `ProfileView.vue`. Hướng dẫn deploy (sinh VAPID keys, đặt env Netlify) ở `docs/SUPABASE_SETUP.md` mục 7. Test: `tests/webPush.test.js`, `tests/sendStudyReminders.test.js`.
> - Vận hành còn treo (như các bước trước): chạy `schema.sql` (bảng `push_subscriptions`) trên Supabase thật, đặt `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VITE_VAPID_PUBLIC_KEY` ở Netlify, kiểm thử push thật trên thiết bị.

- **3.1 Onboarding.** ~~"Học thử 1 buổi" cho khách~~ (bỏ qua theo quyết định). Checklist khởi động sau lần đăng nhập đầu (chọn khóa → hoàn thành buổi đầu → bật nhắc học). Tour ngắn 3–4 bước ở trang chủ (dismiss vĩnh viễn, tôn trọng `reduced-motion`).
- **3.2 SEO/share theo route.** Composable `useHead`/`usePageMeta` đặt `document.title` + meta description theo từng route (khóa, buổi, tools). Thêm OG/Twitter card + ảnh share mặc định trong `index.html` và ghi đè theo route. Cân nhắc prerender trang chủ + `/courses` nếu cần SEO thật.
- **3.3 Nhắc học mạnh hơn.** Web push qua Service Worker (đăng ký subscription + Netlify Scheduled Function gửi mỗi giờ) — đã làm bản đầy đủ thay vì chỉ cải thiện lịch nhắc cục bộ.

### Đợt 4 — Đo lường & chất lượng ✅ 4.1–4.2 XONG (2026-07-12), 4.3 vẫn treo (vận hành)

> Tóm tắt đã làm:
> - **4.1** Bảng `events` trong Supabase (insert-only, RLS `auth.uid() = user_id`, không select/update/delete cho client — kiểu audit log như `admin_audit`). Logic thuần `src/lib/analytics.js` (`sanitizeProps` chỉ giữ string/number/boolean/null — không object lồng nhau, không hàm — nên không lỡ tay gửi PII; `isOptedOut`/`setOptedOut` cờ local riêng); composable `useAnalytics()` (`src/composables/useAnalytics.js`, cùng pattern `usePushReminder.js`) — `track(name, props)` bắn-và-quên, tự tắt khi khách (chưa cấu hình Supabase) hoặc đã tắt ở trang Hồ sơ, không bao giờ throw (best-effort). Gắn vào: `router/index.js` (`page_view` mỗi lượt chuyển trang — đo rơi rụng theo bước; `lesson_open` khi vào `java-day`/`ielts-day`/`comm-day`), `progressSlice.toggleDay` (`lesson_complete`, chỉ khi đánh dấu xong — không bắn khi bỏ đánh dấu), `GlobalSearch.vue` (`search_open` — đo mức dùng tính năng). Toggle "Analytics ẩn danh" ở `ProfileView.vue` (mặc định BẬT, tắt được, mô tả rõ không lưu email/tên/nội dung viết); cờ lưu ở `localPrefsSlice.js` (`analyticsOptOut`). Retention theo tuần/dashboard tổng hợp: chưa làm — dữ liệu đã có trong bảng `events`, truy vấn SQL sau khi có dữ liệu thật. Test: `tests/analytics.test.js`.
> - **4.2** Theo đúng quy ước sẵn có của repo (không có `@vue/test-utils`, tự dựng bằng `createApp(...).mount()` + `vi.mock`) — không thêm dependency mới: `tests/globalSearchPalette.test.js` (mở bằng Ctrl/Cmd+K, focus ô tìm kiếm + bắn `search_open`, đóng bằng Esc, chọn kết quả bằng click → điều hướng router + đóng bảng); `tests/lessonCompleteFlow.test.js` (đăng nhập giả lập → `toggleDay` đánh dấu hoàn thành → cộng XP, lưu `localStorage`, bắn `lesson_complete` — bỏ đánh dấu thì không bắn lại). `error boundary` đã có sẵn test từ Đợt 1 (`tests/errorBoundary.test.js`). Playwright/E2E trình duyệt thật: chưa làm — quy mô hiện tại chưa cần.
> - Vận hành còn treo (chưa đổi): chạy `schema.sql` (bảng `events` mới) trên Supabase thật.

- **4.1 Analytics tôn trọng riêng tư.** Plausible/Umami tự-host, hoặc bảng `events` trong Supabase. Đo: bắt đầu/hoàn thành buổi, điểm rơi rụng theo bước, tính năng ít dùng, retention theo tuần. Không PII, có thể tắt.
- **4.2 Test component/E2E luồng chính.** Ít nhất: đăng nhập (mock) → mở 1 buổi → đánh dấu hoàn thành → tiến độ được lưu; mở search palette bằng phím; error boundary. (Vitest + happy-dom cho component; cân nhắc Playwright cho E2E thật nếu muốn.)
- **4.3 Vận hành & thiết bị thật.** Chạy migration SQL (`site_config`, `course_access`, bucket `recordings`). Lighthouse mobile ≥ 90 + facade YouTube. Kiểm định mic/TTS/audio ở chế độ standalone trên iOS/Android. (Đây là 3 bước cuối `KE_HOACH_MOBILE_PWA.md`.)

### Dọn dẹp tài liệu (nhanh) ✅ XONG (2026-07-12)
- ~~Tick lại checklist Đợt 1–5 trong `KE_HOACH_NOI_TU_TIN.md`~~ (đã lắp code — xác minh trong `CommDayView.vue`: `PronunciationDrill`, `FluencyRetell`, `MonologueTask`, `ListeningDictation`, `ListeningComprehension`, `IntonationTrainer`, `ShadowingBeat`, `deferCorrection`, persona `gaubong`, `commRevengeScene`, `commWeakPairGroups`, `commMilestoneOf` đều đã wired).
- ~~Tick mục shadowing dòng 139 trong `KE_HOACH_CAI_TIEN_GIAO_TIEP.md`~~ (đã xong ở `KE_HOACH_CAI_TIEN_WEBSITE.md` Bước 1.3 — script tự curate 10/10 clip).

---

## 3. Thứ tự khuyến nghị & trạng thái

| Bước | Mô tả | Ưu tiên | Trạng thái |
|---|---|---|---|
| 1.1 | Global error boundary | ⭐⭐⭐ | ✅ |
| 1.2 | Quên/đặt lại mật khẩu | ⭐⭐⭐ | ✅ |
| 1.3 | Accessibility cốt lõi | ⭐⭐⭐ | ✅ |
| 2.1 | Trang Hồ sơ/Cài đặt | ⭐⭐ | ✅ |
| 2.2 | Quản lý tài khoản & dữ liệu | ⭐⭐ | ✅ |
| 2.3 | Export/Import dữ liệu | ⭐ | ✅ |
| 3.1 | Onboarding người mới | ⭐⭐ | ✅ (bỏ qua guest trial theo quyết định) |
| 3.2 | SEO/share theo route | ⭐⭐ | ✅ |
| 3.3 | Nhắc học mạnh hơn (push) | ⭐ | ✅ (web push thật, cần deploy) |
| 4.1 | Analytics riêng tư | ⭐ | ✅ |
| 4.2 | Test component/E2E | ⭐ | ✅ (theo quy ước sẵn có, không Playwright) |
| 4.3 | Vận hành + thiết bị thật | ⭐⭐ | 🟡 một phần (migration/Lighthouse) |
| — | Dọn dẹp tài liệu | ⭐ | ✅ |

> Gợi ý bắt đầu: **Đợt 1** (rẻ, ảnh hưởng 100% người dùng, giảm rủi ro vỡ app). Sau đó Đợt 2 (hồ sơ) vì bổ khuyết rõ rệt nhất về UX cho người đã đăng nhập.
