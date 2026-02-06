import { NextResponse } from "next/server";

import { createParticipantSession, getSessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, accessCode } = await request.json();
  const normalizedAccessCode =
    typeof accessCode === "string" ? accessCode.trim() : "";

  if (!name || !normalizedAccessCode) {
    return NextResponse.json(
      { error: "Name and access code are required." },
      { status: 400 },
    );
  }

  const classItem = await prisma.class.findFirst({
    where: { accessCode: normalizedAccessCode },
    select: { id: true, active: true },
  });

  if (!classItem) {
    return NextResponse.json(
      { error: "Invalid access code." },
      { status: 401 },
    );
  }

  if (!classItem.active) {
    return NextResponse.json(
      { error: "This class is closed." },
      { status: 403 },
    );
  }

  const { token, expiresAt } = await createParticipantSession(
    String(name),
    classItem.id,
  );
  const response = NextResponse.json({ ok: true });

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
