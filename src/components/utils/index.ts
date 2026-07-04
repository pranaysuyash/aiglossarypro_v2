import { cn } from "@/lib/utils"

export const focusRing = cn(
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-2",
)

export const disabled = "disabled:pointer-events-none disabled:opacity-50"

export const fadeIn = "animate-in fade-in duration-300"
export const fadeOut = "animate-out fade-out duration-300"
export const slideInFromTop = "animate-in slide-in-from-top duration-300"
export const slideInFromBottom = "animate-in slide-in-from-bottom duration-300"
export const slideInFromLeft = "animate-in slide-in-from-left duration-300"
export const slideInFromRight = "animate-in slide-in-from-right duration-300"
export const zoomIn = "animate-in zoom-in-95 duration-300"
export const zoomOut = "animate-out zoom-out-95 duration-300"

export const modalEnter = cn(fadeIn, zoomIn, "duration-200")
export const modalExit = cn(fadeOut, zoomOut, "duration-200")
export const dropdownEnter = cn(fadeIn, slideInFromTop, "duration-150")
export const dropdownExit = cn(fadeOut, "slide-out-to-top", "duration-150")
