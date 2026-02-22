"use client"

import { AlertTriangle, ChevronDown } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Violation } from "@/lib/solver/types"
import { DAY_NAMES } from "@/lib/constants"

interface ViolationsPaneProps {
  violations: Violation[]
  onViolationClick?: (v: Violation) => void
}

export function ViolationsPane({
  violations,
  onViolationClick,
}: ViolationsPaneProps) {
  const errors = violations.filter((v) => v.severity === "error")
  const warnings = violations.filter((v) => v.severity === "warning")

  return (
    <Collapsible defaultOpen={violations.length > 0}>
      <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
        <ChevronDown className="h-4 w-4" />
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        違反一覧
        {violations.length > 0 && (
          <span className="text-muted-foreground text-xs">
            ({errors.length}件のエラー, {warnings.length}件の警告)
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="max-h-48">
          <div className="space-y-0.5 p-2">
            {violations.length === 0 && (
              <p className="text-muted-foreground p-2 text-center text-xs">
                違反はありません
              </p>
            )}
            {violations.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "hover:bg-accent/50 flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-xs",
                  v.severity === "error" && "text-destructive",
                  v.severity === "warning" && "text-yellow-600"
                )}
                onClick={() => onViolationClick?.(v)}
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <div>
                  <span className="font-medium">{v.message}</span>
                  {v.dayOfWeek !== undefined && v.period !== undefined && (
                    <span className="text-muted-foreground ml-1">
                      ({DAY_NAMES[v.dayOfWeek]}
                      {v.period}限)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}
