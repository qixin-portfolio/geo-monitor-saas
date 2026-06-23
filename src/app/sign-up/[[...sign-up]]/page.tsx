import { redirect } from "next/navigation"
import { ClerkProvider, SignUp } from "@clerk/nextjs"

import { hasUsableClerkKey } from "@/lib/clerk-config"

export default function SignUpPage() {
  if (!hasUsableClerkKey()) {
    redirect("/pricing")
  }

  return (
    <ClerkProvider>
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <SignUp />
      </main>
    </ClerkProvider>
  )
}
