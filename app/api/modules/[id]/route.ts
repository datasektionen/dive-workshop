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

  const moduleItem = await prisma.module.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      createdAt: true,
      blocks: {
        select: {
          blockId: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!moduleItem) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 })
  }

  return NextResponse.json({ module: moduleItem })
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
  const { name, title, description, blockIds } = body ?? {}

  const data: {
    name?: string
    title?: string
    description?: string
    blocks?: {
      deleteMany: Record<string, never>
      create: { blockId: string }[]
    }
  } = {}

  if (typeof name === "string" && name.trim()) {
    data.name = name.trim()
  }

  if (typeof title === "string" && title.trim()) {
    data.title = title.trim()
  }

  if (typeof description === "string") {
    data.description = description.trim()
  }

  if (Array.isArray(blockIds)) {
    const blocks = blockIds.filter(
      (blockId) => typeof blockId === "string"
    ) as string[]
    data.blocks = {
      deleteMany: {},
      create: blocks.map((blockId, index) => ({ blockId, order: index })),
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const moduleItem = await prisma.module.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        createdAt: true,
        blocks: {
          select: { blockId: true, order: true },
          orderBy: { order: "asc" },
        },
      },
    })
    return NextResponse.json({ module: moduleItem })
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
    await prisma.module.delete({ where: { id } })
  } catch (error) {
    return NextResponse.json({ error: "Module not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
