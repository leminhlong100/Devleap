import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSiteConfigStore } from '@/stores/siteConfig'
import { useUserStore } from '@/stores/user'
import { routeGuardDecision, courseIdForRoute } from '@/router/guard'
import { setRouteDirection } from '@/composables/useRouteTransition'
import { navStart, navDone } from '@/composables/useNavProgress'
import { markCoursePicked } from '@/lib/onboarding'
import { useAnalytics } from '@/composables/useAnalytics'

const COURSE_LANDING_ROUTES = new Set(['java', 'ielts', 'comm', 'java-prep'])
// Các route "mở 1 buổi học" — dùng để bắn thêm sự kiện `lesson_open` bên cạnh
// `page_view` (Bước 4.1, đo điểm bắt đầu buổi / rơi rụng theo bước).
const DAY_ROUTES = { 'java-day': 'java', 'ielts-day': 'ielts', 'comm-day': 'comm' }

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: 'Trang chủ',
      description: 'Devleap — Học Java & tiếng Anh theo lộ trình rõ ràng, có tiến độ, streak và huy hiệu giữ lửa mỗi ngày.',
    },
  },
  {
    path: '/courses',
    name: 'courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: { requiresAuth: true, title: 'Khóa học', description: 'Chọn khóa học: Java 12 tuần, IELTS 8 tuần, Giao Tiếp Thực Chiến, Java Phỏng Vấn Cấp Tốc.' },
  },

  // Khóa Java — bản đồ chinh phục 12 tuần
  {
    path: '/courses/java',
    name: 'java',
    component: () => import('@/views/JavaCourseView.vue'),
    meta: { requiresAuth: true, title: 'Khóa Java 12 tuần', description: 'Lộ trình Java 12 tuần từ nền tảng đến dự án thực chiến, có bài kiểm tra và tiến độ theo tuần.' },
  },
  // Chi tiết một ngày học của khóa Java
  {
    path: '/courses/java/week/:week/day/:day',
    name: 'java-day',
    component: () => import('@/views/DayView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Buổi học Java' },
  },

  // Khóa "Java Phỏng Vấn Cấp Tốc" — ôn 2 tuần + AI mock interview + coding chạy thật
  {
    path: '/courses/java/prep',
    name: 'java-prep',
    component: () => import('@/views/JavaPrepView.vue'),
    meta: { requiresAuth: true, title: 'Java Phỏng Vấn Cấp Tốc', description: '184 câu hỏi phỏng vấn Java theo chủ đề + phỏng vấn thử với AI + 19 bài coding chạy thật.' },
  },
  // Phòng phỏng vấn thử (AI hỏi + chấm từng câu)
  {
    path: '/courses/java/prep/mock',
    name: 'java-mock',
    component: () => import('@/views/MockInterviewView.vue'),
    meta: { requiresAuth: true, title: 'Phỏng vấn thử với AI' },
  },

  // Khóa IELTS — lộ trình 8 tuần
  {
    path: '/courses/ielts',
    name: 'ielts',
    component: () => import('@/views/IeltsCourseView.vue'),
    meta: { requiresAuth: true, vocabFab: true, title: 'Khóa IELTS 8 tuần', description: 'Lộ trình IELTS 8 tuần: từ vựng, ngữ pháp, luyện nghe/nói/đọc/viết có chấm điểm.' },
  },
  {
    path: '/courses/ielts/week/:week/day/:day',
    name: 'ielts-day',
    component: () => import('@/views/IeltsDayView.vue'),
    props: true,
    meta: { requiresAuth: true, vocabFab: true, title: 'Buổi học IELTS' },
  },

  // Khóa Giao Tiếp Thực Chiến — roleplay AI voice-first, 8 tuần
  {
    path: '/courses/comm',
    name: 'comm',
    component: () => import('@/views/CommCourseView.vue'),
    meta: { requiresAuth: true, vocabFab: true, title: 'Giao Tiếp Thực Chiến', description: 'Khóa giao tiếp tiếng Anh 8 tuần, roleplay thoại với AI, luyện phát âm và phản xạ nói.' },
  },
  {
    path: '/courses/comm/week/:week/day/:day',
    name: 'comm-day',
    component: () => import('@/views/CommDayView.vue'),
    props: true,
    meta: { requiresAuth: true, vocabFab: true, title: 'Buổi học Giao Tiếp' },
  },
  // Trang tổng kết cuối khóa comm: bảng điểm 8 Boss + vốn SRS + 3 mốc ghi âm + huy hiệu
  {
    path: '/courses/comm/summary',
    name: 'comm-summary',
    component: () => import('@/views/CommSummaryView.vue'),
    meta: { requiresAuth: true, title: 'Tổng kết khóa Giao Tiếp' },
  },

  // So sánh mốc ghi âm (Đầu/Giữa/Cuối khóa) + nhật ký Mission + huy hiệu real-life
  {
    path: '/milestones',
    name: 'milestones',
    component: () => import('@/views/MilestonesView.vue'),
    meta: { requiresAuth: true, title: 'Mốc tiến bộ' },
  },

  // Biểu đồ tiến bộ viết & nói (điểm viết theo buổi, phút nói theo tuần)
  {
    path: '/progress',
    name: 'progress',
    component: () => import('@/views/ProgressView.vue'),
    meta: { requiresAuth: true, title: 'Tiến độ học tập' },
  },

  // Hồ sơ & cài đặt (Bước 2.1) — gom tên hiển thị, giao diện, nhắc học, leaderboard,
  // persona AI mặc định, quản lý tài khoản & xuất/nhập dữ liệu học tập.
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Hồ sơ & cài đặt' },
  },

  // Bài kiểm tra cuối tuần / cuối khóa (lưu điểm) — scope: "week-N" | "final"
  {
    path: '/courses/:course(java|ielts|comm)/test/:scope',
    name: 'assessment',
    component: () => import('@/views/AssessmentView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Bài kiểm tra' },
  },

  // Luyện shadowing với video YouTube có phụ đề (yêu cầu đăng nhập như khóa học)
  {
    path: '/shadowing',
    name: 'shadowing',
    component: () => import('@/views/ShadowingView.vue'),
    meta: { requiresAuth: true, vocabFab: true, title: 'Luyện Shadowing', description: 'Luyện nói theo video YouTube có phụ đề song ngữ, tự chọn tốc độ và đoạn lặp.' },
  },

  // Đặt lại mật khẩu — đích của link trong email "Quên mật khẩu?" (công khai,
  // không yêu cầu đăng nhập; Supabase tạo phiên khôi phục tạm từ token trong URL).
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'Đặt lại mật khẩu' },
  },

  // Khu công cụ học chung
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { vocabFab: true, title: 'Khu công cụ', description: 'Flashcard SRS, từ điển đã lưu, luyện tập bổ trợ và các công cụ học chung.' },
  },
  {
    path: '/tools/:tool',
    name: 'tools-tab',
    component: () => import('@/views/ToolsView.vue'),
    props: true,
    meta: { vocabFab: true, title: 'Khu công cụ' },
  },

  // Khu quản trị — chỉ admin (có dòng trong bảng admins) mới vào được.
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-home', component: () => import('@/views/admin/AdminHomeView.vue') },
      { path: 'accounts', name: 'admin-accounts', component: () => import('@/views/admin/AdminAccountsView.vue') },
      { path: 'content', name: 'admin-content', component: () => import('@/views/admin/AdminContentView.vue') },
      { path: 'shadowing', name: 'admin-shadowing', component: () => import('@/views/admin/AdminShadowingView.vue') },
      { path: 'moderation', name: 'admin-moderation', component: () => import('@/views/admin/AdminModerationView.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Đổi chức năng trong Khu công cụ: không nhảy lên đầu trang — để ToolsView
    // tự cuộn xuống vùng làm bài/học (xem hàm select).
    if (to.name === 'tools-tab' && (from.name === 'tools-tab' || from.name === 'tools')) {
      return false
    }
    return { top: 0 }
  },
})

