-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "erp" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "scheduleMode" TEXT NOT NULL DEFAULT 'IN_RESERVE',
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING_START',
    "priority" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dependencyParty" TEXT,
    "metric" TEXT,
    "cancelReason" TEXT,
    "plannedStart" TIMESTAMP(3),
    "plannedAcceptance" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diffJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWeeklyOutcome" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "outcomeStatus" TEXT NOT NULL,
    "plannedProgress" INTEGER,
    "actualProgress" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskWeeklyOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberWeeklyAllocation" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "allocationPct" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberWeeklyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectWeeklyTrack" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "plannedStatus" TEXT NOT NULL,
    "actualStatus" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectWeeklyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWeeklyTrack" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "plannedStatus" TEXT NOT NULL,
    "actualStatus" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskWeeklyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_erp_key" ON "User"("erp");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "Task_projectId_parentTaskId_idx" ON "Task"("projectId", "parentTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskWeeklyOutcome_weekStart_idx" ON "TaskWeeklyOutcome"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "TaskWeeklyOutcome_taskId_weekStart_key" ON "TaskWeeklyOutcome"("taskId", "weekStart");

-- CreateIndex
CREATE INDEX "MemberWeeklyAllocation_weekStart_userId_idx" ON "MemberWeeklyAllocation"("weekStart", "userId");

-- CreateIndex
CREATE INDEX "MemberWeeklyAllocation_projectId_weekStart_idx" ON "MemberWeeklyAllocation"("projectId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "MemberWeeklyAllocation_weekStart_userId_projectId_taskId_key" ON "MemberWeeklyAllocation"("weekStart", "userId", "projectId", "taskId");

-- CreateIndex
CREATE INDEX "ProjectWeeklyTrack_weekStart_idx" ON "ProjectWeeklyTrack"("weekStart");

-- CreateIndex
CREATE INDEX "ProjectWeeklyTrack_projectId_weekStart_idx" ON "ProjectWeeklyTrack"("projectId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWeeklyTrack_projectId_weekStart_key" ON "ProjectWeeklyTrack"("projectId", "weekStart");

-- CreateIndex
CREATE INDEX "TaskWeeklyTrack_weekStart_idx" ON "TaskWeeklyTrack"("weekStart");

-- CreateIndex
CREATE INDEX "TaskWeeklyTrack_taskId_weekStart_idx" ON "TaskWeeklyTrack"("taskId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "TaskWeeklyTrack_taskId_weekStart_key" ON "TaskWeeklyTrack"("taskId", "weekStart");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeeklyOutcome" ADD CONSTRAINT "TaskWeeklyOutcome_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeeklyOutcome" ADD CONSTRAINT "TaskWeeklyOutcome_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWeeklyAllocation" ADD CONSTRAINT "MemberWeeklyAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWeeklyAllocation" ADD CONSTRAINT "MemberWeeklyAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWeeklyAllocation" ADD CONSTRAINT "MemberWeeklyAllocation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWeeklyAllocation" ADD CONSTRAINT "MemberWeeklyAllocation_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWeeklyTrack" ADD CONSTRAINT "ProjectWeeklyTrack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWeeklyTrack" ADD CONSTRAINT "ProjectWeeklyTrack_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeeklyTrack" ADD CONSTRAINT "TaskWeeklyTrack_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeeklyTrack" ADD CONSTRAINT "TaskWeeklyTrack_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

