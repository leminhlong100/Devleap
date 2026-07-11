import { ref } from 'vue'
import {
  TOUR_SLIDES,
  hasSeenTour,
  markTourSeen,
  hasPickedCourse,
  isChecklistDismissed,
  dismissChecklist,
  computeChecklist,
} from '@/lib/onboarding'

/** Tour ngắn 3–4 bước ở trang chủ, dismiss vĩnh viễn (Bước 3.1). */
export function useOnboardingTour() {
  const showTour = ref(!hasSeenTour())
  const slideIndex = ref(0)

  function closeTour() {
    markTourSeen()
    showTour.value = false
  }
  function nextSlide() {
    if (slideIndex.value >= TOUR_SLIDES.length - 1) {
      closeTour()
      return
    }
    slideIndex.value += 1
  }
  function prevSlide() {
    if (slideIndex.value > 0) slideIndex.value -= 1
  }

  return { slides: TOUR_SLIDES, showTour, slideIndex, nextSlide, prevSlide, closeTour }
}

/** Checklist khởi động sau đăng nhập đầu (Bước 3.1). */
export function useOnboardingChecklist() {
  const dismissedNow = ref(false)

  function checklist(sessionsDone, reminderEnabled) {
    return computeChecklist({ coursePicked: hasPickedCourse(), sessionsDone, reminderEnabled })
  }

  function shouldShowChecklist(sessionsDone, reminderEnabled) {
    if (dismissedNow.value || isChecklistDismissed()) return false
    return checklist(sessionsDone, reminderEnabled).some((s) => !s.done)
  }

  function dismiss() {
    dismissChecklist()
    dismissedNow.value = true
  }

  return { checklist, shouldShowChecklist, dismiss }
}
