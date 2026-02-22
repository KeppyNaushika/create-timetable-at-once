import { getPrismaClient } from "./client"

export async function getPatterns() {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetablePattern.findMany({
      orderBy: { createdAt: "desc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createPattern(data: { name?: string; status?: string }) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetablePattern.create({
      data: {
        name: data.name ?? "",
        status: data.status ?? "draft",
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deletePattern(id: string) {
  const prisma = getPrismaClient()
  try {
    await prisma.timetablePattern.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function adoptPattern(id: string) {
  const prisma = getPrismaClient()
  try {
    // 他のパターンをdraftに戻す
    await prisma.timetablePattern.updateMany({
      where: { status: "adopted" },
      data: { status: "candidate" },
    })
    return await prisma.timetablePattern.update({
      where: { id },
      data: { status: "adopted" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getPatternWithSlots(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetablePattern.findUnique({
      where: { id },
      include: {
        slots: {
          orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updatePatternScore(
  id: string,
  data: { violationCount: number; score: number }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.timetablePattern.update({
      where: { id },
      data,
    })
  } finally {
    await prisma.$disconnect()
  }
}
