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
  completed      jsonb       not null default '{"java":[],"ielts":[]}'::jsonb,
  updated_at     timestamptz not null default now()
);

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
