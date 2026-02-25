"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { KOMA_TYPES } from "@/lib/constants"
import type { Koma, SpecialRoom } from "@/types/common.types"

interface KomaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  koma: Koma | null
  rooms: SpecialRoom[]
  onUpdateKoma: (id: string, data: Record<string, unknown>) => Promise<void>
  onSetRooms: (komaId: string, roomIds: string[]) => Promise<void>
}

export function KomaDetailDialog({
  open,
  onOpenChange,
  koma,
  rooms,
  onUpdateKoma,
  onSetRooms,
}: KomaDetailDialogProps) {
  const [type, setType] = useState("normal")
  const [priority, setPriority] = useState(5)
  const [label, setLabel] = useState("")
  const [roomIds, setRoomIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && koma) {
      setType(koma.type)
      setPriority(koma.priority)
      setLabel(koma.label)
      setRoomIds(new Set(koma.komaRooms?.map((kr) => kr.roomId) ?? []))
    }
  }, [open, koma])

  const handleRoomToggle = useCallback((roomId: string, checked: boolean) => {
    setRoomIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(roomId)
      } else {
        next.delete(roomId)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!koma) return
    setSaving(true)
    try {
      await onUpdateKoma(koma.id, { type, priority, label })
      await onSetRooms(koma.id, Array.from(roomIds))
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }, [
    koma,
    type,
    priority,
    label,
    roomIds,
    onUpdateKoma,
    onSetRooms,
    onOpenChange,
  ])

  if (!koma) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>詳細設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">種類</Label>
            <RadioGroup
              value={type}
              onValueChange={setType}
              className="flex gap-4"
            >
              {Object.entries(KOMA_TYPES).map(([value, name]) => (
                <div key={value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={value} id={`detail-type-${value}`} />
                  <Label htmlFor={`detail-type-${value}`} className="text-sm">
                    {name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">優先順位 (0-9)</Label>
              <Input
                type="number"
                min={0}
                max={9}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">ラベル</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="任意"
              />
            </div>
          </div>

          {rooms.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">使用教室</Label>
              <div className="space-y-1">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`detail-room-${room.id}`}
                      checked={roomIds.has(room.id)}
                      onCheckedChange={(checked) =>
                        handleRoomToggle(room.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`detail-room-${room.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {room.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
