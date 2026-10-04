import { computed } from 'vue'

export type ToastColor = 'success' | 'info' | 'warning' | 'error' | 'neutral'

export interface AppToast {
  id: string
  title: string
  description?: string
  color?: ToastColor
  duration?: number
}

const DEFAULT_DURATION = 3500
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function useAppToast() {
  const toasts = useState<AppToast[]>('app-toasts', () => [])

  const add = (toast: Partial<AppToast>) => {
    const id = toast.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const duration = toast.duration ?? DEFAULT_DURATION

    const nextToast: AppToast = {
      id,
      title: toast.title ?? 'Notificación',
      description: toast.description,
      color: toast.color ?? 'info',
      duration,
    }

    toasts.value = [...toasts.value, nextToast].slice(-5)

    if (toastTimers.has(id)) {
      clearTimeout(toastTimers.get(id))
    }

    if (duration > 0 && import.meta.client) {
      const timer = setTimeout(() => {
        remove(id)
      }, duration)
      toastTimers.set(id, timer)
    }

    return nextToast
  }

  const remove = (id: string) => {
    if (toastTimers.has(id)) {
      clearTimeout(toastTimers.get(id))
      toastTimers.delete(id)
    }
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const clear = () => {
    for (const timer of toastTimers.values()) {
      clearTimeout(timer)
    }
    toastTimers.clear()
    toasts.value = []
  }

  const hasToasts = computed(() => toasts.value.length > 0)

  return {
    toasts,
    hasToasts,
    add,
    remove,
    clear,
  }
}
