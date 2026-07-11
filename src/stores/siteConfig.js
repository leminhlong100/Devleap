import { defineStore } from 'pinia'
import { fetchSiteConfig, saveSiteConfig } from '@/lib/siteConfigRepo'

/**
 * Cấu hình site (lớp phủ DB) — Đợt 3, docs/KE_HOACH_TRANG_ADMIN.md mục 4.2.
 *
 * Nạp 1 lần lúc khởi động (main.js) để: bật/tắt hiển thị từng khóa và hiện banner
 * thông báo/bảo trì trên trang. Nguồn ghi là /admin/content (qua siteConfigRepo,
 * RLS `is_admin()`); mọi client khác chỉ đọc.
 *
 * An toàn khi CHƯA cấu hình cloud hoặc lỗi mạng: giữ MẶC ĐỊNH (mọi khóa bật,
 * banner tắt) để app không bao giờ "khóa nhầm" nội dung của người học.
 */

// Các khóa có thể bật/tắt (khớp id trong data/courses.js).
export const CONFIGURABLE_COURSES = ['java', 'java-prep', 'ielts', 'comm']

/** Cấu hình mặc định — dùng khi thiếu dòng DB / chưa cấu hình cloud. */
export function defaultConfig() {
  return {
    courses: Object.fromEntries(CONFIGURABLE_COURSES.map((id) => [id, true])),
    banner: { enabled: false, text: '', tone: 'info' }, // tone: 'info' | 'warn'
  }
}

/** Trộn map raw từ DB lên mặc định (chỉ nhận field hợp lệ, bỏ rác). */
export function normalizeConfig(raw = {}) {
  const base = defaultConfig()
  raw = raw && typeof raw === 'object' ? raw : {}
  const c = raw.courses && typeof raw.courses === 'object' ? raw.courses : {}
  for (const id of CONFIGURABLE_COURSES) if (id in c) base.courses[id] = c[id] !== false
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
    loaded: false, // đã cố nạp từ DB xong chưa (thành công hay lỗi đều bật)
  }),

  getters: {
    /** Khóa có được bật hiển thị không (mặc định bật nếu không rõ). */
    courseEnabled: (s) => (id) => s.courses[id] !== false,
    /** Banner đang hiển thị (enabled + có chữ) hay không. */
    bannerActive: (s) => s.banner.enabled && !!s.banner.text.trim(),
  },

  actions: {
    /** Nạp cấu hình từ DB, áp lên state. Nuốt lỗi → giữ mặc định. */
    async load() {
      try {
        const raw = await fetchSiteConfig()
        Object.assign(this, normalizeConfig(raw))
      } catch {
        /* giữ mặc định */
      } finally {
        this.loaded = true
      }
    },

    /** (Admin) Lưu bật/tắt các khóa rồi áp ngay vào state. */
    async setCourses(courses) {
      const value = { ...this.courses, ...courses }
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
