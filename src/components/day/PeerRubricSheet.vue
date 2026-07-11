<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { isCloudEnabled } from '@/lib/supabase'
import { remoteRecordingExists, createRecordingShareLink } from '@/lib/recordingSync'
import { loadRecording } from '@/lib/recorder'

/**
 * Giao thức "người thật có phản hồi" (kế hoạch cải tiến #9): biến mission tự-báo-cáo
 * thành VÒNG CÓ FEEDBACK. Gồm 2 phần:
 *   1) Rubric CHUẨN 4 chiều để TỰ chấm + NGƯỜI NGHE chấm bài self-intro (lưu local).
 *   2) Chia sẻ bản ghi self-intro: tạo link có hạn (Supabase signed URL) + mẫu lời
 *      nhờ nhận xét sẵn để dán ra cộng đồng.
 * Không gọi LLM. Không tự đăng gì công khai — chỉ tạo link để NGƯỜI HỌC tự gửi.
 */
const props = defineProps({
  // Bản ghi self-intro để xin nhận xét (buổi 8.5 — "Tự giới thiệu 90s").
  recId: { type: String, default: 'comm:8:5:mono' },
  recWeek: { type: [Number, String], default: 8 },
  recDay: { type: [Number, String], default: 5 },
})

const router = useRouter()
const user = useUserStore()

// —— Rubric chuẩn 4 chiều (khớp 2 chiều debrief: dễ hiểu + trôi chảy) ——
const DIMENSIONS = [
  { key: 'intelligibility', label: 'Độ dễ hiểu', hint: 'Âm cuối, trọng âm, độ rõ — người nghe hiểu ngay không?' },
  { key: 'fluency', label: 'Trôi chảy', hint: 'Nói kịp, ít khựng dài, không đơ giữa câu.' },
  { key: 'language', label: 'Từ vựng & ngữ pháp', hint: 'Đủ ý, dùng cụm hợp cảnh, ít lỗi cản nghĩa.' },
  { key: 'interaction', label: 'Mạch lạc & tương tác', hint: 'Có mở – thân – kết, nối ý bằng từ nối, phản hồi tự nhiên.' },
]
const BAND_LABELS = ['Khó hiểu', 'Tạm', 'Tốt', 'Rất tốt']

const rubric = computed(() => user.convoPrefs.commPeerRubric || { self: {}, peer: {} })
function score(col, dim) {
  return rubric.value?.[col]?.[dim] ?? null
}
function setScore(col, dim, val) {
  const cur = user.convoPrefs.commPeerRubric || { self: {}, peer: {} }
  const next = { self: { ...(cur.self || {}) }, peer: { ...(cur.peer || {}) } }
  next[col][dim] = val
  user.setConvoPrefs({ commPeerRubric: next })
}
const colTotal = (col) => DIMENSIONS.reduce((s, d) => s + (Number(score(col, d.key)) || 0), 0)
const selfDone = computed(() => DIMENSIONS.every((d) => score('self', d.key) != null))

// —— Chia sẻ bản ghi self-intro ——
const canSync = computed(() => isCloudEnabled && !!user.cloudUserId)
const hasRecording = ref(false) // có bản ghi (local hoặc cloud) để chia sẻ chưa
const shareUrl = ref('')
const sharing = ref(false)
const shareErr = ref('')
const copied = ref(false)

onMounted(async () => {
  const local = await loadRecording(props.recId)
  if (local) {
    hasRecording.value = true
    return
  }
  if (canSync.value) hasRecording.value = await remoteRecordingExists(user.cloudUserId, props.recId)
})

async function makeShareLink() {
  if (!canSync.value || sharing.value) return
  sharing.value = true
  shareErr.value = ''
  try {
    const url = await createRecordingShareLink(user.cloudUserId, props.recId)
    if (url) shareUrl.value = url
    else shareErr.value = 'Chưa tạo được link — kiểm tra kết nối rồi thử lại.'
  } finally {
    sharing.value = false
  }
}

