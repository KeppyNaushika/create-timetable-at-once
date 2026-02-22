"use client"

import { Navigation } from "./Navigation"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Navigation />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
