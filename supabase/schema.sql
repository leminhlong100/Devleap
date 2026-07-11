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
  topics         jsonb       not null default '[]'::jsonb,
  shadowing_scores jsonb     not null default '{}'::jsonb,
  dictation_scores jsonb     not null default '{}'::jsonb,
  week_feedback  jsonb       not null default '{}'::jsonb,
  week_xp          integer   not null default 0,
  week_xp_key      text,
  leaderboard_opt_in boolean not null default false,
  leaderboard_name text,
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

-- Nâng cấp DB đã tạo trước khi có "chủ đề" nhóm từ đã lưu: thêm cột danh sách chủ đề.
alter table public.progress
  add column if not exists topics jsonb not null default '[]'::jsonb;

-- Nâng cấp DB đã tạo trước khi có Shadowing: thêm cột kết quả luyện shadowing.
alter table public.progress
  add column if not exists shadowing_scores jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có Dictation (nghe-viết chính tả): thêm cột kết quả luyện.
alter table public.progress
  add column if not exists dictation_scores jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có khảo sát cuối tuần: thêm cột cảm nhận Dễ/Vừa/Khó.
alter table public.progress
  add column if not exists week_feedback jsonb not null default '{}'::jsonb;

-- Nâng cấp DB đã tạo trước khi có leaderboard tuần (Bước 5.1): thêm cột XP
-- tính riêng theo tuần ISO hiện tại + tùy chọn tham gia/tên hiển thị.
alter table public.progress
  add column if not exists week_xp integer not null default 0;
alter table public.progress
  add column if not exists week_xp_key text;
alter table public.progress
  add column if not exists leaderboard_opt_in boolean not null default false;
alter table public.progress
  add column if not exists leaderboard_name text;

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

-- ----------------------------------------------------------------------------
-- Nhật ký kiểm toán quản trị (Đợt 0 — docs/KE_HOACH_TRANG_ADMIN.md)
-- Function `admin` ghi 1 dòng cho MỌI hành động thay đổi (grant admin, reset,
-- delete, xóa tên leaderboard…). Ghi CHỈ từ service function (bypass RLS);
-- không có policy insert nên client thường không bao giờ ghi được.
-- ----------------------------------------------------------------------------
create table if not exists public.admin_audit (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users (id),
  action     text not null,
  target_id  uuid,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit enable row level security;

-- Chỉ admin đọc được nhật ký (qua is_admin()). Không mở policy ghi cho client.
drop policy if exists "audit_select_admin" on public.admin_audit;
create policy "audit_select_admin"
  on public.admin_audit for select
  using (public.is_admin());

create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);

-- ============================================================================
-- Leaderboard tuần (Bước 5.1) — opt-in, ẩn danh mặc định.
-- ============================================================================

-- Hàm `security definer` (chạy với quyền của người tạo, bỏ qua RLS của
-- `progress`) để KHÔNG phải mở thêm policy select cho bảng `progress` (vốn chỉ
-- cho đọc dòng của chính mình) — chỉ trả về đúng 3 cột cần cho bảng xếp hạng,
-- và CHỈ những dòng đã tự nguyện `leaderboard_opt_in = true`. Nếu
-- `week_xp_key` của một người không khớp tuần ISO hiện tại (thiết bị của họ
-- chưa mở app/đồng bộ lại từ đầu tuần) thì hiện 0 — đúng thực tế "chưa có XP
-- được ghi nhận cho tuần này", tránh hiện nhầm XP tuần trước.
create or replace function public.leaderboard_weekly()
returns table (display_name text, week_xp integer, is_me boolean)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(nullif(trim(p.leaderboard_name), ''), 'Học viên ẩn danh') as display_name,
    case when p.week_xp_key = to_char(now(), 'IYYY-"W"IW') then p.week_xp else 0 end as week_xp,
    p.user_id = auth.uid() as is_me
  from public.progress p
  where p.leaderboard_opt_in = true
  order by week_xp desc
  limit 50;
$$;

-- Chỉ người đã đăng nhập mới gọi được (không lộ ra khách chưa đăng nhập).
revoke all on function public.leaderboard_weekly() from public;
grant execute on function public.leaderboard_weekly() to authenticated;

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

-- Nâng cấp DB đã tạo trước khi gắn clip theo tuần khóa IELTS: thêm cột tuần áp
-- dụng (1-8, NULL = clip chung, không gắn tuần nào — vd 2 clip mẫu ban đầu).
alter table public.shadowing_clips
  add column if not exists week integer;
alter table public.shadowing_clips
  drop constraint if exists shadowing_clips_week_check;
alter table public.shadowing_clips
  add constraint shadowing_clips_week_check check (week is null or (week between 1 and 8));
create index if not exists shadowing_clips_week_idx on public.shadowing_clips (week);

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

-- ============================================================================
-- Storage: bucket ghi âm mốc (VoiceRecorder / MilestonesView) — sync đa thiết bị
-- Đường dẫn mỗi file: recordings/{user_id}/{recId-đã-escape}.webm
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- Mỗi user chỉ đọc/ghi/xóa được file nằm trong thư mục con tên chính user_id
-- của mình (thư mục đầu tiên trong path — storage.foldername tách theo '/').
drop policy if exists "recordings_select_own" on storage.objects;
create policy "recordings_select_own"
  on storage.objects for select
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "recordings_insert_own" on storage.objects;
create policy "recordings_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "recordings_update_own" on storage.objects;
create policy "recordings_update_own"
  on storage.objects for update
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "recordings_delete_own" on storage.objects;
create policy "recordings_delete_own"
  on storage.objects for delete
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- Thêm admin đầu tiên (chạy 1 lần, đổi email cho đúng tài khoản của bạn):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'leminhlongcv@gmail.com'
--   on conflict do nothing;
-- ----------------------------------------------------------------------------
