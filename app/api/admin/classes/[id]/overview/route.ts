import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

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
  });

  if (!classItem) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
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
  });
  const totalBlocks = modules.reduce(
    (sum, entry) => sum + entry.module.blocks.length,
    0,
  );

  const orderedBlocks: {
    id: string;
    blockTitle: string;
    moduleTitle: string;
  }[] = [];
  modules.forEach((entry) => {
    entry.module.blocks.forEach((blockEntry) => {
      orderedBlocks.push({
        id: blockEntry.block.id,
        blockTitle: blockEntry.block.title,
        moduleTitle: entry.module.title,
      });
    });
  });

  const participants = await prisma.participant.findMany({
    where: { classId: id },
    select: { id: true, name: true, createdAt: true, code: true },
    orderBy: { createdAt: "desc" },
  });

  const [progressRows, lastEventByParticipant, totalEvents, totalRuns] =
    await Promise.all([
      // Pull the raw per-block progress rows once: cheap for a workshop-sized
      // class, and it lets us derive viewed-vs-attempted counts, last-run
      // block, and the per-block heatmap from a single query.
      prisma.participantProgress.findMany({
        where: { classId: id, participantId: { not: null } },
        select: {
          participantId: true,
          blockId: true,
          runCount: true,
          lastViewedAt: true,
          lastRunAt: true,
        },
      }),
      prisma.participantEvent.groupBy({
        by: ["participantId"],
        where: { classId: id, participantId: { not: null } },
        _max: { createdAt: true },
      }),
      prisma.participantEvent.count({ where: { classId: id } }),
      prisma.participantEvent.count({ where: { classId: id, type: "code_run" } }),
    ]);

  type Aggregate = {
    viewed: number;
    attempted: number;
    runCount: number;
    lastRunAt: Date | null;
    lastViewedAt: Date | null;
    lastRunBlock: string | null;
  };
  const aggByParticipant = new Map<string, Aggregate>();
  for (const row of progressRows) {
    if (!row.participantId) continue;
    let agg = aggByParticipant.get(row.participantId);
    if (!agg) {
      agg = {
        viewed: 0,
        attempted: 0,
        runCount: 0,
        lastRunAt: null,
        lastViewedAt: null,
        lastRunBlock: null,
      };
      aggByParticipant.set(row.participantId, agg);
    }
    agg.viewed += 1;
    if (row.runCount > 0) agg.attempted += 1;
    agg.runCount += row.runCount;
    if (row.lastRunAt && (!agg.lastRunAt || row.lastRunAt > agg.lastRunAt)) {
      agg.lastRunAt = row.lastRunAt;
      agg.lastRunBlock = row.blockId;
    }
    if (
      row.lastViewedAt &&
      (!agg.lastViewedAt || row.lastViewedAt > agg.lastViewedAt)
    ) {
      agg.lastViewedAt = row.lastViewedAt;
    }
  }

  const lastEventMap = new Map(
    lastEventByParticipant.map((entry) => [
      entry.participantId,
      entry._max.createdAt,
    ]),
  );

  const now = Date.now();
  const activeThreshold = now - 15 * 60 * 1000;

  const participantRows = participants.map((participant) => {
    const agg = aggByParticipant.get(participant.id);
    const viewed = agg?.viewed ?? 0;
    const attempted = agg?.attempted ?? 0;
    const progressPercent =
      totalBlocks > 0 ? Math.round((viewed / totalBlocks) * 100) : 0;
    const lastEvent = lastEventMap.get(participant.id) ?? null;
    const lastActive = lastEvent
      ? lastEvent
      : (agg?.lastRunAt ?? agg?.lastViewedAt ?? null);

    return {
      id: participant.id,
      name: participant.name ?? "Participant",
      joinedAt: participant.createdAt,
      progressPercent,
      viewedBlocks: viewed,
      attemptedBlocks: attempted,
      totalBlocks,
      runCount: agg?.runCount ?? 0,
      lastActive,
      lastRunBlock: agg?.lastRunBlock ?? null,
      participantCode: participant.code ?? null,
    };
  });

  const activeParticipants = participantRows.filter((row) => {
    if (!row.lastActive) return false;
    return row.lastActive.getTime() >= activeThreshold;
  }).length;

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
    blocks: orderedBlocks,
    // Per-(participant, block) cells for the progress heatmap.
    progressCells: progressRows.map((row) => ({
      participantId: row.participantId,
      blockId: row.blockId,
      runCount: row.runCount,
    })),
  });
}
