import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "./constants";

const COOKIE = "gant_session";

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("缺少 SESSION_SECRET");
  }
  return new TextEncoder().encode(s);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub as string | undefined;
    if (!sub) return null;
    const u = await prisma.user.findUnique({ where: { id: sub } });
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) {
    throw new Error("未登录");
  }
  return s;
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function isLead(u: SessionUser) {
  return u.role === UserRole.LEAD;
}
