<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useSiteConfigStore } from '@/stores/siteConfig'
import { courses } from '@/data/courses'
import { computeJavaProgress } from '@/data/course'
import { computeIeltsProgress } from '@/data/courseIelts'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const auth = useAuthStore()
const site = useSiteConfigStore()
const filters = ['Tất cả', '💻 Lập trình', '🗣️ Tiếng Anh']
const active = ref('Tất cả')

// Ẩn khóa bị admin ẩn hẳn (lớp phủ site), rồi lọc theo bộ lọc danh mục. Khóa
// 'restricted' vẫn HIỆN trong thư viện (chỉ chặn đăng ký/vào học) — chỉ 'hidden'
// mới biến mất khỏi danh sách.
const visible = computed(() => courses.filter((c) => site.courseVisible(c.id)))
const shown = computed(() =>
  active.value === 'Tất cả' ? visible.value : visible.value.filter((c) => c.category === active.value),
)

// Vừa bị chặn khỏi một khóa đã tắt (router chuyển về đây kèm ?disabled=id).
const disabledNotice = computed(() => route.query.disabled || '')
// Vừa bị chặn vào học vì chưa đăng ký (router chuyển về đây kèm ?enroll=id).
const enrollNotice = computed(() => route.query.enroll || '')

// Khóa 'restricted' mà người dùng hiện tại KHÔNG có quyền vào — chỉ admin hoặc
// người được cấp quyền (site.courseEnabled) mới đăng ký/học được khóa này.
function permissionLocked(c) {
  return site.courseMode(c.id) === 'restricted' && !site.courseEnabled(c.id, auth.isAdmin)
}

// Đã đăng ký (tự chọn bắt đầu học) khóa này chưa.
function enrolledIn(c) {
  return user.isEnrolled(c.id)
}

// % tiến độ thật theo từng khóa (các khóa khác giữ giá trị biên tập sẵn).
function progressOf(c) {
  if (c.id === 'java') return computeJavaProgress(user.completed.java).pct
  if (c.id === 'ielts') return computeIeltsProgress(user.completed.ielts).pct
  return c.progress
}

function open(c) {
  if (!c.routeName || permissionLocked(c)) return
  if (!enrolledIn(c)) user.enroll(c.id)
  router.push({ name: c.routeName })
}
</script>

