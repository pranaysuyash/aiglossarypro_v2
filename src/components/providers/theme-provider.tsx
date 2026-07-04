"use client"

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react"

type Palette = "warm" | "slate"

interface ThemeContextValue {
  palette: Palette
  setPalette: (palette: Palette) => void
  resolvedPalette: Palette
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultPalette?: Palette
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultPalette = "warm",
  storageKey = "aiglossary-palette",
}: ThemeProviderProps) {
  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window === "undefined") {
      return defaultPalette
    }
    const stored = window.localStorage.getItem(storageKey) as Palette | null
    if (stored === "warm" || stored === "slate") {
      return stored
    }
    return defaultPalette
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-palette", palette)
  }, [palette])

  const setPalette = useCallback(
    (newPalette: Palette) => {
      localStorage.setItem(storageKey, newPalette)
      setPaletteState(newPalette)
    },
    [storageKey],
  )

  const value = useMemo(
    () => ({ palette, setPalette, resolvedPalette: palette }),
    [palette, setPalette],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
