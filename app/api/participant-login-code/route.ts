import { NextResponse } from "next/server"
import crypto from "crypto"

import { getSessionCookieName } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const participantCode =
    typeof body?.participantCode === "string"
      ? body.participantCode.trim().toUpperCase()
      : ""

  if (!participantCode) {
    return NextResponse.json(
      { error: "Participant code is required." },
      { status: 400 }
    )
  }

  const participant = await prisma.participant.findUnique({
    where: { code: participantCode },
    select: { id: true, classId: true, name: true },
  })

  if (!participant || !participant.classId) {
    return NextResponse.json(
      { error: "Invalid participant code." },
      { status: 401 }
    )
  }

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      type: "participant",
      name: participant.name,
      classId: participant.classId,
      participantId: participant.id,
      tokenHash,
      expiresAt,
    },
  })

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
