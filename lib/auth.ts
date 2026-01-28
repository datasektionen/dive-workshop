import "server-only"

import crypto from "crypto"
import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"

const SESSION_COOKIE = "dive_session"
const SESSION_TTL_DAYS = 7
const ADMIN_SESSION_TYPE = "admin"
const PARTICIPANT_SESSION_TYPE = "participant"

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export async function createAdminSession(adminId: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      type: ADMIN_SESSION_TYPE,
      adminId,
      tokenHash,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getAdminFromSessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { admin: true },
  })

  if (!session || session.type !== ADMIN_SESSION_TYPE) {
    return null
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session.admin
}

export async function getAdminFromRequest() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return getAdminFromSessionToken(token)
}

export async function createParticipantSession(name: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      type: PARTICIPANT_SESSION_TYPE,
      name,
      tokenHash,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getParticipantFromSessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  })

  if (!session || session.type !== PARTICIPANT_SESSION_TYPE) {
    return null
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return { name: session.name ?? "Participant" }
}

export async function getParticipantFromRequest() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return getParticipantFromSessionToken(token)
}

export async function deleteSessionByToken(token: string | undefined) {
  if (!token) {
    return
  }

  const tokenHash = hashToken(token)

  try {
    await prisma.session.delete({
      where: { tokenHash },
    })
  } catch (error) {
    // Ignore missing session deletes.
  }
}
