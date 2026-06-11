export default defineNuxtPlugin(() => {
  const router = useRouter()

  function handler(e: KeyboardEvent) {
    if ((e.target as HTMLElement)?.matches('input, textarea, select')) return

    if (e.key === '?' && !e.shiftKey) {
      e.preventDefault()
      const existing = document.getElementById('kb-help-overlay')
      if (existing) {
        existing.remove()
        return
      }
      const overlay = document.createElement('div')
      overlay.id = 'kb-help-overlay'
      overlay.innerHTML = `
        <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.7)">
          <div class="bg-[#111] border border-[#333] rounded p-6 max-w-sm w-full mx-4">
            <div class="text-[#aaa] text-xs mb-4 tracking-wider">KEYBOARD SHORTCUTS</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-[#bbb]">Market</span><span class="text-[#00c853] font-mono">1</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Portfolio</span><span class="text-[#00c853] font-mono">2</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Alerts</span><span class="text-[#00c853] font-mono">3</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Screener</span><span class="text-[#00c853] font-mono">4</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Search</span><span class="text-[#00c853] font-mono">/ or g</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Reload</span><span class="text-[#00c853] font-mono">r</span></div>
              <div class="flex justify-between"><span class="text-[#bbb]">Help</span><span class="text-[#00c853] font-mono">?</span></div>
            </div>
            <div class="text-[#555] text-xs mt-4 text-center">Press ? or Escape to close</div>
          </div>
        </div>
      `
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay.firstChild || e.target === overlay) overlay.remove()
      })
      document.body.appendChild(overlay)
      return
    }

    if (e.key === 'Escape') {
      const existing = document.getElementById('kb-help-overlay')
      if (existing) {
        existing.remove()
        return
      }
    }

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
