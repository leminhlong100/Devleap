<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { defaultCode } from '@/data/tools'
import { runJavaCode, friendlyRunError } from '@/lib/runJava'
import CodeEditor from '@/components/tools/CodeEditor.vue'

// Khi mở từ một ngày học, view truyền code mẫu của ngày đó vào.
const props = defineProps({ initial: { type: Object, default: null } })

const user = useUserStore()
const { isOnline } = useOnlineStatus()
const startCode = () => props.initial?.code || defaultCode
const fileName = computed(() => props.initial?.file || 'Main.java')
const code = ref(startCode())
const output = ref(null) // { ok, stage: 'compile'|'run', stdout, stderr } | null
const running = ref(false)
const runError = ref('')
const hasRun = ref(false)
const rewarded = ref(false)

// Đổi ngày học -> nạp lại code mẫu mới.
watch(
  () => props.initial,
  () => {
    code.value = startCode()
    output.value = null
    runError.value = ''
    hasRun.value = false
  },
)

// Chạy THẬT qua Netlify Function run-java.js (Judge0 CE) — không còn mô phỏng bằng regex.
async function run() {
  if (running.value || !isOnline.value) return
  running.value = true
  runError.value = ''
  output.value = null
  try {
    const result = await runJavaCode(code.value)
    output.value = result
    hasRun.value = true
    // Chỉ thưởng XP khi code THẬT SỰ chạy thành công (biên dịch + chạy không lỗi) — khác
    // hành vi mô phỏng cũ (luôn thưởng chỉ cần bấm Chạy), vì giờ ta biết chắc kết quả thật.
    if (!rewarded.value && result.ok) {
      user.addXp(15)
      rewarded.value = true
    }
  } catch (e) {
    runError.value = friendlyRunError(e)
  } finally {
    running.value = false
  }
}
function reset() {
  code.value = startCode()
  output.value = null
  runError.value = ''
  hasRun.value = false
}
</script>

<template>
  <div class="pg">
    <div class="pg-head">
      <div>
        <h2 class="tool-title">💻 Code Playground · Java</h2>
        <p class="tool-sub">Gõ code rồi bấm <b>Chạy</b> để xem kết quả in ra ngay trong trình duyệt.</p>
      </div>
      <span class="task-tag">{{ props.initial ? `📌 Code mẫu: ${fileName}` : '📌 Bài tập: in lời chào' }}</span>
    </div>

    <div class="pg-grid">
      <div class="editor">
        <div class="bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="file">{{ fileName }}</span>
        </div>
        <CodeEditor v-model="code" class="code-area" />
      </div>

      <div class="console">
        <div class="console-label">KẾT QUẢ / CONSOLE</div>
        <div v-if="runError" class="run-error">⚠️ {{ runError }}</div>
        <template v-else-if="hasRun && output">
          <div v-if="output.stage === 'compile'" class="compile-tag">🛑 Lỗi biên dịch</div>
          <pre v-if="output.stdout" class="line">{{ output.stdout }}</pre>
          <pre v-if="output.stderr" class="line err-line">{{ output.stderr }}</pre>
          <div v-if="!output.stdout && !output.stderr" class="line">(chương trình chạy xong, không có gì được in ra)</div>
          <div v-if="output.ok" class="ok">✓ Chạy thành công · +15 XP</div>
        </template>
        <div v-else-if="running" class="empty">
          <span class="cat-emoji">⏳</span>
          <span>Đang chạy code thật trên máy chủ…</span>
        </div>
        <div v-else class="empty">
          <span class="cat-emoji">🐱</span>
          <span>Bấm <b>▶ Chạy code</b> để xem<br />chương trình của bạn in ra gì.</span>
        </div>
      </div>
    </div>

    <div class="pg-cta">
      <button class="reset" @click="reset">↺ Đặt lại</button>
      <button
        class="run"
        :disabled="running || !isOnline"
        :title="!isOnline ? 'Cần có mạng để chạy code' : undefined"
        @click="run"
      >
        {{ running ? '⏳ Đang chạy…' : isOnline ? '▶ Chạy code' : '🔌 Cần có mạng' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pg {
  background: var(--surface);
  border: 1px solid rgba(108, 92, 231, 0.1);
  border-radius: 28px;
  padding: clamp(16px, 4vw, 32px);
  box-shadow: 0 18px 50px rgba(108, 92, 231, 0.1);
}
.pg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
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
.task-tag {
  background: rgba(108, 92, 231, 0.1);
  color: var(--purple);
  font-size: 12.5px;
  font-weight: 800;
  padding: 7px 14px;
  border-radius: 99px;
  white-space: nowrap;
}
.pg-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 18px;
}
.editor {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #2a2a3e;
  background: #1e1e2e;
}
.bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 16px;
  background: #15151f;
  border-bottom: 1px solid #2a2a3e;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot.r {
  background: #ff5f57;
}
.dot.y {
  background: #febc2e;
}
.dot.g {
  background: #28c840;
}
.file {
  margin-left: 8px;
  color: var(--muted-2);
  font-size: 12.5px;
  font-weight: 600;
}
.code-area {
  display: block;
  background: #1e1e2e;
}
.console {
  border-radius: 16px;
  border: 1px solid #2a2a3e;
  background: #15151f;
  padding: 16px 18px;
  min-height: 340px;
  font-family: var(--mono);
  font-size: 13.5px;
  line-height: 1.65;
  overflow: auto;
}
.console-label {
  color: #6a6a82;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.line {
  color: #d6f5e6;
  white-space: pre-wrap;
  font-family: var(--mono);
  margin: 0 0 6px;
}
.err-line {
  color: #ff8a80;
}
.compile-tag {
  color: #ff8a80;
  font-weight: 700;
  margin-bottom: 10px;
}
.run-error {
  color: #ffb03a;
  line-height: 1.6;
}
.ok {
  color: var(--green);
  margin-top: 14px;
  font-weight: 700;
}
.empty {
  color: #5a5a72;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 260px;
  line-height: 1.6;
}
.empty b {
  color: var(--muted-2);
}
.cat-emoji {
  font-size: 34px;
  margin-bottom: 8px;
}
.pg-cta {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  justify-content: flex-end;
}
.reset,
.run {
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  border-radius: 13px;
}
.reset {
  border: 1px solid rgba(108, 92, 231, 0.2);
  color: var(--slate);
  padding: 13px 22px;
  background: var(--surface);
}
.reset:hover {
  background: var(--purple-soft);
}
.run {
  border: none;
  font-weight: 800;
  color: #fff;
  padding: 13px 28px;
  background: var(--grad-green);
  box-shadow: 0 10px 24px rgba(0, 214, 143, 0.32);
  transition: transform 0.18s;
}
.run:hover {
  transform: translateY(-2px);
}
.run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
@media (max-width: 760px) {
  .pg-grid {
    grid-template-columns: 1fr;
  }
}
</style>
