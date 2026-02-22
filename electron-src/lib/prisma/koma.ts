import { getPrismaClient } from "./client"

const komaIncludes = {
  subject: true,
  grade: true,
  komaTeachers: { include: { teacher: true } },
  komaClasses: { include: { class_: true } },
  komaRooms: { include: { room: true } },
}

export async function getKomas() {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.findMany({
      include: komaIncludes,
      orderBy: [{ gradeId: "asc" }, { subjectId: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getKomaById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.findUnique({
      where: { id },
      include: komaIncludes,
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getKomasByGradeId(gradeId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.findMany({
      where: { gradeId },
      include: komaIncludes,
      orderBy: [{ subject: { sortOrder: "asc" } }, { label: "asc" }],
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createKoma(data: {
  subjectId: string
  gradeId: string
  type?: string
  count?: number
  priority?: number
  label?: string
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.create({
      data,
      include: komaIncludes,
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateKoma(
  id: string,
  data: {
    subjectId?: string
    type?: string
    count?: number
    priority?: number
    label?: string
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.update({
      where: { id },
      data,
      include: komaIncludes,
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteKoma(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function duplicateKoma(id: string) {
  const prisma = getPrismaClient()
  try {
    const original = await prisma.koma.findUnique({
      where: { id },
      include: {
        komaTeachers: true,
        komaClasses: true,
        komaRooms: true,
      },
    })
    if (!original) throw new Error("Koma not found")

    return await prisma.$transaction(async (tx) => {
      const newKoma = await tx.koma.create({
        data: {
          subjectId: original.subjectId,
          gradeId: original.gradeId,
          type: original.type,
          count: original.count,
          priority: original.priority,
          label: original.label ? `${original.label} (コピー)` : "(コピー)",
        },
      })

      if (original.komaTeachers.length > 0) {
        await tx.komaTeacher.createMany({
          data: original.komaTeachers.map((kt) => ({
            komaId: newKoma.id,
            teacherId: kt.teacherId,
            role: kt.role,
          })),
        })
      }

      if (original.komaClasses.length > 0) {
        await tx.komaClass.createMany({
          data: original.komaClasses.map((kc) => ({
            komaId: newKoma.id,
            classId: kc.classId,
          })),
        })
      }

      if (original.komaRooms.length > 0) {
        await tx.komaRoom.createMany({
          data: original.komaRooms.map((kr) => ({
            komaId: newKoma.id,
            roomId: kr.roomId,
          })),
        })
      }

      return await tx.koma.findUnique({
        where: { id: newKoma.id },
        include: komaIncludes,
      })
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function setKomaTeachers(
  komaId: string,
  teachers: { teacherId: string; role: string }[]
) {
  const prisma = getPrismaClient()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.komaTeacher.deleteMany({ where: { komaId } })
      if (teachers.length > 0) {
        await tx.komaTeacher.createMany({
          data: teachers.map((t) => ({
            komaId,
            teacherId: t.teacherId,
            role: t.role,
          })),
        })
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function setKomaClasses(komaId: string, classIds: string[]) {
  const prisma = getPrismaClient()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.komaClass.deleteMany({ where: { komaId } })
      if (classIds.length > 0) {
        await tx.komaClass.createMany({
          data: classIds.map((classId) => ({ komaId, classId })),
        })
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function setKomaRooms(komaId: string, roomIds: string[]) {
  const prisma = getPrismaClient()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.komaRoom.deleteMany({ where: { komaId } })
      if (roomIds.length > 0) {
        await tx.komaRoom.createMany({
          data: roomIds.map((roomId) => ({ komaId, roomId })),
        })
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function batchCreateKomas(
  komas: {
    subjectId: string
    gradeId: string
    type?: string
    count?: number
    priority?: number
    label?: string
  }[]
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.$transaction(
      komas.map((k) => prisma.koma.create({ data: k, include: komaIncludes }))
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function getKomasByTeacherId(teacherId: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.koma.findMany({
      where: {
        komaTeachers: {
          some: { teacherId },
        },
      },
      include: komaIncludes,
      orderBy: [
        { grade: { gradeNum: "asc" } },
        { subject: { sortOrder: "asc" } },
      ],
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteKomasByGradeId(gradeId: string) {
  const prisma = getPrismaClient()
  try {
    await prisma.koma.deleteMany({ where: { gradeId } })
  } finally {
    await prisma.$disconnect()
  }
}
