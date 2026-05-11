import { PrismaClient } from "@prisma/client";
import type { InitialDataFile, InitialDataTask } from "../lib/initial-data";
import { loadInitialDataFile } from "../lib/initial-data";
import { hashPassword } from "../lib/password";
import { getSeedDefaultPassword } from "../lib/seed-default-password";
import { ProjectStatus, TaskStatus } from "../lib/constants";
import {
  normalizeProjectStatus,
  normalizeScheduleMode,
  normalizeTaskStatus as normTaskStatusFromConfig,
} from "../lib/initial-csv-config";

const prisma = new PrismaClient();

function parseDay(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}


type TaskFlat = { task: InitialDataTask; parentTitle: string | null };

function expandTasks(roots: InitialDataTask[]): TaskFlat[] {
  const out: TaskFlat[] = [];
  function visit(t: InitialDataTask, parentName: string | null) {
    const p = parentName ?? t.parentTitle?.trim() ?? null;
    out.push({
      task: { ...t, subtasks: undefined, parentTitle: p ?? undefined },
      parentTitle: p,
    });
    if (t.subtasks?.length) {
      for (const c of t.subtasks) visit(c, t.title);
    }
  }
  for (const r of roots) visit(r, null);
  return out;
}

function sortTasksByParent(flat: TaskFlat[]): InitialDataTask[] {
  const result: TaskFlat[] = [];
  const pool = [...flat];
  let n = 0;
  const max = pool.length * pool.length + 2;
  while (pool.length) {
    n++;
    if (n > max) {
      throw new Error("任务父级无法解析(是否有循环，或同项目内重名导致)");
    }
    const i = pool.findIndex(
      (f) =>
        !f.parentTitle ||
        result.some((r) => r.task.title === f.parentTitle)
    );
    if (i < 0) {
      const missing = pool
        .map((p) => `${p.task.title}←需父:「${p.parentTitle}」`)
        .join("; ");
      throw new Error("子任务父任务无法解析: " + missing);
    }
    const [f] = pool.splice(i, 1);
    result.push(f!);
  }
  return result.map((r) => r.task);
}

function resolveOwnerErp(t: InitialDataTask): string {
  if (t.ownerErp?.trim()) return t.ownerErp.trim();
  if (t.assigneeErps?.[0]) return t.assigneeErps[0]!.trim();
  throw new Error(
    `任务「${t.title}」需 ownerErp（或手编 JSON 的 assigneeErps[0] 当主R）`
  );
}

async function createTasksForProject(
  projectId: string,
  tasks: InitialDataTask[],
  userByErp: Map<string, { id: string; erp: string; name: string; role: string }>
) {
  const flatE = expandTasks(tasks);
  const sorted = sortTasksByParent(flatE);
  const titleToId = new Map<string, string>();
  for (const t of sorted) {
    const parentId = t.parentTitle ? titleToId.get(t.parentTitle) : null;
    if (t.parentTitle && !parentId) {
      throw new Error(
        `任务「${t.title}」的父任务「${t.parentTitle}」未先出现或标题与父任务不完全一致。`
      );
    }
    const ownerErp = resolveOwnerErp(t);
    const owner = userByErp.get(ownerErp);
    if (!owner) {
      throw new Error(`任务「${t.title}」主R ERP「${ownerErp}」在 users 中未找到。`);
    }
    const supportList = t.supportErps?.length
      ? t.supportErps
      : t.assigneeErps?.slice(1) ?? [];
    for (const e of supportList) {
      if (!e?.trim()) continue;
      if (!userByErp.has(e.trim())) {
        throw new Error(`任务「${t.title}」支持人 ERP「${e}」在 users 中未找到。`);
      }
    }
    const st = normTaskStatusFromConfig(
      t.status != null && String(t.status).trim()
        ? String(t.status)
        : TaskStatus.PENDING_START
    );
    const pg =
      t.progress != null
        ? Math.min(100, Math.max(0, Math.trunc(t.progress)))
        : 0;
    const task = await prisma.task.create({
      data: {
        projectId,
        parentTaskId: parentId,
        title: t.title,
        description: t.description?.trim() ?? "",
        status: st,
        progress: pg,
        priority: t.priority?.trim() || null,
        dependencyParty: t.dependencyParty?.trim() || null,
        metric: t.metric?.trim() || null,
        cancelReason: t.cancelReason?.trim() || null,
        ownerUserId: owner.id,
        plannedStart: parseDay(t.plannedStart) ?? undefined,
        plannedEnd: parseDay(t.plannedEnd) ?? undefined,
      },
    });
    if (titleToId.has(t.title)) {
      throw new Error(
        `项目内任务标题需唯一(否则无法解析父子): 重复「${t.title}」`
      );
    }
    titleToId.set(t.title, task.id);
    for (const e of supportList) {
      const u = userByErp.get(e.trim());
      if (!u || u.id === owner.id) continue;
      await prisma.taskAssignee.create({
        data: { taskId: task.id, userId: u.id },
      });
    }
  }
}

