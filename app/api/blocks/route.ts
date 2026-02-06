import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { getAdminFromRequest } from "@/lib/auth"
import { isBlockType } from "@/lib/content/types"
import { isImagiSnippetMode } from "@/lib/markdown/imagi-types"
import { prisma } from "@/lib/prisma"

type MarkdownImagiCacheInput = {
  snippetKey?: unknown
  language?: unknown
  mode?: unknown
  code?: unknown
  codeHash?: unknown
  frames?: unknown
  loopCount?: unknown
  error?: unknown
}

function parseMarkdownImagiCaches(
  input: unknown
): Array<{
  snippetKey: string
  language: string
  mode: string
  code: string
  codeHash: string
  frames: Prisma.InputJsonValue
  loopCount: number
  error: string | null
}> | null {
  if (typeof input === "undefined") {
    return null
  }
  if (!Array.isArray(input)) {
    return []
  }

  const parsed: Array<{
    snippetKey: string
    language: string
    mode: string
    code: string
    codeHash: string
    frames: Prisma.InputJsonValue
    loopCount: number
    error: string | null
  }> = []

  for (const item of input as MarkdownImagiCacheInput[]) {
    const snippetKey =
      typeof item?.snippetKey === "string" ? item.snippetKey.trim() : ""
    const language =
      typeof item?.language === "string" ? item.language.trim() : ""
    const mode = item?.mode
    const code = typeof item?.code === "string" ? item.code : ""
    const codeHash =
      typeof item?.codeHash === "string" ? item.codeHash.trim() : ""
    const frames = Array.isArray(item?.frames)
      ? (item.frames as Prisma.InputJsonValue)
      : ([] as Prisma.InputJsonValue)
    const loopCount = Number.isFinite(Number(item?.loopCount))
      ? Number(item?.loopCount)
      : 0
    const error =
      typeof item?.error === "string" && item.error.trim()
        ? item.error.trim()
        : null

    if (
      !snippetKey ||
      !language ||
      !isImagiSnippetMode(mode) ||
      !codeHash ||
      typeof code !== "string"
    ) {
      continue
    }

    parsed.push({
      snippetKey,
      language,
      mode,
      code,
      codeHash,
      frames,
      loopCount,
      error,
    })
  }

  return parsed
}

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
      name: true,
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
  const {
    type,
    name,
    title,
    description,
    body: content,
    defaultCode,
    default_code,
    markdownImagiCaches,
  } = body ?? {}

  const parsedMarkdownImagiCaches = parseMarkdownImagiCaches(markdownImagiCaches)

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 })
  }

  if (!isBlockType(type)) {
    return NextResponse.json({ error: "Type is required." }, { status: 400 })
  }

  const block = await prisma.$transaction(async (tx) => {
    const createdBlock = await tx.block.create({
      data: {
        type,
        name: name.trim(),
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        body: typeof content === "string" ? content : "",
        defaultCode:
          typeof defaultCode === "string"
            ? defaultCode
            : typeof default_code === "string"
              ? default_code
              : "",
      },
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

    if (parsedMarkdownImagiCaches) {
      await tx.blockMarkdownImagiCache.deleteMany({
        where: { blockId: createdBlock.id },
      })
      if (parsedMarkdownImagiCaches.length > 0) {
        await tx.blockMarkdownImagiCache.createMany({
          data: parsedMarkdownImagiCaches.map((item) => ({
            ...item,
            blockId: createdBlock.id,
          })),
        })
      }
    }

    return createdBlock
  })

  return NextResponse.json({ block })
}
