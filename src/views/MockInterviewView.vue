<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMockInterview } from '@/composables/useMockInterview'
import { INTERVIEW_TOPICS, topicLabel } from '@/data/javaInterview'
import { MOCK_PRESETS } from '@/lib/mockInterview'
import CodeEditor from '@/components/tools/CodeEditor.vue'

const router = useRouter()
const mi = useMockInterview()

// —— Lựa chọn ở màn thiết lập ——
const lang = ref('vi')
const level = ref('') // '' = mọi mức
const count = ref(8)
const durationMin = ref(0) // 0 = không giới hạn giờ
const codingCount = ref(0)
const chosen = ref([]) // topic keys; rỗng = mọi chủ đề

const LEVELS = [
  { key: '', label: 'Mọi mức' },
  { key: 'easy', label: 'Dễ' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'hard', label: 'Khó' },
]
const DURATIONS = [
  { key: 0, label: 'Không giới hạn' },
  { key: 20, label: '20 phút' },
  { key: 30, label: '30 phút' },
  { key: 45, label: '45 phút' },
]

function toggleTopic(key) {
  const i = chosen.value.indexOf(key)
  if (i === -1) chosen.value.push(key)
  else chosen.value.splice(i, 1)
}

function applyPreset(p) {
  count.value = p.count
  durationMin.value = p.durationMin
  codingCount.value = p.codingCount
  begin()
}

function begin() {
  mi.start({
    lang: lang.value,
    topics: chosen.value,
    level: level.value,
    count: count.value,
    durationMin: durationMin.value,
    codingCount: codingCount.value,
  })
}

function scoreColor(s) {
  if (s >= 75) return '#00c281'
  if (s >= 50) return '#FFB020'
  return '#ff5f57'
}

// "Ôn chủ đề yếu": về trang khóa, tab ngân hàng, lọc theo chủ đề điểm thấp nhất.
function reviewWeak() {
  const weak = [...(mi.report.value?.byTopic || [])].sort((a, b) => a.score - b.score)[0]
  router.push({ name: 'java-prep', query: { tab: 'bank', topic: weak?.topic || '' } })
}
</script>