// Mẫu lời nhờ nhận xét (kèm 4 chiều rubric) để cộng đồng biết cần góp ý điều gì.
const requestTemplate = computed(
  () =>
    `Xin chào! Mình đang luyện nói tiếng Anh và rất mong được nghe góp ý cho bài TỰ GIỚI THIỆU 90 giây của mình.\n` +
    `Nhờ mọi người nghe rồi chấm giúp 4 điều (thang 1–4) — cảm ơn nhiều! 🙏\n` +
    `  1) Độ dễ hiểu (âm cuối/trọng âm)\n  2) Trôi chảy (có bị khựng không)\n` +
    `  3) Từ vựng & ngữ pháp\n  4) Mạch lạc (mở – thân – kết)\n` +
    (shareUrl.value ? `\n🎧 Bản ghi: ${shareUrl.value}` : '')
)

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    shareErr.value = 'Trình duyệt chặn sao chép — hãy bôi đen link rồi copy tay.'
  }
}
async function nativeShare() {
  if (!navigator.share) return copy(requestTemplate.value)
  try {
    await navigator.share({ title: 'Xin nhận xét bài self-intro', text: requestTemplate.value })
  } catch {
    /* người dùng hủy — bỏ qua */
  }
}
const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

function goRecord() {
  router.push({ name: 'comm-day', params: { week: props.recWeek, day: props.recDay } })
}
</script>

<template>
  <section class="step-card prs">
    <div class="step-head">
      <div>
        <div class="eyebrow">🤝 NGƯỜI THẬT CHẤM · VÒNG PHẢN HỒI</div>
        <h2 class="step-title">Xin nhận xét từ người thật</h2>
      </div>
    </div>
    <p class="prs-intro">
      Máy chấm được độ rõ và tốc độ, nhưng <b>tai người thật</b> mới cho biết bạn có tự nhiên, dễ nghe
      ngoài đời không. Dùng bảng dưới để <b>tự chấm</b> và nhờ một người bạn / cộng đồng <b>chấm giúp</b>
      bài tự giới thiệu của bạn.
    </p>

    <!-- BẢNG RUBRIC CHUẨN -->
    <div class="prs-table">
      <div class="prs-row prs-head-row">
        <div class="prs-dim">Tiêu chí</div>
        <div class="prs-col-lbl">🧑 Tự chấm</div>
        <div class="prs-col-lbl">👂 Người nghe</div>
      </div>
      <div v-for="dim in DIMENSIONS" :key="dim.key" class="prs-row">
        <div class="prs-dim">
          <div class="prs-dim-name">{{ dim.label }}</div>
          <div class="prs-dim-hint">{{ dim.hint }}</div>
        </div>
        <div v-for="col in ['self', 'peer']" :key="col" class="prs-scale">
          <button
            v-for="n in 4"
            :key="n"
            class="prs-dot"
            :class="{ on: score(col, dim.key) === n }"
            :title="BAND_LABELS[n - 1]"
            @click="setScore(col, dim.key, n)"
          >{{ n }}</button>
        </div>
      </div>
      <div class="prs-row prs-total-row">
        <div class="prs-dim">Tổng (tối đa 16)</div>
        <div class="prs-total">{{ colTotal('self') }}</div>
        <div class="prs-total">{{ colTotal('peer') }}</div>
      </div>
    </div>
    <p class="prs-scale-key">Thang: 1 = {{ BAND_LABELS[0] }} · 2 = {{ BAND_LABELS[1] }} · 3 = {{ BAND_LABELS[2] }} · 4 = {{ BAND_LABELS[3] }}</p>

    <!-- CHIA SẺ BẢN GHI SELF-INTRO -->
    <div class="prs-share">
      <div class="prs-share-head">🎧 Chia sẻ bản ghi self-intro để xin nhận xét</div>

      <template v-if="hasRecording">
        <p class="prs-share-note">
          Tạo một link có hạn (7 ngày) tới bản ghi tự giới thiệu của bạn, rồi gửi kèm mẫu lời nhờ bên dưới
          vào nhóm học / cộng đồng để mọi người nghe và góp ý.
        </p>
        <div v-if="!canSync" class="prs-warn">
          ⚠️ Cần <b>đăng nhập</b> để tạo link chia sẻ (bản ghi mới đồng bộ lên cloud). Đăng nhập rồi ghi lại bài self-intro nhé.
        </div>
        <template v-else>
          <button v-if="!shareUrl" class="prs-btn" :disabled="sharing" @click="makeShareLink">
            {{ sharing ? 'Đang tạo link…' : '🔗 Tạo link chia sẻ bản ghi' }}
          </button>
          <div v-else class="prs-link-box">
            <input class="prs-link" :value="shareUrl" readonly @focus="$event.target.select()" />
            <button class="prs-btn small" @click="copy(shareUrl)">{{ copied ? '✓ Đã copy' : 'Copy link' }}</button>
          </div>
          <p v-if="shareErr" class="prs-warn">⚠️ {{ shareErr }}</p>
        </template>

        <div class="prs-tmpl">
          <div class="prs-tmpl-head">📝 Mẫu lời nhờ nhận xét (bấm để copy):</div>
          <pre class="prs-tmpl-body" @click="copy(requestTemplate)">{{ requestTemplate }}</pre>
          <div class="prs-tmpl-actions">
            <button class="prs-btn small" @click="copy(requestTemplate)">{{ copied ? '✓ Đã copy' : '📋 Copy lời nhờ' }}</button>
            <button v-if="canNativeShare" class="prs-btn small ghost" @click="nativeShare">📤 Chia sẻ…</button>
          </div>
        </div>
      </template>

      <div v-else class="prs-norec">
        <p>Bạn chưa có bản ghi <b>tự giới thiệu 90 giây</b> để chia sẻ. Ghi ở buổi độc thoại Tuần {{ recWeek }} trước đã nhé.</p>
        <button class="prs-btn" @click="goRecord">🎤 Mở buổi để ghi self-intro →</button>
      </div>
    </div>

    <p v-if="selfDone" class="prs-done">✅ Đã tự chấm đủ 4 tiêu chí. Giờ nhờ một người thật nghe & chấm cột "Người nghe" nhé!</p>
  </section>
