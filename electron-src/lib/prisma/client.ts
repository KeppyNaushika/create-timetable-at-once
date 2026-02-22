import { createSharedPrismaClient } from "./databaseInitializer"

export default createSharedPrismaClient()

export function getPrismaClient() {
  return createSharedPrismaClient()
}
