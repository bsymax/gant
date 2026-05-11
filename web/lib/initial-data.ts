import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * 与 `config/initial-data.json` 结构一致。
 * 字段口径、表头与归一化规则以 `docs/初始数据-字段与规则.md` 与 `lib/initial-csv-config.ts` 为准。
 */
export type InitialDataUser = {
  erp: string;
  name: string;
  role: "LEAD" | "MEMBER";
};

export type InitialDataTask = {
  title: string;
  /** 与同一项目下父任务的 title 一致，表示为子任务（仅一层） */
  parentTitle?: string;
  /** 与 DB `Task.description` 一致；CSV 列「任务说明」 */
  description?: string;
  status?: string;
  /** 主 R 工号（手编 JSON 必填；由 `config:from-csv` 从 `task_people` 合并） */
  ownerErp?: string;
  /** 支持人 ERP 列表（可选） */
  supportErps?: string[];
  /** 仅手编 JSON 时兼容：第 1 位主 R，其余为支持（CSV 请用 `task_people.csv`） */
  assigneeErps?: string[];
  /** P0 | P1 | P2 */
  priority?: string;
  /** 0–100 */
  progress?: number;
  dependencyParty?: string;
  metric?: string;
  /** 与 status 已取消 搭配 */
  cancelReason?: string;
  plannedStart?: string;
  plannedEnd?: string;
  /** 嵌套子任务（与 parentTitle+平铺 二选一） */
  subtasks?: InitialDataTask[];
};

export type InitialDataProject = {
  title: string;
  description?: string;
  scheduleMode: "IN_RESERVE" | "ON_TIMELINE";
  /** PLANNING | IN_PROGRESS | NEED_ATTENTION | AT_RISK | CLOSED */
  status?: string;
  plannedStart?: string;
  plannedEnd?: string;
  memberErps: string[];
  tasks?: InitialDataTask[];
};

export type InitialDataFile = {
  $comment?: string;
  users: InitialDataUser[];
  projects: InitialDataProject[];
};

export function loadInitialDataFile(): InitialDataFile | null {
  const f = path.join(process.cwd(), "config", "initial-data.json");
  if (!existsSync(f)) return null;
  try {
    const raw = readFileSync(f, "utf-8");
    return JSON.parse(raw) as InitialDataFile;
  } catch (e) {
    console.error("initial-data.json 解析失败", e);
    return null;
  }
}
