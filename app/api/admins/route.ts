import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

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

export async function POST(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()
  const { fullName, email, password } = body ?? {}

  if (typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 })
  }

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  if (typeof password !== "string" || !password.trim()) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  try {
    const created = await prisma.admin.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        password: hashed,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ admin: created })
  } catch (error) {
    return NextResponse.json({ error: "Unable to create admin." }, { status: 400 })
  }
}
