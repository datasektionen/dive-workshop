import { NextResponse } from "next/server"

import { getParticipantFromRequest } from "@/lib/auth"

export async function GET() {
  const participant = await getParticipantFromRequest()

  if (!participant) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  return NextResponse.json({ name: participant.name })
}
