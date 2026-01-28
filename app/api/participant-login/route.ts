import { NextResponse } from "next/server"

import { createParticipantSession, getSessionCookieName } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { name, accessCode } = await request.json()

  if (!name || !accessCode) {
    return NextResponse.json(
      { error: "Name and access code are required." },
      { status: 400 }
    )
  }

  const classItem = await prisma.class.findFirst({
    where: { accessCode },
    select: { id: true },
  })

  if (!classItem) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 })
  }

  const { token, expiresAt } = await createParticipantSession(String(name))
  const response = NextResponse.json({ ok: true })

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })

  return response
}
