import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      class: {
        select: {
          id: true,
          title: true,
          name: true,
        },
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  return NextResponse.json({
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      code: participant.code,
      createdAt: participant.createdAt,
      classId: participant.class?.id ?? null,
      classTitle: participant.class?.title ?? null,
      className: participant.class?.name ?? null,
      lastSeenAt: participant.sessions[0]?.createdAt ?? null,
    })),
  })
}
