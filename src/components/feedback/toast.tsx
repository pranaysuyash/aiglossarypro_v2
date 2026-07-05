import { createContext, use, useMemo } from "react"
import { useToast, type Toast, type ToastVariant } from "../hooks/use-toast"

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => string
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-[var(--surface-card)] text-[var(--ink-primary)] border-[var(--border-subtle)]",
  success: "bg-[var(--surface-card)] text-[var(--ink-primary)] border-l-4 border-l-[var(--secondary)]",
  error: "bg-[var(--surface-card)] text-[var(--ink-primary)] border-l-4 border-l-[var(--accent-primary)]",
  warning: "bg-[var(--surface-card)] text-[var(--ink-primary)] border-l-4 border-l-[#d4a017]",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error("useToastContext must be used within a ToastProvider")
  return ctx
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null

  return (
    <div
      data-slot="toast-container"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      data-slot="toast"
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg text-sm animate-in slide-in-from-right ${variantStyles[toast.variant]}`}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        className="shrink-0 text-[var(--ink-dim)] hover:text-[var(--ink-primary)] transition-colors"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
