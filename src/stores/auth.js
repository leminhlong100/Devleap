import { defineStore } from 'pinia'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'

/**
 * Phiên đăng nhập (Supabase Auth + Google OAuth).
 *
 * Giữ thông tin user hiện tại và điều phối đồng bộ tiến độ: khi đăng nhập thì
 * gọi userStore.pullAndMerge() để kéo dữ liệu cloud + hợp nhất tiến độ khách;
 * khi đăng xuất thì tách store về chế độ khách.
 *
 * Nếu chưa cấu hình Supabase (isCloudEnabled = false) thì mọi action là no-op,
 * app chạy ở chế độ khách như cũ.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, email, name, avatar } hoặc null
    ready: false, // đã kiểm tra phiên ban đầu xong chưa
    isAdmin: false, // user hiện tại có dòng trong bảng admins không
  }),

  getters: {
    isAuthed: (s) => !!s.user,
    cloudEnabled: () => isCloudEnabled,
  },

  actions: {
    /** Gọi 1 lần khi khởi động app: kiểm tra phiên sẵn có & lắng nghe thay đổi. */
    async init() {
      if (!isCloudEnabled) {
        this.ready = true
        return
      }
      const { data } = await supabase.auth.getSession()
      await this.onSession(data.session)
      this.ready = true

      supabase.auth.onAuthStateChange((_event, session) => {
        this.onSession(session)
      })
    },

    /** Đồng bộ trạng thái store theo session hiện tại. */
    async onSession(session) {
      const user = useUserStore()
      if (session?.user) {
        const u = session.user
        this.user = {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        }
        await user.pullAndMerge(u.id)
        await this.refreshAdmin(u.id)
      } else {
        this.user = null
        this.isAdmin = false
        user.detachCloud()
      }
    },

    /** Kiểm tra user có phải admin (có dòng trong bảng admins). RLS chỉ cho đọc dòng của chính mình. */
    async refreshAdmin(userId) {
      if (!isCloudEnabled) {
        this.isAdmin = false
        return
      }
      try {
        const { data } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle()
        this.isAdmin = !!data
      } catch {
        this.isAdmin = false
      }
    },

    async signInWithGoogle() {
      if (!isCloudEnabled) return
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
    },

    async signOut() {
      if (!isCloudEnabled) return
      await supabase.auth.signOut()
      // onAuthStateChange sẽ kích hoạt onSession(null) -> detachCloud()
    },
  },
})
