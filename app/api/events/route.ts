import { NextResponse } from "next/server"

import { getParticipantFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type EventPayload = {
  type: string
  blockId?: string
  moduleId?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: Request) {
  const participant = await getParticipantFromRequest()

  if (!participant || !participant.classId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (participant.isPreview) {
    return NextResponse.json({ ok: true })
  }

  const body = (await request.json().catch(() => null)) as EventPayload | null
  if (!body || typeof body.type !== "string" || !body.type.trim()) {
    return NextResponse.json({ error: "Event type is required." }, { status: 400 })
  }

  const blockId =
    typeof body.blockId === "string" && body.blockId.trim()
      ? body.blockId.trim()
      : null
  const moduleId =
    typeof body.moduleId === "string" && body.moduleId.trim()
      ? body.moduleId.trim()
      : null

  const event = await prisma.participantEvent.create({
    data: {
      type: body.type.trim(),
      sessionId: participant.sessionId,
      participantId: participant.participantId ?? null,
      classId: participant.classId,
      blockId,
      moduleId,
      metadata:
        body.metadata && typeof body.metadata === "object" ? body.metadata : null,
    },
    select: { id: true },
  })

  if (blockId) {
    if (body.type === "block_view" && participant.participantId) {
      await prisma.participantProgress.upsert({
        where: {
          participantId_blockId: {
            participantId: participant.participantId,
            blockId,
          },
        },
        update: {
          lastViewedAt: new Date(),
          moduleId,
        },
        create: {
          sessionId: participant.sessionId,
          participantId: participant.participantId ?? null,
          classId: participant.classId,
          blockId,
          moduleId,
          lastViewedAt: new Date(),
        },
      })
    }

    if (body.type === "code_run" && participant.participantId) {
      await prisma.participantProgress.upsert({
        where: {
          participantId_blockId: {
            participantId: participant.participantId,
            blockId,
          },
        },
        update: {
          runCount: { increment: 1 },
          lastRunAt: new Date(),
          moduleId,
        },
        create: {
          sessionId: participant.sessionId,
          participantId: participant.participantId ?? null,
          classId: participant.classId,
          blockId,
          moduleId,
          lastRunAt: new Date(),
          runCount: 1,
        },
      })
    }
  }

  return NextResponse.json({ id: event.id })
}
