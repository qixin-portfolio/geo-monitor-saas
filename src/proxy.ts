import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { hasUsableClerkKey } from "@/lib/clerk-config"
const isDev = process.env.NODE_ENV === "development"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/queries(.*)",
  "/api/responses(.*)",
  "/api/tenant(.*)",
  "/api/stripe(.*)",
])

const protectedProxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export default function proxy(
  req: Parameters<typeof protectedProxy>[0],
  event: Parameters<typeof protectedProxy>[1]
) {
  // Dev mode: bypass all auth for local testing
  if (isDev) return NextResponse.next()
  if (!hasUsableClerkKey()) return NextResponse.next()
  if (!isProtectedRoute(req)) return NextResponse.next()
  return protectedProxy(req, event)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
