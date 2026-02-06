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
      description: true,
      accessCode: true,
      active: true,
      courseId: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  })

  if (!classItem) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 })
  }

  return NextResponse.json({ class: classItem })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const {
    title,
    name,
    description,
    accessCode,
    active,
    courseId,
    startDate,
    endDate,
  } = body ?? {}

  const data: {
    title?: string
    name?: string
    description?: string
    accessCode?: string
    active?: boolean
    courseId?: string
    startDate?: Date | null
    endDate?: Date | null
  } = {}

  if (typeof title === "string" && title.trim()) {
    data.title = title.trim()
  }
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim()
  }

  if (typeof description === "string") {
    data.description = description.trim()
  }

  if (typeof accessCode === "string" && accessCode.trim()) {
    data.accessCode = accessCode.trim()
  }

  if (typeof active === "boolean") {
    data.active = active
  }

  if (typeof courseId === "string" && courseId.trim()) {
    data.courseId = courseId.trim()
  }

  if (typeof startDate === "string") {
    if (!startDate.trim()) {
      data.startDate = null
    } else {
      const parsed = new Date(startDate)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Start date is invalid." },
          { status: 400 }
        )
      }
      data.startDate = parsed
    }
  }

  if (typeof endDate === "string") {
    if (!endDate.trim()) {
      data.endDate = null
    } else {
      const parsed = new Date(endDate)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "End date is invalid." },
          { status: 400 }
        )
      }
      data.endDate = parsed
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const classItem = await prisma.class.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        name: true,
        description: true,
        accessCode: true,
        active: true,
        courseId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ class: classItem })
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.class.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: "Class not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
