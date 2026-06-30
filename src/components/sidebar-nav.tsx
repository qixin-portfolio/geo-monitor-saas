"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ClipboardList, CreditCard, LayoutDashboard, Network, Search } from "lucide-react"

const links = [
  { href: "/dashboard", label: "总览", icon: LayoutDashboard },
  { href: "/dashboard/queries", label: "关键词监测", icon: Search },
  { href: "/dashboard/evidence-map", label: "证据链地图", icon: Network },
  { href: "/dashboard/content-backlog", label: "GEO 修复任务", icon: ClipboardList },
  { href: "/dashboard/billing", label: "订阅账单", icon: CreditCard },
  { href: "/pricing", label: "套餐", icon: BarChart3 },
]

export function SidebarNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <nav className="mt-8 flex flex-col gap-1">
      {links.map((link) => {
        const active = isActive(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
