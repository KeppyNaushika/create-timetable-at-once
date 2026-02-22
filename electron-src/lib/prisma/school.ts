import { getPrismaClient } from "./client"

export async function getSchool() {
  const prisma = getPrismaClient()
  try {
    return await prisma.school.findFirst()
  } finally {
    await prisma.$disconnect()
  }
}

export async function createSchool(data: {
  name?: string
  academicYear?: number
  classCountsJson?: string
  namingConvention?: string
  daysPerWeek?: number
  maxPeriodsPerDay?: number
  hasZeroPeriod?: boolean
  periodNamesJson?: string
  periodLengthsJson?: string
  lunchAfterPeriod?: number
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.school.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateSchool(
  id: string,
  data: {
    name?: string
    academicYear?: number
    classCountsJson?: string
    namingConvention?: string
    daysPerWeek?: number
    maxPeriodsPerDay?: number
    hasZeroPeriod?: boolean
    periodNamesJson?: string
    periodLengthsJson?: string
    lunchAfterPeriod?: number
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.school.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getSchoolWithGrades() {
  const prisma = getPrismaClient()
  try {
    const school = await prisma.school.findFirst()
    if (!school) return null
    const grades = await prisma.grade.findMany({
      include: { classes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { gradeNum: "asc" },
    })
    return { ...school, grades }
  } finally {
    await prisma.$disconnect()
  }
}
