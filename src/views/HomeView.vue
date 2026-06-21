<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MascotLogo from '@/components/common/MascotLogo.vue'
import { useUserStore } from '@/stores/user'
import { features, steps } from '@/data/home'
import { computeJavaProgress, javaTotals } from '@/data/course'
import { javaStages } from '@/data/courses'

const router = useRouter()
const user = useUserStore()

// Tiến độ thật của khóa Java, suy từ danh sách ngày đã hoàn thành (store).
const prog = computed(() => computeJavaProgress(user.completed.java))
const stageCount = Object.keys(javaStages).length
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
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="hero container">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="hero-grid">
        <div>
          <div class="badge-pill">
            <span class="dot"></span> Nền tảng học cho người Việt mới bắt đầu
          </div>
          <h1 class="hero-title">
            Học lập trình &<br />tiếng Anh như<br />
            <span class="brand-text">chơi một game</span>
          </h1>
          <p class="hero-sub">
            Mỗi ngày một bước nhảy nhỏ. Lộ trình rõ ràng, công cụ thực hành và streak giữ lửa — để
            bạn thật sự muốn mở app lên học.
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
            <div><div class="stat-n">12+</div><div class="stat-l">tuần lộ trình</div></div>
            <div class="sep"></div>
            <div><div class="stat-n">2.4k</div><div class="stat-l">người đang học</div></div>
            <div class="sep"></div>
            <div><div class="stat-n">4.9★</div><div class="stat-l">đánh giá</div></div>
          </div>
        </div>

        <div class="mascot-card">
          <div class="mascot-bubble"></div>
          <MascotLogo variant="hero" :width="240" :height="257" uid="herom" />
          <div class="float-tag tag-xp">+20 XP 🎉</div>
          <div class="float-tag tag-streak">🔥 Streak 7 ngày</div>
          <div class="float-tag tag-badge">🏅 Huy hiệu mới!</div>
        </div>
      </div>
    </section>

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
        <span class="see-all" @click="router.push({ name: 'courses' })">Xem tất cả →</span>
      </div>
      <div class="feat-card" @click="openFeatured">
        <div class="feat-left">
          <div class="feat-emoji">☕</div>
          <div class="feat-left-top">
            <span class="feat-tag">🔥 ĐANG HỌC</span>
            <h3 class="feat-title">Java + Tiếng Anh<br />12 Tuần Bứt Phá</h3>
          </div>
          <div class="feat-progress">
            <div class="feat-progress-top"><span>Tiến độ của bạn</span><span>{{ prog.pct }}%</span></div>
            <div class="feat-track"><div class="feat-fill" :style="{ width: prog.pct + '%' }"></div></div>
          </div>
        </div>
        <div class="feat-right">
          <p>
            Từ OOP cơ bản đến Microservices, Spring AI & System Design. Mỗi ngày kèm
            <b>10 từ vựng IT</b> để vừa code giỏi vừa giao tiếp tốt — sẵn sàng đi làm Backend.
          </p>
          <div class="feat-stats">
            <div><div class="stat-n sm">{{ javaTotals.weeks }}</div><div class="stat-l">tuần</div></div>
            <div><div class="stat-n sm">{{ javaTotals.lessons }}</div><div class="stat-l">bài học</div></div>
            <div><div class="stat-n sm">{{ stageCount }}</div><div class="stat-l">giai đoạn</div></div>
            <div><div class="stat-n sm" style="color: var(--amber)">Trung cấp</div><div class="stat-l">độ khó</div></div>
          </div>
          <div class="feat-continue">{{ continueLabel }}</div>
        </div>
      </div>
    </section>
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
  background: #fff;
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
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(108, 92, 231, 0.42);
}
.btn-ghost {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: var(--purple);
  padding: 15px 24px;
  background: #fff;
}
.btn-ghost:hover {
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
  background: #e6e6f0;
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
  background: #fff;
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
  color: #7a7a92;
  margin-top: 10px;
}

/* features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  padding: 26px 22px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.06);
  transition: all 0.18s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(108, 92, 231, 0.12);
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
  font-size: 15px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
.feat-card {
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(108, 92, 231, 0.16);
  transition: transform 0.18s;
}
.feat-card:hover {
  transform: translateY(-3px);
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
  background: #fff;
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
