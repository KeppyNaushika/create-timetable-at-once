"use client"

import { useState, useCallback } from "react"
import {
  Download,
  RotateCcw,
  Trash2,
  HardDrive,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BackupSettingsProps {
  backups: { name: string; path: string; size: number; date: string }[]
  onCreateBackup: () => void
  onRestoreBackup: (path: string) => void
  onDeleteBackup: (path: string) => void
  loading?: boolean
}

type ConfirmAction = {
  type: "restore" | "delete"
  path: string
  name: string
} | null

export function BackupSettings({
  backups,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  loading,
}: BackupSettingsProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return
    if (confirmAction.type === "restore") {
      onRestoreBackup(confirmAction.path)
    } else {
      onDeleteBackup(confirmAction.path)
    }
    setConfirmAction(null)
  }, [confirmAction, onRestoreBackup, onDeleteBackup])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" />
                バックアップ管理
              </CardTitle>
              <CardDescription>
                データベースのバックアップと復元
              </CardDescription>
            </div>
            <Button onClick={onCreateBackup} disabled={loading} size="sm">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              バックアップ作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              バックアップがありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>サイズ</TableHead>
                  <TableHead>作成日時</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.path}>
                    <TableCell className="font-medium">
                      {backup.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(backup.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(backup.date).toLocaleString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmAction({
                              type: "restore",
                              path: backup.path,
                              name: backup.name,
                            })
                          }
                          disabled={loading}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          復元
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              path: backup.path,
                              name: backup.name,
                            })
                          }
                          disabled={loading}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(isOpen) => !isOpen && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "restore"
                ? "バックアップの復元"
                : "バックアップの削除"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "restore"
                ? `「${confirmAction?.name}」からデータを復元します。現在のデータは上書きされます。この操作は取り消せません。`
                : `「${confirmAction?.name}」を削除します。この操作は取り消せません。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              キャンセル
            </Button>
            <Button
              variant={
                confirmAction?.type === "delete" ? "destructive" : "default"
              }
              onClick={handleConfirm}
            >
              {confirmAction?.type === "restore" ? "復元する" : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
