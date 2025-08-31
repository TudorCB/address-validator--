-- Create AppSetting
CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "blockPoBoxes" BOOLEAN NOT NULL DEFAULT 1,
  "autoApplyCorrections" BOOLEAN NOT NULL DEFAULT 1,
  "softMode" BOOLEAN NOT NULL DEFAULT 0,
  "pickupRadiusKm" INTEGER NOT NULL DEFAULT 25,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppSetting_shop_key" ON "AppSetting" ("shop");

-- Create ValidationLog
CREATE TABLE IF NOT EXISTS "ValidationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "route" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "action" TEXT,
  "message" TEXT,
  "shopDomain" TEXT,
  "contextSource" TEXT,
  "addressZip" TEXT,
  "addressCity" TEXT,
  "addressProvince" TEXT,
  "addressCountry" TEXT,
  "providerResponseId" TEXT
);

