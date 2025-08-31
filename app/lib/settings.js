import prisma from "../db.server";

const DEFAULTS = {
  pickupRadiusKm: 25,
  blockPoBoxes: true,
  autoApplyCorrections: true,
  softMode: false,
  failedDeliveryCostUsd: 12,
};

function coercePatch(patch = {}) {
  const out = {};
  if (typeof patch.pickupRadiusKm === "number" && patch.pickupRadiusKm >= 0) out.pickupRadiusKm = Math.floor(patch.pickupRadiusKm);
  if (typeof patch.blockPoBoxes === "boolean") out.blockPoBoxes = !!patch.blockPoBoxes;
  if (typeof patch.autoApplyCorrections === "boolean") out.autoApplyCorrections = !!patch.autoApplyCorrections;
  if (typeof patch.softMode === "boolean") out.softMode = !!patch.softMode;
  if (typeof patch.failedDeliveryCostUsd === "number" && Number.isFinite(patch.failedDeliveryCostUsd) && patch.failedDeliveryCostUsd >= 0) out.failedDeliveryCostUsd = patch.failedDeliveryCostUsd;
  return out;
}

export async function getSettings(shopDomain = "__global__") {
  try {
    const row = await prisma.appSetting.findUnique({ where: { shop: shopDomain } });
    if (row) return mapRow(row);
    // create with defaults if not exists
    const created = await prisma.appSetting.create({ data: { shop: shopDomain, ...DEFAULTS } });
    return mapRow(created);
  } catch (e) {
    // Fallback: ephemeral defaults
    return { ...DEFAULTS };
  }
}

export async function updateSettings(patch = {}, shopDomain = "__global__") {
  const data = coercePatch(patch);
  try {
    const existing = await prisma.appSetting.findUnique({ where: { shop: shopDomain } });
    const updated = existing
      ? await prisma.appSetting.update({ where: { shop: shopDomain }, data })
      : await prisma.appSetting.create({ data: { shop: shopDomain, ...DEFAULTS, ...data } });
    return mapRow(updated);
  } catch (e) {
    // Fallback: ephemeral
    return { ...DEFAULTS, ...data };
  }
}

function mapRow(row) {
  return {
    pickupRadiusKm: row.pickupRadiusKm ?? DEFAULTS.pickupRadiusKm,
    blockPoBoxes: row.blockPoBoxes ?? DEFAULTS.blockPoBoxes,
    autoApplyCorrections: row.autoApplyCorrections ?? DEFAULTS.autoApplyCorrections,
    softMode: row.softMode ?? DEFAULTS.softMode,
    failedDeliveryCostUsd: row.failedDeliveryCostUsd ?? DEFAULTS.failedDeliveryCostUsd,
  };
}
