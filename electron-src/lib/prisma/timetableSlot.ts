import { getPrismaClient } from "./client"

export async function placeSlot(data: {
  patternId: string
  komaId: string
  dayOfWeek: number
  period: number
  placedBy?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetableSlot.create({
      data: {
        patternId: data.patternId,
        komaId: data.komaId,
        dayOfWeek: data.dayOfWeek,
        period: data.period,
        placedBy: data.placedBy ?? "manual",
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function removeSlot(patternId: string, slotId: string) {
  const prisma = getPrismaClient()
  try {
    await prisma.timetableSlot.delete({
      where: { id: slotId, patternId },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function fixSlot(slotId: string, isFixed: boolean) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetableSlot.update({
      where: { id: slotId },
      data: { isFixed, placedBy: isFixed ? "fixed" : "manual" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchPlaceSlots(
  patternId: string,
  slots: {
    komaId: string
    dayOfWeek: number
    period: number
    placedBy?: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      slots.map((s) =>
        prisma.timetableSlot.create({
          data: {
            patternId,
            komaId: s.komaId,
            dayOfWeek: s.dayOfWeek,
            period: s.period,
            placedBy: s.placedBy ?? "auto",
          },
        })
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function clearSlots(patternId: string, keepFixed: boolean) {
  const prisma = getPrismaClient()
  try {
    if (keepFixed) {
      await prisma.timetableSlot.deleteMany({
        where: { patternId, isFixed: false },
      })
    } else {
      await prisma.timetableSlot.deleteMany({
        where: { patternId },
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function getSlotsByPatternId(patternId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetableSlot.findMany({
      where: { patternId },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}
