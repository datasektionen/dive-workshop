import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { getAdminFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
    },
  })
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()
  const { fullName, email, password } = body ?? {}

  const data: { fullName?: string; email?: string; password?: string } = {}

  if (typeof fullName === "string" && fullName.trim()) {
    data.fullName = fullName.trim()
  }

  if (typeof email === "string" && email.trim()) {
    data.email = email.trim()
  }

  if (typeof password === "string" && password.trim()) {
    data.password = await bcrypt.hash(password, 12)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  try {
    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    })
    return NextResponse.json({ admin: updated })
  } catch (error) {
    return NextResponse.json({ error: "Update failed." }, { status: 400 })
  }
}
