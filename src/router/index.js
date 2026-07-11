import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { routeGuardDecision } from '@/router/guard'
import { setRouteDirection } from '@/composables/useRouteTransition'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/courses', name: 'courses', component: () => import('@/views/CoursesView.vue'), meta: { requiresAuth: true } },

  // Khóa Java — bản đồ chinh phục 12 tuần
  { path: '/courses/java', name: 'java', component: () => import('@/views/JavaCourseView.vue'), meta: { requiresAuth: true } },
  // Chi tiết một ngày học của khóa Java
  {
    path: '/courses/java/week/:week/day/:day',
    name: 'java-day',
    component: () => import('@/views/DayView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },

  // Khóa "Java Phỏng Vấn Cấp Tốc" — ôn 2 tuần + AI mock interview + coding chạy thật
  { path: '/courses/java/prep', name: 'java-prep', component: () => import('@/views/JavaPrepView.vue'), meta: { requiresAuth: true } },
  // Phòng phỏng vấn thử (AI hỏi + chấm từng câu)
  { path: '/courses/java/prep/mock', name: 'java-mock', component: () => import('@/views/MockInterviewView.vue'), meta: { requiresAuth: true } },

  // Khóa IELTS — lộ trình 8 tuần
  { path: '/courses/ielts', name: 'ielts', component: () => import('@/views/IeltsCourseView.vue'), meta: { requiresAuth: true } },
  {
    path: '/courses/ielts/week/:week/day/:day',
    name: 'ielts-day',
    component: () => import('@/views/IeltsDayView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },

  // Khóa Giao Tiếp Thực Chiến — roleplay AI voice-first, 8 tuần
  { path: '/courses/comm', name: 'comm', component: () => import('@/views/CommCourseView.vue'), meta: { requiresAuth: true } },
  {
    path: '/courses/comm/week/:week/day/:day',
    name: 'comm-day',
    component: () => import('@/views/CommDayView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  // Trang tổng kết cuối khóa comm: bảng điểm 8 Boss + vốn SRS + 3 mốc ghi âm + huy hiệu
  { path: '/courses/comm/summary', name: 'comm-summary', component: () => import('@/views/CommSummaryView.vue'), meta: { requiresAuth: true } },

  // So sánh mốc ghi âm (Đầu/Giữa/Cuối khóa) + nhật ký Mission + huy hiệu real-life
  { path: '/milestones', name: 'milestones', component: () => import('@/views/MilestonesView.vue'), meta: { requiresAuth: true } },

  // Biểu đồ tiến bộ viết & nói (điểm viết theo buổi, phút nói theo tuần)
  { path: '/progress', name: 'progress', component: () => import('@/views/ProgressView.vue'), meta: { requiresAuth: true } },

  // Bài kiểm tra cuối tuần / cuối khóa (lưu điểm) — scope: "week-N" | "final"
  {
    path: '/courses/:course(java|ielts|comm)/test/:scope',
    name: 'assessment',
    component: () => import('@/views/AssessmentView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },

  // Luyện shadowing với video YouTube có phụ đề (yêu cầu đăng nhập như khóa học)
  { path: '/shadowing', name: 'shadowing', component: () => import('@/views/ShadowingView.vue'), meta: { requiresAuth: true } },

  // Khu công cụ học chung
  { path: '/tools', name: 'tools', component: () => import('@/views/ToolsView.vue') },
  { path: '/tools/:tool', name: 'tools-tab', component: () => import('@/views/ToolsView.vue'), props: true },

  // Khu quản trị — chỉ admin (có dòng trong bảng admins) mới vào được.
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-home', component: () => import('@/views/admin/AdminHomeView.vue') },
      { path: 'shadowing', name: 'admin-shadowing', component: () => import('@/views/admin/AdminShadowingView.vue') },
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

// Chặn vào khóa học/quản trị khi chưa đăng nhập (hoặc không đủ quyền).
router.beforeEach(async (to) => {
  if (!to.meta?.requiresAuth && !to.meta?.requiresAdmin) return true
  const auth = useAuthStore()
  await waitForAuthReady(auth)
  return routeGuardDecision(to, auth)
})

// Ghi hướng chuyển trang (đi sâu/lùi) sau khi điều hướng đã xác nhận — App.vue
// dùng để chọn transition trượt có hướng trên mobile (Bước 4.1).
router.afterEach((to, from) => setRouteDirection(to, from))

export default router
