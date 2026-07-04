# Dựng backend đồng bộ tiến độ (Supabase + Google OAuth)

Hướng dẫn này giúp bật lưu tiến độ học trên cloud và đồng bộ giữa nhiều thiết bị.
Toàn bộ phần code đã có sẵn — bạn chỉ cần tạo project Supabase và điền 2 biến môi trường.

> Khi **chưa** cấu hình, app vẫn chạy bình thường ở **chế độ khách** (chỉ lưu
> localStorage trên máy đó). Cấu hình xong thì hiện nút "Đăng nhập với Google".

---

## 1. Tạo project Supabase

1. Vào https://supabase.com → **New project** (chọn region gần VN, vd Singapore).
2. Đợi project khởi tạo xong.

## 2. Tạo bảng + bảo mật (RLS)

1. Vào **SQL Editor** → **New query**.
2. Dán toàn bộ nội dung file [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
3. Kiểm tra **Table Editor**: có bảng `progress`, và ở tab **Authentication → Policies**
   bảng `progress` có 3 policy (select/insert/update "own").
4. Kiểm tra **Storage**: có bucket `recordings` (private) — script đã tự tạo bucket
   và 4 policy (select/insert/update/delete, mỗi user chỉ đụng được thư mục
   `recordings/<user_id>/...` của chính mình) dùng để đồng bộ bản ghi âm mốc
   (`VoiceRecorder.vue`, trang `/milestones`) giữa nhiều thiết bị. Nếu project
   Supabase chặn tạo bucket qua SQL (một số plan cũ), tạo tay: **Storage → New
   bucket** → tên `recordings`, để **Private**, rồi chạy lại riêng phần policy
   trong `schema.sql`.

## 3. Bật đăng nhập Google

### 3a. Tạo OAuth client ở Google Cloud
1. Vào https://console.cloud.google.com → tạo project (hoặc dùng project sẵn có).
2. **APIs & Services → OAuth consent screen**: chọn **External**, điền tên app,
   email hỗ trợ; ở phần Test users thêm email bạn dùng để đăng nhập.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs**: dán URL callback của Supabase, dạng:
     `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (lấy `<PROJECT-REF>` trong Supabase → Project Settings → API → Project URL)
4. Bấm Create → copy **Client ID** và **Client secret**.

### 3b. Khai báo trong Supabase
1. Supabase → **Authentication → Providers → Google** → bật **Enable**.
2. Dán **Client ID** và **Client secret** vừa tạo → **Save**.
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:5173` (lúc dev).
   - **Redirect URLs**: thêm `http://localhost:5173` và domain production sau này.

## 4. Điền biến môi trường vào app

1. Lấy thông tin ở Supabase → **Project Settings → API**:
   - `Project URL`
   - `anon` `public` key
2. Trong thư mục dự án, sao chép `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Điền:
   ```
   VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```
4. Khởi động lại dev server (`npm run dev`) để Vite nạp biến mới.

> `.env.local` đã được `.gitignore` (qua `*.local`) nên không bị commit.
> `anon key` là khóa public, an toàn để đặt ở client vì RLS đã chặn truy cập chéo user.

## 5. Kiểm thử

1. Mở app → bấm **Đăng nhập** ở góc phải header → đăng nhập Google.
2. Học/đánh dấu hoàn thành vài ngày → mở **Table Editor → progress** thấy dòng
   của bạn cập nhật; góc header hiện **☁️ Đã đồng bộ**.
3. Mở app trên thiết bị/khác trình duyệt → đăng nhập cùng tài khoản → tiến độ về đúng.

---

## Cơ chế đồng bộ (tóm tắt)

- Tiến độ luôn ghi **localStorage** trước (tức thì, chạy được offline).
- Khi đã đăng nhập, mỗi thay đổi được **đẩy lên bảng `progress`** (gộp debounce ~1.2s).
- **Lần đầu đăng nhập**, tiến độ khách trên máy được **hợp nhất** với dữ liệu cloud
  (hợp danh sách ngày đã học + thẻ đã thuộc, lấy max điểm) — không mất tiến độ cũ.
- Xung đột giữa các thiết bị: hợp nhất danh sách (union) + last-write-wins cho điểm.
  Đủ cho quy mô cá nhân; chưa phải realtime.

Mã liên quan: [`src/lib/supabase.js`](../src/lib/supabase.js),
[`src/stores/auth.js`](../src/stores/auth.js),
[`src/stores/user.js`](../src/stores/user.js).
