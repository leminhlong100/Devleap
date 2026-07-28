<script setup>
/**
 * Thẻ hiển thị KẾT QUẢ AI CHỮA BÀI (dùng chung cho WritingCoach & SpeakingCoach).
 * review = { cefr, score, summary, lines: [{ original, corrected, ok, note, subject, verb }] }.
 * Gạch chân chủ ngữ (1 gạch) + động từ (2 gạch) trong câu AI đã sửa.
 */
defineProps({ review: { type: Object, required: true } })

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function svHtml(l) {
  const text = l?.corrected || ''
  const marks = []
  for (const [field, cls] of [['subject', 'u-subj'], ['verb', 'u-verb']]) {
    const frag = (l?.[field] || '').trim()
    if (!frag) continue
    const start = text.indexOf(frag)
    if (start >= 0) marks.push({ start, end: start + frag.length, cls })
  }
  marks.sort((a, b) => a.start - b.start)
  const clean = []
  let lastEnd = -1
  for (const mk of marks) {
    if (mk.start >= lastEnd) {
      clean.push(mk)
      lastEnd = mk.end
    }
  }
  let out = ''
  let pos = 0
  for (const mk of clean) {
    out += escapeHtml(text.slice(pos, mk.start))
    out += `<span class="${mk.cls}">${escapeHtml(text.slice(mk.start, mk.end))}</span>`
    pos = mk.end
  }
  out += escapeHtml(text.slice(pos))
  return out
}
</script>

<template>
  <div class="review">
    <div class="rev-top">
      <span class="rev-cefr">{{ review.cefr || '—' }}</span>
      <div class="rev-score-wrap">
        <div class="rev-score-bar"><div class="rev-score-fill" :style="{ width: (review.score || 0) + '%' }"></div></div>
        <span class="rev-score-num">{{ review.score ?? 0 }}/100</span>
      </div>
    </div>
    <p v-if="review.summary" class="rev-summary">{{ review.summary }}</p>
    <div class="rev-legend">Gạch chân: <span class="u-subj">chủ ngữ</span> · <span class="u-verb">động từ</span></div>
    <ul class="rev-lines">
      <li v-for="(l, i) in review.lines || []" :key="i" class="rev-line" :class="{ ok: l.ok }">
        <div v-if="!l.ok && l.corrected !== l.original" class="rev-orig"><s>{{ l.original }}</s></div>
        <div class="rev-corr"><span class="rev-mark">{{ l.ok ? '✓' : '✕' }}</span><span v-html="svHtml(l)"></span></div>
        <div v-if="l.note" class="rev-note">💡 {{ l.note }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.review {
  margin-top: 18px;
  border-top: 1px solid rgba(108, 92, 231, 0.1);
  padding-top: 18px;
}
.rev-top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.rev-cefr {
  background: var(--grad-purple);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 99px;
  flex: none;
}
.rev-score-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 160px;
}
.rev-score-bar {
  flex: 1;
  height: 8px;
  border-radius: 99px;
  background: var(--track-bg);
  overflow: hidden;
}
.rev-score-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #00d68f, #00a86f);
  transition: width 0.4s;
}
.rev-score-num {
  font-size: 13px;
  font-weight: 800;
  color: #00966a;
  flex: none;
}
.rev-summary {
  margin-top: 12px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--slate);
  background: var(--bg);
  border-left: 3px solid var(--purple);
  border-radius: 12px;
  padding: 12px 15px;
}
.rev-lines {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rev-line {
  border: 1px solid rgba(255, 107, 107, 0.25);
  background: rgba(255, 90, 90, 0.04);
  border-radius: 12px;
  padding: 11px 14px;
}
.rev-line.ok {
  border-color: rgba(0, 214, 143, 0.25);
  background: rgba(0, 214, 143, 0.05);
}
.rev-legend {
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted-2);
}
.rev-orig {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--muted-3);
}
.rev-orig s {
  text-decoration-color: rgba(255, 107, 107, 0.6);
}
.rev-mark {
  font-weight: 900;
  color: #e04848;
  margin-right: 7px;
}
.rev-line.ok .rev-mark {
  color: #00a86f;
}
.rev-corr {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.7;
}
.u-subj {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  text-decoration-color: var(--purple);
}
.u-verb {
  text-decoration: underline double;
  text-underline-offset: 3px;
  text-decoration-color: #00a86f;
}
.rev-note {
  margin-top: 6px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--slate);
}
</style>
