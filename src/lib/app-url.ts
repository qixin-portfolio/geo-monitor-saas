function isLocalHost(host: string) {
  return (
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("0.0.0.0")
  )
}

export function getAppUrl(req?: Request) {
  const forwardedHost = req?.headers.get("x-forwarded-host")
  const host = forwardedHost ?? req?.headers.get("host")

  if (host) {
    const forwardedProto = req?.headers.get("x-forwarded-proto")
    const protocol = forwardedProto ?? (isLocalHost(host) ? "http" : "https")
    return `${protocol}://${host}`
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) {
    return envUrl
  }

  return "http://localhost:3000"
}
