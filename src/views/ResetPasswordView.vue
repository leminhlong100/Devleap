<script setup>
/**
 * Trang đặt lại mật khẩu — đích đến của link trong email "Quên mật khẩu?".
 *
 * Supabase (detectSessionInUrl) tự đọc token khôi phục trong URL khi app khởi
 * động và tạo một phiên tạm; nhờ đó updatePassword() đổi được mật khẩu. Nếu vào
 * trang này mà không có phiên (link hết hạn / mở trực tiếp), ta hướng dẫn gửi lại.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import MascotLogo from '@/components/common/MascotLogo.vue'

const router = useRouter()
const auth = useAuthStore()
const { user: authUser, ready: authReady } = storeToRefs(auth)

const password = ref('')
const confirm = ref('')
const busy = ref(false)
const error = ref('')
const done = ref(false)

// Có phiên khôi phục hay không: đã kiểm tra phiên xong (ready) và đang đăng nhập.
const hasSession = computed(() => authReady.value && !!authUser.value)

async function submit() {
  if (busy.value) return
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Mật khẩu quá ngắn (cần ít nhất 6 ký tự).'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Hai lần nhập mật khẩu chưa khớp.'
    return
  }
  busy.value = true
  try {
    const res = await auth.updatePassword(password.value)
    if (res.error) {
      error.value = res.error
    } else {
      done.value = true
    }
  } finally {
    busy.value = false
  }
}

function goHome() {
  router.replace({ name: 'home' })
}
</script>

<template>
  <div class="container page">
    <div class="card">
      <MascotLogo :width="72" :height="77" uid="reset" />

      <template v-if="!auth.cloudEnabled">
        <h1 class="title">Chưa bật đăng nhập</h1>
        <p class="sub">Tính năng đặt lại mật khẩu cần cấu hình tài khoản đám mây.</p>
        <button class="btn primary" @click="goHome">Về trang chủ</button>
      </template>

      <template v-else-if="done">
        <h1 class="title">Đã đổi mật khẩu ✅</h1>
        <p class="sub">Mật khẩu mới đã được lưu. Bạn đang được đăng nhập — vào học tiếp thôi!</p>
        <button class="btn primary" @click="goHome">Bắt đầu học →</button>
      </template>

      <template v-else-if="!authReady">
        <h1 class="title">Đang kiểm tra liên kết…</h1>
        <p class="sub">Vui lòng đợi một chút.</p>
      </template>

      <template v-else-if="!hasSession">
        <h1 class="title">Liên kết không hợp lệ</h1>
        <p class="sub">
          Liên kết đặt lại mật khẩu có thể đã hết hạn hoặc đã dùng rồi. Hãy quay lại và yêu cầu gửi
          lại email đặt lại mật khẩu.
        </p>
        <button class="btn primary" @click="goHome">Về trang chủ</button>
      </template>

      <template v-else>
        <h1 class="title">Đặt mật khẩu mới</h1>
        <p class="sub">Nhập mật khẩu mới cho tài khoản của bạn.</p>
        <form class="form" @submit.prevent="submit">
          <input
            v-model="password"
            class="input"
            type="password"
            autocomplete="new-password"
            placeholder="Mật khẩu mới"
            minlength="6"
            required
          />
          <input
            v-model="confirm"
            class="input"
            type="password"
            autocomplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            minlength="6"
            required
          />
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary" type="submit" :disabled="busy">
            {{ busy ? 'Đang lưu…' : 'Lưu mật khẩu mới' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 48px 20px 70px;
  display: flex;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 24px;
  padding: 34px 30px 30px;
  box-shadow: 0 16px 40px rgba(108, 92, 231, 0.1);
}
.title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 14px 0 0;
}
.sub {
  font-size: 15px;
  line-height: 1.6;
  color: var(--slate);
  margin: 12px 0 20px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.input {
  width: 100%;
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: inherit;
  font-size: 15px;
  padding: 12px 14px;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus {
  border-color: var(--purple, #6c5ce7);
}
.err {
  margin: 2px 0 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #e74c3c;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  cursor: pointer;
  font-size: 15.5px;
  font-weight: 700;
  padding: 14px 20px;
  border-radius: 14px;
  border: none;
  margin-top: 6px;
  min-height: 44px;
  transition: transform 0.15s;
}
.btn.primary {
  color: #fff;
  background: var(--grad-purple);
  box-shadow: 0 12px 26px rgba(108, 92, 231, 0.34);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn:active {
  transform: scale(0.98);
}
</style>
