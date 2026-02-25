"use client"

import {
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  GitCompare,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Play,
  Printer,
  Puzzle,
  School,
  Settings,
  Shuffle,
  SlidersHorizontal,
  Stethoscope,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const setupItems: NavItem[] = [
  {
    label: "学校基本設定",
    href: "/setup/school",
    icon: <School className="h-4 w-4" />,
  },
  {
    label: "科目設定",
    href: "/setup/subjects",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: "基本時間割枠",
    href: "/setup/timetable-frame",
    icon: <Calendar className="h-4 w-4" />,
  },
]

const dataItems: NavItem[] = [
  {
    label: "授業設定",
    href: "/data/koma",
    icon: <Puzzle className="h-4 w-4" />,
  },
  {
    label: "クラス設定",
    href: "/data/classes",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    label: "特別教室",
    href: "/data/rooms",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    label: "校務",
    href: "/data/duties",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    label: "先生設定",
    href: "/data/teachers",
    icon: <Users className="h-4 w-4" />,
  },
]

const schedulerItems: NavItem[] = [
  {
    label: "処理条件",
    href: "/scheduler/conditions",
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
  {
    label: "駒チェック",
    href: "/scheduler/check",
    icon: <CheckSquare className="h-4 w-4" />,
  },
  {
    label: "手動配置",
    href: "/scheduler/manual",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    label: "自動作成",
    href: "/scheduler/auto",
    icon: <Play className="h-4 w-4" />,
  },
  {
    label: "パターン比較",
    href: "/scheduler/patterns",
    icon: <GitCompare className="h-4 w-4" />,
  },
]

const reviewItems: NavItem[] = [
  {
    label: "全体表",
    href: "/review/overview",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    label: "個別表",
    href: "/review/individual",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    label: "品質診断",
    href: "/review/diagnosis",
    icon: <Stethoscope className="h-4 w-4" />,
  },
]

const printItems: NavItem[] = [
  {
    label: "先生全体表",
    href: "/print/teacher-all",
    icon: <Printer className="h-4 w-4" />,
  },
  {
    label: "クラス全体表",
    href: "/print/class-all",
    icon: <Printer className="h-4 w-4" />,
  },
  {
    label: "先生用時間割",
    href: "/print/teacher-schedule",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "クラス用時間割",
    href: "/print/class-schedule",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "教室用時間割",
    href: "/print/room-schedule",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "校務一覧表",
    href: "/print/duty-list",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "先生一覧表",
    href: "/print/teacher-list",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "駒一覧",
    href: "/print/koma-list",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
  {
    label: "残り駒一覧",
    href: "/print/remaining-koma",
    icon: <FileSpreadsheet className="h-4 w-4" />,
  },
]

const dailyItems: NavItem[] = [
  {
    label: "日課カレンダー",
    href: "/daily/calendar",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    label: "日課編集",
    href: "/daily/edit",
    icon: <Shuffle className="h-4 w-4" />,
  },
  {
    label: "授業時数",
    href: "/daily/hours",
    icon: <Calculator className="h-4 w-4" />,
  },
  {
    label: "年間カレンダー",
    href: "/daily/annual",
    icon: <Calendar className="h-4 w-4" />,
  },
]

const examItems: NavItem[] = [
  {
    label: "試験日程",
    href: "/exam/schedule",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "監督割当",
    href: "/exam/assign",
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    label: "選択科目",
    href: "/elective",
    icon: <Shuffle className="h-4 w-4" />,
  },
]

const settingsItems: NavItem[] = [
  {
    label: "アプリ設定",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
]

export function Navigation() {
  const pathname = usePathname()

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    )
  }

  return (
    <div className="bg-card no-print flex h-full w-56 flex-col border-r">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Settings className="text-primary h-5 w-5" />
        <span className="text-sm font-bold">一括時間割作成</span>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === "/"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            ダッシュボード
          </Link>
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            初期設定
          </p>
          {setupItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            データ入力
          </p>
          {dataItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            時間割作成
          </p>
          {schedulerItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            確認
          </p>
          {reviewItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            印刷・出力
          </p>
          {printItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            日課管理
          </p>
          {dailyItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            試験・選択
          </p>
          {examItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            設定
          </p>
          {settingsItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
