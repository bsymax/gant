"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canEditTask } from "@/lib/permissions";
import { AuditEntity, TaskStatus } from "@/lib/constants";

function parseDate(s: string | null): Date | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTask(projectId: string, formData: FormData) {
  const u = await requireSession();
  const { canCreateTask } = await import("@/lib/permissions");
  if (!(await canCreateTask(u, projectId))) {
    throw new Error("无权限");
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("事项标题必填");
  const t = await prisma.task.create({
    data: {
      projectId,
      title,
      status: TaskStatus.PENDING_START,
      ownerUserId: u.id,
    },
  });
  await logAudit({
    entityType: AuditEntity.TASK,
    entityId: t.id,
    action: "create",
    userId: u.id,
    diff: { projectId, title },
  });
  revalidatePath(`/command/projects/${projectId}`);
  revalidatePath("/command");
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: string
) {
  const u = await requireSession();
  if (!(await canEditTask(u, projectId, taskId))) {
    throw new Error("无权限");
  }
  const before = await prisma.task.findUnique({ where: { id: taskId } });
  if (!before) return;
  const after = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
  await logAudit({
    entityType: AuditEntity.TASK,
    entityId: taskId,
    action: "status",
    userId: u.id,
    diff: { before, after },
  });
  revalidatePath(`/command/projects/${projectId}`);
  revalidatePath("/command");
}

export async function updateTaskStatusForm(
  projectId: string,
  taskId: string,
  formData: FormData
) {
  const status = String(formData.get("to") || "").trim();
  if (!status) return;
  await updateTaskStatus(projectId, taskId, status);
}

export async function addTaskAssignee(
  projectId: string,
  taskId: string,
  userId: string
) {
  const u = await requireSession();
  if (!(await canEditTask(u, projectId, taskId))) {
    throw new Error("无权限");
  }
  const exists = await prisma.taskAssignee.findFirst({
    where: { taskId, userId },
  });
  if (exists) return;
  await prisma.taskAssignee.create({ data: { taskId, userId } });
  await logAudit({
    entityType: AuditEntity.TASK,
    entityId: taskId,
    action: "assignee_add",
    userId: u.id,
    diff: { userId },
  });
  revalidatePath(`/command/projects/${projectId}`);
}
