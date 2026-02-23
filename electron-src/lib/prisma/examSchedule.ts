import { getPrismaClient } from "./client"

export async function getExamSchedules() {
  const prisma = getPrismaClient()
  try {
    return await prisma.examSchedule.findMany({
      include: { assignments: true },
      orderBy: { startDate: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getExamScheduleById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examSchedule.findUnique({
      where: { id },
      include: { assignments: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createExamSchedule(data: {
  name: string
  startDate: string
  endDate: string
  subjectsJson?: string
  notes?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examSchedule.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateExamSchedule(
  id: string,
  data: {
    name?: string
    startDate?: string
    endDate?: string
    subjectsJson?: string
    notes?: string
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examSchedule.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteExamSchedule(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examSchedule.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}
