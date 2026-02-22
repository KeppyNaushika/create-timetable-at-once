import { getPrismaClient } from "./client"

export async function getGrades() {
  const prisma = getPrismaClient()
  try {
    return await prisma.grade.findMany({
      include: { classes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { gradeNum: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getGradeById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.grade.findUnique({
      where: { id },
      include: { classes: { orderBy: { sortOrder: "asc" } } },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createGrade(data: { gradeNum: number; name: string }) {
  const prisma = getPrismaClient()
  try {
    return await prisma.grade.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateGrade(
  id: string,
  data: { gradeNum?: number; name?: string }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.grade.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteGrade(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.grade.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}
