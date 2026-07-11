<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { groupedModules } from './adminModules'
import { getStats } from '@/lib/adminApi'

/**
 * Đợt 2 — Dashboard & thống kê (docs/KE_HOACH_TRANG_ADMIN.md mục 3).
 *
 * Bức tranh sức khỏe hệ thống ngay khi mở /admin: số tổng quan, phễu hoàn thành
 * theo khóa, thống kê quiz, nội dung phổ biến/cần chú ý — tất cả là số GỘP (không
 * PII) lấy qua cổng `admin` (getStats). Lưới module giữ ở dưới cùng.
 *
 * Biểu đồ vẽ bằng thanh CSS đơn giản theo hệ màu sẵn có của app (biến --purple…),
 * không kéo thư viện chart — nhất quán với phần còn lại của khu quản trị.
 */
const stats = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await getStats()
    stats.value = res.stats
  } catch (e) {
    error.value = e?.message || 'Không tải được số liệu.'
  } finally {
    loading.value = false
  }
})

const COURSE_LABEL = { java: 'Java', ielts: 'IELTS', comm: 'Giao tiếp' }
const courseKeys = ['java', 'ielts', 'comm']

const overview = computed(() => stats.value?.overview || null)

/** Các thẻ KPI hàng đầu. */
const kpis = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { n: o.totalUsers, l: 'Tài khoản', sub: `${o.withProgress} có tiến độ` },
    { n: o.active7, l: 'Hoạt động 7 ngày', sub: `${o.active30} trong 30 ngày` },
    { n: o.newUsers7, l: 'User mới 7 ngày', sub: `${o.newUsers30} trong 30 ngày` },
    { n: o.totalXp.toLocaleString('vi-VN'), l: 'Tổng XP', sub: 'toàn hệ thống' },
    { n: o.totalCompleted, l: 'Buổi hoàn thành', sub: 'mọi khóa cộng lại' },
    { n: o.totalQuizzesTaken, l: 'Lượt kiểm tra', sub: 'quiz tuần & cuối khóa' },
  ]
})

/** Khóa nào có dữ liệu phễu để hiển thị. */
const funnelCourses = computed(() =>
  courseKeys.filter((c) => (stats.value?.funnels?.[c]?.steps || []).length),
)
function funnelMax(course) {
  const steps = stats.value?.funnels?.[course]?.steps || []
  return Math.max(1, ...steps.map((s) => s.users))
}

const quizCourses = computed(() =>
  courseKeys.filter((c) => (stats.value?.quizzes?.[c] || []).length),
)

const scopeLabel = (scope) => (scope === 'final' ? 'Cuối khóa' : `Tuần ${String(scope).replace('week:', '')}`)

const topLessons = computed(() => stats.value?.content?.topLessons || [])
const hardestQuizzes = computed(() => stats.value?.content?.hardestQuizzes || [])

const moduleGroups = groupedModules()
</script>

