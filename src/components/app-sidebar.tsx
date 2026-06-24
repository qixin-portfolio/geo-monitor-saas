import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

import { SidebarNav } from "@/components/sidebar-nav"
import { hasUsableClerkKey } from "@/lib/clerk-config"

const isDev = process.env.NODE_ENV === "development"

export function AppSidebar() {
  const hasClerk = hasUsableClerkKey()

  return (
    <aside className="flex min-h-screen w-full flex-col border-r bg-muted/30 p-4 md:w-64">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        GEO Monitor
      </Link>
      <SidebarNav />
      <div className="mt-auto flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">账户</span>
        {isDev ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            D
          </div>
        ) : hasClerk ? (
          <UserButton />
        ) : (
          <span className="text-sm text-muted-foreground">预览模式</span>
        )}
      </div>
    </aside>
  )
}
