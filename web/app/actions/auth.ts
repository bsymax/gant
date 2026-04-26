"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const dev = process.env.AUTH_DEV === "1";
  if (!dev) {
    throw new Error("当前环境未开放开发期登录，请设置 AUTH_DEV=1");
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
