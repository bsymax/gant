/**
 * 初始四表（CSV）列别名与值归一化 —— 与 `docs/初始数据-字段与规则.md` 同步维护。
 * 改表头：改本文件中的 `推荐表头`、同文档、及 `config/initial-csv/*.csv` 首行。
 */
import { ProjectStatus, ScheduleMode, TaskStatus } from "./constants";

/** 各文件推荐首行表头（UTF-8），供文档与检查脚本引用的唯一口径 */
export const CSV_RECOMMENDED_HEADER = {
  users: "工号,姓名,角色",
  projects: "项目标题,说明,排期模式,项目状态,计划开始,计划结束",
  tasks:
    "项目标题,任务标题,父任务标题,任务说明,任务状态,优先级,完成度,依赖方,成果指标,取消原因,计划开始,计划结束",
  taskPeople: "项目标题,任务标题,主R,支持人",
} as const;

/**
 * 列别名：同列多个名字等价（不区分大小写，脚本内表头会 trim + lower 存键）。
 * 以逗号前中文名为「主推荐」。
 */
export const Csv = {
  users: {
    erp: ["工号", "erp", "员工号", "Erp", "工号/ERP"] as const,
    name: ["姓名", "name", "显示名", "用户姓名"] as const,
    role: ["角色", "role"] as const,
  },
  projects: {
    title: ["项目标题", "title", "projecttitle", "project_title", "项目名"] as const,
    description: ["说明", "description", "项目说明"] as const,
    scheduleMode: [
      "排期模式",
      "schedulemode",
      "schedule_mode",
      "scheduleMode",
    ] as const,
    /** 取值为项目业务状态，非任务状态 */
    status: ["项目状态", "status", "state", "状态"] as const,
    plannedStart: [
      "计划开始",
      "plannedstart",
      "planned_start",
      "项目计划开始",
    ] as const,
    plannedEnd: [
      "计划结束",
      "plannedend",
      "planned_end",
      "项目计划结束",
    ] as const,
  },
  tasks: {
    projectTitle: [
      "项目标题",
      "projecttitle",
      "project_title",
      "项目名",
    ] as const,
    title: [
      "任务标题",
      "title",
      "任务名",
      "事项",
    ] as const,
    parentTitle: [
      "父任务标题",
      "parenttitle",
      "parent_title",
      "父任务",
    ] as const,
    description: ["任务说明", "description", "说明"] as const,
    status: [
      "任务状态",
      "status",
      "state",
    ] as const,
    priority: ["优先级", "priority", "优先"] as const,
    progress: ["完成度", "当前进度", "progress", "进度"] as const,
    dependencyParty: [
      "依赖方",
      "dependencyparty",
      "dependency_party",
    ] as const,
    metric: ["成果指标", "量化指标", "metric", "指标"] as const,
    cancelReason: ["取消原因", "cancelreason", "cancel_reason"] as const,
    plannedStart: [
      "计划开始",
      "plannedstart",
      "planned_start",
      "任务计划开始",
    ] as const,
    plannedEnd: [
      "计划结束",
      "plannedend",
      "planned_end",
      "任务计划结束",
    ] as const,
  },
  taskPeople: {
    projectTitle: [
      "项目标题",
      "projecttitle",
      "project_title",
    ] as const,
    taskTitle: [
      "任务标题",
      "tasktitle",
      "task_title",
      "任务",
    ] as const,
    ownerErp: [
      "主R",
      "主r",
      "ownererp",
      "owner_erp",
      "主负责人",
    ] as const,
    supporters: [
      "支持人",
      "支持",
      "supportererps",
      "supporter_erps",
    ] as const,
  },
} as const;

export function getCell(
  row: Record<string, string>,
  keys: readonly string[]
): string {
  for (const k of keys) {
    const v = row[k as keyof typeof row];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  for (const rk of Object.keys(row)) {
    const rl = rk.toLowerCase();
    for (const k of keys) {
      if (rl === k.toLowerCase()) {
        const v = row[rk as keyof typeof row];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return "";
}

/** 与 Prisma `Project.status` 一致；CSV/中文 见文档映射表 */
export function normalizeProjectStatus(s: string): string {
  const t = s.trim() || ProjectStatus.IN_PROGRESS;
  const m: Record<string, string> = {
    DRAFT: ProjectStatus.PLANNING,
    ACTIVE: ProjectStatus.IN_PROGRESS,
    DONE: ProjectStatus.CLOSED,
    ARCHIVED: ProjectStatus.CLOSED,
    规划中: ProjectStatus.PLANNING,
    PLANNING: ProjectStatus.PLANNING,
    进行中: ProjectStatus.IN_PROGRESS,
    IN_PROGRESS: ProjectStatus.IN_PROGRESS,
    需关注: ProjectStatus.NEED_ATTENTION,
    NEED_ATTENTION: ProjectStatus.NEED_ATTENTION,
    有风险: ProjectStatus.AT_RISK,
    AT_RISK: ProjectStatus.AT_RISK,
    已关闭: ProjectStatus.CLOSED,
    CLOSED: ProjectStatus.CLOSED,
  };
  return m[t] ?? t;
}

/** 与 Prisma `Task.status` 一致 */
export function normalizeTaskStatus(s: string): string {
  const t = s.trim() || TaskStatus.PENDING_START;
  const m: Record<string, string> = {
    TODO: TaskStatus.PENDING_START,
    待开始: TaskStatus.PENDING_START,
    PENDING_START: TaskStatus.PENDING_START,
    进行中: TaskStatus.IN_PROGRESS,
    IN_PROGRESS: TaskStatus.IN_PROGRESS,
    阻塞: TaskStatus.BLOCKED,
    BLOCKED: TaskStatus.BLOCKED,
    待验收: TaskStatus.PENDING_ACCEPTANCE,
    PENDING_ACCEPTANCE: TaskStatus.PENDING_ACCEPTANCE,
    已完成: TaskStatus.COMPLETED,
    COMPLETED: TaskStatus.COMPLETED,
    DONE: TaskStatus.COMPLETED,
    已取消: TaskStatus.CANCELLED,
    CANCELLED: TaskStatus.CANCELLED,
  };
  return m[t] ?? t;
}

/**
 * 与 `Project.scheduleMode` 一致。旧名 `TBD_ON_TIMELINE` 等并入 `ON_TIMELINE`（起止可空表示日期待定）。
 */
export function normalizeScheduleMode(
  raw: string
): "IN_RESERVE" | "ON_TIMELINE" {
  const t = raw.trim() || ScheduleMode.IN_RESERVE;
  const u = t.toUpperCase();
  if (
    u === "TBD_ON_TIMELINE" ||
    u === "TBD" ||
    t === "上轴待定" ||
    t === "在轴待定"
  ) {
    return ScheduleMode.ON_TIMELINE;
  }
  if (t === "储备" || u === "IN_RESERVE" || t === "池")
    return ScheduleMode.IN_RESERVE;
  if (t === "上轴" || u === "ON_TIMELINE" || t === "已上轴")
    return ScheduleMode.ON_TIMELINE;
  if (t === ScheduleMode.IN_RESERVE || t === ScheduleMode.ON_TIMELINE) return t;
  throw new Error(
    `排期模式无法识别: ${raw}（用 储备/上轴 或 IN_RESERVE/ON_TIMELINE）`
  );
}

