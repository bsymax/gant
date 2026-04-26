import Link from "next/link";
import { returnToReserve } from "@/app/actions/projects";

/** 与指挥台查询的 project include 一致 */
export type CommandGanttProject = {
  id: string;
  title: string;
  plannedStart: Date | null;
  plannedEnd: Date | null;
  members: { id: string; user: { id: string; name: string } }[];
};

type Props = {
  windowStart: Date;
  windowEnd: Date;
  rangeMs: number;
  tbd: CommandGanttProject[];
  onTimeline: CommandGanttProject[];
};

function barLayout(
  p: CommandGanttProject,
  windowStart: Date,
  rangeMs: number
): { left: number; width: number; visible: boolean } {
  if (!p.plannedStart) return { left: 0, width: 0, visible: false };
  const start = p.plannedStart.getTime();
  const end = p.plannedEnd
    ? p.plannedEnd.getTime()
    : start + 7 * 24 * 60 * 60 * 1000;
  const w0 = windowStart.getTime();
  const w1 = w0 + rangeMs;
  const leftEdge = Math.max(start, w0);
  const rightEdge = Math.min(end, w1);
  if (rightEdge <= w0 || leftEdge >= w1) {
    return { left: 0, width: 0, visible: false };
  }
  const left = ((leftEdge - w0) / rangeMs) * 100;
  const width = ((rightEdge - leftEdge) / rangeMs) * 100;
  return { left, width, visible: width > 0 };
}

const WEEKS = 8;

export function CommandGantt({
  windowStart,
  windowEnd,
  rangeMs,
  tbd,
  onTimeline,
}: Props) {
  return (
    <div className="gant-panel p-0">
      <div className="grid grid-cols-[minmax(160px,1fr)_minmax(0,6fr)] gap-0 border-b border-cyan-500/15">
        <div className="p-2 text-xs text-slate-500" />
        <div
          className="grid border-l border-cyan-500/10"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0,1fr))` }}
        >
          {Array.from({ length: WEEKS }, (_, i) => (
            <div
              key={i}
              className="border-l border-cyan-500/10 p-2 text-center text-[10px] text-slate-500 first:border-l-0"
            >
              {i === 0 ? "本周" : `+${i}周`}
            </div>
          ))}
        </div>
      </div>

      {onTimeline.map((p) => {
        const b = barLayout(p, windowStart, rangeMs);
        return (
          <div
            key={p.id}
            className="grid grid-cols-[minmax(160px,1fr)_minmax(0,6fr)] border-b border-cyan-500/5"
          >
            <div className="p-2">
              <Link
                href={`/command/projects/${p.id}`}
                className="text-sm text-cyan-100/90 hover:underline"
              >
                {p.title}
              </Link>
              <form action={returnToReserve.bind(null, p.id)} className="mt-1">
                <button
                  type="submit"
                  className="text-[10px] text-slate-500 hover:text-amber-300/80"
                >
                  降回探索
                </button>
              </form>
            </div>
            <div className="relative min-h-12 border-l border-cyan-500/10 p-1">
              <div className="pointer-events-none absolute inset-0 grid opacity-30"
                style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}
              >
                {Array.from({ length: WEEKS }, (_, i) => (
                  <div
                    key={i}
                    className="border-l border-cyan-500/20 first:border-l-0"
                  />
                ))}
              </div>
              <div className="relative h-8 w-full">
                {b.visible ? (
                  <div
                    className="absolute top-1 h-6 rounded border border-cyan-400/40 bg-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                    style={{
                      left: `${b.left}%`,
                      width: `${Math.max(b.width, 1.2)}%`,
                    }}
                    title={
                      p.plannedStart
                        ? `${p.plannedStart.toLocaleDateString()} → ${p.plannedEnd?.toLocaleDateString() ?? "未设结束"}`
                        : undefined
                    }
                  />
                ) : (
                  <span className="p-1 text-[10px] text-slate-600">
                    本时间窗外或无日期
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {tbd.length > 0 && (
        <div className="border-t border-amber-500/20 bg-amber-500/[0.03] p-3">
          <h3 className="mb-2 text-xs font-mono tracking-widest text-amber-200/80">
            待定 TBD
          </h3>
          <div className="flex flex-wrap gap-2">
            {tbd.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded border border-amber-500/25 bg-amber-500/5 px-3 py-2"
              >
                <Link
                  href={`/command/projects/${p.id}`}
                  className="text-sm text-amber-100/90"
                >
                  {p.title}
                </Link>
                <form action={returnToReserve.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="text-[10px] text-slate-500 hover:text-amber-200/90"
                  >
                    降回
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {onTimeline.length === 0 && tbd.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">暂无在轴项目。</p>
      ) : null}
      <p className="border-t border-cyan-500/10 p-2 text-[10px] text-slate-600">
        窗: {windowStart.toLocaleDateString()} — {windowEnd.toLocaleDateString()}{" "}
        · {WEEKS} 周
      </p>
    </div>
  );
}
