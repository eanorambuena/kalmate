export function useScrollReveal(threshold = 0.2, delay = 0) {
  const el = ref<HTMLElement | null>(null)
  const visible = ref(false)

  onMounted(() => {
    const target = el.value
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => { visible.value = true }, delay)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(target)
  })

  return { el, visible }
}
