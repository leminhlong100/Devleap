# Kế hoạch — Vá giao diện Admin cho Mobile

> Trang `/admin` hiện chỉ dùng tốt trên desktop. Kế hoạch này làm cho toàn bộ khu
> vực admin (`src/views/admin/*`) dùng được thoải mái trên màn hình ≤ 375px, tái
> dùng đúng quy ước responsive đã có ở phần còn lại của site (breakpoint
> `720px`, mẫu drawer/tab của `BottomNav.vue`) thay vì phát minh style mới.

---

## 0. Hiện trạng (rà code)

Không dùng Tailwind — CSS thuần + custom properties, mỗi view có `<style scoped>`
riêng. Phần còn lại của app (không phải admin) đã responsive nhất quán theo
breakpoint **`@media (max-width: 720px)`** (`assets/styles/base.css`,
`components/layout/BottomNav.vue`). Khu admin **không theo quy ước này** — mỗi
view tự chế breakpoint riêng (760px, 700px, 600px, 980px...) và không có
drawer/tab pattern nào cho nav.

| File | Vai trò | Vấn đề mobile chính |
| --- | --- | --- |
| `views/admin/AdminLayout.vue` | Sidebar + `<RouterView>` | Grid `232px 1fr` chỉ gãy ở 760px (lệch quy ước 720px); dưới đó sidebar biến thành hàng ngang wrap link, không phải drawer như `BottomNav.vue` |
| `views/admin/AdminHomeView.vue` | Dashboard: KPI, funnel, bảng quiz, lưới module | `minmax(170–300px,1fr)` các grid rộng hơn viewport 375px; font-size KPI (26px) không co lại |
| `views/admin/AdminAccountsView.vue` | Bảng user + drawer chi tiết + modal xác nhận | `<table>` 7 cột scroll ngang; stat grid trong drawer `repeat(3,1fr)` chỉ còn 2 cột ở 600px, vẫn chật ở 375px |
| `views/admin/AdminContentView.vue` | Toggle chế độ khóa học, form banner, cây nội dung | Hàng nút segmented + `.tg-name{min-width:160px}` dễ tràn; cây nội dung nhiều badge inline dễ vỡ tầng bậc |
| `views/admin/AdminModerationView.vue` | Tab feedback/recording/leaderboard | 2 bảng **không có** wrapper scroll ngang (khác AdminAccountsView); `<audio>` 220px tràn khỏi ô bảng |
| `views/admin/AdminShadowingView.vue` | Editor clip (player + danh sách câu) + bảng clip | `.meta-grid` 5 cột chỉ co về 2 cột ở 700px; `.row-bar` 6+ nút mini dễ vỡ; bảng clip có cột `width:90px` cố định không co |

**Kết luận:** vấn đề lặp lại ở mọi view — **bảng dữ liệu** và **breakpoint tùy
tiện** — nên vá tận gốc bằng 1-2 component dùng chung thay vì sửa từng view
riêng lẻ.

---

## 1. Đợt 1 — Nền tảng dùng chung (làm trước, các đợt sau phụ thuộc vào đây)

### 1.1 Thống nhất breakpoint
- Đổi mọi `max-width: 760px / 700px / 600px` trong `views/admin/*.vue` về
  `720px` cho khớp quy ước toàn site. Thêm biến `--admin-bp-mobile: 720px`
  nếu cần dùng lại nhiều nơi (hoặc dùng thẳng số, giữ đồng bộ với `base.css`).

### 1.2 `AdminLayout.vue` → sidebar thành drawer trên mobile
- Dưới 720px: ẩn sidebar mặc định, thêm nút hamburger ở header admin để mở
  drawer trượt (tái dùng animation/overlay pattern đã có ở `BottomNav.vue`
  hoặc menu mobile của site chính nếu có), thay vì để nav wrap thành hàng ngang.
- Đóng drawer khi chọn 1 mục / khi route đổi.
- Giữ nguyên hành vi desktop (≥720px) như hiện tại.

