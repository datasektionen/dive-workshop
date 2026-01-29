import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { isBlockType } from "@/lib/content/types"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const blocks = await prisma.block.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ blocks })
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, description, body: content } = body ?? {}

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 })
  }

  if (!isBlockType(type)) {
    return NextResponse.json({ error: "Type is required." }, { status: 400 })
  }

  const block = await prisma.block.create({
    data: {
      type,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      body: typeof content === "string" ? content : "",
    },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      body: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ block })
}
