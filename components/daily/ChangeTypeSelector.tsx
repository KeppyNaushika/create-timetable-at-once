"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CHANGE_TYPES } from "@/lib/constants"

interface ChangeTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  types?: Record<string, string>
}

export function ChangeTypeSelector({
  value,
  onChange,
  types,
}: ChangeTypeSelectorProps) {
  const options = types ?? CHANGE_TYPES

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="種別を選択" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
