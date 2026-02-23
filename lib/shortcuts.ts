export interface ShortcutDef {
  key: string
  modifiers: ("ctrl" | "shift" | "alt" | "meta")[]
  label: string
  description: string
  category: string
}

export const SHORTCUT_DEFINITIONS: ShortcutDef[] = [
  {
    key: "z",
    modifiers: ["ctrl"],
    label: "Ctrl+Z",
    description: "元に戻す",
    category: "編集",
  },
  {
    key: "z",
    modifiers: ["ctrl", "shift"],
    label: "Ctrl+Shift+Z",
    description: "やり直す",
    category: "編集",
  },
  {
    key: "s",
    modifiers: ["ctrl"],
    label: "Ctrl+S",
    description: "保存",
    category: "編集",
  },
  {
    key: "/",
    modifiers: ["ctrl"],
    label: "Ctrl+/",
    description: "ショートカット一覧",
    category: "ヘルプ",
  },
  {
    key: "d",
    modifiers: ["ctrl", "shift"],
    label: "Ctrl+Shift+D",
    description: "ダークモード切替",
    category: "表示",
  },
]
