<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { COMM_MILESTONES } from '@/data/milestones'
import { COMM_BADGES } from '@/data/badges'
import { commBadgeStats, commBossScores, commSrsSummary, commMetricsSummary } from '@/lib/commStats'
import { computeCommProgress } from '@/data/courseComm'
import { loadRecording, saveRecording } from '@/lib/recorder'
import { downloadRecording, remoteRecordingExists } from '@/lib/recordingSync'
import { isCloudEnabled } from '@/lib/supabase'

/**
 * Trang Tổng kết khóa "Giao Tiếp Thực Chiến" — nhìn lại cả hành trình 8 tuần:
 * bảng điểm 8 Boss + vốn cụm SRS đã "nhớ" + nghe lại 3 mốc ghi âm (Đầu/Giữa/Cuối)
 * + huy hiệu khóa. Xem docs/KE_HOACH_GIAO_TIEP_THUC_CHIEN.md mục Đợt 4.
 */
const router = useRouter()
const user = useUserStore()

const prog = computed(() => computeCommProgress(user.completed.comm || [], (w) => user.quizPassed('comm', `week:${w}`)))
const bosses = computed(() => commBossScores(user))
const bossesPassed = computed(() => bosses.value.filter((b) => b.passed).length)
const srs = computed(() => commSrsSummary(user))
const metrics = computed(() => commMetricsSummary(user))
const stats = computed(() => commBadgeStats(user))
const earned = computed(() => new Set(COMM_BADGES.filter((b) => b.check(stats.value)).map((b) => b.key)))

// —— 3 mốc ghi âm: nạp từ IndexedDB, hoặc tải lại từ cloud nếu ghi ở máy khác ——
const clips = ref(COMM_MILESTONES.map((m) => ({ ...m, url: '', remote: false, fetching: false })))

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

function goDay(week, day) {
  router.push({ name: 'comm-day', params: { week, day } })
}

// —— Thang tự đánh giá "mình dám nói" (1–5) đầu & cuối khóa (Trục D) ——
const DARE_LABELS = ['Rất ngại', 'Còn ngại', 'Tạm ổn', 'Khá tự tin', 'Rất tự tin']
const dare = computed(() => user.convoPrefs.commDare || { start: null, end: null })
function setDare(which, val) {
  user.setConvoPrefs({ commDare: { ...dare.value, [which]: val } })
}
const dareDelta = computed(() =>
  dare.value.start != null && dare.value.end != null ? dare.value.end - dare.value.start : null,
)
</script>

