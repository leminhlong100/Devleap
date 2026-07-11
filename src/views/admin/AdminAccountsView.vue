<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  listUsers,
  getUserDetail,
  setAdmin as apiSetAdmin,
  resetProgress as apiResetProgress,
  deleteUser as apiDeleteUser,
} from '@/lib/adminApi'

/**
 * Đợt 1 — Quản lý tài khoản (docs/KE_HOACH_TRANG_ADMIN.md mục 2).
 *
 * Danh sách người học (tìm/sắp xếp/phân trang) + panel chi tiết 1 người + các
 * hành động quản trị nhạy cảm (cấp/thu quyền, reset, xóa) — đều xác nhận 2 bước
 * và chạy qua cổng đặc quyền `admin` (server tự xác minh admin + ghi audit).
 */
const auth = useAuthStore()
const myId = computed(() => auth.user?.id || '')

// —— Danh sách ——
const users = ref([])
const loading = ref(true)
const error = ref('')
const okMsg = ref('')

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const { users: list } = await listUsers()
    users.value = list || []
  } catch (e) {
    error.value = e?.message || 'Không tải được danh sách tài khoản.'
  } finally {
    loading.value = false
  }
}
onMounted(reload)

// —— Tìm / sắp xếp / phân trang ——
const query = ref('')
const sortBy = ref('createdAt') // 'createdAt' | 'xp' | 'activity'
const page = ref(1)
const PER_PAGE = 20

const norm = (s) => (s || '').toString().toLowerCase()

