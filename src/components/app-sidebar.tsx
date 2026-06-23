import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { hasUsableClerkKey } from "@/lib/clerk-config"

const links = [
  { href: "/dashboard", label: "总览" },
  { href: "/dashboard/queries", label: "关键词监测" },
  { href: "/dashboard/billing", label: "订阅账单" },
  { href: "/pricing", label: "套餐" },
]

export function AppSidebar() {
  const hasClerk = hasUsableClerkKey()

  return (
    <aside className="flex min-h-screen w-full flex-col border-r bg-muted/30 p-4 md:w-64">
      <Link href="/dashboard" className="text-lg font-semibold">
        GEO Monitor
      </Link>
      <nav className="mt-8 flex flex-col gap-2">
        {links.map((link) => (
          <Button key={link.href} asChild variant="ghost">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">账户</span>
        {hasClerk ? (
          <UserButton />
        ) : (
          <span className="text-sm text-muted-foreground">预览模式</span>
        )}
      </div>
    </aside>
  )
}
