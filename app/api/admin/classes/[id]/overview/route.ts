import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  const classItem = await prisma.class.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      name: true,
      startDate: true,
      endDate: true,
      courseId: true,
      course: { select: { id: true, name: true } },
    },
  })

  if (!classItem) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 })
  }

  const modules = await prisma.courseModule.findMany({
    where: { courseId: classItem.courseId },
    orderBy: { order: "asc" },
    select: {
      module: {
        select: {
          id: true,
          title: true,
          blocks: {
            orderBy: { order: "asc" },
            select: { block: { select: { id: true, title: true } } },
          },
        },
      },
    },
  })
  const totalBlocks = modules.reduce(
    (sum, entry) => sum + entry.module.blocks.length,
    0
  )

  const blockMap = new Map<
    string,
    { blockTitle: string; moduleTitle: string }
  >()
  modules.forEach((entry) => {
    entry.module.blocks.forEach((blockEntry) => {
      blockMap.set(blockEntry.block.id, {
        blockTitle: blockEntry.block.title,
        moduleTitle: entry.module.title,
      })
    })
  })

  const participants = await prisma.participant.findMany({
    where: { classId: id },
    select: { id: true, name: true, createdAt: true, code: true },
    orderBy: { createdAt: "desc" },
  })

  const [
    progressByParticipant,
    runByParticipant,
    lastEventByParticipant,
    lastRunBlocks,
    totalEvents,
    totalRuns,
  ] = await Promise.all([
      prisma.participantProgress.groupBy({
        by: ["participantId"],
        where: { classId: id, participantId: { not: null } },
        _count: { blockId: true },
        _max: { lastViewedAt: true, lastRunAt: true },
      }),
      prisma.participantProgress.groupBy({
        by: ["participantId"],
        where: { classId: id, participantId: { not: null } },
        _sum: { runCount: true },
      }),
      prisma.participantEvent.groupBy({
        by: ["participantId"],
        where: { classId: id, participantId: { not: null } },
        _max: { createdAt: true },
      }),
      prisma.participantProgress.findMany({
        where: {
          classId: id,
          lastRunAt: { not: null },
          participantId: { not: null },
        },
        orderBy: { lastRunAt: "desc" },
        distinct: ["participantId"],
        select: { participantId: true, blockId: true },
      }),
      prisma.participantEvent.count({ where: { classId: id } }),
      prisma.participantEvent.count({ where: { classId: id, type: "code_run" } }),
    ])

  const progressMap = new Map(
    progressByParticipant.map((entry) => [entry.participantId, entry])
  )
  const runMap = new Map(
    runByParticipant.map((entry) => [entry.participantId, entry._sum.runCount ?? 0])
  )
  const lastEventMap = new Map(
    lastEventByParticipant.map((entry) => [entry.participantId, entry._max.createdAt])
  )
  const lastRunBlockMap = new Map(
    lastRunBlocks.map((entry) => [entry.participantId, entry.blockId])
  )

  const now = Date.now()
  const activeThreshold = now - 15 * 60 * 1000

  const participantRows = participants.map((participant) => {
    const progress = progressMap.get(participant.id)
    const completed = progress?._count.blockId ?? 0
    const progressPercent =
      totalBlocks > 0 ? Math.round((completed / totalBlocks) * 100) : 0
    const lastEvent = lastEventMap.get(participant.id) ?? null
    const lastActive = lastEvent
      ? lastEvent
      : progress?._max.lastRunAt ?? progress?._max.lastViewedAt ?? null

    return {
      id: participant.id,
      name: participant.name ?? "Participant",
      joinedAt: participant.createdAt,
      progressPercent,
      completedBlocks: completed,
      totalBlocks,
      runCount: runMap.get(participant.id) ?? 0,
      lastActive,
      lastRunBlock: lastRunBlockMap.get(participant.id) ?? null,
      participantCode: participant.code ?? null,
    }
  })

  const activeParticipants = participantRows.filter((row) => {
    if (!row.lastActive) return false
    return row.lastActive.getTime() >= activeThreshold
  }).length

  return NextResponse.json({
    class: classItem,
    stats: {
      participants: participants.length,
      activeParticipants,
      totalBlocks,
      totalEvents,
      totalRuns,
    },
    participants: participantRows,
    blocks: Array.from(blockMap.entries()).map(([id, info]) => ({
      id,
      ...info,
    })),
  })
}
