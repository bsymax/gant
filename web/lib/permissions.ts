import { prisma } from "./prisma";
import type { SessionUser } from "./auth";
import { UserRole } from "./constants";

export async function isProjectMember(
  userId: string,
  projectId: string
): Promise<boolean> {
  const m = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  return !!m;
}

/** 组长，或已加入该项目的成员 */
export async function canAccessProject(
  u: SessionUser,
  projectId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  return isProjectMember(u.id, projectId);
}

/** 可编辑项目元数据与成员 */
export async function canManageProjectRoster(
  u: SessionUser,
  projectId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  return isProjectMember(u.id, projectId);
}

export async function canCreateTask(
  u: SessionUser,
  projectId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  return isProjectMember(u.id, projectId);
}

export async function canEditTask(
  u: SessionUser,
  projectId: string,
  taskId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  if (await isProjectMember(u.id, projectId)) {
    return true;
  }
  const assign = await prisma.taskAssignee.findFirst({
    where: { taskId, userId: u.id },
  });
  return !!assign;
}
