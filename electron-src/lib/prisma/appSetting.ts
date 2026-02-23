import { getPrismaClient } from "./client"

export async function getSetting(key: string) {
  const prisma = getPrismaClient()
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key },
    })
    return setting?.value ?? null
  } finally {
    await prisma.$disconnect()
  }
}

export async function setSetting(key: string, value: string) {
  const prisma = getPrismaClient()
  try {
    return await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function getAllSettings() {
  const prisma = getPrismaClient()
  try {
    return await prisma.appSetting.findMany()
  } finally {
    await prisma.$disconnect()
  }
}
