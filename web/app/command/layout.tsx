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
      <header className="gant-header-bar flex h-12 shrink-0 items-center justify-between px-4">
        <Link
          href="/command"
          className="font-mono text-sm font-medium tracking-[0.2em] text-cyan-200"
        >
          GANT · 战情
        </Link>
        <div className="flex items-center gap-4 text-sm text-[var(--gant-fore-secondary)]">
          <span>
            {s.name}
            <span className="ml-2 font-mono text-sky-400/90">{s.erp}</span>
            <span className="ml-1 text-[var(--gant-fore-secondary)]">
              {s.role === "LEAD" ? "组长" : "成员"}
            </span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="gant-btn-ghost px-2 py-1 text-xs">
              退出
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}
