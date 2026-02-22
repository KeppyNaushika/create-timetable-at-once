import { getPrismaClient } from "./client"

// 先生ごとの総コマ数 vs 週あたり最大コマ数
export async function getTeacherCapacity() {
  const prisma = getPrismaClient()
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        komaTeachers: {
          include: {
            koma: { select: { id: true, count: true, subjectId: true } },
          },
        },
        availabilities: true,
        teacherDuties: {
          include: { duty: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return teachers.map((t) => {
      const totalKomaCount = t.komaTeachers.reduce(
        (sum, kt) => sum + kt.koma.count,
        0
      )
      const unavailableCount = t.availabilities.filter(
        (a) => a.status === "unavailable"
      ).length
      const dutyCount = t.teacherDuties.length

      return {
        id: t.id,
        name: t.name,
        maxPerDay: t.maxPerDay,
        maxPeriodsPerWeek: t.maxPeriodsPerWeek,
        maxConsecutive: t.maxConsecutive,
        totalKomaCount,
        unavailableCount,
        dutyCount,
        komaCount: t.komaTeachers.length,
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// 曜日×時限ごとの駒数サマリ
export async function getPeriodSummary(
  daysPerWeek: number,
  maxPeriods: number
) {
  const prisma = getPrismaClient()
  try {
    const komas = await prisma.koma.findMany({
      include: {
        komaTeachers: true,
        komaClasses: true,
      },
    })

    const teachers = await prisma.teacher.findMany({
      include: {
        availabilities: true,
        teacherDuties: { include: { duty: true } },
      },
    })

    // 各時限に配置可能な教員数と必要な駒数を集計
    const summary: {
      dayOfWeek: number
      period: number
      availableTeachers: number
      requiredSlots: number
    }[] = []

    for (let d = 0; d < daysPerWeek; d++) {
      for (let p = 1; p <= maxPeriods; p++) {
        const availableTeachers = teachers.filter((t) => {
          const avail = t.availabilities.find(
            (a) => a.dayOfWeek === d && a.period === p
          )
          if (avail && avail.status === "unavailable") return false
          const hasDuty = t.teacherDuties.some(
            (td) => td.duty.dayOfWeek === d && td.duty.period === p
          )
          if (hasDuty) return false
          return true
        }).length

        // 必要スロット数 = 全駒のcount合計 / daysPerWeek (概算)
        const totalSlots = komas.reduce((s, k) => s + k.count, 0)
        const avgPerSlot = Math.ceil(totalSlots / (daysPerWeek * maxPeriods))

        summary.push({
          dayOfWeek: d,
          period: p,
          availableTeachers,
          requiredSlots: avgPerSlot,
        })
      }
    }

    return summary
  } finally {
    await prisma.$disconnect()
  }
}
