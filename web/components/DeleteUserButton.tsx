"use client";

type Props = {
  isLeadRow: boolean;
  isLastLead: boolean;
  disabled?: boolean;
};

export function DeleteUserButton({ isLeadRow, isLastLead, disabled }: Props) {
  return (
    <button
      type="submit"
      className="rounded border border-red-300 bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={(e) => {
        if (!isLeadRow) return;
        if (isLastLead) {
          e.preventDefault();
          window.alert("当前是最后一位组长，不能删除。请先将一名组员改为组长。");
          return;
        }
        const ok = window.confirm(
          "删除组长前，请先将组长权限转交给一名组员（该组员变为组长），并由新组长执行删除。确认已完成转交并继续删除？"
        );
        if (!ok) {
          e.preventDefault();
        }
      }}
    >
      删除
    </button>
  );
}