</template>

<style scoped>
.prs {
  border: 1px solid rgba(0, 214, 143, 0.28);
}
.prs-intro {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--muted);
  margin-top: 12px;
}
.prs-table {
  margin-top: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.prs-row {
  display: grid;
  grid-template-columns: 1fr 140px 140px;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.prs-row:last-child {
  border-bottom: none;
}
.prs-head-row {
  background: var(--bg);
  font-size: 12.5px;
  font-weight: 800;
  color: var(--ink-2);
}
.prs-col-lbl {
  text-align: center;
}
.prs-dim-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.prs-dim-hint {
  font-size: 12px;
  color: var(--muted-2);
  line-height: 1.45;
  margin-top: 2px;
}
.prs-scale {
  display: flex;
  justify-content: center;
  gap: 6px;
}
.prs-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.13s;
}
.prs-dot.on {
  background: linear-gradient(135deg, #00d68f, #00a86f);
  border-color: transparent;
  color: #fff;
}
.prs-total-row {
  background: var(--bg);
  font-size: 13px;
  font-weight: 800;
}
.prs-total {
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: var(--green-2, #00966a);
}
.prs-scale-key {
  font-size: 12px;
  color: var(--muted-2);
  margin-top: 8px;
}
.prs-share {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed var(--line);
}
.prs-share-head {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--ink);
}
.prs-share-note {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.6;
  margin-top: 8px;
}
.prs-btn {
  margin-top: 12px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  padding: 11px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
}
.prs-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.prs-btn.small {
  margin-top: 0;
  font-size: 13px;
  padding: 9px 13px;
}
.prs-btn.ghost {
  background: var(--surface);
  color: var(--green-2, #00966a);
  border: 1px solid rgba(0, 214, 143, 0.4);
}
.prs-link-box {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.prs-link {
  flex: 1;
  min-width: 200px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12.5px;
  background: var(--bg);
  color: var(--ink);
}
.prs-tmpl {
  margin-top: 16px;
}
.prs-tmpl-head {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink-2);
}
.prs-tmpl-body {
  margin-top: 8px;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  color: var(--slate);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
}
.prs-tmpl-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.prs-warn {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-warning);
  background: var(--bg-warning);
  border-radius: 10px;
  padding: 9px 13px;
}
.prs-norec {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.6;
}
.prs-done {
  margin-top: 16px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--green-2, #00966a);
  background: rgba(0, 214, 143, 0.1);
  border-radius: 12px;
  padding: 11px 15px;
}
@media (max-width: 720px) {
  .prs-row {
    grid-template-columns: 1fr 96px 96px;
    gap: 6px;
  }
  .prs-dot {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }
}
</style>
