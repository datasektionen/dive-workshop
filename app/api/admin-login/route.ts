import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createAdminSession, getSessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  await prisma.session.deleteMany({
    where: { adminId: admin.id, type: "admin" },
  });

  const { token, expiresAt } = await createAdminSession(admin.id);
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
