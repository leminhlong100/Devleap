import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, h, nextTick } from 'vue'

// <Transition> chờ transitionend (không tự bắn trong happy-dom) trước khi gỡ
// phần tử leave — đợi thêm 1 nhịp timer để Vue rơi về timeout dự phòng.
const flush = () => new Promise((r) => setTimeout(r, 250))

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const track = vi.fn()
vi.mock('@/composables/useAnalytics', () => ({ useAnalytics: () => ({ track }) }))

// Cô lập khỏi nội dung khóa học thật: chỉ cần 1 kết quả cố định để test điều
// hướng bàn phím, không phụ thuộc từ vựng/bài học nào đang có trong data thật.
const FAKE_ITEM = { id: 'x1', type: 'lesson', title: 'Kế thừa', subtitle: 'Java', icon: '📄', course: 'java', courseLabel: 'Java', count: 1, route: { name: 'java-day', params: { week: 1, day: 1 } } }
vi.mock('@/data/searchIndex', () => ({
  searchAll: (q) => (q.trim() ? [FAKE_ITEM] : []),
  normalize: (s) => (s || '').toLowerCase(),
}))

import GlobalSearch from '@/components/search/GlobalSearch.vue'

let current = null

function mountPalette() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(GlobalSearch) })
  app.mount(el)
  current = { app, el }
  return current
}

describe('GlobalSearch — command palette bàn phím', () => {
  beforeEach(() => {
    push.mockClear()
    track.mockClear()
  })

  // Quan trọng: gỡ hẳn app trước (bỏ listener `keydown` toàn cục khỏi
  // window) rồi mới xóa khỏi DOM — nếu không, phím tắt ở test sau sẽ đồng
  // thời mở/đóng CẢ những instance test trước còn "sống", làm sai lệch kết
  // quả `document.querySelector` (nhiều dialog cùng tồn tại).
  afterEach(() => {
    current?.app.unmount()
    current?.el.remove()
    current = null
  })

  it('Ctrl/Cmd+K mở bảng lệnh, focus vào ô tìm kiếm, bắn sự kiện search_open', async () => {
    const { el } = mountPalette()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(document.activeElement).toBe(document.querySelector('.pal-input'))
    expect(track).toHaveBeenCalledWith('search_open')

    el.remove()
  })

  it('Esc đóng bảng lệnh', async () => {
    const { el } = mountPalette()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    expect(document.querySelector('[role="dialog"]')).toBeTruthy()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flush()
    expect(document.querySelector('[role="dialog"]')).toBeFalsy()

    el.remove()
  })

  it('click 1 kết quả -> điều hướng router rồi đóng bảng', async () => {
    const { el } = mountPalette()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    const input = document.querySelector('.pal-input')
    input.value = 'ke thua'
    input.dispatchEvent(new Event('input'))
    await nextTick()

    const result = document.querySelector('.res')
    expect(result).toBeTruthy()
    result.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()

    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith(FAKE_ITEM.route)
    expect(document.querySelector('[role="dialog"]')).toBeFalsy()

    el.remove()
  })
})
