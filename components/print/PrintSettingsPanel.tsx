"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LINE_STYLES, OUTPUT_ORDERS, PAPER_SIZES } from "@/lib/constants"
import type {
  LineStyle,
  OutputOrder,
  PaperSize,
  PrintSettings,
} from "@/types/review.types"

interface PrintSettingsPanelProps {
  settings: PrintSettings
  onChange: (settings: PrintSettings) => void
}

export function PrintSettingsPanel({
  settings,
  onChange,
}: PrintSettingsPanelProps) {
  const update = (partial: Partial<PrintSettings>) => {
    onChange({ ...settings, ...partial })
  }

  const updateGridLine = (
    key: keyof PrintSettings["gridLines"],
    value: LineStyle
  ) => {
    onChange({
      ...settings,
      gridLines: { ...settings.gridLines, [key]: value },
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">印刷設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">用紙サイズ</Label>
            <select
              className="border-input bg-background h-8 w-full rounded border px-2 text-sm"
              value={settings.paperSize}
              onChange={(e) =>
                update({ paperSize: e.target.value as PaperSize })
              }
            >
              {Object.entries(PAPER_SIZES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">出力順序</Label>
            <select
              className="border-input bg-background h-8 w-full rounded border px-2 text-sm"
              value={settings.outputOrder}
              onChange={(e) =>
                update({ outputOrder: e.target.value as OutputOrder })
              }
            >
              {Object.entries(OUTPUT_ORDERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">罫線設定</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["outer", "外枠"],
                ["inner", "中枠"],
                ["dayDivider", "曜日区切り"],
                ["weekDivider", "週区切り"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-muted-foreground w-16 text-xs">
                  {label}
                </span>
                <select
                  className="border-input bg-background h-7 flex-1 rounded border px-1 text-xs"
                  value={settings.gridLines[key]}
                  onChange={(e) =>
                    updateGridLine(key, e.target.value as LineStyle)
                  }
                >
                  {Object.entries(LINE_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">フッター</Label>
          <Input
            className="h-8 text-sm"
            placeholder="印刷時のフッターテキスト"
            value={settings.footer}
            onChange={(e) => update({ footer: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function getDefaultPrintSettings(): PrintSettings {
  return {
    paperSize: "B4",
    gridLines: {
      outer: "thick",
      inner: "thin",
      dayDivider: "thick",
      weekDivider: "thin",
    },
    outputOrder: "grade",
    footer: "",
    selectedIds: [],
  }
}
