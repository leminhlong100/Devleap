<script setup>
/**
 * Ranh giới lỗi (error boundary) bọc quanh <RouterView>. Bắt lỗi render/lifecycle
 * của bất kỳ view con nào (qua onErrorCaptured) để MỘT trang lỗi không làm trắng
 * cả app — header/nav/footer vẫn dùng được, người dùng vẫn điều hướng đi nơi khác.
 *
 * Khi bắt được lỗi: hiện fallback thân thiện + nút "Thử lại" (render lại view) và
 * "Tải lại trang". Tự xóa lỗi khi người dùng chuyển sang route khác — để rời khỏi
 * trang hỏng là app trở lại bình thường.
 */
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const failed = ref(false)
const message = ref('')

onErrorCaptured((err) => {
  failed.value = true
  message.value = err?.message || String(err)
  // Log để còn xem được trong console/DevTools; báo cáo mềm — không ném tiếp.
  console.error('[AppErrorBoundary] view lỗi:', err)
  return false // chặn lỗi lan lên trên -> app không trắng
})

// Rời trang hỏng (đổi path) thì xóa trạng thái lỗi để view mới render bình thường.
watch(
  () => route.fullPath,
  () => {
    if (failed.value) failed.value = false
  },
)

// Thử render lại view hiện tại (dùng key để buộc dựng lại cây con).
const retryKey = ref(0)
function retry() {
  failed.value = false
  retryKey.value++
}
function reloadPage() {
  if (typeof window !== 'undefined') window.location.reload()
}
</script>

<template>
  <div v-if="failed" class="eb" role="alert">
    <div class="eb-card">
      <div class="eb-emoji">😵‍💫</div>
      <h2 class="eb-title">Ối, phần này gặp trục trặc</h2>
      <p class="eb-sub">
        Một lỗi bất ngờ khiến trang này không hiển thị được. Các phần khác của app
        vẫn dùng bình thường — bạn có thể thử lại hoặc quay về trang khác.
      </p>
      <div class="eb-actions">
        <button class="eb-btn primary" @click="retry">Thử lại</button>
        <button class="eb-btn" @click="reloadPage">Tải lại trang</button>
      </div>
      <p v-if="message" class="eb-detail">{{ message }}</p>
    </div>
  </div>
  <slot v-else :retry-key="retryKey" />
</template>

<style scoped>
.eb {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}
.eb-card {
  max-width: 460px;
  width: 100%;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  padding: 36px 30px 30px;
  box-shadow: 0 16px 40px rgba(108, 92, 231, 0.1);
}
.eb-emoji {
  font-size: 48px;
}
.eb-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.4px;
  margin: 14px 0 0;
  color: var(--ink);
}
.eb-sub {
  font-size: 15px;
  line-height: 1.6;
  color: var(--muted);
  margin: 12px 0 22px;
}
.eb-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.eb-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 22px;
  border-radius: 13px;
  min-height: 44px;
  transition: transform 0.15s;
}
.eb-btn.primary {
  border: none;
  color: #fff;
  background: var(--grad-purple);
  box-shadow: 0 10px 22px rgba(108, 92, 231, 0.3);
}
.eb-btn:active {
  transform: scale(0.97);
}
.eb-detail {
  margin: 18px 0 0;
  font-size: 12px;
  font-family: var(--mono, monospace);
  color: var(--muted-2);
  word-break: break-word;
}
</style>
