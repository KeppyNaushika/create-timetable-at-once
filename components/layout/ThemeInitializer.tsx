"use client"

import { useEffect } from "react"

export function ThemeInitializer() {
  useEffect(() => {
    const initTheme = async () => {
      try {
        const saved = await window.electronAPI?.settingGet?.("theme")
        const theme = saved || "system"

        if (theme === "dark") {
          document.documentElement.classList.add("dark")
        } else if (theme === "system") {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches
          if (prefersDark) {
            document.documentElement.classList.add("dark")
          }
        }
      } catch {
        // electronAPI not available (e.g. during SSR)
      }
    }
    initTheme()
  }, [])

  return null
}