<template>
  <div class="container page">
    <!-- ============ THIẾT LẬP ============ -->
    <section v-if="mi.phase.value === 'setup'" class="setup">
      <button class="back" @click="router.push({ name: 'java-prep' })">← Về khóa ôn</button>
      <h1 class="title">🎤 Mock Interview · Java</h1>
      <p class="sub">AI đóng vai người phỏng vấn: hỏi từng câu, chấm điểm ngay, tổng kết cuối buổi.</p>

      <div class="presets">
        <button v-for="p in MOCK_PRESETS" :key="p.key" class="preset" @click="applyPreset(p)">
          <span class="preset-label">{{ p.label }}</span>
          <span class="preset-blurb">{{ p.blurb }}</span>
        </button>
      </div>

      <div class="card">
        <label class="lbl">Ngôn ngữ phỏng vấn</label>
        <div class="seg">
          <button :class="{ on: lang === 'vi' }" @click="lang = 'vi'">🇻🇳 Tiếng Việt</button>
          <button :class="{ on: lang === 'en' }" @click="lang = 'en'">🇬🇧 English</button>
        </div>

        <label class="lbl">Chủ đề <span class="hint">(bỏ trống = tất cả)</span></label>
        <div class="chips">
          <button
            v-for="t in INTERVIEW_TOPICS"
            :key="t.key"
            class="chip"
            :class="{ on: chosen.includes(t.key) }"
            @click="toggleTopic(t.key)"
          >
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <div class="row">
          <div class="col">
            <label class="lbl">Độ khó</label>
            <div class="seg small">
              <button v-for="l in LEVELS" :key="l.key" :class="{ on: level === l.key }" @click="level = l.key">
                {{ l.label }}
              </button>
            </div>
          </div>
          <div class="col">
            <label class="lbl">Số câu</label>
            <div class="seg small">
              <button v-for="n in [5, 8, 10]" :key="n" :class="{ on: count === n }" @click="count = n">{{ n }}</button>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <label class="lbl">Thời gian</label>
            <div class="seg small">
              <button v-for="d in DURATIONS" :key="d.key" :class="{ on: durationMin === d.key }" @click="durationMin = d.key">
                {{ d.label }}
              </button>
            </div>
          </div>
          <div class="col">
            <label class="lbl">Bài coding trong buổi</label>
            <div class="seg small">
              <button v-for="n in [0, 1, 2]" :key="n" :class="{ on: codingCount === n }" @click="codingCount = n">{{ n }}</button>
            </div>
          </div>
        </div>

        <button class="start" @click="begin">Bắt đầu phỏng vấn →</button>
        <p v-if="!mi.listenable" class="warn">⚠️ Trình duyệt không hỗ trợ mic — bạn vẫn gõ chữ trả lời được.</p>
      </div>
    </section>

    <!-- ============ ĐANG PHỎNG VẤN ============ -->
    <section v-else-if="mi.phase.value === 'running'" class="running">
      <div class="run-head">
        <button class="back" @click="mi.restart()">← Thoát</button>
        <div class="progress">
          <div class="track"><div class="fill" :style="{ width: mi.progressPct.value + '%' }"></div></div>
          <span>Đã trả lời {{ mi.answered.value }}/{{ mi.total.value }}</span>
        </div>
        <span v-if="mi.isTimed.value" class="timer" :class="{ low: mi.remainingSec.value <= 60 }">⏱ {{ mi.remainingLabel.value }}</span>
      </div>

      <div class="qa-list">
        <div v-for="(r, i) in mi.qa.value" :key="i" class="round">
          <div class="q">
            <span class="q-num">Câu {{ i + 1 }}</span>
            <p class="q-text">{{ r.q }}</p>
            <button v-if="mi.speakable" class="icon" title="Đọc to" @click="mi.replay(r.q)">🔊</button>
          </div>

          <p v-if="r.answer" class="answer"><b>Bạn:</b> {{ r.answer }}</p>

          <div v-if="r.evaluating" class="evaluating">⏳ AI đang chấm…</div>

          <div v-else-if="r.evaluation" class="eval">
            <div class="eval-top">
              <span class="score-badge" :style="{ background: scoreColor(r.evaluation.score) }">
                {{ r.evaluation.score }}
              </span>
              <span class="verdict">{{ r.evaluation.verdict }}</span>
            </div>
            <ul v-if="r.evaluation.strengths?.length" class="good">
              <li v-for="(s, k) in r.evaluation.strengths" :key="'s' + k">✅ {{ s }}</li>
            </ul>
            <ul v-if="r.evaluation.gaps?.length" class="bad">
              <li v-for="(g, k) in r.evaluation.gaps" :key="'g' + k">⚠️ {{ g }}</li>
            </ul>
            <p v-if="r.evaluation.ideal" class="ideal"><b>💡 Đáp án gợi ý:</b> {{ r.evaluation.ideal }}</p>
          </div>
        </div>
      </div>

      <div v-if="mi.error.value" class="err">
        {{ mi.error.value }}
        <button v-if="mi.retry.value" class="mini" @click="mi.retry.value()">Thử lại</button>
      </div>

      <!-- Bài coding trong buổi -->
      <div v-if="mi.awaitingCode.value" class="composer coding-composer">
        <CodeEditor v-model="mi.currentRound.value.code" />
        <div v-if="mi.currentRound.value.runOutput" class="out" :class="{ bad: !mi.currentRound.value.runOutput.ok }">
          <pre v-if="mi.currentRound.value.runOutput.stdout">{{ mi.currentRound.value.runOutput.stdout }}</pre>
          <pre v-if="mi.currentRound.value.runOutput.stderr" class="stderr">{{ mi.currentRound.value.runOutput.stderr }}</pre>
        </div>
        <div class="composer-actions">
          <button class="mic" :disabled="mi.loading.value" @click="mi.runCode()">▶ Chạy thử</button>
          <button class="send" :disabled="mi.loading.value" @click="mi.submitCode()">Nộp bài</button>
        </div>
      </div>

      <!-- Ô trả lời câu hiện tại -->
      <div v-else-if="mi.awaitingAnswer.value" class="composer">
        <textarea
          v-model="mi.input.value"
          rows="3"
          placeholder="Trả lời như đang phỏng vấn thật… (gõ hoặc bấm 🎤 để nói)"
          @keydown.enter.exact.prevent="mi.submit()"
        ></textarea>
        <div class="composer-actions">
          <button v-if="mi.listenable" class="mic" :class="{ live: mi.listening.value }" @click="mi.toggleMic()">
            {{ mi.listening.value ? '⏹️ Dừng' : '🎤 Nói' }}
          </button>
          <button class="send" :disabled="!mi.input.value.trim() || mi.loading.value" @click="mi.submit()">Gửi</button>
        </div>
      </div>

      <div v-else-if="mi.loading.value && !mi.qa.value.length" class="evaluating">⏳ Đang chuẩn bị câu hỏi…</div>

      <!-- Đã trả lời hết -> tổng kết -->
      <button v-if="mi.done.value" class="finish" :disabled="mi.loading.value" @click="mi.finish()">
        {{ mi.loading.value ? 'Đang tổng kết…' : '🏁 Kết thúc & nhận báo cáo' }}
      </button>
    </section>

    <!-- ============ BÁO CÁO ============ -->
    <section v-else class="report">
      <button class="back" @click="mi.restart()">← Phỏng vấn lại</button>
      <h1 class="title">📊 Kết quả phỏng vấn</h1>

      <div class="overall">
        <div class="gauge" :style="{ '--c': scoreColor(mi.report.value.overall) }">
          <span class="big">{{ mi.report.value.overall }}</span><span class="unit">/100</span>
        </div>
        <p class="verdict-big">{{ mi.report.value.verdict }}</p>
      </div>

      <p v-if="mi.report.value.summary" class="summary">{{ mi.report.value.summary }}</p>

      <div v-if="mi.report.value.byTopic.length" class="card">
        <h3>Điểm theo chủ đề</h3>
        <div v-for="t in mi.report.value.byTopic" :key="t.topic" class="topic-row">
          <span class="topic-name">{{ topicLabel(t.topic) }}</span>
          <div class="track"><div class="fill" :style="{ width: t.score + '%', background: scoreColor(t.score) }"></div></div>
          <span class="topic-score">{{ t.score }}</span>
        </div>
      </div>

      <div class="two-col">
        <div v-if="mi.report.value.strengths.length" class="card good-card">
          <h3>💪 Điểm mạnh</h3>
          <ul><li v-for="(s, i) in mi.report.value.strengths" :key="i">{{ s }}</li></ul>
        </div>
        <div v-if="mi.report.value.gaps.length" class="card bad-card">
          <h3>🎯 Cần cải thiện</h3>
          <ul><li v-for="(g, i) in mi.report.value.gaps" :key="i">{{ g }}</li></ul>
        </div>
      </div>

      <div v-if="mi.report.value.advice.length" class="card">
        <h3>📌 Lời khuyên trước phỏng vấn thật</h3>
        <ul><li v-for="(a, i) in mi.report.value.advice" :key="i">{{ a }}</li></ul>
      </div>

      <div class="report-actions">
        <button class="start" @click="mi.restart()">🔁 Phỏng vấn lại</button>
        <button v-if="mi.report.value.byTopic.length" class="ghost" @click="reviewWeak()">📚 Ôn chủ đề yếu</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding: 32px 24px 80px;
  max-width: 760px;
}
.back {
  background: none;
  border: none;
  color: var(--purple);
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 12px;
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.sub {
  color: var(--muted);
  margin: 8px 0 22px;
}
.presets {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.preset {
  flex: 1;
  min-width: 200px;
  text-align: left;
  border: 1px solid var(--purple);
  background: var(--purple-soft);
  border-radius: 14px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preset-label {
  font-weight: 800;
  color: var(--purple);
}
.preset-blurb {
  font-size: 12.5px;
  color: var(--muted);
}
.card {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 18px;
}
.lbl {
  display: block;
  font-weight: 700;
  font-size: 14px;
  margin: 16px 0 8px;
}
.lbl:first-child {
  margin-top: 0;
}
.hint {
  color: var(--muted-2);
  font-weight: 500;
  font-size: 12.5px;
}
.seg {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.seg button {
  flex: 1;
  min-width: 110px;
  padding: 11px;
  border-radius: 11px;
  border: 1px solid var(--line-soft);
  background: var(--surface-1, var(--surface));
  font-weight: 700;
  cursor: pointer;
  color: var(--slate);
}
.seg.small button {
  min-width: 60px;
  padding: 9px;
  font-size: 13px;
}
.seg button.on {
  background: var(--grad-purple);
  color: #fff;
  border-color: transparent;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 8px 13px;
  border-radius: 99px;
  border: 1px solid var(--line-soft);
  background: var(--surface-1, var(--surface));
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--slate);
}
.chip.on {
  background: var(--purple-soft);
  border-color: var(--purple);
  color: var(--purple);
}
.row {
  display: flex;
  gap: 18px;
}
.col {
  flex: 1;
}
.start {
  margin-top: 22px;
  width: 100%;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  padding: 15px;
  border-radius: 13px;
  background: var(--grad-purple);
}
.warn {
  margin-top: 12px;
  font-size: 13px;
  color: var(--muted-2);
}
/* —— Running —— */
.run-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.progress {
  flex: 1;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.timer {
  font-weight: 800;
  font-size: 14px;
  color: var(--purple);
  white-space: nowrap;
}
.timer.low {
  color: #ff5f57;
}
.coding-composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.out {
  background: var(--surface-1, rgba(108, 92, 231, 0.05));
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
}
.out.bad {
  background: rgba(255, 95, 87, 0.08);
}
.out pre {
  white-space: pre-wrap;
  margin: 0;
}
.out .stderr {
  color: #ff5f57;
  margin-top: 6px;
}
.track {
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg, rgba(108, 92, 231, 0.12));
  margin-bottom: 5px;
}
.fill {
  height: 100%;
  border-radius: 99px;
  background: var(--grad-brand, var(--grad-purple));
  transition: width 0.3s;
}
.round {
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 14px;
}
.q {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.q-num {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--purple);
  background: var(--purple-soft);
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
  margin-top: 2px;
}
.q-text {
  flex: 1;
  font-weight: 700;
  font-size: 15.5px;
  line-height: 1.5;
}
.icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.answer {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--slate);
  background: var(--surface-1, rgba(108, 92, 231, 0.05));
  padding: 10px 12px;
  border-radius: 10px;
}
.evaluating {
  margin-top: 12px;
  color: var(--muted);
  font-weight: 600;
}
.eval {
  margin-top: 14px;
  border-top: 1px dashed var(--line-soft);
  padding-top: 12px;
}
.eval-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.score-badge {
  color: #fff;
  font-weight: 800;
  padding: 3px 11px;
  border-radius: 99px;
  font-size: 14px;
}
.verdict {
  font-weight: 800;
}
.eval ul {
  margin: 4px 0;
  padding-left: 4px;
  list-style: none;
}
.eval li {
  font-size: 13.5px;
  line-height: 1.5;
  margin: 3px 0;
}
.ideal {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.55;
  background: rgba(0, 194, 129, 0.08);
  padding: 10px 12px;
  border-radius: 10px;
}
.composer {
  position: sticky;
  bottom: 12px;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
.composer textarea {
  width: 100%;
  border: none;
  resize: vertical;
  background: transparent;
  font: inherit;
  color: var(--slate);
  outline: none;
}
.composer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}
.mic,
.send {
  border: none;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 11px;
}
.mic {
  background: var(--purple-soft);
  color: var(--purple);
}
.mic.live {
  background: #ff5f57;
  color: #fff;
}
.send {
  background: var(--grad-purple);
  color: #fff;
}
.send:disabled {
  opacity: 0.5;
  cursor: default;
}
.finish {
  margin-top: 8px;
  width: 100%;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  padding: 15px;
  border-radius: 13px;
  background: linear-gradient(135deg, #00d68f, #00a86f);
}
.err {
  color: #ff5f57;
  font-weight: 600;
  margin: 10px 0;
}
.mini {
  margin-left: 8px;
  border: 1px solid currentColor;
  background: none;
  color: inherit;
  border-radius: 8px;
  padding: 3px 10px;
  cursor: pointer;
  font-weight: 700;
}
/* —— Report —— */
.overall {
  text-align: center;
  margin: 18px 0;
}
.gauge {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 10px solid var(--c);
  color: var(--c);
}
.gauge .big {
  font-size: 52px;
  font-weight: 800;
}
.gauge .unit {
  font-size: 16px;
  font-weight: 700;
}
.verdict-big {
  font-size: 19px;
  font-weight: 800;
  margin-top: 14px;
}
.summary {
  text-align: center;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 20px;
}
.topic-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}
.topic-name {
  width: 130px;
  font-size: 13.5px;
  font-weight: 600;
}
.topic-row .track {
  flex: 1;
  margin: 0;
}
.topic-score {
  width: 30px;
  text-align: right;
  font-weight: 800;
  font-size: 13px;
}
.two-col {
  display: flex;
  gap: 18px;
}
.two-col .card {
  flex: 1;
}
.good-card {
  border-left: 3px solid #00c281;
}
.bad-card {
  border-left: 3px solid #FFB020;
}
.report h3 {
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 10px;
}
.report .card ul {
  padding-left: 18px;
  line-height: 1.6;
  font-size: 14px;
}
.report-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.report-actions .start {
  margin-top: 0;
}
.ghost {
  flex: 1;
  border: 1px solid var(--purple);
  background: none;
  color: var(--purple);
  font-weight: 800;
  border-radius: 13px;
  cursor: pointer;
  font-size: 15px;
}
@media (max-width: 600px) {
  .row,
  .two-col {
    flex-direction: column;
    gap: 10px;
  }
  .topic-name {
    width: 92px;
  }
}
</style>
