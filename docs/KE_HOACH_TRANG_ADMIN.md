# Kế hoạch — Phát triển Trang Quản Trị (Admin) toàn diện

> Hiện `/admin` mới chỉ có **Shadowing**. Kế hoạch này mở rộng khu quản trị thành
> một bảng điều khiển thật: **quản lý tài khoản, dashboard thống kê, quản lý nội
> dung (mở rộng phần DB), và kiểm duyệt & phản hồi** — bám đúng kiến trúc sẵn có,
> ưu tiên an toàn dữ liệu người dùng.

---

## 0. Hiện trạng (rà code)

| Thành phần | Vị trí | Ghi chú |
| --- | --- | --- |
| Cổng vào admin | `src/router/index.js` (`meta.requiresAdmin`) | Chặn nếu thiếu `cloudEnabled && isAuthed && isAdmin` |
| Xác định admin | `stores/auth.js` → `refreshAdmin()` | `isAdmin` = có dòng trong bảng `admins`; RLS chỉ cho đọc dòng của chính mình |
| Registry module | `src/views/admin/adminModules.js` | Thêm module = thêm 1 phần tử + route con + view. Layout/dashboard tự cập nhật |
| Layout + Home | `AdminLayout.vue`, `AdminHomeView.vue` | Sidebar + lưới thẻ module, đã responsive |
| Module mẫu | `AdminShadowingView.vue` + `lib/shadowingRepo.js` + bảng `shadowing_clips` | **Khuôn mẫu chuẩn**: bảng DB + RLS `is_admin()` cho ghi, public đọc |
| Server-side | `netlify/functions/*.js` | Đã có mẫu function (`shadowing.js`, `chat.js`, `run-java.js`); env key giấu ở Netlify |
| Dữ liệu người dùng | Supabase `auth.users` + bảng `progress` | RLS: **mỗi user chỉ đọc/ghi dòng của mình** |

### Hai ràng buộc kiến trúc quyết định thiết kế

1. **Không đọc được dữ liệu người khác từ client.** `auth.users` không truy cập
   được từ client, và RLS của `progress` chặn đọc chéo. ⇒ Mọi thao tác chạm dữ
   liệu người dùng khác **phải qua Netlify Function dùng `SUPABASE_SERVICE_ROLE_KEY`**
   (bypass RLS), sau khi tự xác minh người gọi là admin.
2. **Nội dung khóa lõi là file tĩnh** (`weeks/*.md`, `Base_English/*.md`,
   `data/courseComm.js`, `data/quizSets.js`, `data/badges.js`, …), parse lúc
   chạy. ⇒ Theo lựa chọn đã chốt: **không migrate lõi sang DB**. Admin nội dung =
   *xem cây nội dung tĩnh (read-only)* + *quản lý các lớp phủ ở DB* theo đúng mô
   hình `shadowing_clips`.

---

## 1. Trụ cột an toàn — làm TRƯỚC mọi module (Đợt 0)

Đây là nền móng. Không có nó thì "quản lý tài khoản" là lỗ hổng bảo mật.

### 1.1 Netlify Function `admin` — cổng đặc quyền duy nhất
- File: `netlify/functions/admin.js` + helper `netlify/functions/_adminAuth.js`.
- Mỗi request:
  1. Đọc `Authorization: Bearer <access_token>` (lấy từ `supabase.auth.getSession()` phía client).
  2. Dùng service client `supabase.auth.getUser(token)` → ra `userId`.
  3. Kiểm tra `userId` có trong bảng `admins` (query bằng service key). **Không tin `isAdmin` phía client.**
  4. Chỉ khi hợp lệ mới thực thi `action` trong body.
- Trả lỗi 401/403 rõ ràng; mọi action đi qua `switch(action)` để dễ mở rộng.
- Env cần thêm ở Netlify: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` (nếu chưa có).

### 1.2 Wrapper client `src/lib/adminApi.js`
- Hàm `callAdmin(action, payload)`: tự đính kèm access token, gọi `/.netlify/functions/admin`, chuẩn hóa lỗi (giống `lib/aiError.js`).
- Các hàm mỏng: `listUsers()`, `getUserDetail(id)`, `setAdmin(id, bool)`, `resetProgress(id)`, `deleteUser(id)`, `getStats()`, `listRecordings()`, …

### 1.3 Nhật ký kiểm toán `admin_audit` (Supabase)
```sql
create table public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  target_id uuid,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
-- Chỉ admin đọc (qua is_admin()); ghi chỉ từ service function.
create policy "audit_select_admin" on public.admin_audit
  for select using (public.is_admin());
