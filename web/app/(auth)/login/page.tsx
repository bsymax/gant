import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage() {
  const s = await getSession();
  if (s) {
    redirect("/command");
  }
  const users = await prisma.user.findMany({ orderBy: { email: "asc" } });
  return (
    <div className="gant-canvas flex min-h-full flex-1 items-center justify-center p-6">
      <div className="gant-panel w-full max-w-md p-6">
        <h1 className="mb-1 font-mono text-lg tracking-wider text-cyan-200/90">
          指挥台登录
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          开发期选身份进入（<code className="text-cyan-500/80">AUTH_DEV=1</code>
          ）。生产环境请接真实鉴权。
        </p>
        <form action={loginAction} className="space-y-4">
          <label className="block text-sm text-slate-300">用户</label>
          <select
            name="userId"
            required
            className="gant-input w-full rounded border border-cyan-500/20 bg-slate-950/80 px-3 py-2 text-slate-100"
            defaultValue=""
          >
            <option value="" disabled>
              选择用户…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.email} ({u.role === "LEAD" ? "组长" : "成员"})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="gant-btn w-full rounded px-4 py-2 font-mono text-sm uppercase tracking-widest"
          >
            进入
          </button>
        </form>
      </div>
    </div>
  );
}
