import { getPrismaClient } from "./client"

export async function upsertRoomAvailability(data: {
  roomId: string
  dayOfWeek: number
  period: number
  status: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.roomAvailability.upsert({
      where: {
        roomId_dayOfWeek_period: {
          roomId: data.roomId,
          dayOfWeek: data.dayOfWeek,
          period: data.period,
        },
      },
      update: { status: data.status },
      create: data,
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchUpsertRoomAvailabilities(
  items: {
    roomId: string
    dayOfWeek: number
    period: number
    status: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      items.map((item) =>
        prisma.roomAvailability.upsert({
          where: {
            roomId_dayOfWeek_period: {
              roomId: item.roomId,
              dayOfWeek: item.dayOfWeek,
              period: item.period,
            },
          },
          update: { status: item.status },
          create: item,
        })
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function getRoomAvailabilities(roomId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.roomAvailability.findMany({
      where: { roomId },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}
