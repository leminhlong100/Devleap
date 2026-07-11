<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MascotLogo from '@/components/common/MascotLogo.vue'
import BottomSheet from '@/components/common/BottomSheet.vue'
import OnboardingTour from '@/components/common/OnboardingTour.vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { features, steps } from '@/data/home'
import { computeJavaProgress, javaTotals } from '@/data/course'
import { javaStages, courses } from '@/data/courses'
import { pendingWeekMission } from '@/lib/missionStats'
import { useStudyReminder } from '@/composables/useStudyReminder'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import { useOnboardingTour, useOnboardingChecklist } from '@/composables/useOnboarding'
import { prefetchNextLesson } from '@/lib/prefetchNextLesson'

const router = useRouter()
const user = useUserStore()
const auth = useAuthStore()

// Tiến độ thật của khóa Java, suy từ danh sách ngày đã hoàn thành (store).
const prog = computed(() => computeJavaProgress(user.completed.java))
const stageCount = Object.keys(javaStages).length

// Số liệu hero — dẫn xuất THẬT từ dữ liệu khóa học (không bịa "2.4k người học").
// courses.js đã được nạp sẵn ở chunk trang chủ (qua javaStages) nên không thêm chi phí.
const heroStats = [
  { n: `${courses.length}`, l: 'lộ trình học' },
  { n: `${courses.reduce((s, c) => s + (c.weeks || 0), 0)}`, l: 'tuần nội dung' },
  { n: `${courses.reduce((s, c) => s + (c.lessons || 0), 0)}+`, l: 'bài & câu hỏi' },
]
const continueLabel = computed(() =>
  prog.value.allDone
    ? '🎉 Đã hoàn thành lộ trình'
    : prog.value.doneDays === 0
      ? 'Bắt đầu Tuần 1 →'
      : `Tiếp tục Tuần ${prog.value.currentWeek} →`,
)

function openFeatured() {
  router.push({ name: 'java-day', params: prog.value.continue })
}

// —— Home = "bảng điều khiển hôm nay" khi đã có tiến độ (không phải khách mới) ——
const hasProgress = computed(() => user.completed.java.length > 0 || user.completed.ielts.length > 0)
const streakAtRisk = computed(() => user.streak > 0 && !user.studiedToday())

// Bước 4.4 — nhắc học hằng ngày. Mức 1: banner riêng, nổi bật hơn chip cảnh
// báo ở trên, chỉ hiện khi ĐÃ tới "giờ quen thuộc" (mặc định 20h, chỉnh được).
const { preferredHour, setPreferredHour, eveningReminderDue, checkReminderNotification } = useStudyReminder()
const showEveningReminder = computed(() => hasProgress.value && eveningReminderDue(user.streak, user.studiedToday()))
const reminderHourOptions = [18, 19, 20, 21, 22]

onMounted(() => {
  // Mức 2: kiểm tra ngay khi mở app — gửi Notification nếu đã có quyền & đủ điều kiện.
  if (hasProgress.value) checkReminderNotification(user.streak, user.studiedToday())
  // Bước 3.3 — khi rảnh, warm trước chunk buổi kế tiếp để mở được offline.
  prefetchNextLesson(user)
})

// Bài kiểm tra tuần IELTS đang học chưa đạt (chỉ IELTS có gate theo tuần).
const ieltsContinue = computed(() => user.nextLesson.find((n) => n.course === 'ielts') || null)
const remedial = computed(() => {
  if (!ieltsContinue.value) return null
  const q = user.quizOf('ielts', `week:${ieltsContinue.value.week}`)
  return q && !q.passed && q.wrong?.length ? { week: ieltsContinue.value.week } : null
})
const pendingMission = computed(() =>
  ieltsContinue.value ? pendingWeekMission(user, ieltsContinue.value.week) : null,
)

function goContinue(n) {
  router.push({ name: n.route, params: { week: n.week, day: n.day } })
}
function goDueReview() {
  router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'due' } })
}
function goRemedial() {
  if (remedial.value) router.push({ name: 'assessment', params: { course: 'ielts', scope: `week-${remedial.value.week}` } })
}

// Bước 3.1 — mời cài PWA sau khi đã học xong ≥1 buổi (tránh làm phiền khách mới).
const { isIos, shouldShowInstallCard, promptInstall, dismissInstall } = useInstallPrompt()
const totalSessions = computed(() => user.completed.java.length + user.completed.ielts.length)
const installDismissedNow = ref(false)
const showInstallCard = computed(() => !installDismissedNow.value && shouldShowInstallCard(totalSessions.value))
const showIosInstallSheet = ref(false)

