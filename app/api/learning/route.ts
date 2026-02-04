import { NextResponse } from "next/server"

import { getParticipantFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const participant = await getParticipantFromRequest()

  if (!participant || !participant.classId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const classItem = await prisma.class.findUnique({
    where: { id: participant.classId },
    select: {
      id: true,
      title: true,
      name: true,
      course: {
        select: {
          id: true,
          name: true,
          description: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              order: true,
              module: {
                select: {
                  id: true,
                  name: true,
                  title: true,
                  description: true,
                  blocks: {
                    orderBy: { order: "asc" },
                    select: {
                      order: true,
                      block: {
                        select: {
                          id: true,
                          type: true,
                          title: true,
                          description: true,
                          body: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!classItem?.course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 })
  }

  const course = classItem.course
  const modules = course.modules.map((entry) => {
    const moduleItem = entry.module
    return {
      id: moduleItem.id,
      name: moduleItem.name,
      title: moduleItem.title,
      description: moduleItem.description,
      blocks: moduleItem.blocks.map((blockEntry) => blockEntry.block),
    }
  })

  return NextResponse.json({
    name: participant.name,
    isPreview: participant.isPreview,
    participantCode: participant.participantCode,
    participantId: participant.participantId,
    class: {
      id: classItem.id,
      title: classItem.title,
      name: classItem.name,
    },
    course: {
      id: course.id,
      name: course.name,
      description: course.description,
      modules,
    },
  })
}
