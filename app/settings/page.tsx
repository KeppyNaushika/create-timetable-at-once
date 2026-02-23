"use client"

import { Settings, Palette, Keyboard } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BackupSettings } from "@/components/settings/BackupSettings"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ShortcutHelpDialog } from "@/components/common/ShortcutHelpDialog"
import { useBackup } from "@/hooks/useBackup"
import { useTheme } from "@/hooks/useTheme"
import { useState, useCallback } from "react"

export default function SettingsPage() {
  const {
    backups,
    loading: backupLoading,
    createBackup,
    restoreBackup,
    deleteBackup,
  } = useBackup()

  const { theme, resolvedTheme, setTheme } = useTheme()
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)

  const handleThemeToggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          <Settings className="mr-2 inline h-5 w-5" />
          設定
        </h1>
        <p className="text-sm text-muted-foreground">
          アプリケーションの設定を管理します
        </p>
      </div>

      {/* Theme settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            外観設定
          </CardTitle>
          <CardDescription>テーマやカラーモードの設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>カラーモード</Label>
              <p className="text-sm text-muted-foreground">
                現在: {resolvedTheme === "dark" ? "ダーク" : "ライト"}モード
                {theme === "system" ? "（システム設定に追従）" : ""}
              </p>
            </div>
            <ThemeToggle theme={resolvedTheme} onToggle={handleThemeToggle} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>テーマ追従</Label>
              <p className="text-sm text-muted-foreground">
                OSのダークモード設定に自動で追従します
              </p>
            </div>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
            >
              システム設定に追従
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-4 w-4" />
            キーボードショートカット
          </CardTitle>
          <CardDescription>
            操作を効率化するキーボードショートカット
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShortcutHelpOpen(true)}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            ショートカット一覧を表示
          </Button>
        </CardContent>
      </Card>

      {/* Backup settings */}
      <BackupSettings
        backups={backups}
        onCreateBackup={createBackup}
        onRestoreBackup={restoreBackup}
        onDeleteBackup={deleteBackup}
        loading={backupLoading}
      />

      <ShortcutHelpDialog
        open={shortcutHelpOpen}
        onClose={() => setShortcutHelpOpen(false)}
      />
    </div>
  )
}
