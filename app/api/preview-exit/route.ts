import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  deleteSessionByToken,
  getPreviewCookieName,
} from "@/lib/auth"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getPreviewCookieName())?.value
  await deleteSessionByToken(token)
  cookieStore.set(getPreviewCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })

  return NextResponse.json({ ok: true })
}
