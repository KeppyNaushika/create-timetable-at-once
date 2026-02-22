import { initializeDataDirectory } from "./lib/dataManager"
import { optimizeDatabaseForSharedDrive } from "./lib/prisma/databaseInitializer"

export async function initializeApp(): Promise<void> {
  try {
    await initializeDataDirectory()

    try {
      const { DatabaseSetup } = await import("./lib/databaseSetup")
      const dbSetup = new DatabaseSetup()

      const wasSetupRequired = await dbSetup.setupIfNeeded()

      if (wasSetupRequired) {
        console.log("Database initialized and seeded successfully")
      } else {
        console.log("Database already exists and is ready")
      }
    } catch (dbError) {
      console.error("Database setup failed:", dbError)
      throw new Error(
        `Database initialization failed: ${dbError instanceof Error ? dbError.message : dbError}`
      )
    }

    await optimizeDatabaseForSharedDrive()

    const { checkDatabaseHealth } =
      await import("./lib/prisma/databaseInitializer")
    const isHealthy = await checkDatabaseHealth()

    if (!isHealthy) {
      throw new Error("Database health check failed")
    }

    console.log("Application initialization completed successfully")
  } catch (error) {
    console.error("Failed to initialize application:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Application initialization failed: ${errorMessage}`)
  }
}
