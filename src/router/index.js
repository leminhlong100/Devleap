import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/courses', name: 'courses', component: () => import('@/views/CoursesView.vue') },

  // Khóa Java — bản đồ chinh phục 12 tuần
  { path: '/courses/java', name: 'java', component: () => import('@/views/JavaCourseView.vue') },
  // Chi tiết một ngày học của khóa Java
  {
    path: '/courses/java/week/:week/day/:day',
    name: 'java-day',
    component: () => import('@/views/DayView.vue'),
    props: true,
  },

  // Khóa IELTS — lộ trình 8 tuần
  { path: '/courses/ielts', name: 'ielts', component: () => import('@/views/IeltsCourseView.vue') },
  {
    path: '/courses/ielts/week/:week/day/:day',
    name: 'ielts-day',
    component: () => import('@/views/IeltsDayView.vue'),
    props: true,
  },

  // Bài kiểm tra cuối tuần / cuối khóa (lưu điểm) — scope: "week-N" | "final"
  {
    path: '/courses/:course(java|ielts)/test/:scope',
    name: 'assessment',
    component: () => import('@/views/AssessmentView.vue'),
    props: true,
  },

  // Khu công cụ học chung
  { path: '/tools', name: 'tools', component: () => import('@/views/ToolsView.vue') },
  { path: '/tools/:tool', name: 'tools-tab', component: () => import('@/views/ToolsView.vue'), props: true },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
