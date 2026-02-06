import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type SearchResult = {
  id: string
  category: "class" | "course" | "module" | "block"
  label: string
  secondary: string
  href: string
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (!q) {
    return NextResponse.json({ results: [] as SearchResult[] })
  }

  const [classes, courses, modules, blocks] = await Promise.all([
    prisma.class.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { accessCode: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, title: true },
    }),
    prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, description: true },
    }),
    prisma.module.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, title: true },
    }),
    prisma.block.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, title: true, type: true },
    }),
  ])

  const results: SearchResult[] = [
    ...classes.map((item) => ({
      id: item.id,
      category: "class" as const,
      label: item.name,
      secondary: item.title || "No learner title",
      href: `/admin/classes/${item.id}/overview`,
    })),
    ...courses.map((item) => ({
      id: item.id,
      category: "course" as const,
      label: item.name,
      secondary: item.description || "Course",
      href: `/admin/courses/${item.id}`,
    })),
    ...modules.map((item) => ({
      id: item.id,
      category: "module" as const,
      label: item.name,
      secondary: item.title || "No learner title",
      href: `/admin/modules/${item.id}`,
    })),
    ...blocks.map((item) => ({
      id: item.id,
      category: "block" as const,
      label: item.name,
      secondary: `${item.title || "No learner title"} • ${item.type.toUpperCase()}`,
      href: `/admin/blocks/${item.id}`,
    })),
  ]

  return NextResponse.json({ results })
}
