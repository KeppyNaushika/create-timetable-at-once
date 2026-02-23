import { getPrismaClient } from "./client"

export async function getDailySchedulesByMonth(yearMonth: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailySchedule.findMany({
      where: { date: { startsWith: yearMonth } },
      include: { changes: true },
      orderBy: { date: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getDailyScheduleByDate(date: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailySchedule.findUnique({
      where: { date },
      include: { changes: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function upsertDailySchedule(data: {
  date: string
  scheduleType?: string
  periodsCount?: number | null
  reason?: string
  notes?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailySchedule.upsert({
      where: { date: data.date },
      update: data,
      create: data,
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteDailySchedule(id: string) {
  const prisma = getPrismaClient()
  try {
    await prisma.dailySchedule.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}
