<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import MascotLogo from '@/components/common/MascotLogo.vue'
import GlobalSearch from '@/components/search/GlobalSearch.vue'

const route = useRoute()
const user = useUserStore()
const auth = useAuthStore()
const { xp, streak, level, xpPct, syncStatus } = storeToRefs(user)
const { user: authUser, ready: authReady } = storeToRefs(auth)

const nav = [
  { name: 'Trang chủ', to: { name: 'home' }, match: ['home'] },
  { name: 'Khóa học', to: { name: 'courses' }, match: ['courses', 'java', 'ielts', 'java-day', 'ielts-day'] },
  { name: 'Shadowing', to: { name: 'shadowing' }, match: ['shadowing'] },
  { name: 'Công cụ', to: { name: 'tools' }, match: ['tools', 'tools-tab'] },
]

const activeKey = computed(() => route.name)
const isActive = (item) => item.match.includes(activeKey.value)

// Trạng thái đồng bộ -> nhãn ngắn cạnh avatar khi đã đăng nhập.
const syncLabel = computed(
  () => ({ syncing: '↻ Đang đồng bộ', synced: '☁️ Đã đồng bộ', error: '⚠️ Lỗi đồng bộ' })[syncStatus.value] || '',
)

const menuOpen = ref(false)
async function signIn() {
  await auth.signInWithGoogle()
}
async function signOut() {
  menuOpen.value = false
  await auth.signOut()
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'home' }" class="logo">
        <MascotLogo :width="44" :height="47" uid="hdr" />
        <span class="logo-text">Dev<span class="brand-text">leap</span></span>
      </RouterLink>

      <nav class="nav">
        <RouterLink
          v-for="item in nav"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item) }"
        >
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="header-right">
        <GlobalSearch />

        <!-- Tiến độ/gamification chỉ hiện khi đã đăng nhập thành công -->
        <template v-if="authUser">
          <div class="streak" title="Chuỗi ngày học">
            <span class="streak-icon">🔥</span>{{ streak }}
          </div>
          <div class="xp-chip">
            <div class="xp-info">
              <div class="xp-top">
                <span class="lv">Lv.{{ level }}</span>
                <span class="xp-num">{{ xp }} XP</span>
              </div>
              <div class="xp-track"><div class="xp-fill" :style="{ width: xpPct + '%' }"></div></div>
            </div>
            <div class="avatar">🧑‍💻</div>
          </div>
        </template>

        <!-- Khu đăng nhập (chỉ hiện khi đã cấu hình Supabase) -->
        <template v-if="auth.cloudEnabled && authReady">
          <button v-if="!authUser" class="signin-btn" @click="signIn">
            <span class="g">G</span> Đăng nhập / Đăng ký
          </button>

          <div v-else class="account">
            <button class="account-btn" @click="menuOpen = !menuOpen">
              <img v-if="authUser.avatar" :src="authUser.avatar" class="account-avatar" alt="" referrerpolicy="no-referrer" />
              <span v-else class="account-avatar fallback">{{ (authUser.name || '?')[0].toUpperCase() }}</span>
            </button>
            <div v-if="menuOpen" class="menu" @click.self="menuOpen = false">
              <div class="menu-card">
                <div class="menu-name">{{ authUser.name }}</div>
                <div class="menu-email">{{ authUser.email }}</div>
                <div v-if="syncLabel" class="menu-sync" :class="syncStatus">{{ syncLabel }}</div>
                <button class="menu-out" @click="signOut">Đăng xuất</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(247, 248, 252, 0.82);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(108, 92, 231, 0.1);
}
.header-inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  gap: 28px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  flex: none;
}
.logo-text {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
}
.nav-link {
  padding: 9px 15px;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  color: #5a5a72;
  transition: all 0.15s;
}
.nav-link:hover {
  background: rgba(108, 92, 231, 0.06);
}
.nav-link.active {
  color: var(--purple);
  background: rgba(108, 92, 231, 0.1);
}
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.streak {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fff3dd, #ffe8c2);
  border: 1px solid rgba(255, 176, 32, 0.35);
  padding: 7px 13px;
  border-radius: 13px;
  font-weight: 800;
  color: var(--amber-ink);
  font-size: 14px;
}
.streak-icon {
  font-size: 16px;
}
.xp-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.14);
  padding: 6px 8px 6px 13px;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.07);
}
.xp-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.xp-top {
  display: flex;
  align-items: center;
  gap: 7px;
}
.lv {
  font-size: 12px;
  font-weight: 800;
  color: var(--purple);
}
.xp-num {
  font-size: 11px;
  color: var(--muted-2);
  font-weight: 600;
}
.xp-track {
  width: 96px;
  height: 6px;
  border-radius: 99px;
  background: #ececf5;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand);
  transition: width 0.5s;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, #6c5ce7, #8b7cf0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex: none;
}

/* —— đăng nhập / tài khoản —— */
.signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(108, 92, 231, 0.18);
  background: #fff;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.07);
  transition: background 0.15s;
}
.signin-btn:hover {
  background: var(--purple-soft);
}
.signin-btn .g {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285f4, #ea4335);
  color: #fff;
  font-weight: 900;
  font-size: 13px;
}
.account {
  position: relative;
  flex: none;
}
.account-btn {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 11px;
  line-height: 0;
}
.account-avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  object-fit: cover;
  border: 2px solid rgba(108, 92, 231, 0.25);
}
.account-avatar.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6c5ce7, #8b7cf0);
  color: #fff;
  font-weight: 800;
  font-size: 16px;
}
.menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 60;
}
.menu-card {
  background: #fff;
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(108, 92, 231, 0.18);
  padding: 14px 16px;
  min-width: 200px;
}
.menu-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
}
.menu-email {
  font-size: 12px;
  color: var(--muted-2);
  margin-top: 2px;
  word-break: break-all;
}
.menu-sync {
  font-size: 11.5px;
  font-weight: 700;
  margin-top: 8px;
  color: #00a86f;
}
.menu-sync.syncing {
  color: var(--purple);
}
.menu-sync.error {
  color: #d6512b;
}
.menu-out {
  margin-top: 12px;
  width: 100%;
  border: 1px solid rgba(214, 81, 43, 0.25);
  background: rgba(214, 81, 43, 0.06);
  color: #d6512b;
  font-size: 13px;
  font-weight: 700;
  padding: 9px;
  border-radius: 10px;
  cursor: pointer;
}
.menu-out:hover {
  background: rgba(214, 81, 43, 0.12);
}
@media (max-width: 720px) {
  .header-inner {
    gap: 14px;
    padding: 12px 18px;
    flex-wrap: wrap;
  }
  .xp-info {
    display: none;
  }
}
</style>
