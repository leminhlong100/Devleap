<script setup>
import { computed } from 'vue'
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

function close() {
  const q = { ...route.query }
  delete q.login
  delete q.redirect
  router.replace({ query: q })
}

async function signIn() {
  await auth.signInWithGoogle()
}
</script>

<template>
  <Transition name="gate-fade">
    <div v-if="open" class="gate" @click.self="close">
      <div class="gate-card">
        <button class="gate-close" aria-label="Đóng" @click="close">✕</button>
        <MascotLogo :width="76" :height="81" uid="gate" />
        <h2 class="gate-title">Đăng nhập để vào học</h2>
        <p class="gate-sub">
          Các khóa học chỉ dành cho thành viên đã đăng nhập — để lưu tiến độ, streak và đồng bộ trên
          mọi thiết bị.
        </p>
        <button class="gate-btn tappable" @click="signIn">
          <span class="g">G</span> Đăng nhập / Đăng ký với Google
        </button>
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
  margin: 12px 0 24px;
}
.gate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  border: none;
  cursor: pointer;
  font-size: 15.5px;
  font-weight: 700;
  color: #fff;
  padding: 14px 20px;
  border-radius: 14px;
  background: var(--grad-purple);
  box-shadow: 0 12px 26px rgba(108, 92, 231, 0.34);
  transition: transform 0.15s;
}
@media (hover: hover) {
  .gate-btn:hover {
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
.gate-fade-enter-active,
.gate-fade-leave-active {
  transition: opacity 0.2s ease;
}
.gate-fade-enter-from,
.gate-fade-leave-to {
  opacity: 0;
}
</style>
