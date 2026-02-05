import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: adminId } = await params;

  if (!adminId) {
    return NextResponse.json(
      { error: "Admin id is required." },
      { status: 400 },
    );
  }

  const adminRecord = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!adminRecord) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }

  return NextResponse.json({ admin: adminRecord });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: adminId } = await params;

  if (!adminId) {
    return NextResponse.json(
      { error: "Admin id is required." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { fullName, email, password } = body ?? {};

  const data: { fullName?: string; email?: string; password?: string } = {};

  if (typeof fullName === "string" && fullName.trim()) {
    data.fullName = fullName.trim();
  }

  if (typeof email === "string" && email.trim()) {
    data.email = email.trim();
  }

  if (typeof password === "string" && password.trim()) {
    data.password = await bcrypt.hash(password, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No changes provided." },
      { status: 400 },
    );
  }

  try {
    const admin = await prisma.admin.update({
      where: { id: adminId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json({ error: "Update failed." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: adminId } = await params;

  if (!adminId) {
    return NextResponse.json(
      { error: "Admin id is required." },
      { status: 400 },
    );
  }

  try {
    await prisma.admin.delete({
      where: { id: adminId },
    });
  } catch (error) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
