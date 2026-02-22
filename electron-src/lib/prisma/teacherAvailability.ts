import { getPrismaClient } from "./client"

export async function upsertTeacherAvailability(data: {
  teacherId: string
  dayOfWeek: number
  period: number
  status: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacherAvailability.upsert({
      where: {
        teacherId_dayOfWeek_period: {
          teacherId: data.teacherId,
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

export async function batchUpsertTeacherAvailabilities(
  items: {
    teacherId: string
    dayOfWeek: number
    period: number
    status: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      items.map((item) =>
        prisma.teacherAvailability.upsert({
          where: {
            teacherId_dayOfWeek_period: {
              teacherId: item.teacherId,
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

export async function getTeacherAvailabilities(teacherId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacherAvailability.findMany({
      where: { teacherId },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}