async function handleInstallClick() {
  if (isIos) {
    showIosInstallSheet.value = true
    return
  }
  await promptInstall()
}

function handleInstallDismiss() {
  dismissInstall()
  installDismissedNow.value = true
  showIosInstallSheet.value = false
}

// Bước 3.1 — tour ngắn ở lần đầu ghé trang chủ (khách lẫn người đã đăng nhập,
// chỉ khi chưa từng thấy) + checklist khởi động sau đăng nhập đầu.
const { slides: tourSlides, showTour, slideIndex, nextSlide, prevSlide, closeTour } = useOnboardingTour()
const { checklist, shouldShowChecklist, dismiss: dismissChecklistCard } = useOnboardingChecklist()
const reminderEnabled = ref(typeof Notification !== 'undefined' && Notification.permission === 'granted')
const showChecklist = computed(
  () => auth.isAuthed && shouldShowChecklist(totalSessions.value, reminderEnabled.value),
)
const checklistItems = computed(() => checklist(totalSessions.value, reminderEnabled.value))
function checklistCta() {
  const next = checklistItems.value.find((s) => !s.done)
  if (!next) return
  if (next.key === 'course') router.push({ name: 'courses' })
  else if (next.key === 'session') router.push({ name: 'java' })
  else router.push({ name: 'profile' })
}
</script>

