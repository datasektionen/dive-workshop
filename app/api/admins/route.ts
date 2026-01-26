import { NextResponse } from "next/server"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

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
