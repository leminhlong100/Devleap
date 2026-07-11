import { defineStore } from 'pinia'
import { supabase, isCloudEnabled } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import { useSiteConfigStore } from '@/stores/siteConfig'
import { flushPendingUploads } from '@/lib/recordingSync'

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

      // Ghi âm lỡ upload lỗi (offline) lúc trước — thử lại khi có mạng.
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          if (this.user) flushPendingUploads(this.user.id)
        })
      }
    },

    /** Đồng bộ trạng thái store theo session hiện tại. */
    async onSession(session) {
      const user = useUserStore()
      const site = useSiteConfigStore()
      if (session?.user) {
        const u = session.user
        this.user = {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
          // 'google' | 'email' — hiện ở trang Hồ sơ để biết đăng nhập bằng gì
          // (ẩn nút "Đổi mật khẩu" khi đăng nhập qua Google, vì không có mật khẩu để đổi).
          provider: u.app_metadata?.provider || 'email',
        }
        await user.pullAndMerge(u.id)
        await this.refreshAdmin(u.id)
        // Nạp quyền vào các khóa 'restricted' của chính user (cho router guard +
        // thư viện khóa). Đợi xong trước khi báo `ready` để guard quyết đúng.
        await site.loadMyAccess()
        flushPendingUploads(u.id)
      } else {
        this.user = null
        this.isAdmin = false
        site.clearMyAccess()
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

    /**
     * Đăng nhập bằng email + mật khẩu. Trả về { error } (chuỗi tiếng Việt) nếu
     * thất bại, hoặc { error: null } nếu thành công (onAuthStateChange sẽ lo phần
     * kéo/hợp nhất dữ liệu như OAuth). Không throw để UI tự hiển thị lỗi.
     */
    async signInWithPassword(email, password) {
      if (!isCloudEnabled) return { error: 'Chưa cấu hình đăng nhập.' }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      return { error: error ? authErrorMessage(error) : null }
    },

    /**
     * Đăng ký tài khoản mới bằng email + mật khẩu. Nếu dự án Supabase bật xác
     * nhận email, session sẽ là null và cần bấm link trong email trước khi đăng
     * nhập — trả về { needsConfirm: true } để UI báo cho người dùng.
     */
    async signUpWithPassword(email, password, name) {
      if (!isCloudEnabled) return { error: 'Chưa cấu hình đăng nhập.' }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: (name || '').trim() || email.trim().split('@')[0] },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) return { error: authErrorMessage(error) }
      // Không có session ngay => cần xác nhận email.
      return { error: null, needsConfirm: !data.session }
    },

    async signOut() {
      if (!isCloudEnabled) return
      await supabase.auth.signOut()
      // onAuthStateChange sẽ kích hoạt onSession(null) -> detachCloud()
    },

    /**
     * Gửi email đặt lại mật khẩu. Link trong email đưa người dùng về trang
     * /reset-password kèm token khôi phục; tại đó gọi updatePassword() để đổi.
     * Trả về { error } (tiếng Việt) hoặc { error: null } khi đã gửi.
     */
    async sendPasswordReset(email) {
      if (!isCloudEnabled) return { error: 'Chưa cấu hình đăng nhập.' }
      const clean = (email || '').trim()
      if (!clean) return { error: 'Vui lòng nhập email.' }
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error ? authErrorMessage(error) : null }
    },

    /**
     * Đặt mật khẩu mới. Chỉ chạy được khi đang có phiên khôi phục (người dùng vừa
     * bấm link trong email — Supabase tự tạo phiên tạm từ token trong URL).
     */
    async updatePassword(newPassword) {
      if (!isCloudEnabled) return { error: 'Chưa cấu hình đăng nhập.' }
      if (!newPassword || newPassword.length < 6)
        return { error: 'Mật khẩu quá ngắn (cần ít nhất 6 ký tự).' }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error: error ? authErrorMessage(error) : null }
    },

    /** Đổi tên hiển thị (trang Hồ sơ). Cập nhật cả `user_metadata` lẫn state tại chỗ. */
    async updateDisplayName(name) {
      if (!isCloudEnabled) return { error: 'Chưa cấu hình đăng nhập.' }
      const clean = (name || '').trim()
      if (!clean) return { error: 'Vui lòng nhập tên hiển thị.' }
      const { error } = await supabase.auth.updateUser({ data: { full_name: clean } })
      if (error) return { error: authErrorMessage(error) }
      if (this.user) this.user = { ...this.user, name: clean }
      return { error: null }
    },
  },
})

/** Chuyển thông báo lỗi Supabase Auth sang tiếng Việt gần gũi. */
function authErrorMessage(error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login')) return 'Email hoặc mật khẩu không đúng.'
  if (msg.includes('email not confirmed')) return 'Email chưa được xác nhận — hãy kiểm tra hộp thư.'
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Email này đã có tài khoản — hãy đăng nhập.'
  if (msg.includes('password') && msg.includes('at least'))
    return 'Mật khẩu quá ngắn (cần ít nhất 6 ký tự).'
  if (msg.includes('unable to validate email') || msg.includes('invalid email'))
    return 'Email không hợp lệ.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Bạn thử quá nhiều lần — vui lòng đợi một lát.'
  return error?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
}
