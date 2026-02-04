import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  const participant = await prisma.participant.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.participantEvent.deleteMany({ where: { participantId: participant.id } }),
    prisma.participantProgress.deleteMany({ where: { participantId: participant.id } }),
    prisma.participantCode.deleteMany({ where: { participantId: participant.id } }),
    prisma.session.deleteMany({ where: { participantId: participant.id } }),
    prisma.participant.delete({ where: { id: participant.id } }),
  ])

  return NextResponse.json({ ok: true })
}
