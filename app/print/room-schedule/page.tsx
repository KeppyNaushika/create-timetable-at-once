"use client"

import { PrintableGrid } from "@/components/print/PrintableGrid"
import { PrintPageLayout } from "@/components/print/PrintPageLayout"

export default function RoomSchedulePrintPage() {
  return (
    <PrintPageLayout reportType="room-schedule">
      {({ data, settings }) => {
        const daysPerWeek = data.school?.daysPerWeek ?? 5
        const maxPeriods = data.school?.maxPeriodsPerDay ?? 6
        const komaMap = new Map(data.komas.map((k) => [k.id, k]))

        if (data.rooms.length === 0) {
          return (
            <div className="text-muted-foreground py-8 text-center">
              特別教室が登録されていません
            </div>
          )
        }

        return (
          <div>
            {data.rooms.map((room) => {
              const roomSlots = data.slots.filter((s) => {
                const k = komaMap.get(s.komaId)
                return k?.komaRooms?.some((kr) => kr.roomId === room.id)
              })
              return (
                <PrintableGrid
                  key={room.id}
                  title={`${room.name} 利用予定`}
                  slots={roomSlots}
                  komas={data.komas}
                  subjects={data.subjects}
                  daysPerWeek={daysPerWeek}
                  maxPeriodsPerDay={maxPeriods}
                  gridLines={settings.gridLines}
                  footer={settings.footer}
                />
              )
            })}
          </div>
        )
      }}
    </PrintPageLayout>
  )
}
