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

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  })

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 })
  }

  return NextResponse.json({ course })
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
  const { name, description } = body ?? {}

  const data: { name?: string; description?: string } = {}

  if (typeof name === "string" && name.trim()) {
    data.name = name.trim()
  }

  if (typeof description === "string") {
    data.description = description.trim()
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const course = await prisma.course.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ course })
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
    await prisma.course.delete({ where: { id } })
  } catch (error) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
