import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Paywall({
  title = "当前套餐已到上限",
  description = "升级套餐后可以继续添加更多关键词。",
}: {
  title?: string
  description?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/pricing">查看升级套餐</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
