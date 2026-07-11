<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSiteConfigStore, CONFIGURABLE_COURSES } from '@/stores/siteConfig'
import { buildContentTree } from '@/lib/adminContentTree'
import { courses } from '@/data/courses'
import { listUsers, listCourseAccess, grantCourseAccess, revokeCourseAccess } from '@/lib/adminApi'

/**
 * Đợt 3 + 5 — Quản lý nội dung (docs/KE_HOACH_TRANG_ADMIN.md mục 4 & 5).
 *
 * Ba phần:
 *  A. Lớp phủ DB (sửa được, không cần deploy): chế độ hiển thị khóa + banner.
 *     Mỗi khóa: Hiện (public) · Ẩn (hidden) · Giới hạn (restricted).
 *  A′. Với khóa "Giới hạn": quản lý danh sách người được cấp quyền vào.
 *  B. Cây nội dung tĩnh (read-only): xem toàn cảnh Khóa → Tuần → Buổi. Nội dung
 *     lõi sửa qua file .md + PR (không sửa ở đây).
 */
const site = useSiteConfigStore()

// —— A. Cấu hình site ——
const MODES = [
  { value: 'public', label: 'Hiện', hint: 'Mọi người thấy & vào được' },
  { value: 'restricted', label: 'Giới hạn', hint: 'Chỉ người được cấp quyền' },
  { value: 'hidden', label: 'Ẩn', hint: 'Ẩn với tất cả' },
]
const courseName = Object.fromEntries(courses.map((c) => [c.id, c.name]))
const toggleCourses = ['java', 'ielts', 'comm', 'java-prep'].filter((id) => CONFIGURABLE_COURSES.includes(id))

// Bản nháp chế độ khóa, seed từ store (đã chuẩn hóa thành 'public'|'hidden'|'restricted').
const draftCourses = reactive(Object.fromEntries(toggleCourses.map((id) => [id, site.courseMode(id)])))
const draftBanner = reactive({ ...site.banner })

const savingCourses = ref(false)
const savingBanner = ref(false)
const msg = ref('')
const err = ref('')

const coursesDirty = computed(() => toggleCourses.some((id) => draftCourses[id] !== site.courseMode(id)))

async function saveCourses() {
  savingCourses.value = true
  msg.value = ''
  err.value = ''
  try {
    await site.setCourses({ ...draftCourses })
    msg.value = 'Đã lưu chế độ hiển thị khóa học. Thay đổi có hiệu lực ngay.'
    await refreshAccess()
  } catch (e) {
    err.value = e?.message || 'Lưu thất bại (cần quyền admin + cấu hình Supabase).'
  } finally {
    savingCourses.value = false
  }
}

// —— A′. Quản lý người được cấp quyền vào khóa "Giới hạn" ——
// Các khóa ĐÃ LƯU ở chế độ 'restricted' (grant/revoke áp dụng ngay, độc lập với
// nút "Lưu chế độ"). Đổi 1 khóa sang Giới hạn rồi bấm Lưu để hiện ô quản lý.
const restrictedCourses = computed(() => toggleCourses.filter((id) => site.courseMode(id) === 'restricted'))

const allUsers = ref([]) // danh sách tài khoản (để tìm theo email) — nạp 1 lần
const usersLoaded = ref(false)
const accessByCourse = reactive({}) // courseId -> [{ id, email, name, grantedAt }]
const searchByCourse = reactive({}) // courseId -> chuỗi tìm
const busyGrant = reactive({}) // `${courseId}:${userId}` -> bool
const accessErr = ref('')

const norm = (s) => (s || '').toString().toLowerCase()

async function ensureUsers() {
  if (usersLoaded.value) return
  const { users } = await listUsers()
  allUsers.value = users || []
  usersLoaded.value = true
}

/** Nạp (lại) danh sách người được cấp cho MỌI khóa đang ở chế độ Giới hạn. */
async function refreshAccess() {
  const ids = restrictedCourses.value
  if (!ids.length) return
  accessErr.value = ''
  try {
    await ensureUsers()
    for (const id of ids) {
      const { users } = await listCourseAccess(id)
      accessByCourse[id] = users || []
    }
  } catch (e) {
    accessErr.value = e?.message || 'Không tải được danh sách quyền khóa.'
  }
}
onMounted(refreshAccess)

/** Kết quả tìm cho 1 khóa: khớp email/tên, bỏ người đã được cấp, tối đa 8. */
function matchesFor(courseId) {
  const q = norm(searchByCourse[courseId]).trim()
  if (!q) return []
  const granted = new Set((accessByCourse[courseId] || []).map((u) => u.id))
  return allUsers.value
    .filter((u) => !granted.has(u.id) && (norm(u.email).includes(q) || norm(u.name).includes(q)))
    .slice(0, 8)
}

