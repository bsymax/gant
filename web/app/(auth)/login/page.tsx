import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage() {
  const s = await getSession();
  if (s) {
    redirect("/command");
  }
  const users = await prisma.user.findMany({ orderBy: { erp: "asc" } });
  return (
    <div className="gant-canvas flex min-h-full flex-1 items-center justify-center p-6">
      <div className="gant-panel w-full max-w-md p-6">
        <h1 className="mb-1 font-mono text-lg font-semibold tracking-wider text-cyan-200">
          指挥台登录
        </h1>
        <p className="gant-text-body mb-6 text-sm">
          开发期选身份进入（<code className="text-sky-400">AUTH_DEV=1</code>
          ）。生产环境请接真实鉴权。
        </p>
        <form action={loginAction} className="space-y-4">
          <label className="gant-text-body block text-sm">用户</label>
          <select
            name="userId"
            required
            className="gant-input w-full px-3 py-2.5"
            defaultValue=""
          >
            <option value="" disabled>
              选择用户…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.erp}（{u.role === "LEAD" ? "组长" : "成员"}）
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
