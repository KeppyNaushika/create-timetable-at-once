import { getPrismaClient } from "./client"

export async function batchSetTeachersForDuty(
  dutyId: string,
  teacherIds: string[]
) {
  const prisma = getPrismaClient()
  try {
    await prisma.$transaction(async (tx) => {
      // 既存の割当を全削除
      await tx.teacherDuty.deleteMany({ where: { dutyId } })

      // 新しい割当を作成
      if (teacherIds.length > 0) {
        await tx.teacherDuty.createMany({
          data: teacherIds.map((teacherId) => ({
            dutyId,
            teacherId,
          })),
        })
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}
