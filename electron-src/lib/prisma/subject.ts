import { getPrismaClient } from "./client"

export async function getSubjects() {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.findMany({
      orderBy: { sortOrder: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getSubjectById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.findUnique({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createSubject(data: {
  name: string
  shortName?: string
  color?: string
  category?: string
  sortOrder?: number
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateSubject(
  id: string,
  data: {
    name?: string
    shortName?: string
    color?: string
    category?: string
    sortOrder?: number
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteSubject(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getSubjectsByCategory(category: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.subject.findMany({
      where: { category },
      orderBy: { sortOrder: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function seedDefaultSubjects() {
  const prisma = getPrismaClient()
  try {
    const defaults = [
      {
        name: "国語",
        shortName: "国",
        color: "#EF4444",
        category: "general",
        sortOrder: 1,
      },
      {
        name: "社会",
        shortName: "社",
        color: "#F59E0B",
        category: "general",
        sortOrder: 2,
      },
      {
        name: "数学",
        shortName: "数",
        color: "#3B82F6",
        category: "general",
        sortOrder: 3,
      },
      {
        name: "理科",
        shortName: "理",
        color: "#10B981",
        category: "general",
        sortOrder: 4,
      },
      {
        name: "英語",
        shortName: "英",
        color: "#8B5CF6",
        category: "general",
        sortOrder: 5,
      },
      {
        name: "音楽",
        shortName: "音",
        color: "#EC4899",
        category: "general",
        sortOrder: 6,
      },
      {
        name: "美術",
        shortName: "美",
        color: "#F97316",
        category: "general",
        sortOrder: 7,
      },
      {
        name: "保健体育",
        shortName: "体",
        color: "#06B6D4",
        category: "general",
        sortOrder: 8,
      },
      {
        name: "技術・家庭",
        shortName: "技家",
        color: "#84CC16",
        category: "general",
        sortOrder: 9,
      },
      {
        name: "道徳",
        shortName: "道",
        color: "#A855F7",
        category: "reserve",
        sortOrder: 10,
      },
      {
        name: "学活",
        shortName: "学",
        color: "#64748B",
        category: "reserve",
        sortOrder: 11,
      },
      {
        name: "総合",
        shortName: "総",
        color: "#14B8A6",
        category: "reserve",
        sortOrder: 12,
      },
      {
        name: "職員会議",
        shortName: "職",
        color: "#9CA3AF",
        category: "school_affair",
        sortOrder: 13,
      },
      {
        name: "研修",
        shortName: "研",
        color: "#78716C",
        category: "school_affair",
        sortOrder: 14,
      },
    ]

    for (const subject of defaults) {
      await prisma.subject.upsert({
        where: { name: subject.name },
        update: {},
        create: { ...subject, isDefault: true },
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}
