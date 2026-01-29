import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const modules = await prisma.module.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          blocks: true,
        },
      },
    },
  })

  return NextResponse.json({ modules })
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()
  const { name, title, description, blockIds } = body ?? {}

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    )
  }

  const blocks =
    Array.isArray(blockIds) && blockIds.length
      ? blockIds.filter((blockId) => typeof blockId === "string")
      : []

  const moduleItem = await prisma.module.create({
    data: {
      name: name.trim(),
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      blocks: {
        create: blocks.map((blockId, index) => ({ blockId, order: index })),
      },
    },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      createdAt: true,
      _count: { select: { blocks: true } },
    },
  })

  return NextResponse.json({ module: moduleItem })
}
