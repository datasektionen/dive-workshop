import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ courses })
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()
  const { name, description } = body ?? {}

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  const course = await prisma.course.create({
    data: {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ course })
}
