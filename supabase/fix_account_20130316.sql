-- ============================================================================
-- Dọn dữ liệu bị lẫn cho tài khoản 20130316@st.hcmuaf.edu.vn
-- (do bug đồng bộ logout->login tài khoản khác). Khôi phục về đúng trạng thái:
-- chỉ mới học bài 1 IELTS (tuần 1, buổi 1).
--
-- Chạy trong Supabase Dashboard -> SQL Editor (service context, bỏ qua RLS).
-- ============================================================================

-- Xem trước dữ liệu hiện tại của tài khoản (kiểm tra trước khi sửa):
select u.email, p.xp, p.streak, p.badges, p.completed
from public.progress p
join auth.users u on u.id = p.user_id
where u.email = '20130316@st.hcmuaf.edu.vn';

-- Khôi phục về trạng thái "chỉ học bài 1 IELTS":
update public.progress p
set
  xp               = 50,                                  -- 1 ngày học = 50 XP
  streak           = 1,
  badges           = 0,
  last_study_date  = null,
  known_cards      = '[]'::jsonb,
  srs              = '{}'::jsonb,
  completed        = '{"java":[],"ielts":["1:1"]}'::jsonb, -- chỉ tuần 1 buổi 1
  quiz_scores      = '{}'::jsonb,
  saved_words      = '{}'::jsonb,
  shadowing_scores = '{}'::jsonb,
  updated_at       = now()
from auth.users u
where u.id = p.user_id
  and u.email = '20130316@st.hcmuaf.edu.vn';

-- (Tùy chọn) Nếu muốn xóa SẠCH để học lại từ đầu thay vì giữ bài 1:
-- delete from public.progress p
-- using auth.users u
-- where u.id = p.user_id and u.email = '20130316@st.hcmuaf.edu.vn';
