import { prisma } from "./prisma";

type AuditInput = {
  entityType: "PROJECT" | "TASK";
  entityId: string;
  action: string;
  userId: string;
  diff: Record<string, unknown>;
};

export async function logAudit(i: AuditInput) {
  await prisma.auditLog.create({
    data: {
      entityType: i.entityType,
      entityId: i.entityId,
      action: i.action,
      userId: i.userId,
      diffJson: JSON.stringify(i.diff, null, 0),
    },
  });
}
