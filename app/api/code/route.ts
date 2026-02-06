import { NextResponse } from "next/server"

import { getParticipantFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const participant = await getParticipantFromRequest()

  if (!participant || !participant.classId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get("blockId")

  if (!blockId) {
    return NextResponse.json({ error: "Block id is required." }, { status: 400 })
  }

  const code = participant.participantId
    ? await prisma.participantCode.findUnique({
        where: {
          participantId_blockId: {
            participantId: participant.participantId,
            blockId,
          },
        },
        select: { code: true, updatedAt: true },
      })
    : null

  const sessionCode =
    code ??
    (await prisma.participantCode.findFirst({
      where: {
        sessionId: participant.sessionId,
        blockId,
      },
      orderBy: { updatedAt: "desc" },
      select: { code: true, updatedAt: true },
    }))

  return NextResponse.json({
    code:
      typeof sessionCode?.code === "string" && sessionCode.code.trim().length > 0
        ? sessionCode.code
        : null,
    updatedAt: sessionCode?.updatedAt ?? null,
  })
}

export async function POST(request: Request) {
  const participant = await getParticipantFromRequest()

  if (!participant || !participant.classId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  if (participant.isPreview) {
    return NextResponse.json({ ok: true })
  }

  const body = (await request.json().catch(() => null)) as
    | { blockId?: string; code?: string }
    | null

  const blockId =
    typeof body?.blockId === "string" && body.blockId.trim()
      ? body.blockId.trim()
      : null
  const code = typeof body?.code === "string" ? body.code : null

  if (!blockId || code === null) {
    return NextResponse.json({ error: "Block id and code are required." }, { status: 400 })
  }

  if (participant.participantId) {
    await prisma.participantCode.upsert({
      where: {
        participantId_blockId: {
          participantId: participant.participantId,
          blockId,
        },
      },
      update: {
        code,
        classId: participant.classId,
        participantId: participant.participantId ?? null,
      },
      create: {
        sessionId: participant.sessionId,
        participantId: participant.participantId ?? null,
        classId: participant.classId,
        blockId,
        code,
      },
    })
  } else {
    const existingSessionCode = await prisma.participantCode.findFirst({
      where: {
        sessionId: participant.sessionId,
        blockId,
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    })

    if (existingSessionCode) {
      await prisma.participantCode.update({
        where: { id: existingSessionCode.id },
        data: {
          code,
          classId: participant.classId,
        },
      })
    } else {
      await prisma.participantCode.create({
        data: {
          sessionId: participant.sessionId,
          participantId: null,
          classId: participant.classId,
          blockId,
          code,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
