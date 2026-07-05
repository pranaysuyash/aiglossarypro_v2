import { useCallback, useState } from "react"

export type ToastVariant = "default" | "success" | "error" | "warning"

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastIdCounter = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const addToast = useCallback((message: string, variant: ToastVariant = "default", duration = 4000) => {
    const id = `toast-${++toastIdCounter}`
    const toast: Toast = { id, message, variant, duration }

    setState((prev) => ({ toasts: [...prev.toasts, toast] }))

    if (duration > 0) {
      setTimeout(() => {
        setState((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== id) }))
  }, [])

  const success = useCallback((message: string, duration?: number) => addToast(message, "success", duration), [addToast])
  const error = useCallback((message: string, duration?: number) => addToast(message, "error", duration), [addToast])
  const warning = useCallback((message: string, duration?: number) => addToast(message, "warning", duration), [addToast])

  return { toasts: state.toasts, addToast, removeToast, success, error, warning }
}
