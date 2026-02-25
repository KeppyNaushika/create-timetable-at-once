"use client"

import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    setResolvedTheme(resolved)
    const root = document.documentElement
    if (resolved === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  const resolveTheme = useCallback((t: Theme): ResolvedTheme => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return t
  }, [])

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      try {
        setThemeState(newTheme)
        const resolved = resolveTheme(newTheme)
        applyTheme(resolved)
        await window.electronAPI.settingSet("theme", newTheme)
      } catch {
        // Silently ignore save errors; the theme is still applied visually
      }
    },
    [applyTheme, resolveTheme]
  )

  // Initialize theme from stored setting
  useEffect(() => {
    const init = async () => {
      try {
        const stored = await window.electronAPI.settingGet("theme")
        const initial: Theme =
          stored === "light" || stored === "dark" || stored === "system"
            ? stored
            : "system"
        setThemeState(initial)
        applyTheme(resolveTheme(initial))
      } catch {
        applyTheme(resolveTheme("system"))
      }
    }
    init()
  }, [applyTheme, resolveTheme])

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (theme === "system") {
        const resolved = mediaQuery.matches ? "dark" : "light"
        applyTheme(resolved)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, applyTheme])

  return {
    theme,
    resolvedTheme,
    setTheme,
  }
}
