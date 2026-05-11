import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/constants";
import { createUserForm, deleteUserForm, updateUserForm } from "@/app/actions/users";
import { loadProjectPersonnelShared, ProjectSectionTabs } from "../_shared";
import { DeleteUserButton } from "@/components/DeleteUserButton";

export const dynamic = "force-dynamic";

export default async function ProjectPersonnelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { u } = await loadProjectPersonnelShared(id);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { erp: "asc" }],
  });
  const canEdit = u.role === UserRole.LEAD;
  const leadCount = users.filter((x) => x.role === UserRole.LEAD).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <p>
        <Link href="/command" className="gant-link text-xs">
          ← 返回指挥台
        </Link>
      </p>
      <ProjectSectionTabs projectId={id} active="personnel" />

      <section className="gant-panel p-4">
        <h1 className="mb-2 text-lg font-semibold text-[var(--gant-fore)]">
          人员信息维护
        </h1>
        <p className="gant-text-muted mb-3 text-xs">
          仅维护人员主数据：姓名、ERP、角色（组长/成员）、登录密码。不展示任务信息。
        </p>
        {canEdit ? (
          <form
            action={createUserForm.bind(null, id)}
            className="mb-4 rounded border border-[var(--gant-line-soft)] bg-[var(--gant-surface-2)] p-3"
          >
            <p className="mb-2 text-sm font-semibold text-[var(--gant-fore)]">新增人员</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <input
                name="name"
                placeholder="姓名"
                className="gant-input px-2 py-1.5 text-sm"
                required
              />
              <input
                name="erp"
                placeholder="ERP"
                className="gant-input px-2 py-1.5 text-sm"
                required
              />
              <select name="role" defaultValue={UserRole.MEMBER} className="gant-input px-2 py-1.5 text-sm">
                <option value={UserRole.MEMBER}>成员</option>
                <option value={UserRole.LEAD}>组长</option>
              </select>
              <input
                name="initialPassword"
                type="password"
                placeholder="初始密码（≥8位）"
                autoComplete="new-password"
                className="gant-input px-2 py-1.5 text-sm"
                required
                minLength={8}
              />
              <input
                name="avatarFile"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="gant-input px-2 py-1.5 text-sm lg:col-span-1"
              />
              <button type="submit" className="gant-btn rounded px-2 py-1.5 text-sm">
                新增
              </button>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto rounded border border-[var(--gant-line-soft)]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[var(--gant-surface-2)]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">姓名</th>
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">ERP</th>
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">角色</th>
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">头像</th>
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">新密码</th>
                <th className="px-3 py-2 font-medium text-[var(--gant-fore)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-t border-[var(--gant-line-soft)]">
                  <td className="px-3 py-2">
                    <input
                      form={`update-user-${row.id}`}
                      name="name"
                      defaultValue={row.name}
                      className="gant-input w-full px-2 py-1 text-sm"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      form={`update-user-${row.id}`}
                      name="erp"
                      defaultValue={row.erp}
                      className="gant-input w-full px-2 py-1 text-sm"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      form={`update-user-${row.id}`}
                      name="role"
                      defaultValue={row.role}
                      className="gant-input w-full px-2 py-1 text-sm"
                      disabled={!canEdit}
                    >
                      <option value={UserRole.MEMBER}>成员</option>
                      <option value={UserRole.LEAD}>组长</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.avatarUrl}
                          alt={`${row.name} 头像`}
                          className="h-8 w-8 rounded-md border border-[var(--gant-line-soft)] object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--gant-line-soft)] bg-[var(--gant-surface-2)] text-[11px] text-[var(--gant-muted)]">
                          无
                        </div>
                      )}
                      <div className="flex min-w-52 items-center gap-2">
                        <input
                          form={`update-user-${row.id}`}
                          name="avatarFile"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          className="gant-input w-full px-2 py-1 text-sm"
                          disabled={!canEdit}
                        />
                        <label className="flex items-center gap-1 text-xs text-[var(--gant-muted)]">
                          <input
                            form={`update-user-${row.id}`}
                            type="checkbox"
                            name="clearAvatar"
                            value="1"
                            disabled={!canEdit}
                          />
                          清空
                        </label>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      form={`update-user-${row.id}`}
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="留空不改"
                      minLength={8}
                      className="gant-input w-full min-w-[7rem] px-2 py-1 text-sm"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <>
                          <form
                            id={`update-user-${row.id}`}
                            action={updateUserForm.bind(null, id, row.id)}
                          >
                            <button type="submit" className="gant-btn rounded px-2 py-1 text-xs">
                              保存
                            </button>
                          </form>
                          <form action={deleteUserForm.bind(null, id, row.id)}>
                            <DeleteUserButton
                              isLeadRow={row.role === UserRole.LEAD}
                              isLastLead={row.role === UserRole.LEAD && leadCount <= 1}
                              disabled={!canEdit}
                            />
                          </form>
                        </>
                      ) : (
                        <span className="gant-text-muted text-xs">只读</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p className="gant-text-muted border-t border-[var(--gant-line-soft)] p-3 text-xs">
              暂无人员。
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
