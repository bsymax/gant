"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProjectRoster, canAccessProject } from "@/lib/permissions";
import { ScheduleMode, AuditEntity } from "@/lib/constants";

function parseDate(s: string | null): Date | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createProjectInReserve(formData: FormData) {
  const u = await requireSession();
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    throw new Error("项目标题必填");
  }
  const description = String(formData.get("description") || "").trim();
  const p = await prisma.project.create({
    data: {
      title,
      description,
      scheduleMode: ScheduleMode.IN_RESERVE,
    },
  });
  await prisma.projectMember.create({
    data: { projectId: p.id, userId: u.id },
  });
  await logAudit({
    entityType: AuditEntity.PROJECT,
    entityId: p.id,
    action: "create_reserve",
    userId: u.id,
    diff: { title, scheduleMode: ScheduleMode.IN_RESERVE },
  });
  revalidatePath("/command");
  revalidatePath(`/command/projects/${p.id}`);
}

type DeployMode = "dated" | "tbd";

export async function deployFromReserve(
  projectId: string,
  formData: FormData
) {
  const u = await requireSession();
  if (!(await canManageProjectRoster(u, projectId))) {
    throw new Error("无权限");
  }
  const proj = await prisma.project.findUnique({ where: { id: projectId } });
  if (!proj || proj.scheduleMode !== ScheduleMode.IN_RESERVE) {
    throw new Error("仅「储备中」可上战场");
  }
  const mode = String(formData.get("mode") || "dated") as DeployMode;
  if (mode === "tbd") {
    const next = await prisma.project.update({
      where: { id: projectId },
      data: {
        scheduleMode: ScheduleMode.ON_TIMELINE,
        plannedStart: null,
        plannedEnd: null,
      },
    });
    await logAudit({
      entityType: AuditEntity.PROJECT,
      entityId: projectId,
      action: "deploy_tbd",
      userId: u.id,
      diff: { before: proj, after: next },
    });
  } else {
    const start = parseDate(String(formData.get("plannedStart")));
    if (!start) {
      throw new Error("请填写计划开始日期");
    }
    const end = parseDate(String(formData.get("plannedEnd")));
    const next = await prisma.project.update({
      where: { id: projectId },
      data: {
        scheduleMode: ScheduleMode.ON_TIMELINE,
        plannedStart: start,
        plannedEnd: end,
      },
    });
    await logAudit({
      entityType: AuditEntity.PROJECT,
      entityId: projectId,
      action: "deploy_timeline",
      userId: u.id,
      diff: { before: proj, after: next },
    });
  }
  revalidatePath("/command");
  revalidatePath(`/command/projects/${projectId}`);
}

export async function returnToReserve(projectId: string) {
  const u = await requireSession();
  if (!(await canManageProjectRoster(u, projectId))) {
    throw new Error("无权限");
  }
  const proj = await prisma.project.findUnique({ where: { id: projectId } });
  if (!proj) throw new Error("项目不存在");
  if (proj.scheduleMode === ScheduleMode.IN_RESERVE) {
    throw new Error("已在储备中");
  }
  const next = await prisma.project.update({
    where: { id: projectId },
    data: {
      scheduleMode: ScheduleMode.IN_RESERVE,
      plannedStart: null,
      plannedEnd: null,
    },
  });
  await logAudit({
    entityType: AuditEntity.PROJECT,
    entityId: projectId,
    action: "return_to_reserve",
    userId: u.id,
    diff: { before: proj, after: next },
  });
  revalidatePath("/command");
  revalidatePath(`/command/projects/${projectId}`);
}

export async function addProjectMember(projectId: string, userId: string) {
  const u = await requireSession();
  if (!(await canManageProjectRoster(u, projectId))) {
    throw new Error("无权限");
  }
  const exists = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  if (exists) return;
  await prisma.projectMember.create({ data: { projectId, userId } });
  await logAudit({
    entityType: AuditEntity.PROJECT,
    entityId: projectId,
    action: "member_add",
    userId: u.id,
    diff: { addedUserId: userId },
  });
  revalidatePath("/command");
  revalidatePath(`/command/projects/${projectId}`);
}

export async function addProjectMemberForm(
  projectId: string,
  formData: FormData
) {
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) return;
  await addProjectMember(projectId, userId);
}

export async function removeProjectMember(
  projectId: string,
  memberRowId: string
) {
  const u = await requireSession();
  if (!(await canManageProjectRoster(u, projectId))) {
    throw new Error("无权限");
  }
  const row = await prisma.projectMember.findFirst({
    where: { id: memberRowId, projectId },
  });
  if (!row) return;
  await prisma.projectMember.delete({ where: { id: memberRowId } });
  await logAudit({
    entityType: AuditEntity.PROJECT,
    entityId: projectId,
    action: "member_remove",
    userId: u.id,
    diff: { removedUserId: row.userId },
  });
  revalidatePath("/command");
  revalidatePath(`/command/projects/${projectId}`);
}

export async function updateProjectTitle(
  projectId: string,
  formData: FormData
) {
  const u = await requireSession();
  if (!(await canAccessProject(u, projectId))) {
    throw new Error("无权限");
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("标题必填");
  const description = String(formData.get("description") || "").trim();
  const before = await prisma.project.findUnique({ where: { id: projectId } });
  if (!before) return;
  const after = await prisma.project.update({
    where: { id: projectId },
    data: { title, description },
  });
  await logAudit({
    entityType: AuditEntity.PROJECT,
    entityId: projectId,
    action: "update",
    userId: u.id,
    diff: { before, after },
  });
  revalidatePath("/command");
  revalidatePath(`/command/projects/${projectId}`);
}
