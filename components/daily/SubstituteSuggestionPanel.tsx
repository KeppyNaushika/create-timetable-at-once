"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubstituteCandidateRow } from "@/components/daily/SubstituteCandidateRow"
import { Loader2, Users } from "lucide-react"
import type { SubstituteCandidate } from "@/types/daily.types"

interface SubstituteSuggestionPanelProps {
  candidates: SubstituteCandidate[]
  onSelect: (teacherId: string) => void
  loading?: boolean
}

export function SubstituteSuggestionPanel({
  candidates,
  onSelect,
  loading,
}: SubstituteSuggestionPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          代替候補
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            候補を検索中...
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            候補が見つかりませんでした
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <SubstituteCandidateRow
                key={candidate.teacherId}
                candidate={candidate}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
