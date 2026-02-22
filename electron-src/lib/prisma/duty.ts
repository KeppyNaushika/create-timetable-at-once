import { getPrismaClient } from "./client"

export async function getDuties() {
  const prisma = getPrismaClient()
  try {
    return await prisma.duty.findMany({
      include: {
        teacherDuties: {
          include: { teacher: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getDutyById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.duty.findUnique({
      where: { id },
      include: {
        teacherDuties: {
          include: { teacher: true },
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createDuty(data: {
  name: string
  shortName?: string
  dayOfWeek: number
  period: number
  sortOrder?: number
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.duty.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateDuty(
  id: string,
  data: {
    name?: string
    shortName?: string
    dayOfWeek?: number
    period?: number
    sortOrder?: number
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.duty.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteDuty(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.duty.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}
