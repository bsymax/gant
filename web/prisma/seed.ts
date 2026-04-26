import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.user.upsert({
    where: { email: "lead@local.dev" },
    update: {},
    create: {
      email: "lead@local.dev",
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
    const n = i + 1;
    await prisma.user.upsert({
      where: { email: `member${n}@local.dev` },
      update: {},
      create: {
        email: `member${n}@local.dev`,
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

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
