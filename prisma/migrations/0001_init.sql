-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "defaultFocusMinutes" INTEGER NOT NULL DEFAULT 60,
    "defaultAppointmentMin" INTEGER NOT NULL DEFAULT 15,
    "primaryAppointmentSec" INTEGER NOT NULL DEFAULT 870,
    "instantMaxDelayMin" INTEGER NOT NULL DEFAULT 5,
    "settlementHour" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CtdpNetwork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "completeness" REAL NOT NULL DEFAULT 0,
    "defaultSacredSeatId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CtdpNetwork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CtdpNetwork_defaultSacredSeatId_fkey" FOREIGN KEY ("defaultSacredSeatId") REFERENCES "SacredSeat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CtdpNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "networkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'initial',
    "refTargetId" TEXT,
    "refCount" INTEGER NOT NULL DEFAULT 0,
    "judgmentRule" TEXT,
    "layoutX" REAL,
    "layoutY" REAL,
    "pendingAppointmentId" TEXT,
    "activeSessionId" TEXT,
    "sacredSeatId" TEXT,
    "awaitingJudgment" BOOLEAN NOT NULL DEFAULT false,
    "judgmentReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CtdpNode_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "CtdpNetwork" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CtdpNode_refTargetId_fkey" FOREIGN KEY ("refTargetId") REFERENCES "CtdpNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CtdpNode_sacredSeatId_fkey" FOREIGN KEY ("sacredSeatId") REFERENCES "SacredSeat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SacredSeat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'custom',
    "triggerPayload" TEXT NOT NULL,
    "minFocusMinutes" INTEGER NOT NULL DEFAULT 60,
    "webhookUrl" TEXT,
    "layoutX" REAL,
    "layoutY" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SacredSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuxChain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sacredSeatId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuxChain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuxChain_sacredSeatId_fkey" FOREIGN KEY ("sacredSeatId") REFERENCES "SacredSeat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auxChainId" TEXT NOT NULL,
    "ctdpNodeId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'primary',
    "parentId" TEXT,
    "signalType" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_auxChainId_fkey" FOREIGN KEY ("auxChainId") REFERENCES "AuxChain" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_ctdpNodeId_fkey" FOREIGN KEY ("ctdpNodeId") REFERENCES "CtdpNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sacredSeatId" TEXT NOT NULL,
    "ctdpNodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'focusing',
    "mode" TEXT NOT NULL DEFAULT 'standard',
    "targetMinutes" INTEGER NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "violationNote" TEXT,
    CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FocusSession_sacredSeatId_fkey" FOREIGN KEY ("sacredSeatId") REFERENCES "SacredSeat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FocusSession_ctdpNodeId_fkey" FOREIGN KEY ("ctdpNodeId") REFERENCES "CtdpNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Precedent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "behaviorKey" TEXT NOT NULL,
    "description" TEXT,
    "allowedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Precedent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "triggerJson" TEXT,
    "constraintJson" TEXT,
    "interventionNode" TEXT,
    "steadyStateTarget" TEXT,
    "isRelevant" BOOLEAN NOT NULL DEFAULT true,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "maintenanceCost" INTEGER NOT NULL DEFAULT 3,
    "isUpgradeable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Policy_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PolicyTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "triggerJson" TEXT,
    "constraintJson" TEXT,
    "interventionNode" TEXT,
    "steadyStateTarget" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "maintenanceCost" INTEGER NOT NULL DEFAULT 2,
    "isUpgradeable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "PolicyTree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slotName" TEXT NOT NULL DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyTree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyTreeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "parentId" TEXT,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "addedOnDate" TEXT NOT NULL,
    "groupId" TEXT,
    "layoutX" REAL,
    "layoutY" REAL,
    CONSTRAINT "PolicyTreeNode_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "PolicyTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyTreeNode_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyTreeNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PolicyTreeNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PolicyTreeNode_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PolicyGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyDailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "satisfied" BOOLEAN NOT NULL,
    "note" TEXT,
    CONSTRAINT "PolicyDailyLog_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "PolicyTreeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faultQuota" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PolicyGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyGroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    CONSTRAINT "PolicyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PolicyGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PolicyGroupMember_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompartmentFreeze" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "precedentKey" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "affectedNodeIds" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompartmentFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyUpgrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "paramsJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "PolicyUpgrade_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HabitProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "internalizationDays" INTEGER NOT NULL DEFAULT 0,
    "lifetimeDays" INTEGER NOT NULL DEFAULT 0,
    "lastSatisfiedDate" TEXT,
    CONSTRAINT "HabitProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HabitProgress_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyWinLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "entriesJson" TEXT NOT NULL DEFAULT '[]',
    "dayName" TEXT,
    "winLevel" TEXT,
    CONSTRAINT "DailyWinLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollapseRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "reasonTag" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollapseRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollapseRecord_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "PolicyTreeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CtdpNetwork_userId_key" ON "CtdpNetwork"("userId");

-- CreateIndex
CREATE INDEX "CtdpNode_networkId_state_idx" ON "CtdpNode"("networkId", "state");

-- CreateIndex
CREATE INDEX "SacredSeat_userId_idx" ON "SacredSeat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuxChain_userId_sacredSeatId_key" ON "AuxChain"("userId", "sacredSeatId");

-- CreateIndex
CREATE INDEX "Appointment_auxChainId_status_idx" ON "Appointment"("auxChainId", "status");

-- CreateIndex
CREATE INDEX "Appointment_ctdpNodeId_status_idx" ON "Appointment"("ctdpNodeId", "status");

-- CreateIndex
CREATE INDEX "FocusSession_userId_status_idx" ON "FocusSession"("userId", "status");

-- CreateIndex
CREATE INDEX "FocusSession_ctdpNodeId_idx" ON "FocusSession"("ctdpNodeId");

-- CreateIndex
CREATE INDEX "Precedent_userId_scopeType_scopeId_idx" ON "Precedent"("userId", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "Precedent_userId_scopeType_scopeId_behaviorKey_key" ON "Precedent"("userId", "scopeType", "scopeId", "behaviorKey");

-- CreateIndex
CREATE INDEX "EventLog_userId_createdAt_idx" ON "EventLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Policy_userId_idx" ON "Policy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyTemplate_slug_key" ON "PolicyTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyTree_userId_slotName_key" ON "PolicyTree"("userId", "slotName");

-- CreateIndex
CREATE INDEX "PolicyTreeNode_treeId_status_idx" ON "PolicyTreeNode"("treeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDailyLog_nodeId_date_key" ON "PolicyDailyLog"("nodeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyGroupMember_groupId_policyId_key" ON "PolicyGroupMember"("groupId", "policyId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyUpgrade_policyId_key" ON "PolicyUpgrade"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitProgress_policyId_key" ON "HabitProgress"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyWinLog_userId_date_key" ON "DailyWinLog"("userId", "date");

