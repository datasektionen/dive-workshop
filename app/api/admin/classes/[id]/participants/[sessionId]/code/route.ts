import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; sessionId: string }>
  }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id, sessionId } = await params
  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get("blockId")

  const participant = await prisma.participant.findFirst({
    where: { id: sessionId, classId: id },
    select: { id: true },
  })

  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 })
  }

  const codeEntry = blockId
    ? await prisma.participantCode.findUnique({
        where: {
          participantId_blockId: {
            participantId: sessionId,
            blockId,
          },
        },
        select: { code: true, updatedAt: true, blockId: true },
      })
    : await prisma.participantCode.findFirst({
        where: { participantId: sessionId },
        orderBy: { updatedAt: "desc" },
        select: { code: true, updatedAt: true, blockId: true },
      })

  return NextResponse.json({
    code: codeEntry?.code ?? "",
    updatedAt: codeEntry?.updatedAt ?? null,
    blockId: codeEntry?.blockId ?? null,
  })
}
