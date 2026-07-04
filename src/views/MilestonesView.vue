<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { pickComparisonMilestones } from '@/data/milestones'
import { loadRecording, saveRecording } from '@/lib/recorder'
import { downloadRecording, remoteRecordingExists } from '@/lib/recordingSync'
import { isCloudEnabled } from '@/lib/supabase'
import { MISSION_BADGES } from '@/data/badges'
import { ieltsMissionStats, missionLogEntries } from '@/lib/missionStats'

/**
 * Trang "So sánh mốc" — nghe lại bản ghi Đầu / Giữa / Cuối khóa cạnh nhau (đã có
 * sẵn trong IndexedDB qua VoiceRecorder, hoặc tải lại từ Supabase Storage nếu
 * bản ghi được thực hiện trên máy khác) + nhật ký Mission + huy hiệu real-life.
 * Xem docs/KE_HOACH_CAI_TIEN_GIAO_TIEP.md mục Đợt 4.
 */
const router = useRouter()
const user = useUserStore()

const milestones = pickComparisonMilestones()
const clips = ref(milestones.map((m) => ({ ...m, url: '', remote: false, fetching: false })))

async function fetchClip(c) {
  if (!isCloudEnabled || !user.cloudUserId || c.fetching) return
  c.fetching = true
  try {
    const blob = await downloadRecording(user.cloudUserId, c.recId)
    if (blob) {
      await saveRecording(c.recId, blob)
      c.url = URL.createObjectURL(blob)
      c.remote = false
    }
  } finally {
    c.fetching = false
  }
}

onMounted(async () => {
  for (const c of clips.value) {
    const blob = await loadRecording(c.recId)
    if (blob) {
      c.url = URL.createObjectURL(blob)
      continue
    }
    if (isCloudEnabled && user.cloudUserId) {
      c.remote = await remoteRecordingExists(user.cloudUserId, c.recId)
    }
  }
})
onBeforeUnmount(() => {
  for (const c of clips.value) if (c.url) URL.revokeObjectURL(c.url)
})

const stats = computed(() => ieltsMissionStats(user))
const earned = computed(() => new Set(MISSION_BADGES.filter((b) => b.check(stats.value)).map((b) => b.key)))
const log = computed(() => missionLogEntries(user))
</script>

<template>
  <div class="container narrow section-top">
    <span class="back" @click="router.push({ name: 'ielts' })">← Khóa IELTS nền tảng</span>
    <h1 class="page-title">📊 So sánh mốc & nhật ký thật</h1>
    <p class="page-sub">Nghe lại giọng của em từ Đầu đến Cuối khóa, và xem lại những lần em đã "dám" dùng tiếng Anh ngoài app.</p>

    <!-- 3 MỐC GHI ÂM -->
    <section class="block">
      <h2 class="block-title">🎙️ Ba mốc ghi âm</h2>
      <div v-if="!clips.length" class="empty">Chưa có buổi nào yêu cầu ghi âm — học tiếp để mở mục này nhé.</div>
      <div v-else class="clip-grid">
        <div v-for="c in clips" :key="c.recId" class="clip-card">
          <div class="clip-label">Tuần {{ c.week }} · Buổi {{ c.day }}</div>
          <div class="clip-name">{{ c.label }}</div>
          <audio v-if="c.url" :src="c.url" controls class="clip-audio"></audio>
          <button v-else-if="c.remote" class="clip-fetch" :disabled="c.fetching" @click="fetchClip(c)">
            {{ c.fetching ? 'Đang tải…' : '☁️ Tải bản ghi từ cloud' }}
          </button>
          <div v-else class="clip-empty">Chưa ghi âm buổi này</div>
        </div>
      </div>
    </section>

    <!-- HUY HIỆU REAL-LIFE -->
    <section class="block">
      <h2 class="block-title">🏅 Huy hiệu real-life</h2>
      <div class="badge-grid">
        <div v-for="b in MISSION_BADGES" :key="b.key" class="badge-card" :class="{ on: earned.has(b.key) }">
          <div class="badge-icon">{{ b.icon }}</div>
          <div class="badge-title">{{ b.title }}</div>
          <div class="badge-desc">{{ b.desc }}</div>
          <div class="badge-state">{{ earned.has(b.key) ? '✅ Đã đạt' : '🔒 Chưa đạt' }}</div>
        </div>
      </div>
    </section>

    <!-- NHẬT KÝ MISSION -->
    <section class="block">
      <h2 class="block-title">🌍 Nhật ký Mission</h2>
      <div v-if="!log.length" class="empty">Chưa có Mission nào được ghi lại — mở một buổi có Mission tuần để bắt đầu.</div>
      <ul v-else class="log-list">
        <li v-for="e in log" :key="`${e.week}:${e.day}`" class="log-item">
          <div class="log-head">
            <span class="log-week">Tuần {{ e.week }} · Buổi {{ e.day }}</span>
            <span class="log-state" :class="{ ok: e.done }">{{ e.done ? '✅ Đã hoàn thành' : '📝 Đang làm' }}</span>
          </div>
          <p class="log-text">{{ e.text }}</p>
          <p v-if="e.note" class="log-note">{{ e.note }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.section-top {
  padding-top: 32px;
  padding-bottom: 60px;
}
.back {
  font-size: 14px;
  font-weight: 700;
  color: var(--purple);
  cursor: pointer;
}
.page-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
  margin: 14px 0 8px;
}
.page-sub {
  font-size: 15.5px;
  color: var(--muted);
  line-height: 1.6;
  max-width: 640px;
}
.block {
  margin-top: 36px;
}
.block-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
}
.empty {
  font-size: 14.5px;
  color: var(--muted);
  background: var(--bg);
  border-radius: 14px;
  padding: 16px 18px;
}
.clip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.clip-card {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 10px 26px rgba(108, 92, 231, 0.06);
}
.clip-label {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--muted-2);
  letter-spacing: 0.4px;
}
.clip-name {
  font-size: 15px;
  font-weight: 700;
  margin: 6px 0 12px;
}
.clip-audio {
  width: 100%;
  height: 38px;
}
.clip-empty {
  font-size: 13.5px;
  color: var(--muted-2);
  font-style: italic;
}
.clip-fetch {
  border: none;
  background: var(--purple);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
}
.clip-fetch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.badge-card {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
  opacity: 0.55;
}
.badge-card.on {
  opacity: 1;
  border-color: rgba(0, 214, 143, 0.4);
  box-shadow: 0 12px 28px rgba(0, 214, 143, 0.14);
}
.badge-icon {
  font-size: 32px;
}
.badge-title {
  font-size: 15px;
  font-weight: 800;
  margin: 8px 0 4px;
}
.badge-desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.5;
}
.badge-state {
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 700;
}
.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.log-item {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 16px;
  padding: 14px 18px;
}
.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.log-week {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--muted-2);
}
.log-state {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.log-state.ok {
  color: var(--text-success);
}
.log-text {
  font-size: 14.5px;
  margin: 8px 0 0;
}
.log-note {
  font-size: 13.5px;
  color: var(--muted);
  margin: 6px 0 0;
  font-style: italic;
}

@media (max-width: 800px) {
  .clip-grid,
  .badge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