<template>
  <div>
    <!-- HÔM NAY (bảng điều khiển cho người đã có tiến độ) -->
    <section v-if="hasProgress" class="container today-wrap">
      <div class="today-card">
        <h2 class="today-title">👋 Chào bạn quay lại!</h2>

        <div v-if="user.nextLesson.length" class="today-continues">
          <button
            v-for="n in user.nextLesson"
            :key="n.course"
            class="continue-btn"
            @click="goContinue(n)"
          >
            <span class="continue-course">{{ n.label }}</span>
            <span>▶ Học tiếp: Tuần {{ n.week }} · Buổi {{ n.day }}<template v-if="n.title"> — {{ n.title }}</template></span>
          </button>
        </div>
        <p v-else class="today-alldone">🎉 Bạn đã hoàn thành mọi khóa học đang theo — quá đỉnh!</p>

        <div class="today-chips">
          <span class="chip">🔥 Streak {{ user.streak }} ngày</span>
          <span v-if="streakAtRisk" class="chip chip-warn">⚠️ Sắp đứt streak — học 1 buổi trước 24h nữa</span>
          <span v-if="user.speakingStreak > 0" class="chip">🗣️ Nói {{ user.speakingStreak }} ngày liền</span>
          <button v-if="user.dueTodayCount > 0" type="button" class="chip chip-link" @click="goDueReview">📆 {{ user.dueTodayCount }} từ đến hạn</button>
          <button v-if="remedial" type="button" class="chip chip-warn chip-link" @click="goRemedial">🎯 Quiz Tuần {{ remedial.week }} chưa đạt</button>
        </div>

        <p v-if="pendingMission" class="today-mission">
          🌍 Mission Tuần {{ pendingMission.week }} chưa làm: {{ pendingMission.text }}
        </p>
      </div>
    </section>

    <!-- HERO (khách mới / chưa có tiến độ) -->
    <section v-else class="hero container">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="hero-grid">
        <div>
          <div class="badge-pill">
            <span class="dot"></span> Nền tảng học cho người Việt mới bắt đầu
          </div>
          <h1 class="hero-title">
            Nói được, code được<br />— không chỉ<br />
            <span class="brand-text">học cho biết</span>
          </h1>
          <p class="hero-sub">
            Nhập vai nói với AI, chấm phát âm, gõ tay code và ôn thông minh — luyện mỗi ngày đến khi
            thành phản xạ, không phải học xong rồi quên.
          </p>
          <div class="hero-cta">
            <button class="btn btn-primary" @click="router.push({ name: 'courses' })">
              Khám phá khóa học →
            </button>
            <button class="btn btn-ghost" @click="router.push({ name: 'tools' })">
              Thử công cụ học
            </button>
          </div>
          <div class="hero-stats">
            <template v-for="(s, i) in heroStats" :key="s.l">
              <div class="sep" v-if="i > 0"></div>
              <div><div class="stat-n">{{ s.n }}</div><div class="stat-l">{{ s.l }}</div></div>
            </template>
          </div>
        </div>

        <div class="mascot-card">
          <div class="mascot-bubble"></div>
          <MascotLogo variant="hero" :width="280" :height="280" uid="herom" />
          <div class="float-tag tag-xp">⭐ Level {{ user.level }}</div>
          <div class="float-tag tag-streak">🔥 Streak {{ user.streak }} ngày</div>
          <div class="float-tag tag-badge">🎤 Nói {{ user.speakingStreak }} ngày liền</div>
        </div>
      </div>
    </section>

    <!-- CHECKLIST KHỞI ĐỘNG (Bước 3.1) — sau lần đăng nhập đầu, đến khi xong cả 3 bước -->
    <section v-if="showChecklist" class="container due-wrap">
      <div class="due-card checklist-card">
        <span class="due-emoji">✅</span>
        <div class="due-text checklist-text">
          <b>Khởi động cùng Devleap</b>
          <ul class="checklist-list">
            <li v-for="s in checklistItems" :key="s.key" :class="{ done: s.done }">
              <span>{{ s.done ? '✅' : '⬜' }}</span> {{ s.label }}
            </li>
          </ul>
        </div>
        <div class="install-actions">
          <button class="install-btn install-btn-ghost" @click="dismissChecklistCard">Ẩn đi</button>
          <button class="install-btn install-btn-primary" @click="checklistCta">Tiếp tục →</button>
        </div>
      </div>
    </section>

    <!-- NHẮC HỌC TỐI (Bước 4.4 — mức 1) -->
    <section v-if="showEveningReminder" class="container due-wrap">
      <button type="button" class="due-card reminder-card" @click="user.nextLesson.length ? goContinue(user.nextLesson[0]) : router.push({ name: 'courses' })">
        <span class="due-emoji">🔥</span>
        <div class="due-text">
          <b>Streak {{ user.streak }} ngày sắp đứt — 1 buổi 15' là giữ được</b>
          <span>Học ngay tối nay để không mất công sức đã tích lũy<template v-if="user.dueTodayCount > 0"> · {{ user.dueTodayCount }} từ cũng đang chờ ôn</template></span>
        </div>
        <span class="due-arrow">→</span>
      </button>
      <div class="reminder-hour" @click.stop>
        <label>
          ⏰ Giờ học quen thuộc:
          <select :value="preferredHour" @change="setPreferredHour(Number($event.target.value))">
            <option v-for="h in reminderHourOptions" :key="h" :value="h">{{ h }}:00</option>
          </select>
        </label>
      </div>
    </section>

    <!-- NHẮC ÔN TỪ VỰNG ĐẾN HẠN -->
    <section v-if="user.dueTodayCount > 0" class="container due-wrap">
      <button type="button" class="due-card" @click="router.push({ name: 'tools-tab', params: { tool: 'flashcard' }, query: { deck: 'due' } })">
        <span class="due-emoji">📆</span>
        <div class="due-text">
          <b>Hôm nay có {{ user.dueTodayCount }} từ đến hạn ôn</b>
          <span>Ôn nhanh vài phút để khỏi quên nhé</span>
        </div>
        <span class="due-arrow">→</span>
      </button>
    </section>

    <!-- LỐI TẮT XEM TIẾN ĐỘ HỌC TẬP -->
    <section class="container due-wrap">
      <button type="button" class="due-card" @click="router.push({ name: 'progress' })">
        <span class="due-emoji">📈</span>
        <div class="due-text">
          <b>Xem tiến độ học tập</b>
          <span>Điểm viết, phút luyện nói và từ đến hạn ôn — tất cả trong 1 trang</span>
        </div>
        <span class="due-arrow">→</span>
      </button>
    </section>

    <!-- MỜI CÀI PWA (Bước 3.1) -->
    <section v-if="showInstallCard" class="container due-wrap">
      <div class="due-card install-card">
        <span class="due-emoji">📲</span>
        <div class="due-text">
          <b>Cài Devleap vào màn hình chính</b>
          <span>Mở nhanh hơn, học được cả khi mất mạng</span>
        </div>
        <div class="install-actions">
          <button class="install-btn install-btn-ghost" @click="handleInstallDismiss">Để sau</button>
          <button class="install-btn install-btn-primary" @click="handleInstallClick">Cài đặt</button>
        </div>
      </div>
    </section>
    <BottomSheet v-model="showIosInstallSheet">
      <h3 class="ios-sheet-title">📲 Cài vào màn hình chính</h3>
      <ol class="ios-sheet-steps">
        <li>Bấm nút <b>Chia sẻ</b> <span class="ios-share-icon">⬆️</span> ở thanh dưới Safari</li>
        <li>Chọn <b>"Thêm vào Màn hình chính"</b> trong danh sách hiện ra</li>
      </ol>
      <button class="install-btn install-btn-primary ios-sheet-close" @click="handleInstallDismiss">Đã hiểu</button>
    </BottomSheet>

    <!-- VALUE PROPS -->
    <section class="container section">
      <div class="section-head">
        <h2 class="section-title">Vì sao học ở devleap dễ "nghiện"?</h2>
        <p class="section-sub">Thiết kế để biến việc học mỗi ngày thành thói quen vui vẻ</p>
      </div>
      <div class="features-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon" :style="{ background: f.bg }">{{ f.icon }}</div>
          <h3 class="feature-title">{{ f.title }}</h3>
          <p class="feature-desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="container section">
      <div class="how">
        <div class="how-glow"></div>
        <div class="how-inner">
          <h2 class="how-title">Học theo 3 bước, lặp lại mỗi ngày</h2>
          <div class="steps-grid">
            <div v-for="s in steps" :key="s.n" class="step-card">
              <div class="step-n">{{ s.n }}</div>
              <h3 class="step-title">{{ s.title }}</h3>
              <p class="step-desc">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED COURSE -->
    <section class="container section">
      <div class="feat-head">
        <h2 class="section-title sm">Khóa học nổi bật</h2>
        <button type="button" class="see-all" @click="router.push({ name: 'courses' })">Xem tất cả →</button>
      </div>
      <button type="button" class="feat-card" @click="openFeatured">
        <div class="feat-left">
          <div class="feat-emoji">☕</div>
          <div class="feat-left-top">
            <span class="feat-tag">🔥 ĐANG HỌC</span>
            <h3 class="feat-title">Java<br />12 Tuần Bứt Phá</h3>
          </div>
          <div class="feat-progress">
            <div class="feat-progress-top"><span>Tiến độ của bạn</span><span>{{ prog.pct }}%</span></div>
            <div class="feat-track"><div class="feat-fill" :style="{ width: prog.pct + '%' }"></div></div>
          </div>
        </div>
        <div class="feat-right">
          <p>
            Từ OOP cơ bản đến Microservices, Spring AI & System Design. Lý thuyết cốt lõi,
            code mẫu gõ tay và câu hỏi phỏng vấn mỗi ngày — sẵn sàng đi làm Backend.
          </p>
          <div class="feat-stats">
            <div><div class="stat-n sm">{{ javaTotals.weeks }}</div><div class="stat-l">tuần</div></div>
            <div><div class="stat-n sm">{{ javaTotals.lessons }}</div><div class="stat-l">bài học</div></div>
            <div><div class="stat-n sm">{{ stageCount }}</div><div class="stat-l">giai đoạn</div></div>
            <div><div class="stat-n sm" style="color: var(--amber)">Trung cấp</div><div class="stat-l">độ khó</div></div>
          </div>
          <div class="feat-continue">{{ continueLabel }}</div>
        </div>
      </button>
    </section>

    <OnboardingTour
      v-model:open="showTour"
      :slides="tourSlides"
      :slide-index="slideIndex"
      @next="nextSlide"
      @prev="prevSlide"
      @close="closeTour"
    />
  </div>
