import { redirect } from "next/navigation"
import { ClerkProvider } from "@clerk/nextjs"

import { AppSidebar } from "@/components/app-sidebar"
import { hasUsableClerkKey } from "@/lib/clerk-config"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!hasUsableClerkKey()) {
    redirect("/pricing")
  }

  return (
    <ClerkProvider>
      <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
        <AppSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </ClerkProvider>
  )
}
