import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

// Stub vue-router.useRoute — không cần dựng router thật (giống errorBoundary.test.js).
const fakeRoute = reactive({ fullPath: '/', meta: {} })
vi.mock('vue-router', () => ({
  useRoute: () => fakeRoute,
}))

import { usePageMeta } from '@/composables/usePageMeta'

function ensureMetaTags() {
  document.head.innerHTML = `
    <meta name="description" content="mặc định" />
    <meta property="og:title" content="mặc định" />
    <meta property="og:description" content="mặc định" />
    <meta property="og:url" content="/" />
    <meta name="twitter:title" content="mặc định" />
    <meta name="twitter:description" content="mặc định" />
  `
}

function mount() {
  const el = document.createElement('div')
  const app = createApp({
    setup() {
      usePageMeta()
      return () => h('div')
    },
  })
  app.mount(el)
  return app
}

describe('usePageMeta', () => {
  beforeEach(() => {
    ensureMetaTags()
    fakeRoute.fullPath = '/'
    fakeRoute.meta = {}
  })

  it('dùng tiêu đề/mô tả mặc định khi route không khai meta', async () => {
    mount()
    await nextTick()
    expect(document.title).toBe('Devleap — Nền tảng học lập trình & tiếng Anh')
    expect(document.head.querySelector('meta[name="description"]').content).toContain('chơi một game')
  })

  it('ghi tiêu đề/mô tả theo route.meta và cập nhật OG/Twitter', async () => {
    fakeRoute.fullPath = '/courses/java'
    fakeRoute.meta = { title: 'Khóa Java 12 tuần', description: 'Mô tả khóa Java' }
    mount()
    await nextTick()
    expect(document.title).toBe('Khóa Java 12 tuần · Devleap')
    expect(document.head.querySelector('meta[property="og:title"]').content).toBe('Khóa Java 12 tuần · Devleap')
    expect(document.head.querySelector('meta[property="og:description"]').content).toBe('Mô tả khóa Java')
    expect(document.head.querySelector('meta[name="twitter:title"]').content).toBe('Khóa Java 12 tuần · Devleap')
  })

  it('cập nhật lại khi chuyển route', async () => {
    mount()
    await nextTick()
    fakeRoute.fullPath = '/tools'
    fakeRoute.meta = { title: 'Khu công cụ' }
    await nextTick()
    expect(document.title).toBe('Khu công cụ · Devleap')
  })
})
