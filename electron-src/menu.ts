import { BrowserWindow, Menu, MenuItemConstructorOptions } from "electron"

const menu = (app: Electron.App, mainWindow: BrowserWindow) => {
  const mainMenus: MenuItemConstructorOptions[] = [
    {
      label: "一括時間割作成",
      submenu: [
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Control+Q",
          click: () => {
            app.quit()
          },
        },
        {
          label: "Toggle Full Screen",
          accelerator: "Ctrl+Command+F",
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "Alt+Command+I",
          click: () => {
            mainWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
    {
      label: "編集",
      submenu: [
        { label: "元に戻す", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "やり直し", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "切り取り", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "コピー", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "貼り付け", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "全選択", accelerator: "CmdOrCtrl+A", role: "selectAll" },
        { type: "separator" },
        { label: "再読込", accelerator: "CmdOrCtrl+R", role: "reload" },
        { type: "separator" },
        { label: "拡大", accelerator: "CmdOrCtrl+=", role: "zoomIn" },
        { label: "縮小", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { label: "元の拡大率", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
      ],
    },
  ]

  return Menu.buildFromTemplate(mainMenus)
}

export default menu
