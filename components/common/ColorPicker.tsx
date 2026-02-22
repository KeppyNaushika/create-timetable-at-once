"use client"

import { COLOR_PALETTE } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-6 w-6 rounded-md border-2 transition-transform hover:scale-110",
            value === color
              ? "border-foreground ring-ring ring-2 ring-offset-1"
              : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`色 ${color} を選択`}
        />
      ))}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border-0 p-0"
          aria-label="カスタム色を選択"
        />
      </div>
    </div>
  )
}
