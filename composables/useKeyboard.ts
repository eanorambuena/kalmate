export function useKeyboard() {
  function setup(router: ReturnType<typeof useRouter>) {
    function handler(e: KeyboardEvent) {
      if (e.key === '1') router.push('/')
      if (e.key === '2') router.push('/portfolio')
      if (e.key === '3') router.push('/alerts')
      if (e.key === '/' && !(e.target as HTMLElement)?.matches('input, textarea')) {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('input[type="text"]')
        input?.focus()
      }
    }
    onMounted(() => window.addEventListener('keydown', handler))
    onUnmounted(() => window.removeEventListener('keydown', handler))
  }

  return { setup }
}
