"use client"

import { Printer } from "lucide-react"
import { useCallback } from "react"

import { Button } from "@/components/ui/button"

interface PrintPreviewProps {
  children: React.ReactNode
}

export function PrintPreview({ children }: PrintPreviewProps) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div>
      <div className="no-print mb-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          印刷
        </Button>
      </div>
      <div className="print-area">{children}</div>
    </div>
  )
}
