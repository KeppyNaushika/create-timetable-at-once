"use client"

import { useEffect, useMemo } from "react"
import { Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SHORTCUT_DEFINITIONS } from "@/lib/shortcuts"

interface ShortcutHelpDialogProps {
  open: boolean
  onClose: () => void
}

export function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  // Group shortcuts by category
  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; description: string }[]
    >()
    for (const shortcut of SHORTCUT_DEFINITIONS) {
      const list = groups.get(shortcut.category) ?? []
      list.push({ label: shortcut.label, description: shortcut.description })
      groups.set(shortcut.category, list)
    }
    return groups
  }, [])

  const categories = Array.from(grouped.keys())

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            キーボードショートカット
          </DialogTitle>
          <DialogDescription>
            よく使うキーボードショートカット一覧
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          <div className="space-y-4 pr-4">
            {categories.map((category, idx) => {
              const shortcuts = grouped.get(category) ?? []
              return (
                <div key={category}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {category}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">キー</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shortcuts.map((shortcut) => (
                        <TableRow key={shortcut.label}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {shortcut.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {shortcut.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
