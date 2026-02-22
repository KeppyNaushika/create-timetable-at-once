"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { ColorPicker } from "@/components/common/ColorPicker"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSubjects } from "@/hooks/useSubjects"
import { SUBJECT_CATEGORIES } from "@/lib/constants"
import type { Subject } from "@/types/common.types"

export default function SubjectsPage() {
  const {
    generalSubjects,
    reserveSubjects,
    schoolAffairSubjects,
    loading,
    createSubject,
    updateSubject,
    deleteSubject,
  } = useSubjects()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formName, setFormName] = useState("")
  const [formShortName, setFormShortName] = useState("")
  const [formColor, setFormColor] = useState("#6B7280")
  const [formCategory, setFormCategory] = useState("general")

  const openCreateDialog = useCallback((category: string) => {
    setEditingSubject(null)
    setFormName("")
    setFormShortName("")
    setFormColor("#6B7280")
    setFormCategory(category)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((subject: Subject) => {
    setEditingSubject(subject)
    setFormName(subject.name)
    setFormShortName(subject.shortName)
    setFormColor(subject.color)
    setFormCategory(subject.category)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      toast.error("科目名を入力してください")
      return
    }

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: formName,
          shortName: formShortName,
          color: formColor,
          category: formCategory,
        })
        toast.success("科目を更新しました")
      } else {
        await createSubject({
          name: formName,
          shortName: formShortName,
          color: formColor,
          category: formCategory,
        })
        toast.success("科目を追加しました")
      }
      setDialogOpen(false)
    } catch {
      toast.error("保存に失敗しました")
    }
  }, [
    editingSubject,
    formName,
    formShortName,
    formColor,
    formCategory,
    createSubject,
    updateSubject,
  ])

  const handleDelete = useCallback(
    async (subject: Subject) => {
      if (subject.isDefault) {
        toast.error("デフォルト科目は削除できません")
        return
      }
      try {
        await deleteSubject(subject.id)
        toast.success("科目を削除しました")
      } catch {
        toast.error("削除に失敗しました")
      }
    },
    [deleteSubject]
  )

  const handleColorChange = useCallback(
    async (subject: Subject, color: string) => {
      try {
        await updateSubject(subject.id, { color })
      } catch {
        toast.error("色の変更に失敗しました")
      }
    },
    [updateSubject]
  )

  const SubjectTable = ({
    subjects,
    category,
  }: {
    subjects: Subject[]
    category: string
  }) => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCreateDialog(category)}
        >
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">色</TableHead>
            <TableHead>科目名</TableHead>
            <TableHead>略称</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell>
                <input
                  type="color"
                  value={subject.color}
                  onChange={(e) => handleColorChange(subject, e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 p-0"
                  aria-label={`${subject.name}の色を選択`}
                />
              </TableCell>
              <TableCell className="font-medium">
                {subject.name}
                {subject.isDefault && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    既定
                  </Badge>
                )}
              </TableCell>
              <TableCell>{subject.shortName}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(subject)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!subject.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subject)}
                    >
                      <Trash2 className="text-destructive h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {subjects.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground py-6 text-center"
              >
                科目がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="科目設定"
        description="教科の追加・編集・色設定を行います"
      />

      <div className="p-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">
              {SUBJECT_CATEGORIES.general}
            </TabsTrigger>
            <TabsTrigger value="reserve">
              {SUBJECT_CATEGORIES.reserve}
            </TabsTrigger>
            <TabsTrigger value="school_affair">
              {SUBJECT_CATEGORIES.school_affair}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <SubjectTable subjects={generalSubjects} category="general" />
          </TabsContent>
          <TabsContent value="reserve" className="mt-4">
            <SubjectTable subjects={reserveSubjects} category="reserve" />
          </TabsContent>
          <TabsContent value="school_affair" className="mt-4">
            <SubjectTable
              subjects={schoolAffairSubjects}
              category="school_affair"
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "科目を編集" : "科目を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>科目名</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例: 国語"
              />
            </div>
            <div className="space-y-2">
              <Label>略称</Label>
              <Input
                value={formShortName}
                onChange={(e) => setFormShortName(e.target.value)}
                placeholder="例: 国"
              />
            </div>
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBJECT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>色</Label>
              <ColorPicker value={formColor} onChange={setFormColor} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
