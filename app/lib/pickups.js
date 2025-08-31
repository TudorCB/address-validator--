import prisma from "../db.server";
import { haversineKm } from "./haversine.js";

function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export async function listPickups(shopDomain = "__global__") {
  try {
    const rows = await prisma.pickupLocation.findMany({
      where: { shopDomain },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapRow);
  } catch (e) {
    return [];
  }
}

export async function createPickup(shopDomain, { name, lat, lng }) {
  const nm = String(name || "").trim();
  const la = Number(lat);
  const ln = Number(lng);
  if (!nm) throw new Error("name_required");
  if (!isValidLatLng(la, ln)) throw new Error("invalid_lat_lng");
  const row = await prisma.pickupLocation.create({
    data: { shopDomain, name: nm, lat: la, lng: ln },
  });
  return mapRow(row);
}

export async function updatePickup(shopDomain, id, patch = {}) {
  const existing = await prisma.pickupLocation.findUnique({ where: { id } });
  if (!existing || existing.shopDomain !== shopDomain) throw new Error("not_found");
  const data = {};
  if (typeof patch.name === "string") data.name = String(patch.name).trim();
  if (patch.lat != null) data.lat = Number(patch.lat);
  if (patch.lng != null) data.lng = Number(patch.lng);
  if (("lat" in data || "lng" in data) && !isValidLatLng(data.lat ?? existing.lat, data.lng ?? existing.lng)) {
    throw new Error("invalid_lat_lng");
  }
  const row = await prisma.pickupLocation.update({ where: { id }, data });
  return mapRow(row);
}

export async function deletePickup(shopDomain, id) {
  const existing = await prisma.pickupLocation.findUnique({ where: { id } });
  if (!existing || existing.shopDomain !== shopDomain) throw new Error("not_found");
  await prisma.pickupLocation.delete({ where: { id } });
  return { ok: true };
}

export async function findNearestPickup(shopDomain, origin, { maxKm } = {}) {
  try {
    const all = await prisma.pickupLocation.findMany({ where: { shopDomain } });
    let best = null;
    let bestD = Infinity;
    for (const p of all) {
      const d = haversineKm(origin, { lat: p.lat, lng: p.lng });
      if (Number.isFinite(d) && d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return { nearest: null, distanceKm: null, inRange: false };
    const inRange = Number.isFinite(maxKm) ? bestD <= maxKm : true;
    return { nearest: mapRow(best), distanceKm: bestD, inRange };
  } catch (e) {
    return { nearest: null, distanceKm: null, inRange: false };
  }
}

function mapRow(row) {
  return { id: row.id, shopDomain: row.shopDomain, name: row.name, lat: row.lat, lng: row.lng, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

