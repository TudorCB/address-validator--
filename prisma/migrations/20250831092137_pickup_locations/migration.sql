-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "blockPoBoxes" BOOLEAN NOT NULL DEFAULT true,
    "autoApplyCorrections" BOOLEAN NOT NULL DEFAULT true,
    "softMode" BOOLEAN NOT NULL DEFAULT false,
    "pickupRadiusKm" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSetting" ("autoApplyCorrections", "blockPoBoxes", "createdAt", "id", "pickupRadiusKm", "shop", "softMode", "updatedAt") SELECT "autoApplyCorrections", "blockPoBoxes", "createdAt", "id", "pickupRadiusKm", "shop", "softMode", "updatedAt" FROM "AppSetting";
DROP TABLE "AppSetting";
ALTER TABLE "new_AppSetting" RENAME TO "AppSetting";
CREATE UNIQUE INDEX "AppSetting_shop_key" ON "AppSetting"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PickupLocation_shopDomain_idx" ON "PickupLocation"("shopDomain");
