import { defineStore } from 'pinia'
import * as progress from './user/progressSlice'
import * as srsSlice from './user/srsSlice'
import * as quizSlice from './user/quizSlice'
import * as missionSlice from './user/missionSlice'
import * as vocabSlice from './user/vocabSlice'
import * as writingSlice from './user/writingSlice'
import * as speakingSlice from './user/speakingSlice'
import * as localPrefs from './user/localPrefsSlice'
import * as sync from './user/syncSupabase'

/**
 * Trạng thái người học (gamification) — nguồn sự thật duy nhất cho tiến độ thật.
 *
 * Lưu danh sách ngày đã hoàn thành theo từng khóa (`completed.java`,
 * `completed.ielts`), từ đó suy ra: mở khóa tuần kế, streak, XP, huy hiệu.
 * Cấu trúc tuần/ngày (số ngày mỗi tuần) sống ở tầng dữ liệu khóa học
 * (`data/course.js`, `data/courseIelts.js`) để store không phải kéo các chunk
 * Markdown nặng — view truyền `totalDays` vào khi cần tính hoàn thành tuần.
 *
 * Lưu trữ 2 lớp:
 *  - localStorage: cache tức thì, hoạt động offline & ở chế độ khách.
 *  - Supabase (bảng `progress`): đồng bộ đa thiết bị khi đã đăng nhập.
 * Khi đăng nhập lần đầu, tiến độ khách được hợp nhất vào tài khoản (xem
 * `pullAndMerge` trong `user/syncSupabase.js`). Mọi thay đổi sau đó vừa ghi
 * localStorage vừa đẩy lên cloud (có debounce) qua `persist()`.
 *
 * File này chỉ còn vai trò COMPOSE: mỗi mảng tiến độ (SRS, quiz, mission, từ
 * vựng đã lưu, bài viết, nhật ký nói, tùy chọn local, đồng bộ cloud) sống
 * trong `src/stores/user/*.js` riêng, có state/getters/actions/pick/
 * applyDefaults (và hàm merge nếu có đồng bộ cloud) độc lập, dễ test. Store
 * vẫn là MỘT Pinia store duy nhất — `useUserStore()` giữ nguyên API cũ.
 */
const STORAGE_KEY = 'devleap:user:v2'

export const useUserStore = defineStore('user', {
  state: () => ({
    ...progress.state(),
    ...srsSlice.state(),
    ...quizSlice.state(),
    ...missionSlice.state(),
    ...vocabSlice.state(),
    ...writingSlice.state(),
    ...speakingSlice.state(),
    ...localPrefs.state(),
    ...sync.state(),
  }),

  getters: {
    ...progress.getters,
    ...srsSlice.getters,
    ...quizSlice.getters,
    ...missionSlice.getters,
    ...vocabSlice.getters,
    ...writingSlice.getters,
    ...speakingSlice.getters,
  },

  actions: {
    ...progress.actions,
    ...srsSlice.actions,
    ...quizSlice.actions,
    ...missionSlice.actions,
    ...vocabSlice.actions,
    ...writingSlice.actions,
    ...speakingSlice.actions,
    ...localPrefs.actions,
    ...sync.actions,

    // ——————————————————————— lưu trữ ———————————————————————

    /** Ảnh chụp phần dữ liệu cần bền hoá (không gồm trạng thái sync/tùy chọn local). */
    snapshot() {
      return {
        ...progress.pick(this),
        ...srsSlice.pick(this),
        ...quizSlice.pick(this),
        ...missionSlice.pick(this),
        ...vocabSlice.pick(this),
        ...writingSlice.pick(this),
        ...speakingSlice.pick(this),
      }
    },

    /** Áp một snapshot vào state (đảm bảo shape khóa học luôn đầy đủ). */
    applySnapshot(s = {}) {
      Object.assign(this, progress.applyDefaults(s))
      Object.assign(this, srsSlice.applyDefaults(s))
      Object.assign(this, quizSlice.applyDefaults(s))
      Object.assign(this, missionSlice.applyDefaults(s))
      Object.assign(this, vocabSlice.applyDefaults(s))
      Object.assign(this, writingSlice.applyDefaults(s))
      Object.assign(this, speakingSlice.applyDefaults(s))
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot()))
      } catch {
        /* ignore */
      }
      // Đã đăng nhập -> đẩy lên cloud (gộp nhiều thay đổi liên tiếp thành 1 lần).
      if (this.cloudUserId) this.schedulePush()
    },

    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) this.applySnapshot(JSON.parse(raw))
      } catch {
        /* ignore */
      }
      // Nạp tùy chọn hội thoại (local-only).
      this.loadConvoPrefs()
    },
  },
})