</template>

<style scoped>
/* HERO */
.hero {
  position: relative;
  overflow: hidden;
  padding: 54px 28px 30px;
}
.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.blob-1 {
  top: -80px;
  right: -40px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.14), transparent 70%);
}
.blob-2 {
  bottom: -60px;
  left: -60px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0, 214, 143, 0.12), transparent 70%);
}
.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 40px;
  align-items: center;
}
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.16);
  padding: 7px 14px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
  color: var(--purple);
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.08);
}
.badge-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}
.hero-title {
  font-size: 52px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -1.5px;
  margin: 18px 0 0;
}
.hero-sub {
  font-size: 18px;
  line-height: 1.6;
  color: var(--slate);
  margin: 20px 0 0;
  max-width: 480px;
}
.hero-cta {
  display: flex;
  gap: 14px;
  margin-top: 30px;
  flex-wrap: wrap;
}
.btn {
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  border-radius: 15px;
  transition: all 0.18s;
}
.btn-primary {
  color: #fff;
  padding: 15px 28px;
  background: var(--grad-purple);
  box-shadow: 0 12px 26px rgba(108, 92, 231, 0.34);
}
@media (hover: hover) {
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(108, 92, 231, 0.42);
  }
}
.btn-primary:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 8px 18px rgba(108, 92, 231, 0.36);
}
.btn-ghost {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: var(--purple);
  padding: 15px 24px;
  background: var(--surface);
}
@media (hover: hover) {
  .btn-ghost:hover {
    background: var(--purple-soft);
  }
}
.btn-ghost:active {
  background: var(--purple-soft);
}
.hero-stats {
  display: flex;
  gap: 30px;
  margin-top: 34px;
}
.stat-n {
  font-size: 26px;
  font-weight: 800;
}
.stat-n.sm {
  font-size: 22px;
}
.stat-l {
  font-size: 13px;
  color: var(--muted-2);
  font-weight: 600;
}
.sep {
  width: 1px;
  background: var(--line);
}

