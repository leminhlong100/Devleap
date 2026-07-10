<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { isCloudEnabled } from '@/lib/supabase'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

/**
 * Bảng xếp hạng XP tuần (Bước 5.1) — opt-in, ẩn danh mặc định. Chỉ hoạt động
 * khi đã đăng nhập (cần cloud để so XP với người khác); chế độ khách chỉ hiện
 * lời nhắc đăng nhập, không có gì để bật/tắt.
 */
const user = useUserStore()
const { isOnline } = useOnlineStatus()
const cloudReady = computed(() => isCloudEnabled && !!user.cloudUserId)

const optedIn = ref(user.leaderboardOptIn)
const name = ref(user.leaderboardName)
const status = computed(() => user.leaderboardStatus)
const rows = computed(() => user.leaderboardRows)
const loading = computed(() => status.value === 'loading')

function save() {
  user.setLeaderboardOptIn(optedIn.value, name.value)
  if (optedIn.value) user.fetchLeaderboard()
}
function refresh() {
  user.fetchLeaderboard()
}

// Tự tải khi vừa đăng nhập xong (hoặc ngay khi mở tool nếu đã đăng nhập từ trước).
watch(
  cloudReady,
  (ready) => {
    if (ready && optedIn.value) user.fetchLeaderboard()
  },
  { immediate: true },
)

// Đồng bộ lại 2 ô nhập khi tùy chọn đổi từ NGOÀI thao tác trên chính form này
// (đăng nhập xong `pullAndMerge` kéo về tùy chọn đã lưu ở thiết bị khác) — nếu
// không có watch này, form sẽ đứng im ở giá trị lúc mount (thường là false/'')
// dù store đã có dữ liệu thật ngay sau đó.
watch(() => user.leaderboardOptIn, (v) => { optedIn.value = v })
watch(() => user.leaderboardName, (v) => { name.value = v })
</script>

<template>
  <div class="lb">
    <div class="lb-head">
      <div>
        <h2 class="tool-title">🏆 Bảng xếp hạng tuần</h2>
        <p class="tool-sub">
          So XP kiếm được trong tuần này với các bạn học khác — hoàn toàn tùy chọn, ẩn danh mặc định.
        </p>
      </div>
      <button
        v-if="cloudReady && optedIn"
        class="study-btn"
        :disabled="loading || !isOnline"
        :title="!isOnline ? 'Cần có mạng để tải bảng xếp hạng' : undefined"
        @click="refresh"
      >
        {{ isOnline ? '🔄 Làm mới' : '🔌 Offline' }}
      </button>
    </div>

    <!-- Chưa đăng nhập / chế độ khách -->
    <div v-if="!cloudReady" class="empty">
      <div class="emoji">🔒</div>
      <h3>Cần đăng nhập để dùng bảng xếp hạng</h3>
      <p>
        Đăng nhập bằng Google (biểu tượng tài khoản ở góc trên) để XP tuần của bạn được đồng bộ
        và so được với người khác.
      </p>
    </div>

    <template v-else>
      <div class="optin-box">
        <label class="switch-row">
          <input v-model="optedIn" type="checkbox" @change="save" />
          <span>Tham gia bảng xếp hạng tuần</span>
        </label>
        <p class="hint">XP tuần của bạn vẫn luôn được tính dù không tham gia — chỉ là không hiện ở đây.</p>
        <div v-if="optedIn" class="name-row">
          <label for="lb-name">Tên hiển thị (để trống = ẩn danh)</label>
          <input id="lb-name" v-model="name" maxlength="40" placeholder="Học viên ẩn danh" @change="save" />
        </div>
      </div>

      <div v-if="optedIn" class="board">
        <p v-if="status === 'loading'" class="state-msg">Đang tải…</p>
        <p v-else-if="status === 'error'" class="state-msg err">Không tải được bảng xếp hạng — thử lại sau.</p>
        <div v-else-if="!rows.length" class="empty small">
          <div class="emoji">🥇</div>
          <p>Chưa có ai trong bảng xếp hạng tuần này — bạn sẽ là người đầu tiên!</p>
        </div>
        <ol v-else class="rows">
          <li v-for="(r, i) in rows" :key="i" class="row" :class="{ me: r.isMe }">
            <span class="rank">{{ i + 1 }}</span>
            <span class="name">{{ r.displayName }} <span v-if="r.isMe" class="me-tag">(bạn)</span></span>
            <span class="xp">{{ r.weekXp }} XP</span>
          </li>
        </ol>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lb {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.lb-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}
.tool-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.tool-sub {
  font-size: 14.5px;
  color: var(--slate);
  margin-top: 5px;
}
.study-btn {
  flex: none;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--grad-purple);
  font-size: 13.5px;
  font-weight: 800;
  padding: 11px 16px;
  min-height: 44px;
  border-radius: 12px;
  transition: transform 0.12s, box-shadow 0.15s;
}
@media (hover: hover) {
  .study-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
  }
}
.study-btn:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
}
.study-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.empty {
  text-align: center;
  padding: 44px 10px;
  color: var(--muted-2);
}
.empty.small {
  padding: 30px 0;
}
.emoji {
  font-size: 48px;
}
.empty h3 {
  font-size: 20px;
  font-weight: 800;
  margin-top: 10px;
  color: var(--ink);
}
.empty p {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
}
.optin-box {
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 20px;
}
.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
}
.switch-row input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.hint {
  font-size: 13px;
  color: var(--muted-2);
  margin-top: 8px;
  line-height: 1.5;
}
.name-row {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.name-row label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
}
.name-row input {
  padding: 10px 14px;
  border-radius: 11px;
  border: 1.5px solid rgba(108, 92, 231, 0.16);
  background: var(--surface);
  font-family: inherit;
  font-size: 16px;
  color: var(--ink);
  outline: none;
  max-width: 320px;
}
.name-row input:focus {
  border-color: var(--purple);
}
.state-msg {
  text-align: center;
  padding: 20px 0;
  color: var(--muted-2);
  font-size: 14.5px;
}
.state-msg.err {
  color: var(--text-danger, #e05656);
}
.rows {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: 13px;
  padding: 12px 16px;
}
.row.me {
  border-color: var(--purple);
  background: rgba(108, 92, 231, 0.08);
}
.rank {
  flex: none;
  width: 26px;
  font-size: 14px;
  font-weight: 800;
  color: var(--muted-2);
  text-align: center;
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me-tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--purple);
}
.xp {
  flex: none;
  font-size: 14.5px;
  font-weight: 800;
  color: var(--purple);
}
@media (max-width: 600px) {
  .lb {
    padding: 24px;
  }
}
</style>
