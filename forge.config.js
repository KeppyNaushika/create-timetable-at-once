module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/{node_modules,.next,main,@prisma,.prisma}/**/*",
    },
    asarUnpack: [
      "**/.next/**/*",
      "**/node_modules/**/*",
      "**/main/**/*",
      "**/@prisma/**/*",
      "**/.prisma/**/*",
    ],
    name: "一括時間割作成",
    executableName: "create-timetable-at-once",
    osxSign: false,
    osxNotarize: false,
    ignore: [
      /^\/src/,
      /^\/\.git/,
      /^\/docs/,
      /^\/scripts/,
      /^\/out/,
      /^\/dist/,
    ],
    extraResource: [".next", "public"],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32", "linux"],
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      enabled: process.platform === "linux",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
      enabled: process.platform === "linux",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {
        unpackNatives: true,
      },
    },
  ],
  hooks: {
    prePackage: async () => {
      const fs = require("fs")
      const path = require("path")

      const nextNodeModules = path.join(__dirname, ".next", "node_modules")
      if (fs.existsSync(nextNodeModules)) {
        fs.rmSync(nextNodeModules, { recursive: true, force: true })
      }

      const nextCache = path.join(__dirname, ".next", "cache")
      if (fs.existsSync(nextCache)) {
        fs.rmSync(nextCache, { recursive: true, force: true })
      }
    },
  },
}
