/**
 * 将 config/initial-csv/*.csv 合并为 config/initial-data.json
 * 在 web/ 下执行: npm run config:from-csv
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  InitialDataFile,
  InitialDataProject,
  InitialDataTask,
} from "../lib/initial-data";

const CFG = path.join(process.cwd(), "config", "initial-csv");
const OUT = path.join(process.cwd(), "config", "initial-data.json");

/** 简易 CSV 解析：支持引号内逗号、"" 转义；单元格内勿换行 */
function parseCSV(content: string): string[][] {
  const t = content.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let i = 0;
  let inQ = false;
  while (i < t.length) {
    const c = t[i]!;
    if (inQ) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      cur += c;
    } else {
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(cur);
        cur = "";
        i++;
        continue;
      }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && t[i + 1] === "\n") i++;
        row.push(cur);
        if (row.some((x) => x.trim().length)) rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      cur += c;
    }
    i++;
  }
  row.push(cur);
  if (row.some((x) => x.trim().length)) rows.push(row);
  return rows;
}

function toObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 1) return [];
  const h = rows[0]!.map((k) => k.trim().toLowerCase());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r]!;
    if (line.every((c) => !c.trim())) continue;
    const o: Record<string, string> = {};
    h.forEach((key, j) => {
      o[key] = (line[j] ?? "").trim();
    });
    out.push(o);
  }
  return out;
}

function readTable(name: string): Record<string, string>[] {
  const p = path.join(CFG, name);
  if (!existsSync(p)) {
    if (name === "tasks.csv" || name === "project_members.csv")
      return [];
    throw new Error(`缺少文件: ${p}`);
  }
  const text = readFileSync(p, "utf-8");
  if (!text.trim()) return [];
  return toObjects(parseCSV(text));
}

function main() {
  const userRows = readTable("users.csv");
  if (!userRows.length) {
    throw new Error("users.csv 无数据行（至少要有表头+一行）");
  }

  const users: InitialDataFile["users"] = [];
  for (const r of userRows) {
    const email = (r["email"] ?? r["e-mail"] ?? r["用户邮箱"] ?? "").trim();
    const name = (r["name"] ?? r["显示名"] ?? r["姓名"] ?? "").trim();
    const role = (r["role"] ?? r["角色"] ?? "").trim().toUpperCase();
    if (!email || !name || !role) {
      console.warn("跳过不完整的用户行（需 email, name, role）:", r);
      continue;
    }
    if (role !== "LEAD" && role !== "MEMBER")
      throw new Error(`用户 role 仅能为 LEAD 或 MEMBER: ${email} → ${role}`);
    users.push({ email, name, role: role as "LEAD" | "MEMBER" });
  }
  if (!users.length) throw new Error("users.csv 无有效用户");

  const userEmails = new Set(users.map((u) => u.email));
  const projRows = readTable("projects.csv");
  const memRows = readTable("project_members.csv");
  const taskRows = readTable("tasks.csv");

  const memBy = new Map<string, string[]>();
  for (const m of memRows) {
    const pt =
      (m["projecttitle"] ?? m["project_title"] ?? m["项目标题"] ?? "").trim();
    const ue = (m["useremail"] ?? m["user_email"] ?? m["用户邮箱"] ?? "").trim();
    if (!pt || !ue) continue;
    if (!userEmails.has(ue)) throw new Error(`project_members 中邮箱未在 users 中定义: ${ue}`);
    const arr = memBy.get(pt) ?? [];
    arr.push(ue);
    memBy.set(pt, arr);
  }

  const tasksBy = new Map<string, InitialDataTask[]>();
  for (const t of taskRows) {
    const pt =
      (t["projecttitle"] ?? t["project_title"] ?? t["项目标题"] ?? "").trim();
    const title = (t["title"] ?? t["事项"] ?? t["任务标题"] ?? "").trim();
    if (!pt || !title) continue;
    const st = (t["status"] ?? t["状态"] ?? "TODO").trim() || "TODO";
    const ae = (t["assigneeemails"] ?? t["assignee_emails"] ?? t["协作人邮箱"] ?? "").trim();
    const assigneeEmails = ae
      ? ae.split(/[,;，、]/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    for (const e of assigneeEmails ?? [])
      if (!userEmails.has(e))
        throw new Error(`任务协作人 ${e} 未在 users 中定义`);
    const one: InitialDataTask = { title, status: st };
    if (assigneeEmails?.length) one.assigneeEmails = assigneeEmails;
    const list = tasksBy.get(pt) ?? [];
    list.push(one);
    tasksBy.set(pt, list);
  }

  const projects: InitialDataProject[] = [];
  for (const p of projRows) {
    const title = (p["title"] ?? p["项目标题"] ?? "").trim();
    if (!title) {
      console.warn("跳过无标题项目行", p);
      continue;
    }
    const description = (p["description"] ?? p["说明"] ?? "").trim();
    const scheduleMode = (
      p["schedulemode"] ?? p["schedule_mode"] ?? p["排期模式"] ??
      "IN_RESERVE"
    )
      .trim()
      .toUpperCase() as InitialDataProject["scheduleMode"];
    if (
      scheduleMode !== "IN_RESERVE" &&
      scheduleMode !== "ON_TIMELINE" &&
      scheduleMode !== "TBD_ON_TIMELINE"
    ) {
      throw new Error(
        `项目 ${title} 的 scheduleMode 非法: ${scheduleMode}（需 IN_RESERVE / ON_TIMELINE / TBD_ON_TIMELINE）`
      );
    }
    const status = (p["status"] ?? p["状态"] ?? "ACTIVE").trim() || "ACTIVE";
    const plannedStart = (p["plannedstart"] ?? p["planned_start"] ?? p["计划开始"] ?? "").trim();
    const plannedEnd = (p["plannedend"] ?? p["planned_end"] ?? p["计划结束"] ?? "").trim();

    const memberEmails = memBy.get(title) ?? [];
    if (memberEmails.length === 0) {
      throw new Error(
        `项目「${title}」在 project_members.csv 中没有任何成员。请为每个项目至少配置一行或删除该项目行。`
      );
    }
    for (const e of memberEmails)
      if (!userEmails.has(e))
        throw new Error(
          `项目「${title}」成员 ${e} 未在 users.csv 中`
        );

    const proj: InitialDataProject = {
      title,
      description,
      scheduleMode,
      status,
      memberEmails: [...new Set(memberEmails)],
    };
    if (plannedStart) proj.plannedStart = plannedStart;
    if (plannedEnd) proj.plannedEnd = plannedEnd;

    const ts = tasksBy.get(title);
    if (ts?.length) proj.tasks = ts;
    projects.push(proj);
  }

  const projectTitles = new Set(projects.map((p) => p.title));
  for (const t of memBy.keys()) {
    if (!projectTitles.has(t)) {
      throw new Error(
        `project_members.csv 中项目「${t}」在 projects.csv 中未定义。请增删行保持一致。`
      );
    }
  }
  for (const t of tasksBy.keys()) {
    if (!projectTitles.has(t)) {
      throw new Error(
        `tasks.csv 中项目「${t}」在 projects.csv 中未定义。`
      );
    }
  }

  const out: InitialDataFile = {
    $comment:
      "由 npm run config:from-csv 自 initial-csv 生成。可直接编辑或回改 CSV 后重新生成。",
    users,
    projects,
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2), "utf-8");
  console.log(
    `已生成 ${OUT}（用户 ${users.length} 人，项目 ${projects.length} 个）`
  );
  console.log("下一步: npm run db:seed");
}

try {
  main();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
