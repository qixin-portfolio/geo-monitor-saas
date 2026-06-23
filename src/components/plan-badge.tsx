import type { Plan } from "@prisma/client"

import { Badge } from "@/components/ui/badge"

export function PlanBadge({ plan }: { plan: Plan }) {
  return <Badge variant={plan === "FREE" ? "secondary" : "default"}>{plan}</Badge>
}
