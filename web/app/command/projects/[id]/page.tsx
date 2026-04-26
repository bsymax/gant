import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/permissions";
import {
  addProjectMemberForm,
  removeProjectMember,
  updateProjectTitle,
} from "@/app/actions/projects";
import { createTask, updateTaskStatusForm } from "@/app/actions/tasks";
import { TaskStatus } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await getSession();
  if (!u) redirect("/login");
  if (!(await canAccessProject(u, id))) {
    redirect("/command");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      tasks: { include: { assignees: { include: { user: true } } } },
    },
  });
  if (!project) notFound();

  const allUsers = await prisma.user.findMany({ orderBy: { email: "asc" } });
  const memberIds = new Set(project.members.map((m) => m.userId));

  const logs = await prisma.auditLog.findMany({
    where: { entityType: "PROJECT", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: true },
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <p>
        <Link href="/command" className="gant-link text-xs">
          ← 返回指挥台
        </Link>
      </p>

      <form action={updateProjectTitle.bind(null, id)} className="gant-panel p-4">
        <h1 className="mb-2 font-mono text-xl font-semibold text-cyan-100">项目</h1>
        <input
          name="title"
          defaultValue={project.title}
          className="gant-input mb-2 w-full px-3 py-2.5"
        />
        <textarea
          name="description"
          defaultValue={project.description}
          className="gant-input mb-2 w-full px-3 py-2.5"
          rows={2}
        />
        <button type="submit" className="gant-btn rounded px-3 py-1 text-sm">
          保存
        </button>
        <p className="gant-text-muted mt-2 text-xs">
          状态: {project.scheduleMode} · 有权限的协作人/组长可改
        </p>
      </form>

      <section className="gant-panel p-4">
        <h2 className="gant-text-body mb-2 font-mono text-sm font-medium">
          排兵 / 成员
        </h2>
        <ul className="mb-3 space-y-1">
          {project.members.map((m) => (
            <li
              key={m.id}
              className="gant-text-body flex items-center justify-between text-sm"
            >
              {m.user.name}
              <form action={removeProjectMember.bind(null, id, m.id)}>
                <button
                  type="submit"
                  className="gant-text-muted text-xs hover:text-amber-300"
                >
                  移出
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-wrap items-end gap-2"
          action={addProjectMemberForm.bind(null, id)}
        >
          <select
            name="userId"
            className="gant-input px-2 py-2 text-sm"
            defaultValue=""
          >
            <option value="">添加入员…</option>
            {allUsers
              .filter((x) => !memberIds.has(x.id))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
          <button type="submit" className="gant-btn rounded px-2 py-1 text-sm">
            加入
          </button>
        </form>
      </section>

      <section className="gant-panel p-4">
        <h2 className="gant-text-body mb-2 font-mono text-sm font-medium">事项</h2>
        <ul className="mb-3 space-y-2">
          {project.tasks.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-[var(--gant-line-soft)] bg-[rgba(27,40,55,0.4)] p-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-cyan-100">{t.title}</span>
                <form
                  action={updateTaskStatusForm.bind(
                    null,
                    id,
                    t.id
                  )}
                  className="inline"
                >
                  <input
                    type="hidden"
                    name="to"
                    value={
                      t.status === TaskStatus.DONE
                        ? TaskStatus.TODO
                        : TaskStatus.DONE
                    }
                  />
                  <button
                    type="submit"
                    className="gant-link text-xs"
                  >
                    切换: {t.status}
                  </button>
                </form>
              </div>
              {t.assignees.length > 0 && (
                <p className="gant-text-muted text-[10px]">
                  协作: {t.assignees.map((a) => a.user.name).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
        <form action={createTask.bind(null, id)} className="flex gap-2">
          <input
            name="title"
            placeholder="新事项"
            className="gant-input flex-1 px-2 py-2 text-sm"
            required
          />
          <button type="submit" className="gant-btn rounded px-2 py-1 text-sm">
            添加
          </button>
        </form>
      </section>

      <section className="gant-panel p-4">
        <h2 className="gant-text-body mb-2 font-mono text-sm font-medium">
          项目变更记录
        </h2>
        <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
          {logs.map((l) => (
            <li key={l.id} className="border-b border-[var(--gant-line-soft)] pb-1 text-[var(--gant-fore-secondary)]">
              <span className="text-sky-500/95">
                {l.createdAt.toLocaleString()}
              </span>{" "}
              · {l.user.name} · {l.action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
