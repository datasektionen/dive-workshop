import { NextResponse } from "next/server"

import { getParticipantFromRequest } from "@/lib/auth"

export async function GET() {
  const participant = await getParticipantFromRequest()

  if (!participant) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  return NextResponse.json({
    sessionId: participant.sessionId,
    name: participant.name,
    classId: participant.classId,
    isPreview: participant.isPreview,
    participantCode: participant.participantCode,
    participantId: participant.participantId,
  })
}
