import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

// Stub vue-router.useRoute để trả về route giả (không cần dựng router thật).
const fakeRoute = reactive({ fullPath: '/a' })
vi.mock('vue-router', () => ({
  useRoute: () => fakeRoute,
}))

import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'

function mountBoundary(childSetup) {
  const el = document.createElement('div')
  const Child = defineComponent({ setup: childSetup })
  const app = createApp({
    render: () => h(AppErrorBoundary, null, { default: () => h(Child) }),
  })
  app.mount(el)
  return { app, el }
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    fakeRoute.fullPath = '/a'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('hiện fallback khi view con ném lỗi (không trắng app)', async () => {
    const { el } = mountBoundary(() => {
      throw new Error('bùm render')
    })
    await nextTick()
    expect(el.textContent).toContain('trục trặc')
    expect(el.querySelector('[role="alert"]')).toBeTruthy()
    expect(el.textContent).toContain('Thử lại')
  })

  it('render con bình thường khi không có lỗi', async () => {
    const { el } = mountBoundary(() => () => h('span', 'nội dung ổn'))
    await nextTick()
    expect(el.textContent).toContain('nội dung ổn')
    expect(el.querySelector('[role="alert"]')).toBeFalsy()
  })

  it('xóa lỗi khi điều hướng sang path khác', async () => {
    const { el } = mountBoundary(() => {
      if (fakeRoute.fullPath === '/a') throw new Error('bùm')
      return () => h('span', 'trang mới')
    })
    await nextTick()
    expect(el.textContent).toContain('trục trặc')

    fakeRoute.fullPath = '/b'
    await nextTick()
    await nextTick()
    expect(el.textContent).not.toContain('trục trặc')
    expect(el.textContent).toContain('trang mới')
  })
})