async function seedFromFile(data: InitialDataFile) {
  if (!data.users?.length) {
    throw new Error("initial-data.json 中 users 不能为空");
  }
  const seedPwd = getSeedDefaultPassword();
  const defaultHash = hashPassword(seedPwd);
  const allowedErps = data.users.map((u) => u.erp);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { erp: u.erp },
      update: { name: u.name, role: u.role },
      create: {
        erp: u.erp,
        name: u.name,
        role: u.role,
        passwordHash: defaultHash,
      },
    });
  }
  const lead = await prisma.user.findFirst({ where: { role: "LEAD" } });
  if (!lead) throw new Error("至少需要一个 role 为 LEAD 的用户");
  const stale = (await prisma.user.findMany({
    where: { erp: { notIn: allowedErps } },
    select: { id: true, erp: true },
  })) as { id: string; erp: string }[];
  if (stale.length > 0) {
    const ids = stale.map((r) => r.id);
    await prisma.task.updateMany({
      where: { ownerUserId: { in: ids } },
      data: { ownerUserId: lead.id },
    });
    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { userId: { in: ids } } }),
      prisma.projectMember.deleteMany({ where: { userId: { in: ids } } }),
      prisma.auditLog.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log(
      "已移除非 initial-data 中的用户:",
      stale.map((r) => r.erp).join(", ")
    );
  }
  const allUsers = (await prisma.user.findMany()) as {
    id: string;
    erp: string;
    name: string;
    role: string;
  }[];
  const userByErp = new Map(
    allUsers.map((u) => [u.erp, u] as [string, (typeof allUsers)[number]])
  );

  const wantProjectTitles = (data.projects ?? [])
    .map((p) => p.title.trim())
    .filter(Boolean);
  if (wantProjectTitles.length > 0) {
    const extra = await prisma.project.findMany({
      where: { title: { notIn: wantProjectTitles } },
      select: { id: true, title: true },
    });
    if (extra.length > 0) {
      const removeIds = extra.map((r) => r.id);
      await prisma.auditLog.deleteMany({
        where: { entityType: "PROJECT", entityId: { in: removeIds } },
      });
      await prisma.project.deleteMany({ where: { id: { in: removeIds } } });
      console.log(
        "已删除不在 initial-data 中的项目:",
        extra.map((r) => r.title).join(", ")
      );
    }
  }

  for (const p of data.projects ?? []) {
    const existing = await prisma.project.findFirst({
      where: { title: p.title },
    });
    if (existing) {
      console.log("Seed 跳过(已存在项目):", p.title);
      const taskCount = await prisma.task.count({
        where: { projectId: existing.id },
      });
      if (taskCount === 0 && p.tasks?.length) {
        console.log("  补种任务(项目无任务行):", p.title);
        await createTasksForProject(existing.id, p.tasks, userByErp);
      }
      continue;
    }
    const plannedStart = parseDay(p.plannedStart);
    const plannedEnd = parseDay(p.plannedEnd);
    const project = await prisma.project.create({
      data: {
        title: p.title,
        description: p.description ?? "",
        scheduleMode: normalizeScheduleMode(p.scheduleMode),
        status:
          p.status != null && String(p.status).trim()
            ? normalizeProjectStatus(String(p.status))
            : ProjectStatus.PLANNING,
        plannedStart: plannedStart ?? undefined,
        plannedEnd: plannedEnd ?? undefined,
      },
    });
    for (const erp of p.memberErps ?? []) {
      const u = userByErp.get(erp);
      if (!u) {
        console.warn("  无此用户(ERP)，跳过入项:", erp);
        continue;
      }
      await prisma.projectMember.create({
        data: { projectId: project.id, userId: u.id },
      });
    }
    if (p.tasks?.length) {
      await createTasksForProject(project.id, p.tasks, userByErp);
    }
  }

  const anyProject = await prisma.project.findFirst();
  if (anyProject) {
    await prisma.auditLog.create({
      data: {
        entityType: "PROJECT",
        entityId: anyProject.id,
        action: "seed_config",
        userId: lead.id,
        diffJson: JSON.stringify({ source: "config/initial-data.json" }),
      },
    });
  }
  console.log("Seed OK: 自 initial-data.json");
}

