import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

interface Toast {
  id: string
  message: string
  variant: "default" | "success" | "error" | "warning"
  duration: number
}

function createToastManager() {
  let toasts: Toast[] = []
  let counter = 0
  const timers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  function addToast(message: string, variant: Toast["variant"] = "default", duration = 4000) {
    const id = `toast-${++counter}`
    toasts = [...toasts, { id, message, variant, duration }]

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
        timers.delete(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  function getToasts() { return toasts }

  return { addToast, removeToast, getToasts }
}

describe("ToastManager", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with empty toasts", () => {
    const manager = createToastManager()
    expect(manager.getToasts()).toEqual([])
  })

  it("adds a toast", () => {
    const manager = createToastManager()
    manager.addToast("Test message")
    expect(manager.getToasts()).toHaveLength(1)
    expect(manager.getToasts()[0].message).toBe("Test message")
    expect(manager.getToasts()[0].variant).toBe("default")
  })

  it("adds a success toast", () => {
    const manager = createToastManager()
    manager.addToast("Success!", "success")
    expect(manager.getToasts()[0].variant).toBe("success")
  })

  it("adds an error toast", () => {
    const manager = createToastManager()
    manager.addToast("Error!", "error")
    expect(manager.getToasts()[0].variant).toBe("error")
  })

  it("adds a warning toast", () => {
    const manager = createToastManager()
    manager.addToast("Warning!", "warning")
    expect(manager.getToasts()[0].variant).toBe("warning")
  })

  it("removes a toast by id", () => {
    const manager = createToastManager()
    const id = manager.addToast("Test")
    expect(manager.getToasts()).toHaveLength(1)
    manager.removeToast(id)
    expect(manager.getToasts()).toHaveLength(0)
  })

  it("auto-removes toast after duration", () => {
    const manager = createToastManager()
    manager.addToast("Auto-remove", "default", 1000)
    expect(manager.getToasts()).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(manager.getToasts()).toHaveLength(0)
  })

  it("does not auto-remove when duration is 0", () => {
    const manager = createToastManager()
    manager.addToast("Persistent", "default", 0)
    vi.advanceTimersByTime(10000)
    expect(manager.getToasts()).toHaveLength(1)
  })

  it("supports multiple toasts", () => {
    const manager = createToastManager()
    manager.addToast("First")
    manager.addToast("Second")
    expect(manager.getToasts()).toHaveLength(2)
  })
})
