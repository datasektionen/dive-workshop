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
      description: true,
      accessCode: true,
      active: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return NextResponse.json({ classes })
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

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

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 })
  }

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  if (typeof accessCode !== "string" || !accessCode.trim()) {
    return NextResponse.json(
      { error: "Access code is required." },
      { status: 400 }
    )
  }

  if (typeof courseId !== "string" || !courseId.trim()) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 })
  }

  const parsedStart =
    typeof startDate === "string" && startDate.trim()
      ? new Date(startDate)
      : null
  const parsedEnd =
    typeof endDate === "string" && endDate.trim() ? new Date(endDate) : null

  if (parsedStart && Number.isNaN(parsedStart.getTime())) {
    return NextResponse.json(
      { error: "Start date is invalid." },
      { status: 400 }
    )
  }

  if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
    return NextResponse.json(
      { error: "End date is invalid." },
      { status: 400 }
    )
  }

  const classItem = await prisma.class.create({
    data: {
      title: title.trim(),
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      accessCode: accessCode.trim(),
      active: typeof active === "boolean" ? active : true,
      courseId: courseId.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
    },
    select: {
      id: true,
      title: true,
      name: true,
      description: true,
      accessCode: true,
      active: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      course: {
        select: { id: true, name: true },
      },
    },
  })

  return NextResponse.json({ class: classItem })
}
