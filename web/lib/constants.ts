/** 与 prisma schema 中 String 列一致 */
export const UserRole = {
  LEAD: "LEAD",
  MEMBER: "MEMBER",
} as const;

export const ScheduleMode = {
  IN_RESERVE: "IN_RESERVE",
  ON_TIMELINE: "ON_TIMELINE",
} as const;

/** 周报复核：与周报【正常/需关注/风险】、终止形态对齐 */
export const ProjectStatus = {
  PLANNING: "PLANNING",
  IN_PROGRESS: "IN_PROGRESS",
  NEED_ATTENTION: "NEED_ATTENTION",
  AT_RISK: "AT_RISK",
  CLOSED: "CLOSED",
} as const;

export const TaskStatus = {
  PENDING_START: "PENDING_START",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  PENDING_ACCEPTANCE: "PENDING_ACCEPTANCE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TaskPriority = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
} as const;

/** 周战果判定 */
export const WeeklyOutcomeStatus = {
  HIT: "HIT",
  PARTIAL: "PARTIAL",
  MISS: "MISS",
} as const;

export const AuditEntity = {
  PROJECT: "PROJECT",
  TASK: "TASK",
} as const;

/** 类型守卫函数 */
export function isValidTaskStatus(
  value: unknown
): value is (typeof TaskStatus)[keyof typeof TaskStatus] {
  return (
    typeof value === "string" &&
    Object.values(TaskStatus).includes(value as (typeof TaskStatus)[keyof typeof TaskStatus])
  );
}

export function isValidProjectStatus(
  value: unknown
): value is (typeof ProjectStatus)[keyof typeof ProjectStatus] {
  return (
    typeof value === "string" &&
    Object.values(ProjectStatus).includes(
      value as (typeof ProjectStatus)[keyof typeof ProjectStatus]
    )
  );
}

export function isValidWeeklyOutcomeStatus(
  value: unknown
): value is (typeof WeeklyOutcomeStatus)[keyof typeof WeeklyOutcomeStatus] {
  return (
    typeof value === "string" &&
    Object.values(WeeklyOutcomeStatus).includes(
      value as (typeof WeeklyOutcomeStatus)[keyof typeof WeeklyOutcomeStatus]
    )
  );
}