<template>
  <div class="container narrow section-top">
    <span class="back" @click="router.push({ name: 'comm' })">← Giao Tiếp Thực Chiến</span>
    <h1 class="page-title">🏆 Tổng kết khóa Giao Tiếp Thực Chiến</h1>
    <p class="page-sub">
      Nhìn lại cả chặng đường: bạn đã vượt bao nhiêu Boss, nhớ được bao nhiêu cụm, và giọng nói
      của bạn đã đổi thế nào từ buổi đầu đến Final Boss.
    </p>

    <!-- TỔNG QUAN -->
    <section class="stat-row">
      <div class="stat-tile">
        <div class="st-num">{{ bossesPassed }}/8</div>
        <div class="st-lbl">Boss tuần đã vượt</div>
      </div>
      <div class="stat-tile">
        <div class="st-num">{{ srs.remembered }}/{{ srs.total }}</div>
        <div class="st-lbl">Cụm đang ở trạng thái "nhớ" ({{ srs.pct }}%)</div>
      </div>
      <div class="stat-tile">
        <div class="st-num">{{ prog.pct }}%</div>
        <div class="st-lbl">Tiến độ khóa ({{ prog.doneWeeks }}/{{ prog.totalWeeks }} tuần)</div>
      </div>
    </section>

    <!-- NÓI NHANH HƠN / RÕ HƠN (số khách quan gom từ các buổi) -->
    <section v-if="metrics.sessions" class="block">
      <h2 class="block-title">📈 Nói nhanh hơn & rõ hơn</h2>
      <div class="stat-row">
        <div class="stat-tile">
          <div class="st-num">{{ metrics.avgWpm ?? '—' }}<small v-if="metrics.avgWpm"> từ/phút</small></div>
          <div class="st-lbl">Tốc độ nói trung bình{{ metrics.bestWpm ? ` · nhanh nhất ${metrics.bestWpm}` : '' }}</div>
        </div>
        <div class="stat-tile">
          <div class="st-num">{{ metrics.avgPron != null ? metrics.avgPron + '%' : '—' }}</div>
          <div class="st-lbl">Độ chuẩn phát âm (đọc-to máy nhận đúng)</div>
        </div>
        <div class="stat-tile">
          <div class="st-num">{{ metrics.sessions }}</div>
          <div class="st-lbl">Buổi đã đo trôi chảy / phát âm</div>
        </div>
      </div>
    </section>

    <!-- BẢNG ĐIỂM 8 BOSS -->
    <section class="block">
      <h2 class="block-title">👑 Bảng điểm 8 Boss tuần</h2>
      <div class="boss-grid">
        <button
          v-for="b in bosses"
          :key="b.week"
          class="boss-card"
          :class="{ passed: b.passed, played: b.entry && !b.passed }"
          @click="goDay(b.week, 7)"
        >
          <div class="bc-top">
            <span class="bc-icon">{{ b.icon }}</span>
            <span class="bc-week">Tuần {{ b.week }}</span>
          </div>
          <div class="bc-title">{{ b.title }}</div>
          <div class="bc-score">
            <template v-if="b.entry">{{ b.passed ? '✅' : '⏳' }} {{ b.pct }}%</template>
            <template v-else>🔒 Chưa đấu</template>
          </div>
        </button>
      </div>
    </section>

    <!-- 3 MỐC GHI ÂM -->
    <section class="block">
      <h2 class="block-title">🎙️ Ba mốc ghi âm — nghe lại tiến bộ</h2>
      <div class="clip-grid">
        <div v-for="c in clips" :key="c.recId" class="clip-card">
          <div class="clip-tag">{{ c.tag }}</div>
          <div class="clip-name">{{ c.label }}</div>
          <div class="clip-loc">Tuần {{ c.week }} · Buổi {{ c.day }}</div>
          <audio v-if="c.url" :src="c.url" controls class="clip-audio"></audio>
          <button v-else-if="c.remote" class="clip-fetch" :disabled="c.fetching" @click="fetchClip(c)">
            {{ c.fetching ? 'Đang tải…' : '☁️ Tải bản ghi từ cloud' }}
          </button>
          <button v-else class="clip-go" @click="goDay(c.week, c.day)">🎤 Chưa ghi — mở buổi để ghi</button>
        </div>
      </div>
    </section>

    <!-- THANG TỰ ĐÁNH GIÁ "MÌNH DÁM NÓI" -->
    <section class="block">
      <h2 class="block-title">💬 "Mình dám nói" tới đâu rồi?</h2>
      <p class="dare-intro">
        Tự chấm cảm giác dám mở miệng nói tiếng Anh (1 = rất ngại, 5 = rất tự tin). Chấm <b>mốc đầu</b> khi mới
        bắt đầu và <b>mốc cuối</b> khi học xong — để tự thấy mình đã bạo dạn hơn bao nhiêu.
      </p>
      <div class="dare-grid">
        <div class="dare-col">
          <div class="dare-lbl">🏁 Mốc đầu khóa</div>
          <div class="dare-scale">
            <button
              v-for="n in 5"
              :key="'s' + n"
              class="dare-dot"
              :class="{ on: dare.start === n }"
              @click="setDare('start', n)"
            >{{ n }}</button>
          </div>
          <div class="dare-cap">{{ dare.start ? DARE_LABELS[dare.start - 1] : 'Chưa chấm' }}</div>
        </div>
        <div class="dare-col">
          <div class="dare-lbl">🏆 Mốc cuối khóa</div>
          <div class="dare-scale">
            <button
              v-for="n in 5"
              :key="'e' + n"
              class="dare-dot"
              :class="{ on: dare.end === n }"
              @click="setDare('end', n)"
            >{{ n }}</button>
          </div>
          <div class="dare-cap">{{ dare.end ? DARE_LABELS[dare.end - 1] : 'Chưa chấm' }}</div>
        </div>
      </div>
      <div v-if="dareDelta !== null" class="dare-delta" :class="{ up: dareDelta > 0 }">
        {{ dareDelta > 0 ? `📈 Tăng ${dareDelta} bậc — bạn dám nói hơn hẳn lúc đầu! 🎉` : dareDelta === 0 ? 'Giữ nguyên — cứ tiếp tục luyện nói mỗi ngày nhé.' : 'Đừng lo, tự tin lên xuống là bình thường — quay lại luyện thêm vài buổi.' }}
      </div>
    </section>

    <!-- HUY HIỆU KHÓA -->
    <section class="block">
      <h2 class="block-title">🏅 Huy hiệu khóa</h2>
      <div class="badge-grid">
        <div v-for="b in COMM_BADGES" :key="b.key" class="badge-card" :class="{ on: earned.has(b.key) }">
          <div class="badge-icon">{{ b.icon }}</div>
          <div class="badge-title">{{ b.title }}</div>
          <div class="badge-desc">{{ b.desc }}</div>
          <div class="badge-state">{{ earned.has(b.key) ? '✅ Đã đạt' : '🔒 Chưa đạt' }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-top {
  padding-top: 32px;
  padding-bottom: 60px;
}
.narrow {
  max-width: 1000px;
}
.back {
  font-size: 14px;
  font-weight: 700;
  color: #b25f00;
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
  max-width: 660px;
}
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 26px;
}
.stat-tile {
  background: var(--surface);
  border: 1px solid rgba(255, 176, 32, 0.2);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
}
.st-num {
  font-size: 30px;
  font-weight: 800;
  color: #b25f00;
}
.st-lbl {
  font-size: 13px;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.4;
}
.block {
  margin-top: 38px;
}
.block-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
}
.boss-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.boss-card {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s;
}
.boss-card.passed {
  opacity: 1;
  border-color: rgba(0, 214, 143, 0.4);
  box-shadow: 0 10px 24px rgba(0, 214, 143, 0.12);
}
.boss-card.played {
  opacity: 1;
}
@media (hover: hover) {
  .boss-card:hover {
    transform: translateY(-3px);
  }
}
.bc-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bc-icon {
  font-size: 20px;
}
.bc-week {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted-2);
}
.bc-title {
  font-size: 13.5px;
  font-weight: 700;
  margin: 8px 0 10px;
  line-height: 1.4;
  min-height: 38px;
}
.bc-score {
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
}
.clip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.clip-card {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.12);
  border-radius: 18px;
  padding: 18px;
}
.clip-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  color: #6c5ce7;
  background: rgba(108, 92, 231, 0.12);
  padding: 3px 10px;
  border-radius: 99px;
}
.clip-name {
  font-size: 15px;
  font-weight: 700;
  margin: 10px 0 2px;
}
.clip-loc {
  font-size: 12px;
  color: var(--muted-2);
  margin-bottom: 12px;
}
.clip-audio {
  width: 100%;
  height: 38px;
}
.clip-fetch,
.clip-go {
  border: none;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
}
.clip-fetch {
  background: var(--purple, #6c5ce7);
  color: #fff;
}
.clip-fetch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.clip-go {
  background: var(--bg);
  color: var(--muted);
  border: 1px dashed var(--line);
}
.dare-intro {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 16px;
  max-width: 660px;
}
.dare-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.dare-col {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.15);
  border-radius: 16px;
  padding: 18px;
  text-align: center;
}
.dare-lbl {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 12px;
}
.dare-scale {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.dare-dot {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s;
}
.dare-dot.on {
  background: linear-gradient(135deg, #6c5ce7, #8b7cf0);
  border-color: transparent;
  color: #fff;
}
.dare-cap {
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.dare-delta {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg);
  border-radius: 12px;
  padding: 12px 16px;
}
.dare-delta.up {
  color: var(--green-2, #00966a);
  background: rgba(0, 214, 143, 0.1);
}
.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.badge-card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
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
@media (max-width: 860px) {
  .boss-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-row,
  .clip-grid,
  .dare-grid,
  .badge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
