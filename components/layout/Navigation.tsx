"use client"

import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Play,
  Puzzle,
  School,
  Settings,
  SlidersHorizontal,
  Users,
  GitCompare,
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

const dataItems: NavItem[] = [
  {
    label: "先生設定",
    href: "/data/teachers",
    icon: <Users className="h-4 w-4" />,
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
    label: "駒設定",
    href: "/data/koma",
    icon: <Puzzle className="h-4 w-4" />,
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
    <div className="bg-card flex h-full w-56 flex-col border-r">
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
      </ScrollArea>
    </div>
  )
}
