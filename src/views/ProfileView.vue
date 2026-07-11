<script setup>
/**
 * Trang Hồ sơ & Cài đặt (Bước 2.1–2.3 KE_HOACH_HOAN_THIEN_SAN_PHAM.md) — gom
 * các tùy chọn trước đây rải rác (HomeView, LeaderboardTool, AiChat) về một
 * nơi, cộng thêm quản lý tài khoản (đổi mật khẩu/đặt lại tiến độ/đăng xuất)
 * và xuất/nhập dữ liệu học tập.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useStudyReminder } from '@/composables/useStudyReminder'
import { usePushReminder } from '@/composables/usePushReminder'
import { PERSONAS } from '@/composables/useChatEngine'
import { clearLocalProgress } from '@/lib/clearProgress'
import { buildExportPayload, parseImportPayload } from '@/lib/dataExport'
import { mergeSnapshots } from '@/stores/user/syncSupabase'
import MascotLogo from '@/components/common/MascotLogo.vue'

const router = useRouter()
const user = useUserStore()
const auth = useAuthStore()
const { xp, streak, level, convoPrefs, leaderboardOptIn, leaderboardName, analyticsOptOut } = storeToRefs(user)
const { user: authUser } = storeToRefs(auth)

const { theme, toggleTheme } = useTheme()
const { preferredHour, setPreferredHour } = useStudyReminder()
const reminderHourOptions = [18, 19, 20, 21, 22]

// —— Tên hiển thị ——
const nameDraft = ref(authUser.value?.name || '')
const nameBusy = ref(false)
const nameMsg = ref('')
async function saveName() {
  if (nameBusy.value) return
  nameMsg.value = ''
  nameBusy.value = true
  try {
    const res = await auth.updateDisplayName(nameDraft.value)
    nameMsg.value = res.error ? res.error : 'Đã lưu tên hiển thị ✅'
  } finally {
    nameBusy.value = false
  }
}
const isGoogleAccount = computed(() => authUser.value?.provider === 'google')

// —— Đổi mật khẩu (chỉ tài khoản email/mật khẩu) ——
const pwBusy = ref(false)
const pwMsg = ref('')
async function sendChangePasswordEmail() {
  if (pwBusy.value || !authUser.value?.email) return
  pwBusy.value = true
  pwMsg.value = ''
  try {
    const res = await auth.sendPasswordReset(authUser.value.email)
    pwMsg.value = res.error || `Đã gửi email đặt mật khẩu mới tới ${authUser.value.email}.`
  } finally {
    pwBusy.value = false
  }
}

// —— Thông báo nhắc học ——
const notifySupported = typeof window !== 'undefined' && 'Notification' in window
const notifyPermission = ref(notifySupported ? Notification.permission : 'unsupported')
function requestNotify() {
  if (!notifySupported || notifyPermission.value !== 'default') return
  Notification.requestPermission().then((p) => {
    notifyPermission.value = p
  })
}

// —— Nhắc học qua Web Push thật (Bước 3.3) — hoạt động cả khi app đã đóng ——
const push = usePushReminder()
const pushMsg = ref('')
onMounted(() => {
  push.checkSubscribed()
})
async function togglePush() {
  pushMsg.value = ''
  if (push.subscribed.value) {
    await push.disable(authUser.value?.id)
    return
  }
  const res = await push.enable(authUser.value?.id, preferredHour.value)
  if (res.error) pushMsg.value = res.error
}

// —— Analytics ẩn danh (Bước 4.1) ——
function toggleAnalytics() {
  user.setAnalyticsOptOut(!analyticsOptOut.value)
}

// —— Leaderboard ——
const lbName = ref(leaderboardName.value)
function toggleLeaderboard() {
  user.setLeaderboardOptIn(!leaderboardOptIn.value, lbName.value)
}
function saveLbName() {
  if (!leaderboardOptIn.value) return
  user.setLeaderboardOptIn(true, lbName.value)
}

// —— Persona AI mặc định (khóa Nền Tảng) ——
function choosePersona(key) {
  user.setConvoPrefs({ persona: key })
}

// —— Đặt lại tiến độ (2 bước xác nhận) ——
const resetStep = ref(0) // 0 = chưa bấm, 1 = đang xác nhận
const resetBusy = ref(false)
function askReset() {
  resetStep.value = 1
}
function cancelReset() {
  resetStep.value = 0
}
async function confirmReset() {
  if (resetBusy.value) return
  resetBusy.value = true
  try {
    user.applySnapshot({}) // về mặc định trong bộ nhớ
    if (user.cloudUserId) await user.pushNow() // ghi đè cloud bằng bản mặc định
    clearLocalProgress() // xóa cache local (tiến độ + đồng bộ + AI persona + Java prep)
    window.location.assign(router.resolve({ name: 'home' }).href)
  } finally {
    resetBusy.value = false
  }
}

// —— Xuất/nhập dữ liệu học tập ——
function exportData() {
  const payload = buildExportPayload(user.snapshot())
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devleap-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importMsg = ref('')
const pendingImport = ref(null) // dữ liệu đã đọc & hợp lệ, chờ chọn hợp nhất/ghi đè
const fileInput = ref(null)

function pickImportFile() {
  importMsg.value = ''
  pendingImport.value = null
  fileInput.value?.click()
}
function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // cho phép chọn lại cùng file lần sau
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const res = parseImportPayload(String(reader.result || ''))
    if (!res.ok) {
      importMsg.value = res.error
      return
    }
    pendingImport.value = res.data
  }
  reader.onerror = () => {
    importMsg.value = 'Không đọc được file.'
  }
  reader.readAsText(file)
}
async function applyImport(mode) {
  if (!pendingImport.value) return
  const next = mode === 'merge' ? mergeSnapshots(user.snapshot(), pendingImport.value) : pendingImport.value
  user.applySnapshot(next)
  user.persist()
  if (user.cloudUserId) await user.pushNow()
  importMsg.value = 'Đã nhập dữ liệu ✅'
  pendingImport.value = null
}
</script>

<template>
  <div class="container page">
    <div class="head">
      <MascotLogo :width="56" :height="60" uid="profile" />
      <div>
        <h1 class="title">Hồ sơ & cài đặt</h1>
        <p class="sub">Lv.{{ level }} · {{ xp }} XP · 🔥 {{ streak }} ngày</p>
      </div>
    </div>

    <!-- Tài khoản -->
    <section class="card">
      <h2 class="h2">Tài khoản</h2>
      <div class="field">
        <label class="label" for="pf-name">Tên hiển thị</label>
        <div class="row">
          <input id="pf-name" v-model="nameDraft" class="input" maxlength="60" />
          <button class="btn" type="button" :disabled="nameBusy" @click="saveName">Lưu</button>
        </div>
        <p v-if="nameMsg" class="hint">{{ nameMsg }}</p>
      </div>
      <div class="field">
        <span class="label">Email</span>
        <p class="static">{{ authUser?.email }}</p>
      </div>
      <div class="field">
        <span class="label">Đăng nhập bằng</span>
        <p class="static">{{ isGoogleAccount ? 'Google' : 'Email/mật khẩu' }}</p>
      </div>
      <div v-if="!isGoogleAccount" class="field">
        <button class="btn" type="button" :disabled="pwBusy" @click="sendChangePasswordEmail">
          {{ pwBusy ? 'Đang gửi…' : 'Đổi mật khẩu' }}
        </button>
        <p v-if="pwMsg" class="hint">{{ pwMsg }}</p>
      </div>
    </section>

    <!-- Giao diện & nhắc học -->
    <section class="card">
      <h2 class="h2">Giao diện & nhắc học</h2>
      <div class="field row-between">
        <span class="label">Giao diện</span>
        <button class="btn" type="button" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️ Sáng' : '🌙 Tối' }}
        </button>
      </div>
      <div class="field row-between">
        <label class="label" for="pf-hour">Giờ nhắc học</label>
        <select id="pf-hour" class="select" :value="preferredHour" @change="setPreferredHour(Number($event.target.value))">
          <option v-for="h in reminderHourOptions" :key="h" :value="h">{{ h }}:00</option>
        </select>
      </div>
      <div class="field row-between">
        <span class="label">Thông báo trình duyệt</span>
        <button v-if="notifyPermission === 'default'" class="btn" type="button" @click="requestNotify">
          Bật thông báo
        </button>
        <span v-else class="static">
          {{ { granted: 'Đã bật ✅', denied: 'Đã chặn — bật lại ở cài đặt trình duyệt', unsupported: 'Trình duyệt không hỗ trợ' }[notifyPermission] }}
        </span>
      </div>
      <p class="note">Thông báo trên chỉ nhắc được khi bạn đang mở app trên trình duyệt này.</p>

      <div class="field row-between">
        <div>
          <span class="label">Nhắc học kể cả khi app đã đóng</span>
          <p class="note">Push thật qua trình duyệt — không cần mở tab.</p>
        </div>
        <button
          v-if="push.supported"
          class="btn"
          type="button"
          :disabled="push.busy.value"
          @click="togglePush"
        >
          {{ push.subscribed.value ? 'Đã bật ✅ — Tắt' : 'Bật nhắc học' }}
        </button>
        <span v-else class="static">Thiết bị/trình duyệt này chưa hỗ trợ</span>
      </div>
      <p v-if="pushMsg" class="hint">{{ pushMsg }}</p>

      <div class="field row-between">
        <div>
          <span class="label">Analytics ẩn danh</span>
          <p class="note">Giúp cải thiện app: mở trang, mở/hoàn thành buổi, dùng tính năng — không lưu email, tên hay nội dung bạn viết.</p>
        </div>
        <button class="switch" type="button" role="switch" :aria-checked="!analyticsOptOut" @click="toggleAnalytics">
          <span class="knob" :class="{ on: !analyticsOptOut }"></span>
        </button>
      </div>
    </section>

    <!-- Cộng đồng & AI -->
    <section class="card">
      <h2 class="h2">Cộng đồng & trợ lý AI</h2>
      <div class="field row-between">
        <span class="label">Tham gia bảng xếp hạng tuần</span>
        <button class="switch" type="button" role="switch" :aria-checked="leaderboardOptIn" @click="toggleLeaderboard">
          <span class="knob" :class="{ on: leaderboardOptIn }"></span>
        </button>
      </div>
      <div v-if="leaderboardOptIn" class="field">
        <label class="label" for="pf-lbname">Tên hiển thị trên bảng xếp hạng</label>
        <div class="row">
          <input id="pf-lbname" v-model="lbName" class="input" maxlength="40" placeholder="Để trống = Học viên ẩn danh" />
          <button class="btn" type="button" @click="saveLbName">Lưu</button>
        </div>
      </div>
      <div class="field">
        <span class="label">Phong cách AI mặc định (khóa Nền Tảng)</span>
        <div class="persona-list">
          <button
            v-for="p in PERSONAS"
            :key="p.key"
            class="persona"
            type="button"
            :class="{ active: convoPrefs.persona === p.key }"
            @click="choosePersona(p.key)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- Dữ liệu học tập -->
    <section class="card">
      <h2 class="h2">Dữ liệu học tập</h2>
      <div class="field row-between">
        <div>
          <span class="label">Sao lưu tiến độ</span>
          <p class="note">Xuất XP, ngày hoàn thành, SRS, quiz, từ đã lưu… ra 1 file JSON.</p>
        </div>
        <button class="btn" type="button" @click="exportData">Xuất file</button>
      </div>
      <div class="field row-between">
        <div>
          <span class="label">Nhập dữ liệu từ file sao lưu</span>
          <p class="note">Chọn file JSON đã xuất trước đó.</p>
        </div>
        <button class="btn" type="button" @click="pickImportFile">Chọn file…</button>
        <input ref="fileInput" type="file" accept="application/json" class="visually-hidden" @change="onImportFile" />
      </div>
      <p v-if="importMsg" class="hint">{{ importMsg }}</p>
      <div v-if="pendingImport" class="import-confirm">
        <p class="note">Áp dụng dữ liệu vừa nhập như thế nào?</p>
        <div class="row">
          <button class="btn" type="button" @click="applyImport('merge')">Hợp nhất với dữ liệu hiện tại</button>
          <button class="btn danger" type="button" @click="applyImport('overwrite')">Ghi đè hoàn toàn</button>
          <button class="btn ghost" type="button" @click="pendingImport = null">Hủy</button>
        </div>
      </div>
    </section>

    <!-- Vùng nguy hiểm -->
    <section class="card danger-zone">
      <h2 class="h2">Đặt lại tiến độ</h2>
      <p class="note">Xóa toàn bộ XP, streak, ngày hoàn thành, SRS, quiz, từ đã lưu… Không thể hoàn tác.</p>
      <button v-if="resetStep === 0" class="btn danger" type="button" @click="askReset">Đặt lại tiến độ…</button>
      <div v-else class="row">
        <button class="btn danger" type="button" :disabled="resetBusy" @click="confirmReset">
          {{ resetBusy ? 'Đang xóa…' : 'Xác nhận xóa toàn bộ tiến độ' }}
        </button>
        <button class="btn ghost" type="button" @click="cancelReset">Hủy</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 20px 70px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}
.sub {
  font-size: 13.5px;
  color: var(--slate);
  margin: 4px 0 0;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 20px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.h2 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row-between {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.static {
  font-size: 14px;
  color: var(--slate);
  margin: 0;
}
.note {
  font-size: 12.5px;
  color: var(--muted-2);
  margin: 0;
}
.hint {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--purple);
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.input,
.select {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: inherit;
  font-size: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.input {
  flex: 1;
  min-width: 160px;
}
.input:focus,
.select:focus {
  border-color: var(--purple, #6c5ce7);
}
.btn {
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 11px;
  cursor: pointer;
  min-height: 40px;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn.danger {
  border-color: rgba(214, 81, 43, 0.3);
  background: rgba(214, 81, 43, 0.08);
  color: var(--danger-strong);
}
.btn.ghost {
  border-color: transparent;
  background: none;
}
.switch {
  position: relative;
  border: none;
  width: 44px;
  height: 26px;
  border-radius: 99px;
  background: var(--track-bg);
  cursor: pointer;
  flex: none;
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s;
}
.knob.on {
  transform: translateX(18px);
}
.switch:has(.knob.on) {
  background: var(--purple);
}
.persona-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.persona {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 13px;
  border-radius: 11px;
  cursor: pointer;
}
.persona.active {
  border-color: var(--purple, #6c5ce7);
  background: var(--purple-soft);
  color: var(--purple);
  font-weight: 800;
}
.import-confirm {
  border-top: 1px solid var(--line-soft);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.danger-zone {
  border-color: rgba(214, 81, 43, 0.25);
}
</style>
