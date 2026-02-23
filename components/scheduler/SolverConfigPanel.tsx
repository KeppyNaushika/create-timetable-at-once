"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SolverConfig } from "@/lib/solver/types"

interface SolverConfigPanelProps {
  config: SolverConfig
  onChange: (config: SolverConfig) => void
}

export function SolverConfigPanel({
  config,
  onChange,
}: SolverConfigPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs">タイムアウト (秒)</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[config.maxTimeMs / 1000]}
            min={10}
            max={300}
            step={10}
            onValueChange={([v]) =>
              onChange({ ...config, maxTimeMs: v * 1000 })
            }
            className="flex-1"
          />
          <span className="text-muted-foreground w-10 text-xs">
            {config.maxTimeMs / 1000}s
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">生成パターン数</Label>
        <Select
          value={String(config.maxPatterns)}
          onValueChange={(v) =>
            onChange({ ...config, maxPatterns: parseInt(v) })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 5, 10].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}パターン
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">リスタート回数</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[config.ilsRestarts]}
            min={1}
            max={20}
            step={1}
            onValueChange={([v]) =>
              onChange({ ...config, ilsRestarts: v })
            }
            className="flex-1"
          />
          <span className="text-muted-foreground w-10 text-xs">
            {config.ilsRestarts}回
          </span>
        </div>
      </div>
    </div>
  )
}
