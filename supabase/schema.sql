-- ============================================================================
-- DevLeap · Bảng lưu tiến độ học + Row Level Security
-- Chạy trong Supabase Dashboard → SQL Editor (một lần).
-- ============================================================================

-- Mỗi user có đúng 1 dòng tiến độ, khóa theo auth.users.id.
create table if not exists public.progress (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  xp             integer     not null default 0,
  streak         integer     not null default 0,
  badges         integer     not null default 0,
  last_study_date text,
  known_cards    jsonb       not null default '[]'::jsonb,
  srs            jsonb       not null default '{}'::jsonb,
  completed      jsonb       not null default '{"java":[],"ielts":[]}'::jsonb,
  quiz_scores    jsonb       not null default '{}'::jsonb,
  saved_words    jsonb       not null default '{}'::jsonb,
  shadowing_scores jsonb     not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

-- Nâng cấp DB đã tạo trước khi có Spaced Repetition: thêm cột lịch ôn tập.
alter table public.progress
  add column if not exists srs jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có bài kiểm tra: thêm cột điểm kiểm tra.
alter table public.progress
  add column if not exists quiz_scores jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có "từ vựng đã lưu": thêm cột danh sách lưu.
alter table public.progress
  add column if not exists saved_words jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có Shadowing: thêm cột kết quả luyện shadowing.
alter table public.progress
  add column if not exists shadowing_scores jsonb not null default '{}'::jsonb;

-- Bật RLS: mặc định chặn hết, chỉ mở đúng các policy bên dưới.
alter table public.progress enable row level security;

-- User chỉ đọc được dòng của chính mình.
drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own"
  on public.progress for select
  using (auth.uid() = user_id);

-- User chỉ tạo dòng cho chính mình.
drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own"
  on public.progress for insert
  with check (auth.uid() = user_id);

-- User chỉ sửa dòng của chính mình.
drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Quản trị: danh sách admin + kho clip Shadowing
-- ============================================================================

-- Ai có dòng ở đây là admin. Chỉ thêm admin thủ công qua SQL (hoặc service key),
-- client không bao giờ ghi được bảng này.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Admin chỉ đọc được dòng của chính mình (đủ để app kiểm tra "tôi có phải admin").
-- Không có policy insert/update/delete -> RLS chặn mọi ghi từ client.
drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self"
  on public.admins for select
  using (auth.uid() = user_id);

-- Hàm tiện ích: user hiện tại có phải admin không (dùng trong policy của clip).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Kho clip shadowing — thay cho file tĩnh src/data/shadowing/clips/*.json.
create table if not exists public.shadowing_clips (
  video_id       text primary key,
  title          text        not null,
  level          text        not null default 'A1-A2',
  topic          text,
  lang           text        not null default 'en',
  -- Giữ nguyên dạng { ai: [...], original: [...] } mà function trả về.
  sentences      jsonb       not null default '{"ai":[],"original":[]}'::jsonb,
  sentence_count integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.shadowing_clips enable row level security;

-- Nội dung công khai: ai cũng đọc được (kể cả khách chưa đăng nhập).
drop policy if exists "clips_select_all" on public.shadowing_clips;
create policy "clips_select_all"
  on public.shadowing_clips for select
  using (true);

-- Chỉ admin được thêm clip.
drop policy if exists "clips_insert_admin" on public.shadowing_clips;
create policy "clips_insert_admin"
  on public.shadowing_clips for insert
  with check (public.is_admin());

-- Chỉ admin được sửa clip.
drop policy if exists "clips_update_admin" on public.shadowing_clips;
create policy "clips_update_admin"
  on public.shadowing_clips for update
  using (public.is_admin())
  with check (public.is_admin());

-- Chỉ admin được xóa clip.
drop policy if exists "clips_delete_admin" on public.shadowing_clips;
create policy "clips_delete_admin"
  on public.shadowing_clips for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Thêm admin đầu tiên (chạy 1 lần, đổi email cho đúng tài khoản của bạn):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'leminhlongcv@gmail.com'
--   on conflict do nothing;
-- ----------------------------------------------------------------------------
