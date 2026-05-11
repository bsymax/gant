"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { verifyPassword } from "@/lib/password";

export type LoginFormState = { error: string } | null;

export async function loginWithPasswordAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const erp = String(formData.get("erp") || "").trim();
  const password = String(formData.get("password") || "");
  if (!erp || !password) {
    return { error: "请填写 ERP 与密码" };
  }
  // 不用 ORM select passwordHash：开发模式下 Turbopack 偶发仍加载旧 Client，会报 Unknown field。
  const rows = await prisma.$queryRaw<Array<{ id: string; passwordHash: string }>>(
    Prisma.sql`SELECT id, "passwordHash" FROM "User" WHERE erp = ${erp} LIMIT 1`
  );
  const u = rows[0];
  if (
    !u ||
    !u.passwordHash ||
    !(await verifyPassword(password, u.passwordHash))
  ) {
    return { error: "ERP 或密码不正确" };
  }
  await createSession(u.id);
  revalidatePath("/");
  redirect("/command");
}

/** 仅 AUTH_DEV=1 时可用：下拉选用户直接进入 */
export async function loginDevPickAction(formData: FormData) {
  if (process.env.AUTH_DEV !== "1") {
    throw new Error("当前环境未开放开发期快捷登录");
  }
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) {
    throw new Error("请选择用户");
  }
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) {
    throw new Error("用户不存在");
  }
  await createSession(u.id);
  revalidatePath("/");
  redirect("/command");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/login");
}
