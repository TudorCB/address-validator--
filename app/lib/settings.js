/**
 * Simple in-memory settings (dev). Replace with DB in production.
 */
const store = {
  pickupRadiusKm: 25,
  blockPoBoxes: true,
  autoApplyCorrections: true,
  softMode: false, // if true, never hard-block; show warnings only
};

export function getSettings() {
  return { ...store };
}

export function updateSettings(patch = {}) {
  if (typeof patch.pickupRadiusKm === "number" && patch.pickupRadiusKm >= 0) {
    store.pickupRadiusKm = patch.pickupRadiusKm;
  }
  if (typeof patch.blockPoBoxes === "boolean") {
    store.blockPoBoxes = patch.blockPoBoxes;
  }
  if (typeof patch.autoApplyCorrections === "boolean") {
    store.autoApplyCorrections = patch.autoApplyCorrections;
  }
  if (typeof patch.softMode === "boolean") {
    store.softMode = patch.softMode;
  }
  return getSettings();
}
