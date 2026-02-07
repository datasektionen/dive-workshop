import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { getAdminFromRequest } from "@/lib/auth"
import { type BlockType, isBlockType } from "@/lib/content/types"
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
      exampleSolution: true,
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
    exampleSolution,
    example_solution,
    markdownImagiCaches,
  } = body ?? {}
  const parsedMarkdownImagiCaches = parseMarkdownImagiCaches(markdownImagiCaches)

  const data: {
    type?: BlockType
    name?: string
    title?: string
    description?: string
    body?: string
    defaultCode?: string
    exampleSolution?: string
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

  if (typeof exampleSolution === "string") {
    data.exampleSolution = exampleSolution
  } else if (typeof example_solution === "string") {
    data.exampleSolution = example_solution
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const block = await prisma.$transaction(async (tx) => {
      const updatedBlock = await tx.block.update({
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
          exampleSolution: true,
          createdAt: true,
        },
      })

      if (parsedMarkdownImagiCaches) {
        await tx.blockMarkdownImagiCache.deleteMany({
          where: { blockId: id },
        })
        if (parsedMarkdownImagiCaches.length > 0) {
          await tx.blockMarkdownImagiCache.createMany({
            data: parsedMarkdownImagiCaches.map((item) => ({
              ...item,
              blockId: id,
            })),
          })
        }
      }

      return updatedBlock
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
