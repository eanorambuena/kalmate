export function useScrollReveal(threshold = 0.2, delay = 0) {
  const el = ref<HTMLElement | null>(null)
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const target = el.value
    if (!target) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => { visible.value = true }, delay)
          observer?.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(target)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { el, visible }
}
