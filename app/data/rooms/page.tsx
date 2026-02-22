"use client"

import { Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { AvailabilityGrid } from "@/components/timetable/AvailabilityGrid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRooms } from "@/hooks/useRooms"
import { useSchool } from "@/hooks/useSchool"
import type { SpecialRoom } from "@/types/common.types"

export default function RoomsPage() {
  const {
    rooms,
    loading,
    createRoom,
    updateRoom,
    deleteRoom,
    upsertAvailability,
    fetchRooms,
  } = useRooms()
  const { school } = useSchool()

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formShortName, setFormShortName] = useState("")

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId])

  const handleCreateRoom = useCallback(async () => {
    if (!formName.trim()) {
      toast.error("教室名を入力してください")
      return
    }
    try {
      const created = await createRoom({
        name: formName,
        shortName: formShortName,
      })
      setSelectedRoomId(created.id)
      setDialogOpen(false)
      setFormName("")
      setFormShortName("")
      toast.success("特別教室を追加しました")
    } catch {
      toast.error("追加に失敗しました")
    }
  }, [formName, formShortName, createRoom])

  const handleDeleteRoom = useCallback(
    async (room: SpecialRoom) => {
      try {
        await deleteRoom(room.id)
        if (selectedRoomId === room.id) {
          setSelectedRoomId(null)
        }
        toast.success("特別教室を削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deleteRoom, selectedRoomId]
  )

  const handleUpdateField = useCallback(
    async (field: string, value: unknown) => {
      if (!selectedRoom) return
      try {
        await updateRoom(selectedRoom.id, { [field]: value })
      } catch {
        toast.error("更新に失敗しました")
      }
    },
    [selectedRoom, updateRoom]
  )

  const handleAvailabilityToggle = useCallback(
    async (dayOfWeek: number, period: number, newStatus: string) => {
      if (!selectedRoom) return
      try {
        await upsertAvailability({
          roomId: selectedRoom.id,
          dayOfWeek,
          period,
          status: newStatus,
        })
        await fetchRooms()
      } catch {
        toast.error("都合の更新に失敗しました")
      }
    },
    [selectedRoom, upsertAvailability, fetchRooms]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="特別教室設定"
        description="特別教室の情報と使用可能時間を設定します"
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          教室を追加
        </Button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* 左: 教室リスト */}
        <div className="w-56 border-r">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedRoomId === room.id
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedRoomId(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedRoomId(room.id)
                  }}
                >
                  <span>{room.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRoom(room)
                    }}
                  >
                    <Trash2 className="text-destructive h-3 w-3" />
                  </Button>
                </div>
              ))}
              {rooms.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  特別教室がありません
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右: 詳細 */}
        <div className="flex-1 overflow-auto">
          {selectedRoom ? (
            <div className="p-6">
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">基本情報</TabsTrigger>
                  <TabsTrigger value="availability">都合</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 space-y-4">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>教室名</Label>
                          <Input
                            key={selectedRoom.id + "-name"}
                            defaultValue={selectedRoom.name}
                            onBlur={(e) =>
                              handleUpdateField("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>略名</Label>
                          <Input
                            key={selectedRoom.id + "-shortName"}
                            defaultValue={selectedRoom.shortName}
                            onBlur={(e) =>
                              handleUpdateField("shortName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>収容人数</Label>
                          <Input
                            key={selectedRoom.id + "-capacity"}
                            type="number"
                            min={1}
                            defaultValue={selectedRoom.capacity}
                            onBlur={(e) =>
                              handleUpdateField(
                                "capacity",
                                parseInt(e.target.value) || 40
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>備考</Label>
                        <Input
                          key={selectedRoom.id + "-notes"}
                          defaultValue={selectedRoom.notes}
                          onBlur={(e) =>
                            handleUpdateField("notes", e.target.value)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="availability" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>使用可能時間</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AvailabilityGrid
                        roomId={selectedRoom.id}
                        daysPerWeek={school?.daysPerWeek ?? 5}
                        maxPeriodsPerDay={school?.maxPeriodsPerDay ?? 6}
                        hasZeroPeriod={school?.hasZeroPeriod ?? false}
                        availabilities={selectedRoom.availabilities ?? []}
                        onToggle={handleAvailabilityToggle}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                左のリストから教室を選択してください
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>特別教室を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>教室名</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例: 音楽室"
              />
            </div>
            <div className="space-y-2">
              <Label>略名</Label>
              <Input
                value={formShortName}
                onChange={(e) => setFormShortName(e.target.value)}
                placeholder="例: 音"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateRoom}>追加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
