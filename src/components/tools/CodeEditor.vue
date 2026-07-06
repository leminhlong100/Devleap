<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import {
  syntaxHighlighting,
  HighlightStyle,
  indentUnit,
  bracketMatching,
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { java } from '@codemirror/lang-java'
import { tags as t } from '@lezer/highlight'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const host = ref(null)
const view = shallowRef(null)

// Bảng màu syntax — khớp tông editor tối #1e1e2e của Playground.
const highlight = HighlightStyle.define([
  { tag: t.keyword, color: '#c792ea', fontWeight: '600' },
  { tag: [t.controlKeyword, t.moduleKeyword], color: '#c792ea' },
  { tag: [t.typeName, t.className, t.namespace], color: '#82aaff' },
  { tag: t.definition(t.variableName), color: '#e6e6f0' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#82aaff' },
  { tag: t.propertyName, color: '#e6e6f0' },
  { tag: [t.string, t.special(t.string)], color: '#c3e88d' },
  { tag: [t.number, t.bool, t.null], color: '#f78c6c' },
  { tag: t.comment, color: '#5a6a8a', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#89ddff' },
  { tag: t.annotation, color: '#ffcb6b' },
  { tag: t.invalid, color: '#ff5f57' },
])

// Theme khớp khung editor hiện có (nền tối, font mono dự án).
const theme = EditorView.theme(
  {
    '&': { backgroundColor: '#1e1e2e', color: '#e6e6f0', fontSize: '14px' },
    '.cm-content': {
      fontFamily: 'var(--mono)',
      padding: '16px 0',
      lineHeight: '1.6',
      caretColor: '#00d68f',
    },
    '.cm-scroller': { fontFamily: 'var(--mono)', overflow: 'auto' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': {
      backgroundColor: '#1e1e2e',
      color: '#4a4a62',
      border: 'none',
      paddingLeft: '6px',
    },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(108,92,231,.12)', color: '#9a9ab8' },
    '.cm-activeLine': { backgroundColor: 'rgba(108,92,231,.07)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#00d68f' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(108,92,231,.35)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(0,214,143,.22)',
      outline: '1px solid rgba(0,214,143,.5)',
    },
  },
  { dark: true },
)

function buildState(doc) {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      bracketMatching(),
      closeBrackets(),
      indentUnit.of('    '),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      java(),
      syntaxHighlighting(highlight),
      theme,
      EditorState.readOnly.of(props.readonly),
      EditorView.editable.of(!props.readonly),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
      }),
    ],
  })
}

onMounted(() => {
  view.value = new EditorView({ state: buildState(props.modelValue), parent: host.value })
})

onBeforeUnmount(() => {
  view.value?.destroy()
  view.value = null
})

// Đồng bộ thay đổi từ bên ngoài (reset, đổi ngày học) mà không làm gãy con trỏ
// khi giá trị đã khớp (tránh vòng lặp với updateListener).
watch(
  () => props.modelValue,
  (val) => {
    const v = view.value
    if (!v || val === v.state.doc.toString()) return
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: val } })
  },
)
</script>

<template>
  <div ref="host" class="cm-host" :class="{ ro: readonly }"></div>
</template>

<style scoped>
.cm-host {
  height: 300px;
  overflow: hidden;
}
.cm-host :deep(.cm-editor) {
  height: 100%;
}
/* Read-only (code mẫu): cao theo nội dung, không cuộn riêng. */
.cm-host.ro,
.cm-host.ro :deep(.cm-editor) {
  height: auto;
}
.cm-host.ro :deep(.cm-scroller) {
  overflow: visible;
}
</style>
