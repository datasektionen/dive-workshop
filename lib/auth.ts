import "server-only"

import crypto from "crypto"
import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"

const SESSION_COOKIE = "dive_session"
const PREVIEW_COOKIE = "dive_preview"
const SESSION_TTL_DAYS = 7
const ADMIN_SESSION_TYPE = "admin"
const PARTICIPANT_SESSION_TYPE = "participant"
const PREVIEW_SESSION_TYPE = "preview"

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export function getPreviewCookieName() {
  return PREVIEW_COOKIE
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

export async function createParticipantSession(name: string, classId: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const maxAttempts = 20
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  let participant = null as null | { id: string; code: string }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const bytes = crypto.randomBytes(8)
    const participantCode = Array.from(bytes, (byte) => {
      return alphabet[byte % alphabet.length]
    }).join("")

    try {
      participant = await prisma.participant.create({
        data: {
          name,
          classId,
          code: participantCode,
        },
        select: { id: true, code: true },
      })
      break
    } catch (error) {
      // Duplicate code, retry.
    }
  }

  if (!participant) {
    throw new Error("Unable to generate a unique participant code.")
  }

  await prisma.session.create({
    data: {
      type: PARTICIPANT_SESSION_TYPE,
      name,
      classId,
      participantId: participant.id,
      tokenHash,
      expiresAt,
    },
  })

  return { token, expiresAt, participantCode: participant.code }
}

export async function getParticipantFromSessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  })

  if (
    !session ||
    (session.type !== PARTICIPANT_SESSION_TYPE &&
      session.type !== PREVIEW_SESSION_TYPE)
  ) {
    return null
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  if (session.type === PREVIEW_SESSION_TYPE) {
    return {
      sessionId: session.id,
      name: session.name ?? "Participant",
      classId: session.classId ?? null,
      isPreview: true,
      participantCode: null,
      participantId: session.participantId ?? null,
    }
  }

  const participant = session.participantId
    ? await prisma.participant.findUnique({
        where: { id: session.participantId },
        select: { id: true, name: true, classId: true, code: true },
      })
    : null

  return {
    sessionId: session.id,
    name: participant?.name ?? session.name ?? "Participant",
    classId: participant?.classId ?? session.classId ?? null,
    isPreview: false,
    participantCode: participant?.code ?? null,
    participantId: participant?.id ?? session.participantId ?? null,
  }
}

export async function getParticipantFromRequest() {
  const cookieStore = await cookies()
  const previewToken = cookieStore.get(PREVIEW_COOKIE)?.value
  if (previewToken) {
    const previewSession = await getParticipantFromSessionToken(previewToken)
    if (previewSession?.isPreview) {
      return previewSession
    }
  }

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
