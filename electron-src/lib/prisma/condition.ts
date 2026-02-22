import { getPrismaClient } from "./client"

export async function getCondition() {
  const prisma = getPrismaClient()
  try {
    return await prisma.scheduleCondition.findFirst({
      include: { perSubjectConditions: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function upsertCondition(data: Record<string, unknown>) {
  const prisma = getPrismaClient()
  try {
    const existing = await prisma.scheduleCondition.findFirst()
    if (existing) {
      return await prisma.scheduleCondition.update({
        where: { id: existing.id },
        data,
        include: { perSubjectConditions: true },
      })
    }
    return await prisma.scheduleCondition.create({
      data: data as Parameters<
        typeof prisma.scheduleCondition.create
      >[0]["data"],
      include: { perSubjectConditions: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function upsertPerSubjectCondition(data: {
  conditionId: string
  subjectId: string
  placementRestriction?: string
  maxPerDay?: number
}) {
  const prisma = getPrismaClient()
  try {
    const existing = await prisma.perSubjectCondition.findUnique({
      where: {
        conditionId_subjectId: {
          conditionId: data.conditionId,
          subjectId: data.subjectId,
        },
      },
    })
    if (existing) {
      return await prisma.perSubjectCondition.update({
        where: { id: existing.id },
        data: {
          placementRestriction: data.placementRestriction,
          maxPerDay: data.maxPerDay,
        },
      })
    }
    return await prisma.perSubjectCondition.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deletePerSubjectCondition(
  conditionId: string,
  subjectId: string
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.perSubjectCondition.deleteMany({
      where: { conditionId, subjectId },
    })
  } finally {
    await prisma.$disconnect()
  }
}
