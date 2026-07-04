import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

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

  // Khóa IELTS — lộ trình 8 tuần
  { path: '/courses/ielts', name: 'ielts', component: () => import('@/views/IeltsCourseView.vue'), meta: { requiresAuth: true } },
  {
    path: '/courses/ielts/week/:week/day/:day',
    name: 'ielts-day',
    component: () => import('@/views/IeltsDayView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },

  // So sánh mốc ghi âm (Đầu/Giữa/Cuối khóa) + nhật ký Mission + huy hiệu real-life
  { path: '/milestones', name: 'milestones', component: () => import('@/views/MilestonesView.vue'), meta: { requiresAuth: true } },

  // Bài kiểm tra cuối tuần / cuối khóa (lưu điểm) — scope: "week-N" | "final"
  {
    path: '/courses/:course(java|ielts)/test/:scope',
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

  // Khu quản trị: bắt buộc có cloud + đăng nhập + là admin.
  if (to.meta?.requiresAdmin) {
    if (!auth.cloudEnabled) return { name: 'home' }
    if (!auth.isAuthed) return { name: 'home', query: { login: 'required', redirect: to.fullPath } }
    return auth.isAdmin ? true : { name: 'home' }
  }

  // Chưa cấu hình Supabase → không thể đăng nhập, cho qua ở chế độ khách.
  if (!auth.cloudEnabled) return true
  if (auth.isAuthed) return true

  return { name: 'home', query: { login: 'required', redirect: to.fullPath } }
})

export default router
