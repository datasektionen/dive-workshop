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
      courseId: true,
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
  const { title, name, description, accessCode, courseId } = body ?? {}

  const data: {
    title?: string
    name?: string
    description?: string
    accessCode?: string
    courseId?: string
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

  if (typeof courseId === "string" && courseId.trim()) {
    data.courseId = courseId.trim()
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
        courseId: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ class: classItem })
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
