"use client"

import { useEffect } from "react"

interface ShortcutDefinition {
  key: string
  modifiers: string[]
  handler: () => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  useEffect(() => {
    if (shortcuts.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        const needsCtrl = shortcut.modifiers.includes("ctrl")
        const needsMeta = shortcut.modifiers.includes("meta")
        const needsShift = shortcut.modifiers.includes("shift")
        const needsAlt = shortcut.modifiers.includes("alt")

        // "ctrl" in modifiers matches both Ctrl (Windows/Linux) and Meta (Mac)
        const ctrlOrMetaMatch =
          needsCtrl || needsMeta
            ? e.ctrlKey || e.metaKey
            : !e.ctrlKey && !e.metaKey

        const shiftMatch = needsShift ? e.shiftKey : !e.shiftKey
        const altMatch = needsAlt ? e.altKey : !e.altKey

        if (keyMatch && ctrlOrMetaMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [shortcuts])
}
