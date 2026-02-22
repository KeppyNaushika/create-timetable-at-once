"use client"

import { BookOpen, Calendar, GraduationCap, School, Users } from "lucide-react"
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
  section: "setup" | "data"
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
]

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">一括時間割作成</h1>
        <p className="text-muted-foreground mt-2">
          中学校向け時間割自動作成アプリケーション
        </p>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">初期設定</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {navCards
            .filter((c) => c.section === "setup")
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

      <div>
        <h2 className="mb-3 text-lg font-semibold">データ入力</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {navCards
            .filter((c) => c.section === "data")
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
    </div>
  )
}
