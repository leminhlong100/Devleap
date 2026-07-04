<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import QuizTool from '@/components/tools/QuizTool.vue'

const props = defineProps({
  day: { type: Object, required: true },
  plan: { type: Object, required: true },
  // 3 cờ này phụ thuộc store + tính "cổng hoàn thành buổi" nên vẫn tính ở
  // IeltsDayView.vue (agenda/dayReady/nextGateLabel cũng cần) — truyền xuống
  // thay vì tính lại ở đây để khỏi lệch 2 nguồn sự thật.
  showGrammarDrills: { type: Boolean, default: false },
  grammarGateNeeded: { type: Boolean, default: false },
  grammarPassed: { type: Boolean, default: false },
})

const user = useUserStore()
const grammarDrills = computed(() => props.day?.grammarDrills || [])

function onGrammarComplete(r) {
  user.recordGrammarDay('ielts', props.day.week, props.day.n, r.score, r.total, 0.7)
}
</script>

<template>
  <!-- GRAMMAR (theo ngày: điểm mới / ôn tập / tổng hợp cuối tuần) -->
  <section v-if="plan.grammar && day.grammar.length" class="step-card">
    <div class="step-head">
      <div>
        <div class="eyebrow">{{ day.grammarMode === 'new' ? 'NGỮ PHÁP HÔM NAY' : day.grammarMode === 'final' ? 'TỔNG HỢP NGỮ PHÁP TUẦN' : 'ÔN TẬP NGỮ PHÁP' }}</div>
        <h2 class="step-title">
          {{ day.grammarMode === 'new' ? '📖 Điểm ngữ pháp của buổi' : day.grammarMode === 'final' ? '🧩 Ôn lại toàn bộ ngữ pháp tuần' : '🔁 Ôn lại ngữ pháp đã học' }}
        </h2>
      </div>
    </div>
    <p v-if="day.grammarMode !== 'new'" class="quiz-intro">
      {{ day.grammarMode === 'final' ? 'Buổi cuối tuần — xâu chuỗi lại tất cả điểm ngữ pháp trước khi làm bài kiểm tra tuần.' : 'Hôm nay không có điểm mới — ôn lại cho nhớ rồi luyện tập bên dưới.' }}
    </p>
    <div v-for="(g, i) in day.grammar" :key="i" class="grammar-block">
      <h3 class="grammar-title">{{ g.title }}</h3>
      <div class="prose" v-html="g.html"></div>
    </div>
  </section>

  <!-- LUYỆN TẬP NGỮ PHÁP — bắt buộc ở ngày học MỚI; ngày ôn là tự chọn -->
  <section v-if="showGrammarDrills" class="step-card" :class="{ current: grammarGateNeeded && !grammarPassed }">
    <div class="step-head">
      <div>
        <div class="eyebrow" :class="{ green: grammarPassed }">{{ grammarGateNeeded ? 'LUYỆN TẬP — VẬN DỤNG NGAY' : 'ÔN LẠI — TỰ CHỌN' }}</div>
        <h2 class="step-title">✏️ Bài tập ngữ pháp ({{ grammarDrills.length }} câu)</h2>
      </div>
      <span class="wt-badge" :class="{ ok: grammarPassed }">{{ grammarGateNeeded ? (grammarPassed ? '✅ Đã đạt' : 'Cần ≥70%') : 'Tự chọn' }}</span>
    </div>
    <p v-if="grammarGateNeeded" class="quiz-intro">Điền chỗ trống và sửa câu sai. <b>Đạt từ 70%</b> để hoàn thành buổi và mở buổi kế tiếp.</p>
    <p v-else class="quiz-intro">Ôn lại điểm ngữ pháp đã học cho nhớ — <b>không bắt buộc</b> để qua buổi.</p>
    <div class="grammar-drill">
      <QuizTool :questions="grammarDrills" mode="practice" :pass-threshold="0.7" embedded @complete="onGrammarComplete" />
    </div>
    <div v-if="grammarGateNeeded && grammarPassed" class="gate-line ok">✅ Bạn đã đạt phần luyện tập.</div>
    <div v-else-if="grammarGateNeeded" class="gate-line">🔒 Đạt ≥70% phần luyện tập để hoàn thành buổi.</div>
  </section>
</template>

<style scoped src="./ieltsDaySection.css"></style>
<style scoped>
.grammar-block + .grammar-block {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(108, 92, 231, 0.08);
}
.grammar-title {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--ink);
  margin-top: 14px;
}
</style>
