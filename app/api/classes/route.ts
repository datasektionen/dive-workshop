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
      name: true,
      description: true,
      accessCode: true,
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
  const { name, description, accessCode, courseId } = body ?? {}

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

  const classItem = await prisma.class.create({
    data: {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      accessCode: accessCode.trim(),
      courseId: courseId.trim(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      accessCode: true,
      createdAt: true,
      course: {
        select: { id: true, name: true },
      },
    },
  })

  return NextResponse.json({ class: classItem })
}
