import { getPrismaClient } from "./client"

export async function getTeachers() {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.findMany({
      include: { availabilities: true },
      orderBy: { name: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getTeacherById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.findUnique({
      where: { id },
      include: { availabilities: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createTeacher(data: {
  name: string
  nameKana?: string
  mainSubjectId?: string
  maxPeriodsPerWeek?: number
  notes?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateTeacher(
  id: string,
  data: {
    name?: string
    nameKana?: string
    mainSubjectId?: string | null
    maxPeriodsPerWeek?: number
    notes?: string
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteTeacher(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getTeacherWithAvailabilities(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.teacher.findUnique({
      where: { id },
      include: {
        availabilities: {
          orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchImportTeachers(
  teachers: {
    name: string
    nameKana?: string
    mainSubjectId?: string
    maxPeriodsPerWeek?: number
    notes?: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      teachers.map((t) => prisma.teacher.create({ data: t }))
    )
  } finally {
    await prisma.$disconnect()
  }
}
