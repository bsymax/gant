import { PrismaClient } from "@prisma/client";
import type { InitialDataFile } from "../lib/initial-data";
import { loadInitialDataFile } from "../lib/initial-data";

const prisma = new PrismaClient();

function parseDay(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seedFromFile(data: InitialDataFile) {
  if (!data.users?.length) {
    throw new Error("initial-data.json 中 users 不能为空");
  }
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { erp: u.erp },
      update: { name: u.name, role: u.role },
      create: { erp: u.erp, name: u.name, role: u.role },
    });
  }
  const lead = await prisma.user.findFirst({ where: { role: "LEAD" } });
  if (!lead) throw new Error("至少需要一个 role 为 LEAD 的用户");
  const userByErp = new Map(
    (await prisma.user.findMany()).map((x) => [x.erp, x])
  );

  for (const p of data.projects ?? []) {
    const existing = await prisma.project.findFirst({
      where: { title: p.title },
    });
    if (existing) {
      console.log("Seed 跳过(已存在项目):", p.title);
      continue;
    }
    const plannedStart = parseDay(p.plannedStart);
    const plannedEnd = parseDay(p.plannedEnd);
    const project = await prisma.project.create({
      data: {
        title: p.title,
        description: p.description ?? "",
        scheduleMode: p.scheduleMode,
        status: p.status ?? "ACTIVE",
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
    for (const t of p.tasks ?? []) {
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: t.title,
          status: t.status ?? "TODO",
        },
      });
      for (const e of t.assigneeErps ?? []) {
        const u = userByErp.get(e);
        if (!u) continue;
        const ok = await prisma.taskAssignee.findFirst({
          where: { taskId: task.id, userId: u.id },
        });
        if (!ok) {
          await prisma.taskAssignee.create({
            data: { taskId: task.id, userId: u.id },
          });
        }
      }
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
  const lead = await prisma.user.upsert({
    where: { erp: "8800001" },
    update: {},
    create: {
      erp: "8800001",
      name: "组长",
      role: "LEAD",
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
      status: "ACTIVE",
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
      status: "ACTIVE",
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.projectMember.createMany({
    data: [{ projectId: p2.id, userId: lead.id }],
  });

  const t0 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "示例事项",
      status: "IN_PROGRESS",
    },
  });
  await prisma.taskAssignee.create({
    data: { taskId: t0.id, userId: lead.id },
  });

  const p3 = await prisma.project.create({
    data: {
      title: "示例·待定 TBD",
      description: "在轴上但未钉死日期",
      scheduleMode: "TBD_ON_TIMELINE",
      status: "ACTIVE",
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

async function main() {
  const fromFile = loadInitialDataFile();
  if (fromFile?.users?.length) {
    await seedFromFile(fromFile);
  } else {
    await seedDefault();
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
