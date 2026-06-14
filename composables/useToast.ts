export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])

function add(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2, 8)
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), 3000)
}

function remove(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToast() {
  return { toasts, add, remove }
}
