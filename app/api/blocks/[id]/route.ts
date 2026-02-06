import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { type BlockType, isBlockType } from "@/lib/content/types"
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

  const block = await prisma.block.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      name: true,
      title: true,
      description: true,
      body: true,
      defaultCode: true,
      createdAt: true,
    },
  })

  if (!block) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 })
  }

  return NextResponse.json({ block })
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
    type,
    name,
    title,
    description,
    body: content,
    defaultCode,
    default_code,
  } = body ?? {}

  const data: {
    type?: BlockType
    name?: string
    title?: string
    description?: string
    body?: string
    defaultCode?: string
  } = {}

  if (isBlockType(type)) {
    data.type = type
  }

  if (typeof name === "string" && name.trim()) {
    data.name = name.trim()
  }

  if (typeof title === "string" && title.trim()) {
    data.title = title.trim()
  }

  if (typeof description === "string") {
    data.description = description.trim()
  }

  if (typeof content === "string") {
    data.body = content
  }

  if (typeof defaultCode === "string") {
    data.defaultCode = defaultCode
  } else if (typeof default_code === "string") {
    data.defaultCode = default_code
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const block = await prisma.block.update({
      where: { id },
      data,
      select: {
        id: true,
        type: true,
        name: true,
        title: true,
        description: true,
        body: true,
        defaultCode: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ block })
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
    await prisma.block.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: "Block not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