/** 无配置文件时的默认演示数据 */
async function seedDefault() {
  const seedPwd = getSeedDefaultPassword();
  const defaultHash = hashPassword(seedPwd);
  const lead = await prisma.user.upsert({
    where: { erp: "8800001" },
    update: {},
    create: {
      erp: "8800001",
      name: "组长",
      role: "LEAD",
      passwordHash: defaultHash,
    },
  });

  const members = [
    "成员一",
    "成员二",
    "成员三",
    "成员四",
    "成员五",
    "成员六",
    "成员七",
  ];

  for (let i = 0; i < members.length; i++) {
    const n = 8800101 + i;
    const erp = String(n);
    await prisma.user.upsert({
      where: { erp },
      update: {},
      create: {
        erp,
        name: members[i]!,
        role: "MEMBER",
        passwordHash: defaultHash,
      },
    });
  }

  const already = await prisma.project.findFirst({
    where: { title: "示例·储备中的探索" },
  });
  if (already) {
    console.log("Seed skip: 示例项目已存在");
    return;
  }

  const p1 = await prisma.project.create({
    data: {
      title: "示例·储备中的探索",
      description: "默认在战情池，可点上战场",
      scheduleMode: "IN_RESERVE",
      status: ProjectStatus.PLANNING,
    },
  });

  await prisma.projectMember.create({
    data: { projectId: p1.id, userId: lead.id },
  });

  const p2 = await prisma.project.create({
    data: {
      title: "示例·已上时间轴",
      description: "演示甘特条",
      scheduleMode: "ON_TIMELINE",
      status: ProjectStatus.IN_PROGRESS,
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.projectMember.createMany({
    data: [{ projectId: p2.id, userId: lead.id }],
  });

  await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "示例任务",
      status: TaskStatus.IN_PROGRESS,
      ownerUserId: lead.id,
    },
  });

  const p3 = await prisma.project.create({
    data: {
      title: "示例·上轴未钉日期",
      description: "在轴上、计划起止可空，指挥台中落在「日期待钉」区",
      scheduleMode: "ON_TIMELINE",
      status: ProjectStatus.PLANNING,
    },
  });

  await prisma.projectMember.create({
    data: { projectId: p3.id, userId: lead.id },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "PROJECT",
      entityId: p1.id,
      action: "seed",
      userId: lead.id,
      diffJson: JSON.stringify({ note: "初始种子数据" }),
    },
  });

  console.log("Seed OK: lead + 7 members, 3 demo projects");
}

/** 兼容旧数据：passwordHash 为空时补上种子默认密码 */
async function ensurePasswordsAfterSeed() {
  const seedPwd = getSeedDefaultPassword();
  const h = hashPassword(seedPwd);
  const r = await prisma.user.updateMany({
    where: { passwordHash: "" },
    data: { passwordHash: h },
  });
  if (r.count > 0) {
    console.log(`已为 ${r.count} 个用户补写初始密码哈希（SEED_DEFAULT_PASSWORD）`);
  }
}

async function main() {
  const fromFile = loadInitialDataFile();
  if (fromFile?.users?.length) {
    await seedFromFile(fromFile);
  } else {
    await seedDefault();
  }
  await ensurePasswordsAfterSeed();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
