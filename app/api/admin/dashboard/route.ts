import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      name: true,
      startDate: true,
      endDate: true,
      courseId: true,
      course: { select: { name: true } },
    },
  })

  const now = new Date()
  const activeClasses = classes.filter((classItem) => {
    const afterStart = !classItem.startDate || classItem.startDate <= now
    const beforeEnd = !classItem.endDate || classItem.endDate >= now
    return afterStart && beforeEnd
  })

  const courseBlockCounts = new Map<string, number>()
  async function getBlockCount(courseId: string) {
    if (courseBlockCounts.has(courseId)) {
      return courseBlockCounts.get(courseId) ?? 0
    }
    const moduleIds = await prisma.courseModule.findMany({
      where: { courseId },
      select: { moduleId: true },
    })
    const ids = moduleIds.map((entry) => entry.moduleId)
    if (ids.length === 0) {
      courseBlockCounts.set(courseId, 0)
      return 0
    }
    const totalBlocks = await prisma.moduleBlock.count({
      where: { moduleId: { in: ids } },
    })
    courseBlockCounts.set(courseId, totalBlocks)
    return totalBlocks
  }

  const dashboards = await Promise.all(
    activeClasses.map(async (classItem) => {
      const [participants, runEvents, progressCount, totalBlocks] =
        await Promise.all([
          prisma.participant.count({
            where: { classId: classItem.id },
          }),
          prisma.participantEvent.count({
            where: { classId: classItem.id, type: "code_run" },
          }),
          prisma.participantProgress.count({
            where: { classId: classItem.id, participantId: { not: null } },
          }),
          getBlockCount(classItem.courseId),
        ])

      const participantMax = participants * Math.max(totalBlocks, 1)
      const progressPercent =
        participantMax > 0
          ? Math.round((progressCount / participantMax) * 100)
          : 0

      return {
        id: classItem.id,
        title: classItem.title,
        name: classItem.name,
        startDate: classItem.startDate,
        endDate: classItem.endDate,
        courseName: classItem.course?.name ?? "",
        participants,
        runEvents,
        progressPercent,
      }
    })
  )

  return NextResponse.json({ classes: dashboards })
}
