<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  getFeedbackStats,
  listRecordings,
  deleteRecording as apiDeleteRecording,
  listLeaderboard,
  clearLeaderboardName as apiClearName,
} from '@/lib/adminApi'

/**
 * Đợt 4 — Kiểm duyệt & phản hồi (docs/KE_HOACH_TRANG_ADMIN.md mục 5).
 *
 * 3 tab: cảm nhận độ khó cuối tuần (tổng hợp), ghi âm mốc (nghe/xóa qua signed
 * URL), leaderboard (xóa tên phản cảm). Mọi thao tác xóa ghi `admin_audit`.
 */
const TABS = [
  { key: 'feedback', label: '📊 Độ khó' },
  { key: 'recordings', label: '🎙️ Ghi âm' },
  { key: 'leaderboard', label: '🏆 Leaderboard' },
]
const tab = ref('feedback')

const error = ref('')
const okMsg = ref('')

// —— Phản hồi độ khó ——
const feedback = ref(null)
const fbLoading = ref(true)
const COURSE_LABEL = { java: 'Java', ielts: 'IELTS', comm: 'Giao tiếp' }
const fbCourses = computed(() => Object.keys(feedback.value || {}).filter((c) => (feedback.value[c] || []).length))

// —— Ghi âm ——
const recordings = ref([])
const recLoading = ref(true)

// —— Leaderboard ——
const entries = ref([])
const lbLoading = ref(true)

async function loadFeedback() {
  fbLoading.value = true
  try {
    const { feedback: f } = await getFeedbackStats()
    feedback.value = f
  } catch (e) {
    error.value = e?.message || 'Không tải được phản hồi.'
  } finally {
    fbLoading.value = false
  }
}
async function loadRecordings() {
  recLoading.value = true
  try {
    const { recordings: r } = await listRecordings(200)
    recordings.value = r || []
  } catch (e) {
    error.value = e?.message || 'Không tải được ghi âm.'
  } finally {
    recLoading.value = false
  }
}
async function loadLeaderboard() {
  lbLoading.value = true
  try {
    const { entries: e } = await listLeaderboard()
    entries.value = e || []
  } catch (er) {
    error.value = er?.message || 'Không tải được leaderboard.'
  } finally {
    lbLoading.value = false
  }
}

onMounted(() => {
  loadFeedback()
  loadRecordings()
  loadLeaderboard()
})

const shortId = (id) => (id ? `${id.slice(0, 8)}…` : '')
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const fmtSize = (n) => (n ? `${Math.round(n / 1024)} KB` : '')

async function removeRecording(rec) {
  if (!window.confirm(`Xóa ghi âm "${rec.label}"? Không thể hoàn tác.`)) return
  error.value = ''
  okMsg.value = ''
  try {
    await apiDeleteRecording(rec.path)
    recordings.value = recordings.value.filter((r) => r.path !== rec.path)
    okMsg.value = 'Đã xóa ghi âm.'
  } catch (e) {
    error.value = e?.message || 'Xóa thất bại.'
  }
}

async function clearName(entry) {
  if (!window.confirm(`Xóa tên hiển thị "${entry.displayName}" khỏi leaderboard?`)) return
  error.value = ''
  okMsg.value = ''
  try {
    await apiClearName(entry.id)
    entry.displayName = ''
    okMsg.value = 'Đã xóa tên hiển thị.'
  } catch (e) {
    error.value = e?.message || 'Xóa thất bại.'
  }
}

const recordingColumns = [
  { key: 'label', label: 'Mốc', primary: true },
  { key: 'userId', label: 'Người dùng' },
  { key: 'createdAt', label: 'Thời điểm' },
  { key: 'listen', label: 'Nghe' },
  { key: 'actions', label: '', numeric: true },
]
const leaderboardColumns = [
  { key: 'displayName', label: 'Tên hiển thị', primary: true },
  { key: 'email', label: 'Email' },
  { key: 'weekXp', label: 'XP tuần', numeric: true },
  { key: 'actions', label: '', numeric: true },
]

