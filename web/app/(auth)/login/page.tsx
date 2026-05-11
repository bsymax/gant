import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForms } from "@/components/LoginForms";

export default async function LoginPage() {
  const s = await getSession();
  if (s) {
    redirect("/command");
  }
  const dev = process.env.AUTH_DEV === "1";
  const users = dev
    ? await prisma.user.findMany({
        orderBy: { erp: "asc" },
        select: { id: true, erp: true, name: true, role: true },
      })
    : [];

  return (
    <div className="gant-canvas flex min-h-full flex-1 items-center justify-center p-6">
      <div className="gant-panel w-full max-w-md p-6">
        <h1 className="mb-1 font-mono text-lg font-semibold tracking-wider text-slate-800">
          指挥台登录
        </h1>
        <p className="gant-text-body mb-6 text-sm">
          使用 ERP 与密码登录。
          {dev ? " 下方提供开发期快捷选用户入口。" : ""}
        </p>
        <LoginForms showDevPicker={dev} users={users} />
      </div>
    </div>
  );
}