<template>
  <div class="container page">
    <div class="page-head">
      <h1 class="title">Thư viện khóa học</h1>
      <p class="sub">
        Chọn một hành trình và bắt đầu bước nhảy đầu tiên. Khóa mới được thêm liên tục.
      </p>
    </div>

    <p v-if="disabledNotice" class="disabled-note">
      Khóa học này hiện đang tạm ẩn. Vui lòng quay lại sau nhé!
    </p>
    <p v-if="enrollNotice" class="disabled-note">
      Hãy bấm "Đăng ký" ở khóa học bên dưới trước khi vào học nhé!
    </p>

    <div class="filters">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        class="filter"
        :class="{ on: active === f }"
        @click="active = f"
      >{{ f }}</button>
    </div>

    <div class="grid">
      <button
        v-for="c in shown"
        :key="c.id"
        type="button"
        class="course-card"
        :style="{
          cursor: c.locked || permissionLocked(c) ? 'default' : 'pointer',
          opacity: c.locked || permissionLocked(c) ? 0.92 : 1,
        }"
        @click="open(c)"
      >
        <div class="banner" :style="{ background: c.banner }">
          <span class="banner-emoji-bg">{{ c.emoji }}</span>
          <span class="banner-emoji">{{ c.emoji }}</span>
          <span class="banner-tag">{{ c.tag }}</span>
        </div>
        <div class="body">
          <h3 class="c-name">{{ c.name }}</h3>
          <p class="c-desc">{{ c.desc }}</p>
          <div class="meta">
            <span>📅 {{ c.weeks }} {{ c.unit || 'tuần' }}</span>
            <span>📚 {{ c.lessons }} bài</span>
            <span :style="{ color: c.levelColor, fontWeight: 700 }">● {{ c.level }}</span>
          </div>

          <span v-if="!c.active" class="locked-btn">🔔 Thông báo khi mở</span>
          <span v-else-if="permissionLocked(c)" class="locked-btn">🔒 Cần được cấp quyền</span>
          <span v-else-if="!enrolledIn(c)" class="cta">📝 Đăng ký</span>
          <div v-else class="progress-wrap">
            <div class="progress-top"><span>Tiến độ</span><span class="pct">{{ progressOf(c) }}%</span></div>
            <div class="track"><div class="fill" :style="{ width: progressOf(c) + '%' }"></div></div>
            <span class="cta">{{ c.cta }}</span>
          </div>
        </div>
      </button>

      <!-- add-new placeholder -->
      <div class="add-card">
        <div class="add-icon">✨</div>
        <h3>Sắp có thêm khóa mới</h3>
        <p>Python, Frontend, IELTS nâng cao… Bạn muốn học gì tiếp theo?</p>
        <span class="suggest">Đề xuất khóa học →</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 48px 28px 70px;
}
.page-head {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 14px;
}
.title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
}
.sub {
  font-size: 18px;
  color: var(--muted);
  margin-top: 12px;
}
.disabled-note {
  max-width: 620px;
  margin: 18px auto 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #b26a00;
  background: rgba(214, 158, 43, 0.14);
  border: 1px solid rgba(214, 158, 43, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
}
.filters {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 26px 0 38px;
  flex-wrap: wrap;
}
.filter {
  padding: 9px 18px;
  border-radius: 99px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--slate);
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.12);
  cursor: pointer;
  transition: all 0.15s;
}
@media (hover: hover) {
  .filter:hover {
    background: var(--purple-soft);
  }
}
.filter:active {
  background: var(--purple-soft);
}
.filter.on {
  color: #fff;
  background: var(--grad-purple);
  border-color: transparent;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.course-card {
  background: var(--surface);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  box-shadow: 0 12px 34px rgba(108, 92, 231, 0.07);
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s;
}
@media (hover: hover) {
  .course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 22px 48px rgba(108, 92, 231, 0.15);
  }
}
.course-card:active {
  transform: translateY(-1px) scale(0.99);
  box-shadow: 0 22px 48px rgba(108, 92, 231, 0.15);
}
.banner {
  height: 118px;
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 24px;
  overflow: hidden;
}
.banner-emoji-bg {
  position: absolute;
  right: -6px;
  bottom: -18px;
  font-size: 96px;
  opacity: 0.22;
}
.banner-emoji {
  position: relative;
  font-size: 46px;
}
.banner-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  padding: 5px 12px;
  border-radius: 99px;
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
}
.body {
  padding: 22px 22px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.c-name {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.3px;
  line-height: 1.25;
}
.c-desc {
  font-size: 14px;
  line-height: 1.55;
  color: var(--muted);
  margin-top: 9px;
  flex: 1;
}
.meta {
  display: flex;
  gap: 14px;
  margin-top: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--slate);
  font-weight: 600;
}
.progress-wrap {
  margin-top: 18px;
}
.progress-top {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
  margin-bottom: 7px;
}
.pct {
  color: #00c281;
}
.track {
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg);
}
.fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand);
}
.cta {
  display: block;
  text-align: center;
  margin-top: 18px;
  width: 100%;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  padding: 13px;
  border-radius: 13px;
  background: var(--grad-purple);
}
.locked-btn {
  display: block;
  text-align: center;
  margin-top: 18px;
  width: 100%;
  border: 1px dashed rgba(108, 92, 231, 0.3);
  font-size: 15px;
  font-weight: 700;
  color: var(--muted-2);
  padding: 13px;
  border-radius: 13px;
  background: var(--surface-1);
}
.add-card {
  border: 2px dashed rgba(108, 92, 231, 0.22);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px;
  min-height: 300px;
  color: var(--muted-2);
}
.add-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--purple-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.add-card h3 {
  font-size: 17px;
  font-weight: 800;
  color: var(--slate);
  margin-top: 16px;
}
.add-card p {
  font-size: 13.5px;
  margin-top: 8px;
  line-height: 1.5;
}
.suggest {
  margin-top: 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .title {
    font-size: 32px;
  }
}
</style>