async function grant(courseId, user) {
  const key = `${courseId}:${user.id}`
  if (busyGrant[key]) return
  busyGrant[key] = true
  accessErr.value = ''
  try {
    await grantCourseAccess(user.id, courseId)
    const { users } = await listCourseAccess(courseId)
    accessByCourse[courseId] = users || []
    searchByCourse[courseId] = ''
  } catch (e) {
    accessErr.value = e?.message || 'Không cấp được quyền.'
  } finally {
    busyGrant[key] = false
  }
}

async function revoke(courseId, user) {
  const key = `${courseId}:${user.id}`
  if (busyGrant[key]) return
  busyGrant[key] = true
  accessErr.value = ''
  try {
    await revokeCourseAccess(user.id, courseId)
    accessByCourse[courseId] = (accessByCourse[courseId] || []).filter((u) => u.id !== user.id)
  } catch (e) {
    accessErr.value = e?.message || 'Không thu được quyền.'
  } finally {
    busyGrant[key] = false
  }
}

async function saveBanner() {
  savingBanner.value = true
  msg.value = ''
  err.value = ''
  try {
    await site.setBanner({ ...draftBanner })
    Object.assign(draftBanner, site.banner)
    msg.value = 'Đã lưu banner. Thay đổi có hiệu lực ngay.'
  } catch (e) {
    err.value = e?.message || 'Lưu thất bại (cần quyền admin + cấu hình Supabase).'
  } finally {
    savingBanner.value = false
  }
}

// —— B. Cây nội dung ——
const tree = buildContentTree()
const openCourse = reactive({}) // key -> bool
const openWeek = reactive({}) // "course:week" -> bool
const toggleCourse = (k) => (openCourse[k] = !openCourse[k])
const toggleWeek = (k) => (openWeek[k] = !openWeek[k])
</script>

