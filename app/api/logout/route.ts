import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  deleteSessionByToken,
  getPreviewCookieName,
  getSessionCookieName,
} from "@/lib/auth"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName())?.value
  const previewToken = cookieStore.get(getPreviewCookieName())?.value

  await deleteSessionByToken(token)
  await deleteSessionByToken(previewToken)

  const response = NextResponse.json({ ok: true })

  const expiredCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  }

  response.cookies.set(getSessionCookieName(), "", expiredCookie)
  response.cookies.set(getPreviewCookieName(), "", expiredCookie)

  return response
}
