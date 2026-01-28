import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getParticipantFromSessionToken, getSessionCookieName } from "@/lib/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getSessionCookieName())?.value
  const participant = await getParticipantFromSessionToken(sessionToken)

  if (!participant) {
    redirect("/")
  }

  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
