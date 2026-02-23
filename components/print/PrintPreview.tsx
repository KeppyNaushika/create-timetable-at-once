"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface PrintPreviewProps {
  children: React.ReactNode
}

export function PrintPreview({ children }: PrintPreviewProps) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div>
      <div className="mb-2 flex justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          印刷
        </Button>
      </div>
      <div className="print-area">{children}</div>
    </div>
  )
}
