<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import MascotLogo from '@/components/common/MascotLogo.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { user: authUser, ready: authReady } = storeToRefs(auth)

// Hiện hộp đăng nhập khi guard đẩy về trang chủ kèm ?login=required và vẫn chưa đăng nhập.
const open = computed(
  () => route.query.login === 'required' && auth.cloudEnabled && authReady.value && !authUser.value,
)

// —— form email/mật khẩu ——
const mode = ref('signin') // 'signin' | 'signup' | 'forgot'
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const info = ref('') // thông báo tích cực (vd cần xác nhận email)

// Reset trạng thái form mỗi khi mở lại hộp.
watch(open, (v) => {
  if (v) {
    mode.value = 'signin'
    name.value = ''
    email.value = ''
    password.value = ''
    error.value = ''
    info.value = ''
    busy.value = false
  }
})

function switchMode(m) {
  mode.value = m
  error.value = ''
  info.value = ''
}

function close() {
  const q = { ...route.query }
  delete q.login
  delete q.redirect
  router.replace({ query: q })
}

async function submitPassword() {
  if (busy.value) return
  error.value = ''
  info.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Vui lòng nhập email và mật khẩu.'
    return
  }
  busy.value = true
  try {
    if (mode.value === 'signup') {
      const res = await auth.signUpWithPassword(email.value, password.value, name.value)
      if (res.error) {
        error.value = res.error
      } else if (res.needsConfirm) {
        info.value = 'Đã gửi email xác nhận — hãy mở hộp thư và bấm vào liên kết để kích hoạt.'
      }
      // Nếu không cần xác nhận, onAuthStateChange sẽ đóng hộp (open = false).
    } else {
      const res = await auth.signInWithPassword(email.value, password.value)
      if (res.error) error.value = res.error
    }
  } finally {
    busy.value = false
  }
}

async function submitForgot() {
  if (busy.value) return
  error.value = ''
  info.value = ''
  if (!email.value.trim()) {
    error.value = 'Vui lòng nhập email để nhận liên kết đặt lại.'
    return
  }
  busy.value = true
  try {
    const res = await auth.sendPasswordReset(email.value)
    if (res.error) {
      error.value = res.error
    } else {
      info.value = 'Đã gửi email đặt lại mật khẩu — hãy mở hộp thư và bấm vào liên kết.'
    }
  } finally {
    busy.value = false
  }
}

async function signInGoogle() {
  await auth.signInWithGoogle()
}
</script>

