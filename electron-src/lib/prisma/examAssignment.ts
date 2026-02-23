import { getPrismaClient } from "./client"

export async function getExamAssignmentsByScheduleId(scheduleId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examAssignment.findMany({
      where: { examScheduleId: scheduleId },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchUpsertExamAssignments(
  scheduleId: string,
  assignments: {
    date: string
    period: number
    subjectId: string
    classId: string
    supervisorId: string
    assignedBy?: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    // Delete existing assignments for this schedule, then create new ones
    await prisma.examAssignment.deleteMany({
      where: { examScheduleId: scheduleId },
    })
    return await prisma.examAssignment.createMany({
      data: assignments.map((a) => ({
        examScheduleId: scheduleId,
        date: a.date,
        period: a.period,
        subjectId: a.subjectId,
        classId: a.classId,
        supervisorId: a.supervisorId,
        assignedBy: a.assignedBy ?? "auto",
      })),
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteExamAssignment(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examAssignment.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function clearExamAssignments(scheduleId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.examAssignment.deleteMany({
      where: { examScheduleId: scheduleId },
    })
  } finally {
    await prisma.$disconnect()
  }
}
