import { getPrismaClient } from "./client"

export async function getDailyChangesByScheduleId(scheduleId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailyChange.findMany({
      where: { dailyScheduleId: scheduleId },
      orderBy: { period: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createDailyChange(data: {
  dailyScheduleId: string
  classId: string
  period: number
  changeType: string
  originalKomaId?: string
  substituteTeacherId?: string
  rescheduleDate?: string
  reschedulePeriod?: number
  notes?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailyChange.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateDailyChange(
  id: string,
  data: {
    classId?: string
    period?: number
    changeType?: string
    originalKomaId?: string | null
    substituteTeacherId?: string | null
    rescheduleDate?: string | null
    reschedulePeriod?: number | null
    notes?: string
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.dailyChange.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteDailyChange(id: string) {
  const prisma = getPrismaClient()
  try {
    await prisma.dailyChange.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}
