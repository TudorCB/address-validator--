/**
 * Simple in-memory settings (dev). Replace with DB in production.
 */
const store = {
  pickupRadiusKm: 25,
  blockPoBoxes: true,
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
  return getSettings();
}

