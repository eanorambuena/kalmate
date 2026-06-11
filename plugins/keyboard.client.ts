export default defineNuxtPlugin(() => {
  const router = useRouter()

  function handler(e: KeyboardEvent) {
    if ((e.target as HTMLElement)?.matches('input, textarea, select')) return
    if (e.key === '1') router.push('/')
    if (e.key === '2') router.push('/portfolio')
    if (e.key === '3') router.push('/alerts')
    if (e.key === '4') router.push('/screener')
    if (e.key === '/') {
      e.preventDefault()
      const input = document.querySelector<HTMLInputElement>('input[type="text"]')
      input?.focus()
    }
    if (e.key === 'g') {
      const input = document.querySelector<HTMLInputElement>('input[type="text"]')
      input?.focus()
    }
    if (e.key === 'r') {
      window.location.reload()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handler)
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handler)
    }
  })
})
