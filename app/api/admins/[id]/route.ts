import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const adminId = params.id

  if (!adminId) {
    return NextResponse.json({ error: "Admin id is required." }, { status: 400 })
  }

  try {
    await prisma.admin.delete({
      where: { id: adminId },
    })
  } catch (error) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