<template>
  <div class="head">
    <h1 class="title">📚 Quản lý nội dung</h1>
    <p class="sub">
      Bật/tắt hiển thị khóa và đăng banner (lưu ở DB, có hiệu lực ngay). Nội dung lõi các khóa là
      file Markdown — xem cây bên dưới, sửa qua file + PR.
    </p>
  </div>

  <p v-if="err" class="notice err">⚠️ {{ err }}</p>
  <p v-if="msg" class="notice ok">✓ {{ msg }}</p>

  <!-- A. Lớp phủ DB -->
  <section class="card">
    <h2 class="sec">Chế độ hiển thị khóa học</h2>
    <p class="sec-sub">
      <b>Hiện</b>: mọi người thấy. <b>Ẩn</b>: ẩn khỏi thư viện & chặn truy cập cho tất cả.
      <b>Giới hạn</b>: chỉ admin và những người bạn cấp quyền (quản lý bên dưới) mới thấy & vào được.
    </p>
    <div class="modes">
      <div v-for="id in toggleCourses" :key="id" class="mode-row">
        <span class="tg-name">{{ courseName[id] || id }}</span>
        <div class="seg" role="radiogroup" :aria-label="courseName[id] || id">
          <button
            v-for="m in MODES"
            :key="m.value"
            type="button"
            class="seg-btn"
            :class="[m.value, { on: draftCourses[id] === m.value }]"
            :title="m.hint"
            role="radio"
            :aria-checked="draftCourses[id] === m.value"
            @click="draftCourses[id] = m.value"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
    </div>
    <div class="row-end">
      <button class="btn" :disabled="!coursesDirty || savingCourses" @click="saveCourses">
        {{ savingCourses ? 'Đang lưu…' : 'Lưu chế độ khóa' }}
      </button>
    </div>
  </section>

  <!-- A′. Người được cấp quyền vào khóa Giới hạn -->
  <section v-if="restrictedCourses.length" class="card">
    <h2 class="sec">Người được cấp quyền vào khóa Giới hạn</h2>
    <p class="sec-sub">
      Tìm người theo email hoặc tên rồi thêm vào danh sách. Thay đổi có hiệu lực ngay
      (không cần bấm “Lưu chế độ”).
    </p>
    <p v-if="accessErr" class="notice err mini">⚠️ {{ accessErr }}</p>

    <div v-for="id in restrictedCourses" :key="id" class="acc-course">
      <h3 class="acc-title">🔒 {{ courseName[id] || id }}</h3>

      <div class="acc-search">
        <input
          v-model="searchByCourse[id]"
          class="in"
          type="search"
          placeholder="Tìm email hoặc tên để cấp quyền…"
        />
        <ul v-if="matchesFor(id).length" class="acc-matches">
          <li v-for="u in matchesFor(id)" :key="u.id" class="acc-match">
            <span class="acc-u">
              <span class="acc-u-name">{{ u.name || '(không tên)' }}</span>
              <span class="acc-u-mail">{{ u.email }}</span>
            </span>
            <button class="btn sm" :disabled="busyGrant[`${id}:${u.id}`]" @click="grant(id, u)">+ Thêm</button>
          </li>
        </ul>
        <p v-else-if="(searchByCourse[id] || '').trim()" class="acc-empty">Không tìm thấy ai khớp.</p>
      </div>

      <ul v-if="(accessByCourse[id] || []).length" class="acc-granted">
        <li v-for="u in accessByCourse[id]" :key="u.id" class="acc-granted-row">
          <span class="acc-u">
            <span class="acc-u-name">{{ u.name || '(không tên)' }}</span>
            <span class="acc-u-mail">{{ u.email }}</span>
          </span>
          <button
            class="link danger"
            :disabled="busyGrant[`${id}:${u.id}`]"
            @click="revoke(id, u)"
          >
            Gỡ
          </button>
        </li>
      </ul>
      <p v-else class="acc-empty">Chưa cấp cho ai — khóa này hiện chỉ admin vào được.</p>
    </div>
  </section>

  <section class="card">
    <h2 class="sec">Banner thông báo</h2>
    <p class="sec-sub">Hiện một dải thông báo trên đầu mọi trang (thông tin hoặc bảo trì).</p>
    <div class="banner-form">
      <label class="chk">
        <input type="checkbox" v-model="draftBanner.enabled" />
        <span>Bật banner</span>
      </label>
      <label class="field">
        <span>Kiểu</span>
        <select v-model="draftBanner.tone" class="in">
          <option value="info">📣 Thông tin</option>
          <option value="warn">🛠️ Bảo trì / Cảnh báo</option>
        </select>
      </label>
      <label class="field grow">
        <span>Nội dung</span>
        <input v-model="draftBanner.text" class="in" type="text" maxlength="200" placeholder="VD: Hệ thống bảo trì 22:00–23:00 hôm nay." />
      </label>
    </div>
    <div v-if="draftBanner.enabled && draftBanner.text.trim()" class="preview" :class="draftBanner.tone">
      <span>{{ draftBanner.tone === 'warn' ? '🛠️' : '📣' }}</span>
      <span>{{ draftBanner.text }}</span>
    </div>
    <div class="row-end">
      <button class="btn" :disabled="savingBanner" @click="saveBanner">
        {{ savingBanner ? 'Đang lưu…' : 'Lưu banner' }}
      </button>
    </div>
  </section>

  <!-- Shadowing thuộc nhóm nội dung -->
  <RouterLink :to="{ name: 'admin-shadowing' }" class="card link-card">
    <div>
      <h2 class="sec plain">🎧 Nội dung Shadowing</h2>
      <p class="sec-sub">Thêm/sửa bài luyện shadowing (lưu ở DB như banner) — mở trình quản lý riêng.</p>
    </div>
    <span class="chev">→</span>
  </RouterLink>

  <!-- B. Cây nội dung tĩnh -->
  <section class="card">
    <h2 class="sec">Cây nội dung (chỉ xem)</h2>
    <p class="sec-sub">Nội dung lõi nằm ở file Markdown — sửa qua file + PR, không sửa trên giao diện.</p>

    <div class="tree">
      <div v-for="c in tree" :key="c.key" class="c-node">
        <button class="c-row" @click="toggleCourse(c.key)">
          <span class="tw">{{ openCourse[c.key] ? '▾' : '▸' }}</span>
          <span class="c-lbl">{{ c.label }}</span>
          <span class="c-meta">{{ c.totals.weeks }} tuần · {{ c.totals.days }} buổi</span>
          <code class="c-file">{{ c.file }}</code>
        </button>

        <div v-if="openCourse[c.key]" class="c-body">
          <div v-for="w in c.weeks" :key="w.num" class="w-node">
            <button class="w-row" @click="toggleWeek(`${c.key}:${w.num}`)">
              <span class="tw">{{ openWeek[`${c.key}:${w.num}`] ? '▾' : '▸' }}</span>
              <span class="w-num">Tuần {{ w.num }}</span>
              <span class="w-title">{{ w.title }}</span>
              <span v-for="b in w.badges" :key="b.label" class="badge">{{ b.n }} {{ b.label }}</span>
            </button>
            <ul v-if="openWeek[`${c.key}:${w.num}`]" class="d-list">
              <li v-for="d in w.days" :key="d.n" class="d-row">
                <span class="d-n">{{ d.emoji }} Buổi {{ d.n }}</span>
                <span class="d-title">{{ d.title }}</span>
                <span v-for="b in d.badges" :key="b.label" class="badge sm">{{ b.n }} {{ b.label }}</span>
              </li>
              <li v-if="!w.days.length" class="d-row muted">Không có buổi con.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: 18px;
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
.notice {
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
.card {
  background: var(--surface);
  border: 1.5px solid rgba(108, 92, 231, 0.12);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;
}
.sec {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
}
.sec.plain {
  margin: 0;
}
.sec-sub {
  font-size: 13px;
  color: var(--muted-2);
  margin: 4px 0 14px;
  line-height: 1.55;
}
.link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.link-card .sec-sub {
  margin-bottom: 0;
}
.chev {
  font-size: 22px;
  color: var(--purple);
  font-weight: 800;
}

/* chế độ khóa (segmented) */
.notice.mini {
  margin-bottom: 12px;
}
.modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mode-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid rgba(108, 92, 231, 0.14);
  border-radius: 12px;
  background: var(--surface-1);
}
.tg-name {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
  flex: 1;
  min-width: 160px;
}
.seg {
  display: inline-flex;
  border: 1.5px solid rgba(108, 92, 231, 0.2);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface);
}
.seg-btn {
  font-size: 13px;
  font-weight: 800;
  color: var(--muted-2);
  background: none;
  border: none;
  padding: 8px 14px;
  cursor: pointer;
  border-left: 1px solid rgba(108, 92, 231, 0.14);
}
.seg-btn:first-child {
  border-left: none;
}
.seg-btn.on.public {
  color: #fff;
  background: var(--text-success, #00a86f);
}
.seg-btn.on.restricted {
  color: #fff;
  background: #b26a00;
}
.seg-btn.on.hidden {
  color: #fff;
  background: var(--muted, #8a8aa3);
}

/* quản lý người được cấp quyền */
.acc-course {
  padding: 14px 0;
  border-top: 1px solid rgba(108, 92, 231, 0.1);
}
.acc-course:first-of-type {
  border-top: none;
  padding-top: 4px;
}
.acc-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 10px;
}
.acc-search {
  position: relative;
  max-width: 460px;
}
.acc-search .in {
  width: 100%;
}
.acc-matches {
  list-style: none;
  margin: 8px 0 0;
  padding: 6px;
  border: 1px solid rgba(108, 92, 231, 0.16);
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.acc-match,
.acc-granted-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 9px;
}
.acc-match:hover {
  background: var(--purple-soft);
}
.acc-granted {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 460px;
}
.acc-granted-row {
  border: 1px solid rgba(108, 92, 231, 0.1);
  background: var(--surface-1);
}
.acc-u {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.acc-u-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.acc-u-mail {
  font-size: 12px;
  color: var(--muted);
}
.acc-empty {
  font-size: 13px;
  color: var(--muted);
  margin-top: 10px;
}
.btn.sm {
  padding: 6px 12px;
  font-size: 13px;
}
.link {
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 800;
  color: var(--purple);
  cursor: pointer;
  padding: 4px 6px;
}
.link.danger {
  color: var(--text-danger);
}
.link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* banner form */
.banner-form {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}
.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.chk input {
  width: 18px;
  height: 18px;
  accent-color: var(--purple);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-2);
}
.field.grow {
  flex: 1;
  min-width: 240px;
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
.preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #fff;
  background: var(--grad-purple, var(--purple));
}
.preview.warn {
  background: linear-gradient(135deg, #f59000, #d6512b);
}
.row-end {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.btn {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: var(--grad-purple, var(--purple));
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* tree */
.tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.c-row,
.w-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  padding: 9px 6px;
  border-radius: 8px;
  color: var(--ink);
}
@media (hover: hover) {
  .c-row:hover,
  .w-row:hover {
    background: var(--purple-soft);
  }
}
.tw {
  font-size: 12px;
  color: var(--muted-2);
  width: 14px;
  flex: none;
}
.c-lbl {
  font-size: 15.5px;
  font-weight: 800;
}
.c-meta {
  font-size: 12px;
  color: var(--muted-2);
}
.c-file {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
  background: var(--chip-bg);
  padding: 2px 8px;
  border-radius: 7px;
}
.c-body {
  padding-left: 18px;
  border-left: 2px solid rgba(108, 92, 231, 0.1);
  margin-left: 12px;
}
.w-num {
  font-size: 13px;
  font-weight: 800;
  color: var(--purple);
  white-space: nowrap;
}
.w-title {
  font-size: 13.5px;
  color: var(--slate);
}
.d-list {
  list-style: none;
  margin: 0 0 6px;
  padding-left: 30px;
}
.d-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(108, 92, 231, 0.06);
  flex-wrap: wrap;
}
.d-n {
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}
.d-title {
  color: var(--muted);
}
.muted {
  color: var(--muted);
}
.badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.badge.sm {
  font-size: 10.5px;
  padding: 1px 7px;
}
</style>
