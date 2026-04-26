-- SQLite: 将 User.email 迁移为 erp，保留行数据与 id（外键仍有效）
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erp" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "erp", "name", "role", "createdAt", "updatedAt")
SELECT "id", "email", "name", "role", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_erp_key" ON "User"("erp");
PRAGMA foreign_keys=ON;
