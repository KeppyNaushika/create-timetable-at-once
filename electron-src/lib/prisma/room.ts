import { getPrismaClient } from "./client"

export async function getRooms() {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.findMany({
      include: { availabilities: true },
      orderBy: { sortOrder: "asc" },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getRoomById(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.findUnique({
      where: { id },
      include: { availabilities: true },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function createRoom(data: {
  name: string
  shortName?: string
  capacity?: number
  notes?: string
  sortOrder?: number
}) {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.create({ data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function updateRoom(
  id: string,
  data: {
    name?: string
    shortName?: string
    capacity?: number
    notes?: string
    sortOrder?: number
  }
) {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.update({ where: { id }, data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteRoom(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.delete({ where: { id } })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getRoomWithAvailabilities(id: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.specialRoom.findUnique({
      where: { id },
      include: {
        availabilities: {
          orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}
