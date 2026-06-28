import { redirect } from "next/navigation"
import { ClerkProvider, SignUp } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

import { hasUsableClerkKey } from "@/lib/clerk-config"

export default function SignUpPage() {
  if (!hasUsableClerkKey()) {
    redirect("/pricing")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <ClerkProvider>
        <div className="relative z-10">
          <SignUp
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            signInFallbackRedirectUrl="/dashboard"
          />
        </div>
      </ClerkProvider>
    </main>
  )
}
