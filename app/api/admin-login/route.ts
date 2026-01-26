import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    )
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    )
  }

  const isValid = await bcrypt.compare(password, admin.password)

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
