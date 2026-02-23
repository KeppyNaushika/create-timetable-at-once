import "./globals.css"
import "@fontsource/noto-sans-jp/400.css"
import "@fontsource/noto-sans-jp/500.css"
import "@fontsource/noto-sans-jp/700.css"

import type { Metadata } from "next"

import { ToastProvider } from "@/components/common/ToastProvider"
import { AppShell } from "@/components/layout/AppShell"
import { ThemeInitializer } from "@/components/layout/ThemeInitializer"

export const metadata: Metadata = {
  title: "一括時間割作成",
  description: "中学校向け時間割自動作成アプリケーション",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
        <ThemeInitializer />
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  )
}
