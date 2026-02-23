"use client"

import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  GitCompare,
  GraduationCap,
  LayoutGrid,
  Play,
  Printer,
  Puzzle,
  School,
  SlidersHorizontal,
  Stethoscope,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface NavCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  section: "setup" | "data" | "scheduler" | "review" | "print"
  step: number
}

const navCards: NavCard[] = [
  {
    title: "学校基本設定",
    description: "学校名、年度、学年・学級構成を設定します",
    href: "/setup/school",
    icon: <School className="h-6 w-6" />,
    section: "setup",
    step: 1,
  },
  {
    title: "科目設定",
    description: "教科の追加・編集・色設定を行います",
    href: "/setup/subjects",
    icon: <BookOpen className="h-6 w-6" />,
    section: "setup",
    step: 2,
  },
  {
    title: "基本時間割枠",
    description: "週制、時限数、帯長などを設定します",
    href: "/setup/timetable-frame",
    icon: <Calendar className="h-6 w-6" />,
    section: "setup",
    step: 3,
  },
  {
    title: "先生設定",
    description: "先生の情報、都合、担当科目を設定します",
    href: "/data/teachers",
    icon: <Users className="h-6 w-6" />,
    section: "data",
    step: 4,
  },
  {
    title: "クラス設定",
    description: "学年・クラスの表示名を編集します",
    href: "/data/classes",
    icon: <GraduationCap className="h-6 w-6" />,
    section: "data",
    step: 5,
  },
  {
    title: "特別教室",
    description: "特別教室の情報と使用可能時間を設定します",
    href: "/data/rooms",
    icon: <Building2 className="h-6 w-6" />,
    section: "data",
    step: 6,
  },
  {
    title: "校務",
    description: "校務の情報と担当先生を設定します",
    href: "/data/duties",
    icon: <Briefcase className="h-6 w-6" />,
    section: "data",
    step: 7,
  },
  {
    title: "授業設定",
    description: "各学年の授業時数と担当先生を設定します",
    href: "/data/koma",
    icon: <Puzzle className="h-6 w-6" />,
    section: "data",
    step: 8,
  },
  {
    title: "処理条件",
    description: "時間割作成の制約条件と重みを設定します",
    href: "/scheduler/conditions",
    icon: <SlidersHorizontal className="h-6 w-6" />,
    section: "scheduler",
    step: 9,
  },
  {
    title: "駒チェック",
    description: "先生容量と時限サマリをチェックします",
    href: "/scheduler/check",
    icon: <CheckSquare className="h-6 w-6" />,
    section: "scheduler",
    step: 10,
  },
  {
    title: "手動配置",
    description: "ドラッグ＆ドロップで時間割を手動作成します",
    href: "/scheduler/manual",
    icon: <LayoutGrid className="h-6 w-6" />,
    section: "scheduler",
    step: 11,
  },
  {
    title: "自動作成",
    description: "CSPソルバーで時間割を自動生成します",
    href: "/scheduler/auto",
    icon: <Play className="h-6 w-6" />,
    section: "scheduler",
    step: 12,
  },
  {
    title: "パターン比較",
    description: "複数パターンを比較し最適なものを採用します",
    href: "/scheduler/patterns",
    icon: <GitCompare className="h-6 w-6" />,
    section: "scheduler",
    step: 13,
  },
  {
    title: "全体表",
    description: "先生別・クラス別の時間割一覧を確認します",
    href: "/review/overview",
    icon: <Eye className="h-6 w-6" />,
    section: "review",
    step: 14,
  },
  {
    title: "個別表",
    description: "先生・クラスごとの個別時間割を確認します",
    href: "/review/individual",
    icon: <ClipboardCheck className="h-6 w-6" />,
    section: "review",
    step: 15,
  },
  {
    title: "品質診断",
    description: "時間割の品質を5カテゴリで自動診断します",
    href: "/review/diagnosis",
    icon: <Stethoscope className="h-6 w-6" />,
    section: "review",
    step: 16,
  },
  {
    title: "印刷・出力",
    description: "各種帳票をPDF・Excel・印刷で出力します",
    href: "/print/teacher-all",
    icon: <Printer className="h-6 w-6" />,
    section: "print",
    step: 17,
  },
]

const sections = [
  { key: "setup", label: "初期設定" },
  { key: "data", label: "データ入力" },
  { key: "scheduler", label: "時間割作成" },
  { key: "review", label: "確認" },
  { key: "print", label: "印刷・出力" },
] as const

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">一括時間割作成</h1>
        <p className="text-muted-foreground mt-2">
          中学校向け時間割自動作成アプリケーション
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">{section.label}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {navCards
              .filter((c) => c.section === section.key)
              .map((card) => (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:bg-accent/50 h-full transition-colors">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {card.title}
                          <Badge variant="outline" className="text-xs">
                            Step {card.step}
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{card.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
