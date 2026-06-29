import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { hasUsableClerkKey } from "@/lib/clerk-config"

const isDev = process.env.NODE_ENV === "development"

export default clerkMiddleware(async (auth, req) => {
  // Development-only bypass for local demos.
  if (isDev) return NextResponse.next()
  // Skip if Clerk keys are not configured (e.g., local dev without env).
  if (!hasUsableClerkKey()) return NextResponse.next()

  // Only protect dashboard and API routes that require authentication.
  const url = req.nextUrl.pathname
  const isProtected =
    url.startsWith("/dashboard") ||
    url.startsWith("/api/queries") ||
    url.startsWith("/api/responses") ||
    url.startsWith("/api/tenant") ||
    url.startsWith("/api/monitoring") ||
    url.startsWith("/api/report") ||
    url.startsWith("/api/stripe")
  if (!isProtected) return NextResponse.next()

  // Check auth manually - avoid auth.protect() which throws and breaks Next.js 16 proxy.ts
  const session = await auth()
  if (!session?.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
