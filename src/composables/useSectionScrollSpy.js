import { ref, onMounted, onUnmounted } from 'vue'

// Theo dõi các phần tử có [data-agenda-key] trong trang buổi học (DayView/IeltsDayView)
// để AgendaRail biết mục nào đang hiện trên màn hình (thanh ngang mobile) và để bấm
// vào một mục trong rail có thể cuộn tới đúng phần tương ứng. Dùng document.querySelectorAll
// thay vì template ref vì chỉ có đúng 1 buổi học được mount tại một thời điểm.
export function useSectionScrollSpy() {
  const activeKey = ref(null)
  let observer = null

  function refresh() {
    observer?.disconnect()
    const els = document.querySelectorAll('[data-agenda-key]')
    if (!els.length) return
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (!visible.length) return
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        activeKey.value = top.target.dataset.agendaKey
      },
      // Trừ đi phần header + thanh rail ngang dính trên (mobile) và ưu tiên mục ngay dưới đường đó.
      { rootMargin: '-130px 0px -60% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
  }

  function scrollToKey(key) {
    const el = document.querySelector(`[data-agenda-key="${key}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  onMounted(refresh)
  onUnmounted(() => observer?.disconnect())

  return { activeKey, scrollToKey, refresh }
}
