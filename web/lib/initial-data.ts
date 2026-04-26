import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/** 与 `config/initial-data.json` 结构一致，见 `docs/初始化配置说明.md` */
export type InitialDataUser = {
  email: string;
  name: string;
  role: "LEAD" | "MEMBER";
};

export type InitialDataTask = {
  title: string;
  status?: string;
  assigneeEmails?: string[];
};

export type InitialDataProject = {
  title: string;
  description?: string;
  scheduleMode: "IN_RESERVE" | "ON_TIMELINE" | "TBD_ON_TIMELINE";
  status?: string;
  /** ISO 日期，如 2026-04-26 */
  plannedStart?: string;
  plannedEnd?: string;
  memberEmails: string[];
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