```
- Function `admin.js` ghi 1 dòng cho **mọi hành động thay đổi** (grant admin, reset, delete…).

### 1.4 Cứng hóa cổng vào
- Giữ `requiresAdmin` như hiện tại (bảo vệ UX). An toàn thật nằm ở function (bước 1.1).
- Bổ sung test: route guard cho non-admin, và `_adminAuth` từ chối token thường.

**Xong Đợt 0 khi:** có 1 function admin xác thực chắc, wrapper client, bảng audit,
và 1 action thử (vd `ping` trả `{ ok: true, isAdmin: true }`).

---

## 2. Đợt 1 — Quản lý tài khoản  🧑‍💼

Module `accounts` (`AdminAccountsView.vue`, route `admin-accounts`).

### 2.1 Danh sách người dùng
- Action `listUsers`: service function join `auth.users` × `progress` →
  `{ id, email, name, createdAt, lastStudyDate, xp, streak, badges, completedCount, isAdmin }`.
- UI: bảng + ô tìm (email/tên), sắp xếp (XP, ngày tạo, hoạt động gần nhất), phân trang.
- Cột "Admin" hiện huy hiệu; hoạt động gần nhất tô màu theo độ mới.

### 2.2 Chi tiết 1 người dùng (drawer/panel)
- Action `getUserDetail(id)`: trả toàn bộ `progress` bóc tách dễ đọc —
  số buổi hoàn thành từng khóa (java/ielts/comm), điểm quiz, badge, chuỗi ngày,
  từ đã lưu (đếm), lịch SRS (đếm).
- Chỉ đọc; là nơi bấm các hành động ở 2.3.

### 2.3 Hành động quản trị (đều ghi audit + xác nhận 2 bước)
| Hành động | action | Bảo vệ |
| --- | --- | --- |
| Cấp / thu quyền admin | `setAdmin` | Không cho tự thu quyền của **chính mình**; cảnh báo khi hạ admin cuối cùng |
| Reset tiến độ | `resetProgress` | Xác nhận gõ email; audit lưu snapshot cũ để cứu |
| Xóa tài khoản | `deleteUser` | Không cho tự xóa; xác nhận mạnh; xóa cả `progress` + ghi âm storage |
| Đổi tên hiển thị leaderboard xấu | `clearLeaderboardName` | (giao thoa với Đợt 4) |

> ⚠️ Xóa vĩnh viễn & sửa quyền là hành động nhạy cảm — luôn xác nhận rõ ràng
> trong UI. Không tự động hóa hàng loạt.

**Xong khi:** admin xem được danh sách + chi tiết, cấp/thu quyền admin an toàn,
reset/xóa có xác nhận và ghi audit.

---

## 3. Đợt 2 — Dashboard & Thống kê  📊

Nâng `AdminHomeView.vue` thành dashboard thật (giữ lưới module xuống dưới).

### 3.1 Số liệu tổng quan (thẻ)
- Tổng user, user hoạt động 7/30 ngày (theo `last_study_date`), user mới trong kỳ.
- Tổng XP toàn hệ, số buổi hoàn thành, số bài quiz đã làm.

### 3.2 Phễu hoàn thành theo khóa
- Với java/ielts/comm: bao nhiêu người chạm tới từng tuần → thấy chỗ rơi rụng.
- Tỉ lệ đậu quiz tuần/cuối khóa, điểm trung bình.

### 3.3 Nội dung phổ biến / cần chú ý
- Buổi được hoàn thành nhiều nhất & ít nhất; quiz có tỉ lệ trượt cao (gợi ý chỉnh độ khó — nối với `KE_HOACH_DO_KHO_KHOA_HOC.md`).

### 3.4 Nguồn dữ liệu — chọn RPC security-definer cho số **tổng hợp**
- Vì dashboard chỉ cần **số gộp, không PII**, tạo hàm `security definer` trả
  aggregate (giống `leaderboard_weekly()` sẵn có) → gọi thẳng bằng RPC từ client,
  không cần lộ dữ liệu thô. Ví dụ `admin_overview()`, `course_funnel()`.
- Bảo vệ trong hàm: `if not public.is_admin() then raise exception ...`.
- Số cần join `auth.users` (user mới theo ngày tạo) thì lấy qua function `admin` (Đợt 0).
- Biểu đồ: dùng bar/line đơn giản theo hệ màu sẵn có (tham chiếu skill `dataviz` khi vẽ).

**Xong khi:** mở `/admin` thấy ngay bức tranh sức khỏe hệ thống, số liệu khớp thực tế.

---

## 4. Đợt 3 — Quản lý nội dung (mở rộng phần DB)  📚

Chốt: **không migrate lõi**. Hai nhánh:

### 4.1 Trình xem cây nội dung tĩnh (read-only) — module `content`
- Parse dữ liệu khóa hiện có (`parseWeek`, `parseIelts`, `parseComm`, `quizSets`,
  `badges`, `milestones`) và hiển thị cây: Khóa → Tuần → Buổi → (mission/quiz/…).
- Mục đích: admin **thấy toàn cảnh** nội dung, tra cứu nhanh, biết buổi nào tồn tại
  để gắn lớp phủ. Kèm ghi chú rõ: "Sửa nội dung lõi qua file + PR" (kèm đường dẫn file).

### 4.2 Lớp phủ ở DB (sửa được, không cần deploy) — theo mô hình `shadowing_clips`
- **Cấu hình site** `site_config` (key → jsonb): bật/tắt hiển thị từng khóa,
  banner/thông báo trang chủ, ghi chú bảo trì.
  ```sql
  create table public.site_config (
    key text primary key, value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );
  -- public đọc; is_admin() ghi (giống clips)
  ```
  Client đọc `site_config` lúc khởi động (thêm vào `stores` hoặc composable) để
  hiện banner / ẩn khóa chưa mở.
- **Shadowing**: gộp module hiện có vào nhóm "Nội dung" (giữ nguyên code).
- **(Tùy chọn) Nội dung bổ sung merge lúc chạy**: nếu sau này cần thêm
  vocab/quiz phụ mà không deploy, tạo bảng riêng và **merge static + DB** đúng
  như `shadowingRepo.mergeByVideoId` (static là nền, DB thắng khi trùng).

**Xong khi:** admin xem được cây nội dung, bật/tắt khóa và đăng banner từ giao
diện, thay đổi hiện ngay cho người dùng.

---

## 5. Đợt 4 — Kiểm duyệt & Phản hồi  🛡️

Module `moderation` (`AdminModerationView.vue`).

### 5.1 Phản hồi cuối tuần (đã có dữ liệu)
- `progress.week_feedback` (Dễ/Vừa/Khó) — RPC aggregate theo tuần × khóa → biểu đồ
  cảm nhận độ khó. Nối trực tiếp với kế hoạch chuẩn hóa độ khó.

### 5.2 Ghi âm mốc (storage `recordings`)
- Hiện RLS chỉ cho chủ sở hữu. Để admin nghe/kiểm duyệt: qua function `admin`
  tạo **signed URL** bằng service key (không mở policy storage cho admin ở client).
- UI: liệt kê ghi âm gần nhất (user, mốc, thời điểm), nghe thử, gắn cờ / xóa (audit).

### 5.3 Leaderboard
- Xem danh sách opt-in + tên hiển thị; xóa tên phản cảm (`clearLeaderboardName`, Đợt 1).

### 5.4 (Tùy chọn) Nội dung user tạo khác
- Từ đã lưu / chủ đề hiện là dữ liệu riêng tư — mặc định **không** đưa vào kiểm
  duyệt (tôn trọng riêng tư). Chỉ xử lý khi có tính năng chia sẻ công khai.

**Xong khi:** admin thấy phản hồi độ khó tổng hợp, kiểm duyệt được ghi âm &
tên leaderboard, mọi thao tác xóa đều ghi audit.

---

## 6. Bảng tổng hợp công việc

| Đợt | Module / Hạng mục | File chính | DB / Function | Ưu tiên |
| --- | --- | --- | --- | --- |
| 0 | Nền tảng bảo mật | `functions/admin.js`, `_adminAuth.js`, `lib/adminApi.js` | `admin_audit` + service key | 🔴 Bắt buộc trước |
| 1 | Quản lý tài khoản | `AdminAccountsView.vue` | actions: list/detail/setAdmin/reset/delete | 🔴 Cao |
| 2 | Dashboard & thống kê | nâng `AdminHomeView.vue` | RPC `admin_overview`, `course_funnel` | 🟠 Cao |
| 3 | Nội dung (cây tĩnh + lớp phủ DB) | `AdminContentView.vue` | `site_config` + gộp shadowing | 🟠 Trung bình |
| 4 | Kiểm duyệt & phản hồi | `AdminModerationView.vue` | RPC feedback + signed URL ghi âm | 🟡 Trung bình |

Mỗi module mới = 1 phần tử trong `adminModules.js` + 1 route con trong
`router/index.js` + 1 view (đúng nhịp mở rộng hiện tại).

---

## 7. Nguyên tắc xuyên suốt

- **Một cổng đặc quyền duy nhất** (function `admin`) cho mọi thứ chạm dữ liệu
  người khác; client không bao giờ giữ service key.
- **Xác minh admin ở server**, không tin cờ client.
- **Audit mọi thay đổi**; hành động phá hủy luôn xác nhận 2 bước.
- **Số tổng hợp qua RPC security-definer** (không lộ PII); **danh sách/PII qua function**.
- **Nội dung lõi ở file, lớp phủ ở DB** — không trộn nguồn sự thật.
- **Test song hành** (`tests/`): route guard, `_adminAuth` từ chối token thường,
  các action chính.

---

## 8. Trạng thái

- [x] Đợt 0 — Nền tảng bảo mật ✅ (function `admin.js` + `_adminAuth.js` xác minh
      admin phía server; wrapper `lib/adminApi.js` (`callAdmin`/`pingAdmin`); bảng
      `admin_audit` + `logAudit`; dev proxy chuyển tiếp Bearer token; guard tách ra
      `router/guard.js`; test: `adminAuth`, `adminApi`, `routeGuard`. Action thử `ping`.)
- [ ] Đợt 1 — Quản lý tài khoản
- [ ] Đợt 2 — Dashboard & thống kê
- [ ] Đợt 3 — Quản lý nội dung (mở rộng DB)
- [ ] Đợt 4 — Kiểm duyệt & phản hồi

> Ghi chú: kế hoạch tự chứa. Bắt đầu **bắt buộc từ Đợt 0** rồi tới Đợt 1.