// Chiều rộng đoạn bar cảm nhận (%) theo tổng số lượt của tuần đó.
function seg(row, kind) {
  const total = row.easy + row.ok + row.hard + row.skipped
  return total ? (row[kind] / total) * 100 : 0
}
</script>

<template>
  <div class="head">
    <h1 class="title">🛡️ Kiểm duyệt & phản hồi</h1>
    <p class="sub">
      Cảm nhận độ khó theo tuần, nghe & kiểm duyệt ghi âm mốc, dọn tên hiển thị leaderboard.
      Thao tác xóa đều ghi nhật ký kiểm toán.
    </p>
  </div>

  <div class="tabs">
    <button v-for="t in TABS" :key="t.key" class="tab" :class="{ on: tab === t.key }" @click="tab = t.key">
      {{ t.label }}
    </button>
  </div>

  <p v-if="error" class="msg err">⚠️ {{ error }}</p>
  <p v-if="okMsg" class="msg ok">✓ {{ okMsg }}</p>

  <!-- Tab: Độ khó -->
  <section v-show="tab === 'feedback'">
    <div v-if="fbLoading" class="muted pad">Đang tải…</div>
    <div v-else-if="!fbCourses.length" class="muted pad">Chưa có phản hồi độ khó nào.</div>
    <div v-else class="fb-grid">
      <div v-for="c in fbCourses" :key="c" class="card">
        <h3 class="card-h">{{ COURSE_LABEL[c] }}</h3>
        <div class="fb-rows">
          <div v-for="row in feedback[c]" :key="row.week" class="fb-row">
            <span class="fb-w">Tuần {{ row.week }}</span>
            <div class="fb-bar">
              <span class="s easy" :style="{ width: seg(row, 'easy') + '%' }" :title="`Dễ: ${row.easy}`"></span>
              <span class="s ok" :style="{ width: seg(row, 'ok') + '%' }" :title="`Vừa: ${row.ok}`"></span>
              <span class="s hard" :style="{ width: seg(row, 'hard') + '%' }" :title="`Khó: ${row.hard}`"></span>
              <span class="s skip" :style="{ width: seg(row, 'skipped') + '%' }" :title="`Bỏ qua: ${row.skipped}`"></span>
            </div>
            <span class="fb-hard" :class="{ warn: row.hardPct >= 40 }">{{ row.hardPct }}% khó</span>
          </div>
        </div>
      </div>
      <p class="legend muted">
        <span class="dot easy"></span>Dễ <span class="dot ok"></span>Vừa
        <span class="dot hard"></span>Khó <span class="dot skip"></span>Bỏ qua
        · Tuần nào ≥40% thấy "khó" → cân nhắc chỉnh độ khó.
      </p>
    </div>
  </section>

  <!-- Tab: Ghi âm -->
  <section v-show="tab === 'recordings'">
    <div v-if="recLoading" class="muted pad">Đang tải…</div>
    <div v-else-if="!recordings.length" class="muted pad">Chưa có ghi âm nào.</div>
    <AdminDataTable v-else :columns="recordingColumns" :rows="recordings" row-key="path">
      <template #cell-label="{ row: r }">
        <div class="r-label">{{ r.label }}</div>
        <div class="r-sub">{{ fmtSize(r.size) }}</div>
      </template>
      <template #cell-userId="{ row: r }">
        <code class="uid">{{ shortId(r.userId) }}</code>
      </template>
      <template #cell-createdAt="{ row: r }">
        <span class="r-date">{{ fmtDate(r.createdAt) }}</span>
      </template>
      <template #cell-listen="{ row: r }">
        <audio v-if="r.url" :src="r.url" controls preload="none" class="player"></audio>
        <span v-else class="muted">—</span>
      </template>
      <template #cell-actions="{ row: r }">
        <button class="link del" @click="removeRecording(r)">Xóa</button>
      </template>
    </AdminDataTable>
  </section>

  <!-- Tab: Leaderboard -->
  <section v-show="tab === 'leaderboard'">
    <div v-if="lbLoading" class="muted pad">Đang tải…</div>
    <div v-else-if="!entries.length" class="muted pad">Chưa có ai tham gia leaderboard.</div>
    <AdminDataTable v-else :columns="leaderboardColumns" :rows="entries" row-key="id">
      <template #cell-displayName="{ row: e }">
        <span v-if="e.displayName" class="lb-name">{{ e.displayName }}</span>
        <span v-else class="muted">(ẩn danh)</span>
      </template>
      <template #cell-email="{ row: e }">
        <span class="r-sub">{{ e.email }}</span>
      </template>
      <template #cell-actions="{ row: e }">
        <button class="link del" :disabled="!e.displayName" @click="clearName(e)">Xóa tên</button>
      </template>
    </AdminDataTable>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: 16px;
}
.title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.sub {
  font-size: 14.5px;
  color: var(--muted-2);
  margin-top: 8px;
  max-width: 760px;
  line-height: 1.6;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tab {
  border: 1.5px solid rgba(108, 92, 231, 0.18);
  background: var(--surface);
  color: var(--slate);
  font-size: 14px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 11px;
  cursor: pointer;
}
.tab.on {
  color: #fff;
  background: var(--grad-purple, var(--purple));
  border-color: transparent;
}
.msg {
  font-size: 13.5px;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 14px;
}
.err {
  color: var(--text-danger);
  background: rgba(214, 81, 43, 0.08);
  border: 1px solid rgba(214, 81, 43, 0.25);
}
.ok {
  color: var(--text-success);
  background: rgba(0, 168, 111, 0.08);
  border: 1px solid rgba(0, 168, 111, 0.25);
}
.muted {
  color: var(--muted);
  font-size: 14px;
}
.pad {
  padding: 22px 0;
}

/* Độ khó */
.fb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.card {
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 18px 20px;
}
.card-h {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 12px;
}
.fb-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fb-row {
  display: grid;
  grid-template-columns: 56px 1fr 62px;
  align-items: center;
  gap: 10px;
}
.fb-w {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-2);
}
.fb-bar {
  display: flex;
  height: 14px;
  border-radius: 99px;
  overflow: hidden;
  background: var(--chip-bg);
}
.s {
  height: 100%;
}
.s.easy {
  background: #00a86f;
}
.s.ok {
  background: #6c5ce7;
}
.s.hard {
  background: #d6512b;
}
.s.skip {
  background: var(--muted);
  opacity: 0.4;
}
.fb-hard {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
  text-align: right;
}
.fb-hard.warn {
  color: var(--text-danger);
}
.legend {
  grid-column: 1 / -1;
  font-size: 12.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 8px;
}
.dot.easy {
  background: #00a86f;
}
.dot.ok {
  background: #6c5ce7;
}
.dot.hard {
  background: #d6512b;
}
.dot.skip {
  background: var(--muted);
  opacity: 0.5;
}

.r-label {
  font-weight: 700;
  color: var(--ink);
}
.r-sub {
  font-size: 12.5px;
  color: var(--muted);
}
.r-date {
  font-size: 13px;
  color: var(--slate);
  white-space: nowrap;
}
.uid {
  font-size: 12px;
  color: var(--muted);
  background: var(--chip-bg);
  padding: 2px 8px;
  border-radius: 7px;
}
.player {
  height: 34px;
  max-width: 220px;
}
@media (max-width: 720px) {
  .player {
    width: 100%;
    max-width: none;
  }
}
.lb-name {
  font-weight: 700;
  color: var(--ink);
}
.link {
  border: none;
  background: none;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
  padding: 0;
}
.link.del {
  color: var(--text-danger);
}
.link:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