/* mascot card */
.mascot-card {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 420px;
}
.mascot-bubble {
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 42% 58% 60% 40% / 45% 45% 55% 55%;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.16), rgba(0, 214, 143, 0.16));
}
.float-tag {
  position: absolute;
  background: var(--surface);
  padding: 10px 15px;
  border-radius: 15px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.1);
  font-weight: 800;
  font-size: 15px;
}
.tag-xp {
  top: 28px;
  left: 6px;
  color: #00c281;
  animation: floaty2 4s ease-in-out infinite;
}
.tag-streak {
  bottom: 54px;
  right: 0;
  color: var(--amber-ink);
  animation: floaty2 5s ease-in-out infinite 0.6s;
}
.tag-badge {
  bottom: 6px;
  left: 24px;
  color: var(--purple);
  font-weight: 700;
  font-size: 14px;
  animation: floaty2 4.5s ease-in-out infinite 0.3s;
}

/* "Hôm nay" — bảng điều khiển cho người đã có tiến độ */
.today-wrap {
  padding-top: 40px;
}
.today-card {
  background: var(--today-card-bg);
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 24px;
  padding: 28px 30px;
}
.today-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin: 0 0 18px;
}
.today-continues {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.continue-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  padding: 16px 22px;
  border-radius: 16px;
  background: var(--grad-purple);
  box-shadow: 0 12px 26px rgba(108, 92, 231, 0.28);
  transition: transform 0.15s;
}
@media (hover: hover) {
  .continue-btn:hover {
    transform: translateY(-2px);
  }
}
.continue-btn:active {
  transform: translateY(0) scale(0.98);
}
.continue-course {
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 9px;
  border-radius: 99px;
}
.today-alldone {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 18px;
}
.today-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  display: inline-flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 99px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.chip-warn {
  border-color: rgba(230, 126, 34, 0.3);
  color: var(--amber-ink);
  background: var(--chip-warn-bg);
}
.chip-link {
  cursor: pointer;
}
@media (hover: hover) {
  .chip-link:hover {
    transform: translateY(-1px);
  }
}
.chip-link:active {
  transform: translateY(0) scale(0.97);
}
.today-mission {
  margin: 16px 0 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--slate);
}

/* nhắc ôn từ đến hạn */
.due-wrap {
  padding-top: 6px;
  padding-bottom: 6px;
}
.due-card {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  background: var(--today-card-bg);
  border: 1px solid rgba(108, 92, 231, 0.18);
  border-radius: 18px;
  padding: 16px 22px;
  cursor: pointer;
  transition: transform 0.15s;
}
@media (hover: hover) {
  .due-card:hover {
    transform: translateY(-2px);
  }
}
.due-card:active {
  transform: translateY(0) scale(0.98);
}
.due-emoji {
  font-size: 28px;
}
.due-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}
.due-text b {
  font-size: 15.5px;
  color: var(--ink);
}
.due-text span {
  font-size: 13px;
  color: var(--muted);
}
.due-arrow {
  font-size: 20px;
  color: var(--purple);
  font-weight: 800;
}
.reminder-card {
  border-color: rgba(230, 126, 34, 0.3);
}
.reminder-hour {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}
.reminder-hour select {
  margin-left: 6px;
  border-radius: 8px;
  border: 1px solid var(--line-soft);
  background: var(--surface);
  color: var(--ink);
  padding: 3px 8px;
  font-size: 13px;
}

