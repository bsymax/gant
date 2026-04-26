/** 与 prisma schema 中 String 列一致 */
export const UserRole = {
  LEAD: "LEAD",
  MEMBER: "MEMBER",
} as const;

export const ScheduleMode = {
  IN_RESERVE: "IN_RESERVE",
  ON_TIMELINE: "ON_TIMELINE",
  TBD_ON_TIMELINE: "TBD_ON_TIMELINE",
} as const;

export const ProjectStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const;

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export const AuditEntity = {
  PROJECT: "PROJECT",
  TASK: "TASK",
} as const;
