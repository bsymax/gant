"use client";

import { useActionState } from "react";
import {
  loginDevPickAction,
  loginWithPasswordAction,
  type LoginFormState,
} from "@/app/actions/auth";
import { UserRole } from "@/lib/constants";

type UserOption = {
  id: string;
  erp: string;
  name: string;
  role: string;
};

export function LoginForms({
  showDevPicker,
  users,
}: {
  showDevPicker: boolean;
  users: UserOption[];
}) {
  const [pwdState, pwdFormAction, pwdPending] = useActionState<
    LoginFormState,
    FormData
  >(loginWithPasswordAction, null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-slate-600">
          ERP 登录
        </h2>
        <form action={pwdFormAction} className="space-y-4">
          <label className="gant-text-body block text-sm">ERP（工号）</label>
          <input
            name="erp"
            type="text"
            autoComplete="username"
            required
            className="gant-input w-full px-3 py-2.5"
            placeholder="例如 8800001"
          />
          <label className="gant-text-body block text-sm">密码</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="gant-input w-full px-3 py-2.5"
          />
          {pwdState?.error ? (
            <p className="text-sm text-red-600" role="alert">
              {pwdState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pwdPending}
            className="gant-btn w-full rounded px-4 py-2 font-mono text-sm uppercase tracking-widest disabled:opacity-60"
          >
            {pwdPending ? "登录中…" : "登录"}
          </button>
        </form>
      </div>

      {showDevPicker ? (
        <div className="border-t border-[var(--gant-line-soft)] pt-6">
          <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-amber-800">
            开发期快捷入口
          </h2>
          <p className="gant-text-muted mb-4 text-xs">
            仅当 <code className="rounded bg-slate-100 px-1">AUTH_DEV=1</code>{" "}
            时可用；生产环境请关闭并仅用密码登录。
          </p>
          <form action={loginDevPickAction} className="space-y-4">
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
                  {u.name} {u.erp}（{u.role === UserRole.LEAD ? "组长" : "成员"}）
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="gant-btn w-full rounded border border-amber-700/40 bg-amber-50 px-4 py-2 font-mono text-sm uppercase tracking-widest text-amber-950"
            >
              免密进入（开发）
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
