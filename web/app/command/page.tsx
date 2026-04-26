import { prisma } from "@/lib/prisma";
import { ScheduleMode } from "@/lib/constants";
import { getDefaultCommandWindow } from "@/lib/dates";
import {
  createProjectInReserve,
  deployFromReserve,
  returnToReserve,
} from "@/app/actions/projects";
import { CommandGantt } from "@/components/CommandGantt";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const { start: windowStart, end: windowEnd } = getDefaultCommandWindow(8);
  const rangeMs = windowEnd.getTime() - windowStart.getTime();

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { members: { include: { user: true } } },
  });

  const reserve = projects.filter(
    (p) => p.scheduleMode === ScheduleMode.IN_RESERVE
  );
  const tbd = projects.filter(
    (p) => p.scheduleMode === ScheduleMode.TBD_ON_TIMELINE
  );
  const onTimeline = projects.filter(
    (p) => p.scheduleMode === ScheduleMode.ON_TIMELINE
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-amber-200/80">
          <span className="h-2 w-2 rounded-sm bg-amber-400/80" />
          储备与意向
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          新建默认进池；未上时间轴、无日期承诺。可拖入时间轴与 PRD §3.1
          一致（当前为表单项）。
        </p>
        <div className="gant-panel mb-4 p-4">
          <form action={createProjectInReserve} className="flex flex-wrap gap-2">
            <input
              name="title"
              placeholder="新项目名称"
              className="gant-input min-w-[200px] flex-1 rounded border border-cyan-500/20 bg-slate-950/80 px-3 py-2 text-sm"
            />
            <input
              name="description"
              placeholder="说明（可空）"
              className="gant-input min-w-[200px] flex-1 rounded border border-cyan-500/20 bg-slate-950/80 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="gant-btn rounded px-3 py-2 text-sm"
            >
              创建入池
            </button>
          </form>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reserve.map((p) => (
            <div
              key={p.id}
              className="gant-card flex flex-col justify-between p-4"
            >
              <div>
                <Link
                  href={`/command/projects/${p.id}`}
                  className="font-medium text-cyan-100/90 hover:underline"
                >
                  {p.title}
                </Link>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {p.description}
                  </p>
                ) : null}
              </div>
              <form
                action={deployFromReserve.bind(null, p.id)}
                className="mt-3 space-y-2 border-t border-cyan-500/10 pt-3"
              >
                <div className="flex gap-2 text-xs text-slate-400">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="mode"
                      value="dated"
                      defaultChecked
                    />
                    有日期
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="mode" value="tbd" />
                    上轴待定
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    name="plannedStart"
                    className="gant-input rounded border border-cyan-500/20 bg-slate-950/80 px-2 py-1 text-xs"
                  />
                  <input
                    type="date"
                    name="plannedEnd"
                    className="gant-input rounded border border-cyan-500/20 bg-slate-950/80 px-2 py-1 text-xs"
                    title="结束可空"
                  />
                  <button
                    type="submit"
                    className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100/90 hover:bg-amber-500/20"
                  >
                    上战场
                  </button>
                </div>
              </form>
            </div>
          ))}
          {reserve.length === 0 ? (
            <p className="text-sm text-slate-500">战情池空，请新建。</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-cyan-200/80">
          <span className="h-2 w-2 rounded-sm bg-cyan-400/80" />
          时间轴与待定列
        </h2>
        <CommandGantt
          windowStart={windowStart}
          windowEnd={windowEnd}
          rangeMs={rangeMs}
          tbd={tbd}
          onTimeline={onTimeline}
        />
      </section>
    </div>
  );
}
