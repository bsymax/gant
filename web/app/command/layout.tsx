import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";

export default async function CommandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSession();
  if (!s) {
    redirect("/login");
  }
  return (
    <div className="gant-canvas flex min-h-full flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-cyan-500/15 bg-slate-950/60 px-4 backdrop-blur">
        <Link
          href="/command"
          className="font-mono text-sm tracking-[0.2em] text-cyan-300/90"
        >
          GANT · 战情
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>
            {s.name}
            <span className="ml-2 text-cyan-500/70">
              {s.role === "LEAD" ? "组长" : "成员"}
            </span>
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded border border-slate-600/60 px-2 py-1 text-xs text-slate-400 hover:border-cyan-500/30 hover:text-cyan-200/80"
            >
              退出
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}
