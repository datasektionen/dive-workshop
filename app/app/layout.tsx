import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getParticipantFromRequest } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await cookies()
  const participant = await getParticipantFromRequest()

  if (!participant) {
    redirect("/")
  }

  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