<template>
  <div class="head">
    <h1 class="title">Bảng quản trị</h1>
    <p class="sub">Sức khỏe hệ thống Devleap trong nháy mắt, rồi tới các module quản lý.</p>
  </div>

  <!-- Dashboard -->
  <section class="dash">
    <div v-if="loading" class="muted pad">Đang tải số liệu…</div>
    <p v-else-if="error" class="note">
      ⓘ Chưa lấy được số liệu ({{ error }}). Dashboard cần cấu hình
      <code>SUPABASE_SERVICE_ROLE_KEY</code> phía máy chủ. Các module bên dưới vẫn dùng được.
    </p>

    <template v-else-if="stats">
      <!-- 3.1 KPI -->
      <div class="kpis">
        <div v-for="(k, i) in kpis" :key="i" class="kpi">
          <span class="kpi-n">{{ k.n }}</span>
          <span class="kpi-l">{{ k.l }}</span>
          <span class="kpi-sub">{{ k.sub }}</span>
        </div>
      </div>

      <!-- 3.2 Phễu hoàn thành theo khóa -->
      <div v-if="funnelCourses.length" class="panels">
        <div v-for="c in funnelCourses" :key="c" class="panel">
          <h3 class="panel-h">Phễu hoàn thành · {{ COURSE_LABEL[c] }}</h3>
          <p class="panel-sub">{{ stats.funnels[c].touched }} người đã bắt đầu khóa này</p>
          <div class="funnel">
            <div v-for="s in stats.funnels[c].steps" :key="s.week" class="frow">
              <span class="fw">Tuần {{ s.week }}</span>
              <div class="ftrack">
                <div class="fbar" :style="{ width: (s.users / funnelMax(c)) * 100 + '%' }"></div>
              </div>
              <span class="fn">{{ s.users }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3.2 Thống kê quiz -->
      <div v-if="quizCourses.length" class="panels">
        <div v-for="c in quizCourses" :key="c" class="panel">
          <h3 class="panel-h">Kiểm tra · {{ COURSE_LABEL[c] }}</h3>
          <table class="qtbl">
            <thead>
              <tr><th>Bài</th><th class="num">Lượt làm</th><th class="num">Tỉ lệ đậu</th><th class="num">Điểm TB</th></tr>
            </thead>
            <tbody>
              <tr v-for="q in stats.quizzes[c]" :key="q.scope">
                <td>{{ scopeLabel(q.scope) }}</td>
                <td class="num">{{ q.takers }}</td>
                <td class="num"><span class="rate" :class="{ low: q.passRate < 60 }">{{ q.passRate }}%</span></td>
                <td class="num">{{ q.avgPct }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3.3 Nội dung phổ biến / cần chú ý -->
      <div class="panels">
        <div class="panel">
          <h3 class="panel-h">Buổi được hoàn thành nhiều nhất</h3>
          <ol v-if="topLessons.length" class="rank">
            <li v-for="(l, i) in topLessons" :key="i">
              <span class="r-lbl">{{ COURSE_LABEL[l.course] }} · Tuần {{ l.week }} · Buổi {{ l.day }}</span>
              <span class="r-n">{{ l.count }}</span>
            </li>
          </ol>
          <p v-else class="muted">Chưa có dữ liệu.</p>
        </div>
        <div class="panel">
          <h3 class="panel-h">Quiz tỉ lệ trượt cao</h3>
          <ol v-if="hardestQuizzes.length" class="rank">
            <li v-for="(q, i) in hardestQuizzes" :key="i">
              <span class="r-lbl">{{ COURSE_LABEL[q.course] }} · {{ scopeLabel(q.scope) }}</span>
              <span class="r-n bad">{{ q.passRate }}% đậu</span>
            </li>
          </ol>
          <p v-else class="muted">Chưa có quiz nào bị trượt — 👏</p>
        </div>
      </div>
    </template>
  </section>

  <!-- Lưới module (gom theo nhóm) -->
  <template v-for="g in moduleGroups" :key="g.name">
    <h2 class="sec">{{ g.name }}</h2>
    <div class="grid">
      <RouterLink v-for="m in g.modules" :key="m.key" :to="m.route" class="card">
        <span class="card-ic">{{ m.icon }}</span>
        <h3>{{ m.title }}</h3>
        <p>{{ m.desc }}</p>
      </RouterLink>
    </div>
  </template>
</template>

<style scoped>
.head {
  margin-bottom: 22px;
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
}
.sub {
  font-size: 15.5px;
  color: var(--muted-2);
  margin-top: 8px;
}
.dash {
  margin-bottom: 34px;
}
.muted {
  color: var(--muted);
  font-size: 14px;
}
.pad {
  padding: 20px 0;
}
.note {
  font-size: 13.5px;
  color: var(--muted-2);
  background: var(--surface-1);
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 12px;
  padding: 14px 16px;
  line-height: 1.6;
}
.note code {
  background: var(--chip-bg);
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 12.5px;
}

/* KPI */
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}
.kpi {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 16px 18px;
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
}
.kpi-n {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.5px;
}
.kpi-l {
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
}
.kpi-sub {
  font-size: 11.5px;
  color: var(--muted-2);
}

/* Panels */
.panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}
.panel {
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 18px 20px;
}
.panel-h {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}
.panel-sub {
  font-size: 12.5px;
  color: var(--muted-2);
  margin: 3px 0 12px;
}

/* Funnel bars */
.funnel {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 10px;
}
.frow {
  display: grid;
  grid-template-columns: 58px 1fr 34px;
  align-items: center;
  gap: 10px;
}
.fw {
  font-size: 12px;
  color: var(--muted-2);
  font-weight: 600;
}
.ftrack {
  background: var(--chip-bg);
  border-radius: 99px;
  height: 12px;
  overflow: hidden;
}
.fbar {
  height: 100%;
  background: var(--grad-purple, var(--purple));
  border-radius: 99px;
  min-width: 2px;
  transition: width 0.3s;
}
.fn {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink);
  text-align: right;
}

/* Quiz table */
.qtbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  margin-top: 6px;
}
.qtbl th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--muted-2);
  padding: 6px 8px;
  border-bottom: 1.5px solid rgba(108, 92, 231, 0.12);
}
.qtbl td {
  padding: 8px;
  border-bottom: 1px solid rgba(108, 92, 231, 0.08);
}
.qtbl .num {
  text-align: right;
}
.rate {
  font-weight: 800;
  color: var(--text-success);
}
.rate.low {
  color: var(--text-danger);
}

/* Rank lists */
.rank {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rank li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(108, 92, 231, 0.07);
}
.r-lbl {
  color: var(--slate);
}
.r-n {
  font-weight: 800;
  color: var(--purple);
  white-space: nowrap;
}
.r-n.bad {
  color: var(--text-danger);
}

/* Module grid */
.sec {
  font-size: 14px;
  font-weight: 800;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 8px 0 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.card {
  display: block;
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  padding: 22px;
  transition: all 0.15s;
}
@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
    border-color: var(--purple);
  }
}
.card:active {
  transform: translateY(-1px) scale(0.98);
  border-color: var(--purple);
}
.card-ic {
  font-size: 30px;
}
.card h3 {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  margin: 12px 0 6px;
}
.card p {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.55;
}
</style>
