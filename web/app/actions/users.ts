"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { assertPasswordPolicy, hashPassword } from "@/lib/password";

function parseRole(raw: string): string {
  if (raw === UserRole.LEAD || raw === UserRole.MEMBER) {
    return raw;
  }
  throw new Error(`无效的角色：${raw}`);
}

function ensureLead(sessionRole: string) {
  if (sessionRole !== UserRole.LEAD) {
    throw new Error("仅组长可维护人员信息");
  }
}

function revalidateUserPages(projectId: string) {
  revalidatePath(`/command/projects/${projectId}/personnel`);
  revalidatePath(`/command/projects/${projectId}`);
  revalidatePath("/command");
  revalidatePath("/login");
}

function supportsUserAvatarField(): boolean {
  try {
    const runtimeModel = (
      prisma as unknown as {
        _runtimeDataModel?: {
          models?: Record<string, { fields?: Array<{ name: string }> }>;
        };
      }
    )._runtimeDataModel;
    const fields = runtimeModel?.models?.User?.fields ?? [];
    return fields.some((f) => f.name === "avatarUrl");
  } catch {
    return false;
  }
}

function isManagedAvatarUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith("/uploads/avatars/");
}

async function removeManagedAvatar(url: string | null | undefined) {
  if (!isManagedAvatarUrl(url)) return;
  const rel = url!.replace(/^\//, "");
  const abs = join(process.cwd(), "public", rel);
  try {
    await unlink(abs);
  } catch {
    // 删除失败不影响主流程（文件可能已不存在）
  }
}

function resolveAvatarExt(file: File): string {
  const fromName = extname(file.name || "").toLowerCase();
  if (fromName === ".jpg" || fromName === ".jpeg") return ".jpg";
  if (fromName === ".png") return ".png";
  if (fromName === ".webp") return ".webp";
  if (fromName === ".gif") return ".gif";
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  throw new Error("仅支持 jpg/png/webp/gif 图片");
}

async function saveAvatarFromForm(formData: FormData): Promise<string | null> {
  const maybe = formData.get("avatarFile");
  if (!(maybe instanceof File) || maybe.size <= 0) return null;
  if (!maybe.type.startsWith("image/")) {
    throw new Error("头像必须为图片文件");
  }
  if (maybe.size > 5 * 1024 * 1024) {
    throw new Error("头像图片请控制在 5MB 以内");
  }
  const ext = resolveAvatarExt(maybe);
  const dir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const absPath = join(dir, filename);
  const buf = Buffer.from(await maybe.arrayBuffer());
  await writeFile(absPath, buf);
  return `/uploads/avatars/${filename}`;
}

export async function createUserForm(projectId: string, formData: FormData) {
  const u = await requireSession();
  ensureLead(u.role);
  const erp = String(formData.get("erp") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = parseRole(String(formData.get("role") || ""));
  const supportAvatar = supportsUserAvatarField();
  if (!erp) throw new Error("ERP 必填");
  if (!name) throw new Error("姓名必填");
  const initialPassword = String(formData.get("initialPassword") || "");
  assertPasswordPolicy(initialPassword);
  const avatarUrl = supportAvatar ? (await saveAvatarFromForm(formData)) ?? "" : "";
  const data: {
    erp: string;
    name: string;
    role: string;
    passwordHash: string;
    avatarUrl?: string;
  } = {
    erp,
    name,
    role,
    passwordHash: hashPassword(initialPassword),
  };
  if (supportAvatar) {
    data.avatarUrl = avatarUrl;
  }
  await prisma.user.create({
    data,
  });
  revalidateUserPages(projectId);
}

export async function updateUserForm(projectId: string, userId: string, formData: FormData) {
  const u = await requireSession();
  ensureLead(u.role);
  const erp = String(formData.get("erp") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const clearAvatar = String(formData.get("clearAvatar") || "") === "1";
  const role = parseRole(String(formData.get("role") || ""));
  const supportAvatar = supportsUserAvatarField();
  if (!erp) throw new Error("ERP 必填");
  if (!name) throw new Error("姓名必填");
  const newPasswordRaw = String(formData.get("newPassword") || "").trim();
  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) throw new Error("用户不存在");
  let avatarUrl = "";
  if (supportAvatar) {
    const uploadedAvatar = await saveAvatarFromForm(formData);
    avatarUrl = (before as { avatarUrl?: string | null }).avatarUrl ?? "";
    if (uploadedAvatar) {
      avatarUrl = uploadedAvatar;
    } else if (clearAvatar) {
      avatarUrl = "";
    }
  }
  const data: {
    erp: string;
    name: string;
    role: string;
    passwordHash?: string;
    avatarUrl?: string;
  } = {
    erp,
    name,
    role,
  };
  if (newPasswordRaw) {
    assertPasswordPolicy(newPasswordRaw);
    data.passwordHash = hashPassword(newPasswordRaw);
  }
  if (supportAvatar) {
    data.avatarUrl = avatarUrl;
  }
  await prisma.user.update({
    where: { id: userId },
    data,
  });
  const beforeAvatar = (before as { avatarUrl?: string | null }).avatarUrl ?? null;
  if (supportAvatar && beforeAvatar !== avatarUrl && isManagedAvatarUrl(beforeAvatar)) {
    await removeManagedAvatar(beforeAvatar);
  }
  revalidateUserPages(projectId);
}

export async function deleteUserForm(projectId: string, userId: string, _formData: FormData) {
  void _formData;
  const u = await requireSession();
  ensureLead(u.role);
  const supportAvatar = supportsUserAvatarField();
  if (u.id === userId) {
    throw new Error("不允许删除当前登录用户");
  }

  const avatarSnapshot = supportAvatar
    ? ((await prisma.user.findUnique({
        where: { id: userId },
      })) as { avatarUrl?: string | null } | null)
    : null;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      _count: {
        select: {
          ownedTasks: true,
          auditLogs: true,
          weeklyOutcomesUpdated: true,
          weeklyAllocationsUpdated: true,
        },
      },
    },
  });
  if (!target) return;

  if (target.role === UserRole.LEAD) {
    const leadRows = await prisma.user.findMany({
      where: { role: UserRole.LEAD },
      select: { id: true, updatedAt: true },
    });
    if (leadRows.length <= 1) {
      throw new Error("删除组长前，请先将一名组员改为组长，再由新组长删除原组长。");
    }
    const newestOtherLead = leadRows
      .filter((x) => x.id !== userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    if (!newestOtherLead || newestOtherLead.id !== u.id) {
      throw new Error("仅允许新组长账号本人删除原组长，请切换到新组长账号后操作。");
    }
  }

  const hasHardRefs =
    target._count.ownedTasks > 0 ||
    target._count.auditLogs > 0 ||
    target._count.weeklyOutcomesUpdated > 0 ||
    target._count.weeklyAllocationsUpdated > 0;
  if (hasHardRefs) {
    throw new Error("该用户已有任务主将/审计记录/周报更新记录，暂不支持删除");
  }

  await prisma.user.delete({
    where: { id: userId },
  });
  const avatarUrl = avatarSnapshot?.avatarUrl ?? null;
  if (supportAvatar && isManagedAvatarUrl(avatarUrl)) {
    await removeManagedAvatar(avatarUrl);
  }
  revalidateUserPages(projectId);
}
