import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ admins })
}
