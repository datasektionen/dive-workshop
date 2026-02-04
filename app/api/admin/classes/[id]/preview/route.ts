import { NextResponse } from "next/server"

import { getAdminFromRequest, getPreviewCookieName } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params

  const classItem = await prisma.class.findUnique({
    where: { id },
    select: { id: true, title: true },
  })

  if (!classItem) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      type: "preview",
      name: "Admin Preview",
      classId: classItem.id,
      tokenHash,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(getPreviewCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return NextResponse.json({ ok: true })
}
