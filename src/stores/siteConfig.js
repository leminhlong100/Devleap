import { defineStore } from 'pinia'
import { fetchSiteConfig, saveSiteConfig, fetchMyCourseAccess } from '@/lib/siteConfigRepo'

/**
 * Cấu hình site (lớp phủ DB) — Đợt 3, docs/KE_HOACH_TRANG_ADMIN.md mục 4.2 & 5.
 *
 * Nạp 1 lần lúc khởi động (main.js) để: đặt chế độ hiển thị từng khóa và hiện
 * banner thông báo/bảo trì trên trang. Nguồn ghi là /admin/content (qua
 * siteConfigRepo, RLS `is_admin()`); mọi client khác chỉ đọc.
 *
 * Mỗi khóa có MỘT trong ba chế độ (Đợt 5 — khóa riêng theo người):
 *   - 'public'     : mọi người thấy & vào được (mặc định).
 *   - 'hidden'     : ẩn với tất cả.
 *   - 'restricted' : chỉ admin + những người được cấp quyền (bảng course_access).
 *
 * An toàn khi CHƯA cấu hình cloud hoặc lỗi mạng: giữ MẶC ĐỊNH (mọi khóa 'public',
 * banner tắt) để app không bao giờ "khóa nhầm" nội dung của người học.
 */

// Các khóa có thể cấu hình chế độ (khớp id trong data/courses.js).
export const CONFIGURABLE_COURSES = ['java', 'java-prep', 'ielts', 'comm']

/** Các chế độ hiển thị hợp lệ của một khóa. */
export const COURSE_MODES = ['public', 'hidden', 'restricted']

/**
 * Chuẩn hóa 1 giá trị chế độ khóa (tương thích ngược với dữ liệu cũ dạng
 * boolean: `true` -> 'public', `false` -> 'hidden'). Giá trị lạ -> 'public'.
 */
export function normalizeMode(v) {
  if (v === false) return 'hidden'
  if (v === true || v == null) return 'public'
  return COURSE_MODES.includes(v) ? v : 'public'
}

/** Cấu hình mặc định — dùng khi thiếu dòng DB / chưa cấu hình cloud. */
export function defaultConfig() {
  return {
    courses: Object.fromEntries(CONFIGURABLE_COURSES.map((id) => [id, 'public'])),
    banner: { enabled: false, text: '', tone: 'info' }, // tone: 'info' | 'warn'
  }
}

/** Trộn map raw từ DB lên mặc định (chỉ nhận field hợp lệ, bỏ rác). */
export function normalizeConfig(raw = {}) {
  const base = defaultConfig()
  raw = raw && typeof raw === 'object' ? raw : {}
  const c = raw.courses && typeof raw.courses === 'object' ? raw.courses : {}
  for (const id of CONFIGURABLE_COURSES) if (id in c) base.courses[id] = normalizeMode(c[id])
  const b = raw.banner && typeof raw.banner === 'object' ? raw.banner : {}
  base.banner = {
    enabled: !!b.enabled,
    text: typeof b.text === 'string' ? b.text : '',
    tone: b.tone === 'warn' ? 'warn' : 'info',
  }
  return base
}

export const useSiteConfigStore = defineStore('siteConfig', {
  state: () => ({
    ...defaultConfig(),
    // Danh sách id khóa 'restricted' mà NGƯỜI DÙNG HIỆN TẠI được cấp quyền vào
    // (đọc từ bảng course_access — RLS chỉ trả dòng của chính mình).
    myAccess: [],
    loaded: false, // đã cố nạp cấu hình chế độ khóa từ DB xong chưa (thành/bại đều bật)
  }),

  getters: {
    /** Chế độ hiển thị của một khóa ('public' | 'hidden' | 'restricted'). */
    courseMode: (s) => (id) => normalizeMode(s.courses[id]),
    /**
     * Khóa có XUẤT HIỆN trong thư viện khóa học không (chỉ 'hidden' mới ẩn hẳn).
     * Khóa 'restricted' vẫn hiện — chỉ chặn ĐĂNG KÝ/vào học ở `courseEnabled`.
     */
    courseVisible: (s) => (id) => normalizeMode(s.courses[id]) !== 'hidden',
    /**
     * Người dùng có được thấy/vào khóa này không.
     *  - 'public'     : luôn được.
     *  - 'hidden'     : không bao giờ.
     *  - 'restricted' : chỉ admin hoặc người có trong danh sách được cấp.
     * @param {string} id      id khóa
     * @param {boolean} isAdmin admin luôn xem được mọi khóa (kiểm tra ở call site)
     */
    courseEnabled: (s) => (id, isAdmin = false) => {
      const mode = normalizeMode(s.courses[id])
      if (mode === 'hidden') return false
      if (mode === 'restricted') return !!isAdmin || s.myAccess.includes(id)
      return true
    },
    /** Banner đang hiển thị (enabled + có chữ) hay không. */
    bannerActive: (s) => s.banner.enabled && !!s.banner.text.trim(),
  },

  actions: {
    /** Nạp cấu hình từ DB, áp lên state. Nuốt lỗi → giữ mặc định. */
    async load() {
      try {
        const raw = await fetchSiteConfig()
        const cfg = normalizeConfig(raw)
        this.courses = cfg.courses
        this.banner = cfg.banner
      } catch {
        /* giữ mặc định */
      } finally {
        this.loaded = true
      }
    },

    /** Nạp danh sách khóa 'restricted' mà user hiện tại được cấp. Nuốt lỗi → rỗng. */
    async loadMyAccess() {
      try {
        this.myAccess = await fetchMyCourseAccess()
      } catch {
        this.myAccess = []
      }
    },

    /** Xóa quyền cục bộ khi đăng xuất/chuyển sang khách. */
    clearMyAccess() {
      this.myAccess = []
    },

    /** (Admin) Lưu chế độ hiển thị các khóa rồi áp ngay vào state. */
    async setCourses(courses) {
      const value = { ...this.courses }
      for (const [id, mode] of Object.entries(courses)) value[id] = normalizeMode(mode)
      await saveSiteConfig('courses', value)
      this.courses = value
    },

    /** (Admin) Lưu banner rồi áp ngay vào state. */
    async setBanner(banner) {
      const value = {
        enabled: !!banner.enabled,
        text: (banner.text || '').trim(),
        tone: banner.tone === 'warn' ? 'warn' : 'info',
      }
      await saveSiteConfig('banner', value)
      this.banner = value
    },
  },
})