const filtered = computed(() => {
  const q = norm(query.value).trim()
  let list = users.value
  if (q) list = list.filter((u) => norm(u.email).includes(q) || norm(u.name).includes(q))
  const arr = [...list]
  if (sortBy.value === 'xp') arr.sort((a, b) => (b.xp || 0) - (a.xp || 0))
  else if (sortBy.value === 'activity')
    arr.sort((a, b) => dayNum(b.lastStudyDate) - dayNum(a.lastStudyDate))
  else arr.sort((a, b) => tsNum(b.createdAt) - tsNum(a.createdAt))
  return arr
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const pageClamped = computed(() => Math.min(page.value, totalPages.value))
const paged = computed(() => {
  const start = (pageClamped.value - 1) * PER_PAGE
  return filtered.value.slice(start, start + PER_PAGE)
})
function goPage(p) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
}

// —— Định dạng ngày & tô màu theo độ mới ——
const tsNum = (iso) => (iso ? new Date(iso).getTime() || 0 : 0)
/** 'YYYY-M-D' -> số ngày (so sánh/độ mới). */
function dayNum(ymd) {
  if (!ymd) return 0
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y) return 0
  return Date.UTC(y, (m || 1) - 1, d || 1) / 86400000
}
function fmtDate(iso) {
  if (!iso) return '—'
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
/** Nhãn hoạt động gần nhất từ 'YYYY-M-D' + lớp màu theo độ mới. */
function activity(ymd) {
  if (!ymd) return { label: 'Chưa học', cls: 'none' }
  const today = Math.floor(Date.now() / 86400000)
  const diff = today - dayNum(ymd)
  if (diff <= 1) return { label: diff <= 0 ? 'Hôm nay' : 'Hôm qua', cls: 'fresh' }
  if (diff <= 7) return { label: `${diff} ngày trước`, cls: 'recent' }
  if (diff <= 30) return { label: `${diff} ngày trước`, cls: 'stale' }
  return { label: `${diff} ngày trước`, cls: 'cold' }
}

// —— Panel chi tiết ——
const detail = ref(null)
const detailLoading = ref(false)
const detailId = ref('')

async function openDetail(id) {
  detailId.value = id
  detail.value = null
  detailLoading.value = true
  error.value = ''
  try {
    const { user } = await getUserDetail(id)
    detail.value = user
  } catch (e) {
    error.value = e?.message || 'Không tải được chi tiết.'
    detailId.value = ''
  } finally {
    detailLoading.value = false
  }
}
function closeDetail() {
  detail.value = null
  detailId.value = ''
}

// —— Hành động quản trị (xác nhận 2 bước) ——
// pending: { kind:'setAdmin'|'reset'|'delete', user, on? }. Với reset/delete cần
// gõ đúng email để mở nút xác nhận.
const pending = ref(null)
const typed = ref('')
const working = ref(false)

function askSetAdmin(user, on) {
  pending.value = { kind: 'setAdmin', user, on }
  typed.value = ''
}
function askReset(user) {
  pending.value = { kind: 'reset', user }
  typed.value = ''
}
function askDelete(user) {
  pending.value = { kind: 'delete', user }
  typed.value = ''
}
function cancelPending() {
  pending.value = null
  typed.value = ''
}

const needsType = computed(() => pending.value?.kind === 'reset' || pending.value?.kind === 'delete')
const confirmReady = computed(() => {
  if (!pending.value) return false
  if (!needsType.value) return true
  return typed.value.trim().toLowerCase() === norm(pending.value.user.email)
})

async function runPending() {
  if (!pending.value || !confirmReady.value || working.value) return
  const { kind, user, on } = pending.value
  working.value = true
  error.value = ''
  okMsg.value = ''
  try {
    if (kind === 'setAdmin') {
      await apiSetAdmin(user.id, on)
      okMsg.value = on ? `Đã cấp quyền admin cho ${user.email}.` : `Đã thu quyền admin của ${user.email}.`
    } else if (kind === 'reset') {
      await apiResetProgress(user.id)
      okMsg.value = `Đã reset tiến độ của ${user.email}.`
    } else if (kind === 'delete') {
      await apiDeleteUser(user.id)
      okMsg.value = `Đã xóa tài khoản ${user.email}.`
      if (detailId.value === user.id) closeDetail()
    }
    pending.value = null
    typed.value = ''
    await reload()
    if (detailId.value && kind !== 'delete') await openDetail(detailId.value)
  } catch (e) {
    error.value = e?.message || 'Thao tác thất bại.'
  } finally {
    working.value = false
  }
}

const confirmText = computed(() => {
  const p = pending.value
  if (!p) return {}
  if (p.kind === 'setAdmin')
    return p.on
      ? { title: 'Cấp quyền admin', body: `Cho phép ${p.user.email} truy cập toàn bộ khu quản trị?`, cta: 'Cấp quyền', danger: false }
      : { title: 'Thu quyền admin', body: `Gỡ quyền quản trị của ${p.user.email}?`, cta: 'Thu quyền', danger: true }
  if (p.kind === 'reset')
    return { title: 'Reset tiến độ', body: `Xóa toàn bộ tiến độ học của ${p.user.email}. Bản cũ được lưu trong nhật ký kiểm toán để cứu.`, cta: 'Reset tiến độ', danger: true }
  return { title: 'Xóa tài khoản', body: `Xóa VĨNH VIỄN tài khoản ${p.user.email}: tiến độ + ghi âm + quyền. Không thể hoàn tác.`, cta: 'Xóa vĩnh viễn', danger: true }
})
</script>

<template>
  <div class="head">
    <h1 class="title">🧑‍💼 Quản lý tài khoản</h1>
    <p class="sub">
      Xem người học, tiến độ từng người và thực hiện các thao tác quản trị. Mọi thay đổi (cấp/thu
      quyền, reset, xóa) đều được ghi nhật ký kiểm toán và cần xác nhận.
    </p>
  </div>

  <p v-if="error" class="msg err">⚠️ {{ error }}</p>
  <p v-if="okMsg" class="msg ok">✓ {{ okMsg }}</p>

  <!-- Thanh công cụ -->
  <div class="toolbar">
    <input v-model="query" class="in search" type="search" placeholder="Tìm theo email hoặc tên…" @input="page = 1" />
    <label class="sort">
      <span>Sắp xếp</span>
      <select v-model="sortBy" class="in">
        <option value="createdAt">Mới tạo</option>
        <option value="xp">XP cao nhất</option>
        <option value="activity">Hoạt động gần nhất</option>
      </select>
    </label>
    <button class="btn ghost" :disabled="loading" @click="reload">↻ Tải lại</button>
  </div>

  <div v-if="loading" class="muted pad">Đang tải danh sách…</div>
  <div v-else-if="!users.length" class="muted pad">Chưa có tài khoản nào.</div>
  <template v-else>
    <div class="count muted">
      {{ filtered.length }} tài khoản{{ query ? ` khớp “${query}”` : '' }} · trang {{ pageClamped }}/{{ totalPages }}
    </div>

    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Người học</th>
            <th class="num">XP</th>
            <th class="num">Chuỗi</th>
            <th class="num">Huy hiệu</th>
            <th class="num">Buổi</th>
            <th>Hoạt động</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in paged" :key="u.id" :class="{ sel: u.id === detailId }">
            <td>
              <div class="u-name">
                {{ u.name || '(không tên)' }}
                <span v-if="u.isAdmin" class="badge-admin">admin</span>
                <span v-if="u.id === myId" class="badge-me">bạn</span>
              </div>
              <div class="u-mail">{{ u.email }}</div>
            </td>
            <td class="num">{{ u.xp }}</td>
            <td class="num">{{ u.streak }}</td>
            <td class="num">{{ u.badges }}</td>
            <td class="num">{{ u.completedCount }}</td>
            <td>
              <span class="act" :class="activity(u.lastStudyDate).cls">{{ activity(u.lastStudyDate).label }}</span>
            </td>
            <td class="right">
              <button class="link" @click="openDetail(u.id)">Chi tiết</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button class="btn ghost sm" :disabled="pageClamped <= 1" @click="goPage(pageClamped - 1)">← Trước</button>
      <span class="muted">{{ pageClamped }} / {{ totalPages }}</span>
      <button class="btn ghost sm" :disabled="pageClamped >= totalPages" @click="goPage(pageClamped + 1)">Sau →</button>
    </div>
  </template>

  <!-- Panel chi tiết -->
  <div v-if="detailId" class="drawer-scrim" @click.self="closeDetail">
    <aside class="drawer">
      <div class="drawer-head">
        <h2>Chi tiết tài khoản</h2>
        <button class="x" title="Đóng" @click="closeDetail">✕</button>
      </div>

      <div v-if="detailLoading" class="muted pad">Đang tải…</div>
      <div v-else-if="detail" class="drawer-body">
        <div class="d-id">
          <div class="d-name">
            {{ detail.name || '(không tên)' }}
            <span v-if="detail.isAdmin" class="badge-admin">admin</span>
          </div>
          <div class="u-mail">{{ detail.email }}</div>
          <div class="d-meta">
            Tạo: {{ fmtDate(detail.createdAt) }} · Đăng nhập gần nhất: {{ fmtDate(detail.lastSignInAt) }}
          </div>
        </div>

        <div v-if="!detail.hasProgress" class="muted pad-sm">Người dùng này chưa có dữ liệu tiến độ.</div>

        <div class="stat-grid">
          <div class="stat"><span class="s-n">{{ detail.xp }}</span><span class="s-l">XP</span></div>
          <div class="stat"><span class="s-n">{{ detail.streak }}</span><span class="s-l">Chuỗi ngày</span></div>
          <div class="stat"><span class="s-n">{{ detail.badges }}</span><span class="s-l">Huy hiệu</span></div>
          <div class="stat"><span class="s-n">{{ detail.completed.java }}</span><span class="s-l">Buổi Java</span></div>
          <div class="stat"><span class="s-n">{{ detail.completed.ielts }}</span><span class="s-l">Buổi IELTS</span></div>
          <div class="stat"><span class="s-n">{{ detail.completed.comm }}</span><span class="s-l">Buổi Giao tiếp</span></div>
          <div class="stat"><span class="s-n">{{ detail.quizCount }}</span><span class="s-l">Bài quiz</span></div>
          <div class="stat"><span class="s-n">{{ detail.savedWordsCount }}</span><span class="s-l">Từ đã lưu</span></div>
          <div class="stat"><span class="s-n">{{ detail.srsCount }}</span><span class="s-l">Thẻ SRS</span></div>
          <div class="stat"><span class="s-n">{{ detail.shadowingCount }}</span><span class="s-l">Shadowing</span></div>
          <div class="stat"><span class="s-n">{{ detail.dictationCount }}</span><span class="s-l">Chính tả</span></div>
          <div class="stat"><span class="s-n">{{ detail.topicsCount }}</span><span class="s-l">Chủ đề</span></div>
        </div>

        <div class="lb muted pad-sm">
          Leaderboard: {{ detail.leaderboardOptIn ? `tham gia — “${detail.leaderboardName || 'ẩn danh'}”` : 'không tham gia' }}
        </div>

        <h3 class="sec">Hành động</h3>
        <div class="d-actions">
          <button
            v-if="!detail.isAdmin"
            class="btn ghost"
            @click="askSetAdmin(detail, true)"
          >
            Cấp quyền admin
          </button>
          <button
            v-else
            class="btn ghost"
            :disabled="detail.id === myId"
            :title="detail.id === myId ? 'Không thể tự thu quyền của chính mình' : ''"
            @click="askSetAdmin(detail, false)"
          >
            Thu quyền admin
          </button>
          <button class="btn ghost warn" @click="askReset(detail)">Reset tiến độ</button>
          <button
            class="btn ghost danger"
            :disabled="detail.id === myId"
            :title="detail.id === myId ? 'Không thể tự xóa tài khoản của chính mình' : ''"
            @click="askDelete(detail)"
          >
            Xóa tài khoản
          </button>
        </div>
      </div>
    </aside>
  </div>

  <!-- Hộp xác nhận 2 bước -->
  <div v-if="pending" class="modal-scrim" @click.self="cancelPending">
    <div class="modal" :class="{ danger: confirmText.danger }">
      <h3>{{ confirmText.title }}</h3>
      <p class="modal-body">{{ confirmText.body }}</p>
      <label v-if="needsType" class="confirm-type">
        <span>Gõ lại email <code>{{ pending.user.email }}</code> để xác nhận:</span>
        <input v-model="typed" class="in" type="text" autocomplete="off" @keyup.enter="runPending" />
      </label>
      <div class="modal-actions">
        <button class="btn ghost" :disabled="working" @click="cancelPending">Hủy</button>
        <button
          class="btn"
          :class="{ danger: confirmText.danger }"
          :disabled="!confirmReady || working"
          @click="runPending"
        >
          {{ working ? 'Đang xử lý…' : confirmText.cta }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 20px;
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
.msg {
  margin: 0 0 14px;
  font-size: 13.5px;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 12px;
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
.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 14px;
}
.in {
  font-size: 15px;
  padding: 10px 13px;
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
}
.in:focus {
  outline: none;
  border-color: var(--purple);
}
.search {
  flex: 1;
  min-width: 220px;
}
.sort {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-2);
}
.btn {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple, var(--purple));
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.sm {
  padding: 7px 13px;
  font-size: 13.5px;
}
.btn.ghost {
  background: var(--surface);
  color: var(--ink);
  border: 1.5px solid rgba(108, 92, 231, 0.2);
}
.btn.ghost.warn {
  color: var(--text-danger);
  border-color: rgba(214, 81, 43, 0.3);
}
.btn.ghost.danger {
  color: #fff;
  background: var(--text-danger);
  border-color: var(--text-danger);
}
.btn.danger {
  background: var(--text-danger);
}
.count,
.pad {
  margin-bottom: 10px;
}
.pad {
  padding: 24px 0;
}
.pad-sm {
  padding: 8px 0;
}
.muted {
  color: var(--muted);
  font-size: 13.5px;
}
.tbl-wrap {
  overflow-x: auto;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.tbl th {
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--muted-2);
  padding: 8px 12px;
  border-bottom: 1.5px solid rgba(108, 92, 231, 0.12);
  white-space: nowrap;
}
.tbl th.num,
.tbl td.num {
  text-align: right;
  width: 74px;
}
.tbl td {
  padding: 12px;
  border-bottom: 1px solid rgba(108, 92, 231, 0.1);
  vertical-align: middle;
}
.tbl tr.sel td {
  background: var(--purple-soft);
}
.u-name {
  font-weight: 700;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.u-mail {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.badge-admin {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 2px 7px;
  border-radius: 99px;
}
.badge-me {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--muted-2);
  background: var(--chip-bg);
  padding: 2px 7px;
  border-radius: 99px;
}
.right {
  text-align: right;
  white-space: nowrap;
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
.act {
  font-size: 12.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.act.fresh {
  color: var(--text-success);
  background: rgba(0, 168, 111, 0.12);
}
.act.recent {
  color: var(--purple);
  background: var(--purple-soft);
}
.act.stale {
  color: #b26a00;
  background: rgba(214, 158, 43, 0.14);
}
.act.cold,
.act.none {
  color: var(--muted);
  background: var(--chip-bg);
}
.pager {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}

/* —— Drawer chi tiết —— */
.drawer-scrim {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 41, 0.4);
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  width: min(460px, 100%);
  background: var(--surface);
  height: 100%;
  overflow-y: auto;
  padding: 22px;
  box-shadow: -8px 0 30px rgba(15, 12, 41, 0.16);
}
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.drawer-head h2 {
  font-size: 19px;
  font-weight: 800;
}
.x {
  border: none;
  background: var(--chip-bg);
  color: var(--ink);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
}
.d-id {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(108, 92, 231, 0.12);
}
.d-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 8px;
}
.d-meta {
  font-size: 12px;
  color: var(--muted-2);
  margin-top: 6px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 16px 0;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  background: var(--surface-1);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 12px;
}
.s-n {
  font-size: 20px;
  font-weight: 800;
  color: var(--ink);
}
.s-l {
  font-size: 11.5px;
  color: var(--muted-2);
}
.lb {
  margin-bottom: 8px;
}
.sec {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--muted-2);
  margin: 18px 0 10px;
}
.d-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* —— Modal xác nhận —— */
.modal-scrim {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 41, 0.5);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  width: min(440px, 100%);
  background: var(--surface);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(15, 12, 41, 0.3);
}
.modal h3 {
  font-size: 19px;
  font-weight: 800;
}
.modal.danger h3 {
  color: var(--text-danger);
}
.modal-body {
  font-size: 14px;
  color: var(--slate);
  line-height: 1.6;
  margin: 10px 0 16px;
}
.confirm-type {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--muted-2);
  margin-bottom: 18px;
}
.confirm-type code {
  color: var(--ink);
  font-weight: 700;
}
.confirm-type .in {
  width: 100%;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 600px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