### 1.3 Component dùng chung `AdminDataTable.vue`
- Nhận `columns` + `rows` (+ slot cho cell tùy biến như audio player, badge...).
- Desktop (≥720px): render `<table>` như cũ.
- Mobile (<720px): tự chuyển sang **card-stack** (mỗi row → 1 card, label:value
  theo chiều dọc) — không còn scroll ngang bảng.
- Áp dụng lại cho: bảng user (`AdminAccountsView`), bảng feedback/recording/
  leaderboard (`AdminModerationView`), bảng clip (`AdminShadowingView`).

**Xong Đợt 1 khi:** breakpoint đồng nhất 720px toàn bộ `views/admin/`, có
drawer mobile cho sidebar, và `AdminDataTable.vue` sẵn sàng để 3 view bảng
dùng lại ở Đợt 2.

---

## 2. Đợt 2 — Áp dụng cho từng view bảng

- **`AdminAccountsView.vue`**: thay `<table class="tbl">` bằng
  `AdminDataTable`; drawer chi tiết đổi stat grid sang `repeat(2,1fr)` dưới
  720px (thay vì chỉ dưới 600px), full-width dưới 480px nếu vẫn chật.
- **`AdminModerationView.vue`**: thay 2 bảng còn lại bằng `AdminDataTable`;
  audio player trong card mobile dùng `width: 100%` thay vì `max-width: 220px`.
- **`AdminShadowingView.vue`** (bảng clip): thay bảng cố định cột 90px bằng
  `AdminDataTable`.

**Xong Đợt 2 khi:** không còn `<table>` nào trong admin bị scroll ngang trên
375px; mọi bảng đọc được dạng card trên mobile.

---

## 3. Đợt 3 — Vá layout không phải bảng

- **`AdminHomeView.vue`**: đổi `minmax(170–300px,1fr)` → dùng
  `repeat(auto-fit, minmax(140px,1fr))` hoặc ép 1 cột dưới 480px; giảm
  font-size KPI (26px → ~20px) dưới 720px qua media query.
- **`AdminContentView.vue`**: hàng segmented-button + `.tg-name` chuyển
  `flex-wrap: wrap` có khoảng cách dọc rõ ràng dưới 720px; cây nội dung giảm
  `padding-left`/gộp badge phụ vào 1 dòng thứ 2 thay vì nhồi ngang.
- **`AdminShadowingView.vue`** (editor): `.meta-grid` xuống 1 cột dưới 720px
  (không chỉ 2 cột ở 700px); `.row-bar` gom nút phụ vào menu "..." hoặc wrap
  có hàng riêng thay vì tràn ngang; kiểm tra iframe YouTube co theo
  `aspect-ratio` full-width.

**Xong Đợt 3 khi:** không còn phần tử nào tràn ngang màn hình 375px ở bất kỳ
view admin nào (kiểm bằng DevTools responsive mode, không cần scroll ngang
trang).

---

## 4. Đợt 4 — Kiểm thử & hoàn thiện

- Test tay trên viewport 375px (iPhone SE) và 390px cho cả 6 view admin:
  Home, Accounts (+ drawer + modal), Content, Moderation (3 tab), Shadowing
  (editor + bảng clip), qua Chrome DevTools / Browser pane.
- Kiểm tra vùng chạm (tap target) ≥ 44px cho nút trong drawer/menu mobile mới.
- Cập nhật `Vitest` nếu `AdminDataTable.vue` có logic (props → rows/cards) cần
  test đơn vị.

**Xong Đợt 4 khi:** đi hết 6 view admin trên viewport mobile không còn lỗi vỡ
layout, tràn ngang, hay vùng chạm quá nhỏ.

---

## Tóm tắt tiến độ

| Đợt | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Breakpoint 720px thống nhất + sidebar drawer + `AdminDataTable.vue` | **Xong** (2026-07-12) |
| 2 | Áp `AdminDataTable` cho 3 view có bảng | **Xong** (2026-07-12) |
| 3 | Vá layout non-table (Home/Content/Shadowing editor) | **Xong** (2026-07-12) |
| 4 | Test tay trên mobile viewport + hoàn thiện | Chưa làm |

