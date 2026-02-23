import { getPrismaClient } from "./client"

export async function getSchoolEvents() {
  const prisma = getPrismaClient()
  try {
    return await prisma.schoolEvent.findMany({
      orderBy: { date: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getSchoolEventsByDateRange(startDate: string, endDate: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.schoolEvent.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createSchoolEvent(data: {
  date: string
  eventType: string
  name: string
  isAllDay?: boolean
  affectedPeriods?: number
  notes?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.schoolEvent.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateSchoolEvent(
  id: string,
  data: {
    date?: string
    eventType?: string
    name?: string
    isAllDay?: boolean
    affectedPeriods?: number
    notes?: string
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.schoolEvent.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteSchoolEvent(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.schoolEvent.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function importHolidays(holidays: { date: string; name: string }[]) {
  const prisma = getPrismaClient()
  try {
    // Get existing dates to skip duplicates
    const existing = await prisma.schoolEvent.findMany({
      where: {
        eventType: "national_holiday",
        date: { in: holidays.map((h) => h.date) },
      },
      select: { date: true },
    })
    const existingDates = new Set(existing.map((e) => e.date))

    const newHolidays = holidays.filter((h) => !existingDates.has(h.date))

    if (newHolidays.length > 0) {
      await prisma.schoolEvent.createMany({
        data: newHolidays.map((h) => ({
          date: h.date,
          eventType: "national_holiday",
          name: h.name,
          isAllDay: true,
          affectedPeriods: 0,
        })),
      })
    }

    return { count: newHolidays.length }
  } finally {
    await prisma.$disconnect()
  }
}
