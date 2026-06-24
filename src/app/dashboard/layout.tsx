import { ClerkProvider } from "@clerk/nextjs"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { hasUsableClerkKey } from "@/lib/clerk-config"

const isDev = process.env.NODE_ENV === "development"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isDev && !hasUsableClerkKey()) {
    redirect("/pricing")
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <AppSidebar />
      <main className="min-w-0">
        {isDev ? children : <ClerkProvider>{children}</ClerkProvider>}
      </main>
    </div>
  )
}