### Ghi chú Đợt 3
- `AdminHomeView.vue`: dưới 720px — KPI grid `auto-fit minmax(140px,1fr)` + giảm
  padding/font số KPI (26px→20px); `.panels` và lưới module ép về 1 cột; bảng
  quiz (`.qtbl`, chưa đổi sang `AdminDataTable` vì cấu trúc đơn giản) bọc thêm
  `.qtbl-wrap{overflow-x:auto}` làm lưới an toàn phòng tràn.
- `AdminContentView.vue`: dưới 720px — hàng chế độ khóa (`mode-row`) xếp dọc,
  nhóm nút segmented giãn đều `flex:1`; cây nội dung cho `c-row`/`w-row` wrap,
  đẩy `c-meta`/`c-file`/`w-title` xuống dòng riêng (thụt `24px` khớp icon mở),
  giảm padding thụt tầng (`c-body`, `d-list`).
- `AdminShadowingView.vue` (editor): `meta-grid` xuống hẳn 1 cột dưới 720px
  (trước đó Đợt 1 mới co về 2 cột); `.transport` và `.row-bar` cho wrap, dùng
  trick `.spacer{flex-basis:100%}` để đẩy cụm nút "Đầu=⏱/Cuối=⏱" xuống dòng
  riêng thay vì tràn ngang.
- `npm run build` + `npm test` (770 tests) qua hết.
- Vẫn chưa kiểm tra trực quan trên trình duyệt (lý do như Đợt 1–2: cần tài
  khoản admin thật để vào `/admin`).

### Ghi chú Đợt 2
- `AdminAccountsView.vue`: bảng user → `AdminDataTable` (cột Người học/XP/Chuỗi/
  Huy hiệu/Buổi/Hoạt động/Chi tiết); dùng `row-class` mới của component để giữ
  highlight `.sel` khi đang mở panel chi tiết (qua `:deep()` vì component con
  scoped riêng).
- `AdminModerationView.vue`: cả 2 bảng (ghi âm, leaderboard) → `AdminDataTable`;
  `<audio class="player">` đổi `width:100%` dưới 720px thay vì `max-width:220px`
  cố định.
- `AdminShadowingView.vue`: bảng clip → `AdminDataTable`.
- `AdminDataTable.vue` bổ sung prop `rowClass: (row) => classValue` để view cha
  tô màu hàng đang chọn/đang sửa — không có ở bản Đợt 1.
- Dọn CSS `.tbl`/`.tbl-wrap`/`.right` không còn dùng ở cả 3 view.
- `npm run build` + `npm test` (770 tests) qua hết.
- **Vẫn chưa kiểm tra trực quan trên trình duyệt** (lý do như Đợt 1: `/admin`
  cần tài khoản admin thật, guard không cho bypass bằng env rỗng).

### Ghi chú Đợt 1
- `AdminShadowingView.vue` (`.meta-grid`) và `AdminAccountsView.vue` (`.stat-grid`)
  đổi breakpoint 700px/600px → 720px cho khớp quy ước site.
- `AdminLayout.vue`: thêm topbar mobile (nút ☰) + tái dùng `components/common/BottomSheet.vue`
  làm drawer nav thay vì sidebar wrap ngang; sidebar desktop giữ nguyên ≥720px.
- `components/admin/AdminDataTable.vue` (mới): bảng → card-stack dưới 720px, API
  `columns`/`rows` + slot `#cell-<key>` để tùy biến từng ô. **Chưa được view nào
  dùng** — việc thay `<table>` hiện có bằng component này là Đợt 2.
- Đã chạy `npm run build` và `npm test` (770 tests) — qua hết, không lỗi.
- **Chưa kiểm tra trực quan trên trình duyệt**: route `/admin` yêu cầu đăng nhập
  + quyền admin thật (guard chặn ở `router/guard.js`), không bypass được bằng
  env rỗng như các route khách khác. Cần đăng nhập bằng tài khoản admin thật để
  xem trực tiếp drawer mobile hoạt động.