/** Đợi store auth kiểm tra xong phiên ban đầu (getSession) trước khi quyết định. */
function waitForAuthReady(auth) {
  if (auth.ready) return Promise.resolve()
  return new Promise((resolve) => {
    const stop = watch(
      () => auth.ready,
      (ready) => {
        if (ready) {
          stop()
          resolve()
        }
      },
    )
  })
}

// Hiện thanh tiến trình ngay khi bắt đầu chuyển trang — bao trọn cả thời gian
// tải chunk lazy lẫn chờ xác thực bên dưới, để bấm là có phản hồi tức thì.
router.beforeEach(() => {
  navStart()
  return true
})

// Chặn vào khóa học/quản trị khi chưa đăng nhập (hoặc không đủ quyền).
router.beforeEach(async (to) => {
  if (!to.meta?.requiresAuth && !to.meta?.requiresAdmin) return true
  const auth = useAuthStore()
  await waitForAuthReady(auth)
  const decision = routeGuardDecision(to, auth)
  if (decision !== true) return decision

  // Lớp phủ site (Đợt 3): khóa bị admin tắt -> chặn vào, đưa về thư viện khóa
  // học. Chỉ chặn khi cấu hình đã nạp xong (site.loaded) để tránh khóa nhầm
  // trong lúc còn đang nạp (mặc định mọi khóa bật).
  const site = useSiteConfigStore()
  const courseId = courseIdForRoute(to)
  if (courseId && site.loaded && !site.courseEnabled(courseId, auth.isAdmin)) {
    return { name: 'courses', query: { disabled: courseId } }
  }

  // Chưa "Đăng ký" khóa này thì chưa cho vào học trực tiếp bằng URL — đưa về
  // thư viện khóa học để bấm Đăng ký trước (admin luôn được vào thẳng).
  if (courseId && !auth.isAdmin) {
    const user = useUserStore()
    if (!user.isEnrolled(courseId)) {
      return { name: 'courses', query: { enroll: courseId } }
    }
  }
  return true
})

// Ghi hướng chuyển trang (đi sâu/lùi) sau khi điều hướng đã xác nhận — App.vue
// dùng để chọn transition trượt có hướng trên mobile (Bước 4.1).
router.afterEach((to, from) => {
  setRouteDirection(to, from)
  navDone()
  // Bước 3.1 — dấu mốc "đã chọn khóa" cho checklist khởi động ở HomeView.
  if (COURSE_LANDING_ROUTES.has(to.name)) markCoursePicked()

  // Bước 4.1 — analytics tôn trọng riêng tư: mỗi lượt chuyển trang là 1
  // `page_view` (đo rơi rụng theo bước); mở 1 buổi học kèm `lesson_open`.
  const { track } = useAnalytics()
  track('page_view', { name: to.name, path: to.path })
  const course = DAY_ROUTES[to.name]
  if (course) track('lesson_open', { course, week: to.params.week, day: to.params.day })
})

// Điều hướng bị hủy/lỗi (vd lỗi tải chunk) cũng phải ẩn thanh, đừng để treo.
router.onError(() => navDone())

export default router
