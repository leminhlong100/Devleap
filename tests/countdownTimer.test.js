import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import CountdownTimer from '@/components/day/CountdownTimer.vue'

function mount(props) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const events = { timeup: 0 }
  let vm
  const app = createApp({
    render: () => h(CountdownTimer, { ...props, ref: 'ct', onTimeup: () => (events.timeup += 1) }),
    mounted() {
      vm = this.$refs.ct
    },
  })
  app.mount(el)
  return { el, events, getVm: () => vm, app }
}
const btnByText = (el, txt) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent.includes(txt))

describe('CountdownTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('hiển thị mm:ss theo số phút', () => {
    const { el } = mount({ minutes: 2 })
    expect(el.querySelector('.ct-time').textContent).toBe('2:00')
  })

  it('đếm ngược khi bấm Bắt đầu', async () => {
    const { el } = mount({ minutes: 1 })
    btnByText(el, 'Bắt đầu').click()
    await nextTick()
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(el.querySelector('.ct-time').textContent).toBe('0:57')
  })

  it('về 0 -> phát timeup + hiện "Hết giờ"', async () => {
    const { el, events, getVm } = mount({ minutes: 1 })
    getVm().start()
    vi.advanceTimersByTime(60000)
    await nextTick()
    expect(events.timeup).toBe(1)
    expect(el.querySelector('.ct-time').textContent).toContain('Hết giờ')
    expect(el.querySelector('.ct').classList.contains('over')).toBe(true)
  })

  it('Đặt lại đưa về thời gian ban đầu', async () => {
    const { el, getVm } = mount({ minutes: 1 })
    getVm().start()
    vi.advanceTimersByTime(5000)
    await nextTick()
    btnByText(el, 'Đặt lại').click()
    await nextTick()
    expect(el.querySelector('.ct-time').textContent).toBe('1:00')
  })
})