<template>
  <Transition name="gate-fade">
    <div v-if="open" class="gate" @click.self="close">
      <div class="gate-card">
        <button class="gate-close" aria-label="Đóng" @click="close">✕</button>
        <MascotLogo :width="76" :height="81" uid="gate" />
        <h2 class="gate-title">
          {{ mode === 'forgot' ? 'Quên mật khẩu?' : mode === 'signup' ? 'Tạo tài khoản mới' : 'Đăng nhập để vào học' }}
        </h2>
        <p class="gate-sub">
          <template v-if="mode === 'forgot'">
            Nhập email tài khoản — chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.
          </template>
          <template v-else>
            Các khóa học chỉ dành cho thành viên đã đăng nhập — để lưu tiến độ, streak và đồng bộ
            trên mọi thiết bị.
          </template>
        </p>

        <!-- Chuyển giữa Đăng nhập / Đăng ký -->
        <div v-if="mode !== 'forgot'" class="gate-tabs" role="tablist">
          <button
            class="gate-tab"
            :class="{ active: mode === 'signin' }"
            role="tab"
            :aria-selected="mode === 'signin'"
            @click="switchMode('signin')"
          >
            Đăng nhập
          </button>
          <button
            class="gate-tab"
            :class="{ active: mode === 'signup' }"
            role="tab"
            :aria-selected="mode === 'signup'"
            @click="switchMode('signup')"
          >
            Đăng ký
          </button>
        </div>

        <!-- Form Quên mật khẩu -->
        <form v-if="mode === 'forgot'" class="gate-form" @submit.prevent="submitForgot">
          <input
            v-model="email"
            class="gate-input"
            type="email"
            autocomplete="email"
            placeholder="Email"
            required
          />
          <p v-if="error" class="gate-error">{{ error }}</p>
          <p v-if="info" class="gate-info">{{ info }}</p>
          <button class="gate-btn primary tappable" type="submit" :disabled="busy">
            {{ busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại' }}
          </button>
          <button class="gate-link-btn" type="button" @click="switchMode('signin')">
            ← Quay lại đăng nhập
          </button>
        </form>

        <!-- Form Đăng nhập / Đăng ký -->
        <form v-else class="gate-form" @submit.prevent="submitPassword">
          <input
            v-if="mode === 'signup'"
            v-model="name"
            class="gate-input"
            type="text"
            autocomplete="name"
            placeholder="Tên hiển thị (tùy chọn)"
          />
          <input
            v-model="email"
            class="gate-input"
            type="email"
            autocomplete="email"
            placeholder="Email"
            required
          />
          <input
            v-model="password"
            class="gate-input"
            type="password"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            placeholder="Mật khẩu"
            minlength="6"
            required
          />

          <button
            v-if="mode === 'signin'"
            class="gate-link-btn forgot"
            type="button"
            @click="switchMode('forgot')"
          >
            Quên mật khẩu?
          </button>

          <p v-if="error" class="gate-error">{{ error }}</p>
          <p v-if="info" class="gate-info">{{ info }}</p>

          <button class="gate-btn primary tappable" type="submit" :disabled="busy">
            {{ busy ? 'Đang xử lý…' : mode === 'signup' ? 'Đăng ký' : 'Đăng nhập' }}
          </button>
        </form>

        <template v-if="mode !== 'forgot'">
          <div class="gate-or"><span>hoặc</span></div>

          <button class="gate-btn tappable" @click="signInGoogle">
            <span class="g">G</span> Tiếp tục với Google
          </button>
        </template>
        <button class="gate-later" @click="close">Để sau</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.gate {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(30, 30, 46, 0.5);
  backdrop-filter: blur(6px);
}
.gate-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border-radius: 24px;
  padding: 34px 30px 26px;
  text-align: center;
  box-shadow: 0 30px 70px rgba(30, 30, 46, 0.32);
}
.gate-close {
  position: absolute;
  top: 14px;
  right: 16px;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--muted-2);
  cursor: pointer;
  line-height: 1;
  padding: 6px;
}
.gate-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 14px 0 0;
}
.gate-sub {
  font-size: 15px;
  line-height: 1.6;
  color: var(--slate);
  margin: 12px 0 18px;
}
.gate-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: var(--surface-2, rgba(108, 92, 231, 0.08));
  border-radius: 12px;
  margin-bottom: 16px;
}
.gate-tab {
  flex: 1;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--slate);
  padding: 9px 0;
  border-radius: 9px;
  transition: all 0.15s;
}
.gate-tab.active {
  background: var(--surface);
  color: var(--text, inherit);
  box-shadow: 0 2px 8px rgba(30, 30, 46, 0.12);
}
.gate-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.gate-input {
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
.gate-input:focus {
  border-color: var(--purple, #6c5ce7);
}
.gate-error {
  margin: 2px 0 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #e74c3c;
  text-align: left;
}
.gate-info {
  margin: 2px 0 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #16a34a;
  text-align: left;
}
.gate-or {
  position: relative;
  text-align: center;
  margin: 18px 0 14px;
}
.gate-or::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--line);
}
.gate-or span {
  position: relative;
  background: var(--surface);
  padding: 0 12px;
  font-size: 13px;
  color: var(--muted-2);
}
.gate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  cursor: pointer;
  font-size: 15.5px;
  font-weight: 700;
  padding: 14px 20px;
  border-radius: 14px;
  transition: transform 0.15s;
}
.gate-btn.primary {
  border: none;
  color: #fff;
  background: var(--grad-purple);
  box-shadow: 0 12px 26px rgba(108, 92, 231, 0.34);
  margin-top: 4px;
}
.gate-btn:not(.primary) {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: inherit;
}
.gate-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
@media (hover: hover) {
  .gate-btn:not(:disabled):hover {
    transform: translateY(-2px);
  }
}
.gate-btn .g {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  color: #4285f4;
  font-weight: 900;
  font-size: 14px;
}
.gate-later {
  display: block;
  margin: 14px auto 0;
  border: none;
  background: none;
  color: var(--muted-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.gate-link-btn {
  border: none;
  background: none;
  color: var(--purple, #6c5ce7);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 2px;
}
.gate-link-btn.forgot {
  align-self: flex-end;
  margin-top: -2px;
}
.gate-fade-enter-active,
.gate-fade-leave-active {
  transition: opacity 0.2s ease;
}
.gate-fade-enter-from,
.gate-fade-leave-to {
  opacity: 0;
}
</style>
