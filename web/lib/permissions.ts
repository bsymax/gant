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
  _projectId: string
): Promise<boolean> {
  void _projectId;
  if (u.role === UserRole.LEAD) return true;
  return false;
}

export async function canCreateTask(
  u: SessionUser,
  projectId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  return isProjectMember(u.id, projectId);
}

/** 可编辑任务元数据（标题、描述、优先级、计划日期等）：组长、主将、副将 */
export async function canEditTaskMeta(
  u: SessionUser,
  projectId: string,
  taskId: string
): Promise<boolean> {
  if (u.role === UserRole.LEAD) return true;
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { ownerUserId: true },
  });
  if (!task) return false;
  if (task.ownerUserId === u.id) return true;
  const support = await prisma.taskAssignee.findFirst({
    where: { taskId, userId: u.id },
  });
  return !!support;
}
