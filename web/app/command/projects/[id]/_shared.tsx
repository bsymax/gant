import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessProject, canManageProjectRoster } from "@/lib/permissions";
import { UserRole } from "@/lib/constants";

export type TaskWith = Prisma.TaskGetPayload<{
  include: {
    owner: true;
    assignees: { include: { user: true } };
  };
}>;

export type TaskWithSubs = TaskWith & { subtasks: TaskWith[] };

async function loadProjectCoreContext(id: string) {
  const u = await getSession();
  if (!u) redirect("/login");
  if (!(await canAccessProject(u, id))) redirect("/command");
  const canProjectAdmin = await canManageProjectRoster(u, id);
  return { u, canProjectAdmin };
}

export async function loadProjectPlanningShared(id: string) {
  const { u, canProjectAdmin } = await loadProjectCoreContext(id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      tasks: {
        where: { parentTaskId: null },
        include: {
          subtasks: {
            include: {
              owner: true,
              assignees: { include: { user: true } },
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          owner: true,
          assignees: { include: { user: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!project) notFound();

  const allUsers = await prisma.user.findMany({ orderBy: { erp: "asc" } });
  return {
    u,
    project,
    allUsers,
    canProjectAdmin,
  };
}

export async function loadProjectPersonnelShared(id: string) {
  const { u } = await loadProjectCoreContext(id);
  if (u.role !== UserRole.LEAD) {
    redirect(`/command/projects/${id}/planning`);
  }
  return { u };
}

export function ProjectSectionTabs({
  projectId,
  active,
  showPersonnel = true,
}: {
  projectId: string;
  active: "planning" | "tree" | "execution" | "generals" | "personnel";
  showPersonnel?: boolean;
}) {
  const base = "rounded-md border px-3 py-1.5 text-xs transition";
  const on = "border-sky-400 bg-sky-50 text-sky-700 shadow-sm";
  const off = "border-[var(--gant-line-soft)] text-[var(--gant-fore-secondary)] hover:bg-slate-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/command/projects/${projectId}/planning`}
        className={`${base} ${active === "planning" ? on : off}`}
      >
        项目信息维护 / 任务计划
      </a>
      <a
        href={`/command/projects/${projectId}/tree`}
        className={`${base} ${active === "tree" ? on : off}`}
      >
        项目作战全景图
      </a>
      <a
        href={`/command/projects/${projectId}/execution`}
        className={`${base} ${active === "execution" ? on : off}`}
      >
        任务执行情况
      </a>
      <a
        href={`/command/projects/${projectId}/execution/generals`}
        className={`${base} ${active === "generals" ? on : off}`}
      >
        战将信息
      </a>
      {showPersonnel ? (
        <a
          href={`/command/projects/${projectId}/personnel`}
          className={`${base} ${active === "personnel" ? on : off}`}
        >
          人员信息维护
        </a>
      ) : null}
    </div>
  );
}