/* checklist khởi động */
.checklist-card {
  flex-wrap: wrap;
  align-items: flex-start;
}
.checklist-text {
  gap: 8px;
}
.checklist-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: var(--ink);
}
.checklist-list li.done {
  color: var(--muted);
  text-decoration: line-through;
}

/* mời cài PWA */
.install-card {
  cursor: default;
  flex-wrap: wrap;
}
.install-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
.install-btn {
  border: none;
  cursor: pointer;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 16px;
  min-height: 44px;
  touch-action: manipulation;
  transition: transform 0.15s;
}
.install-btn:active {
  transform: scale(0.96);
}
.install-btn-ghost {
  background: transparent;
  color: var(--muted);
}
.install-btn-primary {
  color: #fff;
  background: var(--grad-purple);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.28);
}
.ios-sheet-title {
  font-size: 19px;
  font-weight: 800;
  margin: 6px 0 16px;
}
.ios-sheet-steps {
  margin: 0 0 20px;
  padding-left: 22px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
}
.ios-share-icon {
  font-size: 14px;
}
.ios-sheet-close {
  width: 100%;
}

@media (max-width: 480px) {
  .install-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .install-actions {
    margin-left: 0;
    width: 100%;
  }
  .install-btn {
    flex: 1;
  }
}

/* sections */
.section {
  padding-top: 40px;
  padding-bottom: 40px;
}
.section-head {
  text-align: center;
  margin-bottom: 36px;
}
.section-title {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.8px;
}
.section-title.sm {
  font-size: 30px;
  letter-spacing: -0.6px;
}
.section-sub {
  font-size: 17px;
  color: var(--muted);
  margin-top: 10px;
}

/* features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  padding: 26px 22px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
  transition: all 0.18s;
}
@media (hover: hover) {
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(108, 92, 231, 0.12);
  }
}
.feature-card:active {
  transform: translateY(-1px) scale(0.99);
  box-shadow: 0 12px 30px rgba(108, 92, 231, 0.1);
}
.feature-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}
.feature-title {
  font-size: 18px;
  font-weight: 800;
  margin: 18px 0 8px;
  letter-spacing: -0.3px;
}
.feature-desc {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
}

/* how it works */
.how {
  background: linear-gradient(135deg, #1e1e2e, #2c2545);
  border-radius: 30px;
  padding: 48px 44px;
  position: relative;
  overflow: hidden;
}
.how-glow {
  position: absolute;
  top: -50px;
  right: -30px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.35), transparent 70%);
}
.how-inner {
  position: relative;
}
.how-title {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.6px;
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 32px;
}
.step-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
}
.step-n {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  font-size: 18px;
}
.step-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 8px;
}
.step-desc {
  color: #b3b0c9;
  font-size: 14.5px;
  line-height: 1.6;
}

/* featured */
.feat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}
.see-all {
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
.feat-card {
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  border: none;
  padding: 0;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(108, 92, 231, 0.16);
  transition: transform 0.18s;
}
@media (hover: hover) {
  .feat-card:hover {
    transform: translateY(-3px);
  }
}
.feat-card:active {
  transform: translateY(-1px) scale(0.995);
}
.feat-left {
  background: linear-gradient(150deg, #6c5ce7, #4b3bc4);
  padding: 42px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.feat-emoji {
  position: absolute;
  bottom: -30px;
  right: -20px;
  font-size: 140px;
  opacity: 0.16;
}
.feat-left-top {
  position: relative;
}
.feat-tag {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 6px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
}
.feat-title {
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  margin: 18px 0 0;
  letter-spacing: -0.5px;
}
.feat-progress {
  position: relative;
  margin-top: 24px;
}
.feat-progress-top {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}
.feat-track {
  height: 9px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.22);
}
.feat-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #00d68f, #7ef0c4);
}
.feat-right {
  background: var(--surface);
  padding: 42px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.feat-right p {
  font-size: 17px;
  line-height: 1.65;
  color: var(--slate);
}
.feat-right p b {
  color: var(--ink);
}
.feat-stats {
  display: flex;
  gap: 26px;
  margin-top: 24px;
}
.feat-continue {
  margin-top: 26px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--purple);
  font-size: 16px;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
  .mascot-card {
    min-height: 320px;
  }
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .steps-grid {
    grid-template-columns: 1fr;
  }
  .feat-card {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 40px;
  }
}
@media (max-width: 560px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 34px;
  }
}
</style>
