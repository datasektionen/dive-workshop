import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { deleteSessionByToken, getSessionCookieName } from "@/lib/auth"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName())?.value

  await deleteSessionByToken(token)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })

  return response
}
