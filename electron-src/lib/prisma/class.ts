import { getPrismaClient } from "./client"

export async function getClasses() {
  const prisma = getPrismaClient()
  try {
    return await prisma.class.findMany({
      include: { grade: true },
      orderBy: [{ grade: { gradeNum: "asc" } }, { sortOrder: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getClassesByGradeId(gradeId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.class.findMany({
      where: { gradeId },
      orderBy: { sortOrder: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createClass(data: {
  gradeId: string
  name: string
  sortOrder?: number
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.class.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateClass(
  id: string,
  data: { name?: string; sortOrder?: number }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.class.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteClass(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.class.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchCreateClasses(
  classes: { gradeId: string; name: string; sortOrder: number }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      classes.map((c) => prisma.class.create({ data: c }))
    )
  } finally {
    await prisma.$disconnect()
  }
}
