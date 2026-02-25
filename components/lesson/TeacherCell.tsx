"use client"

import { Settings, Unlink, UserPlus, Users } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { CellData } from "@/lib/lessonGrid"

interface TeacherCellProps {
  cell: CellData
  colSpan: number
  subjectColor: string
  isCombined: boolean
  combinedClassNames?: string
  onClickTeacher: (komaId: string) => void
  onCombine: (komaId: string) => void
  onSplitCombine: (komaId: string) => void
  onDetail: (komaId: string) => void
}

export function TeacherCell({
  cell,
  colSpan,
  subjectColor,
  isCombined,
  combinedClassNames,
  onClickTeacher,
  onCombine,
  onSplitCombine,
  onDetail,
}: TeacherCellProps) {
  const mainTeacher = cell.teachers.find((t) => t.role === "main")
  const subTeachers = cell.teachers.filter((t) => t.role === "sub")
  const hasTeacher = cell.teachers.length > 0

  return (
    <td
      colSpan={colSpan}
      className="border p-0"
      style={{
        borderLeftColor: subjectColor,
        borderLeftWidth: colSpan > 1 ? 2 : undefined,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="hover:bg-accent/50 flex min-h-[2.5rem] cursor-pointer flex-col justify-center px-2 py-1 transition-colors"
            onClick={() => onClickTeacher(cell.komaId)}
          >
            {hasTeacher ? (
              <>
                <span className="text-sm leading-tight">
                  {mainTeacher?.name ?? ""}
                  {subTeachers.length > 0 && (
                    <span className="text-muted-foreground text-[10px]">
                      {" "}
                      (主)
                    </span>
                  )}
                </span>
                {subTeachers.map((t) => (
                  <span
                    key={t.teacherId}
                    className="text-muted-foreground text-xs leading-tight"
                  >
                    {t.name} (副)
                  </span>
                ))}
                {isCombined && combinedClassNames && (
                  <span className="text-muted-foreground text-[10px] leading-tight">
                    [{combinedClassNames}]
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">
                {isCombined && combinedClassNames
                  ? `[${combinedClassNames}]`
                  : "未設定"}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onClickTeacher(cell.komaId)}>
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            担当先生を設定
          </ContextMenuItem>
          <ContextMenuSeparator />
          {isCombined ? (
            <ContextMenuItem onClick={() => onSplitCombine(cell.komaId)}>
              <Unlink className="mr-2 h-3.5 w-3.5" />
              合同授業を解除
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={() => onCombine(cell.komaId)}>
              <Users className="mr-2 h-3.5 w-3.5" />
              合同授業に変更
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDetail(cell.komaId)}>
            <Settings className="mr-2 h-3.5 w-3.5" />
            詳細設定
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </td>
  )
}
