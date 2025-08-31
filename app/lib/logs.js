import prisma from "../db.server";
import crypto from "node:crypto";

// Fallback in-memory store if DB is unavailable
const mem = [];
let memSeq = 1;

function hashNormalizedAddress(entry = {}) {
  try {
    const parts = [
      String(entry.address1 || "").trim().toLowerCase(),
      // Address2 is intentionally excluded from hash to reduce PII surface
      String(entry.addressCity || "").trim().toLowerCase(),
      String(entry.addressProvince || "").trim().toLowerCase(),
      String(entry.addressZip || "").trim().toLowerCase(),
      String(entry.addressCountry || "").trim().toUpperCase(),
    ];
    const joined = parts.join("|").replace(/\s+/g, " ");
    return crypto.createHash("sha256").update(joined).digest("hex");
  } catch {
    return null;
  }
}

function sanitizeEntry(input = {}) {
  const e = { ...(input || {}) };
  // Remove/strip PII
  if ("phone" in e) delete e.phone;
  if ("email" in e) delete e.email;
  if ("address2" in e) e.address2 = "";
  // Add normalized address hash (does not include address2)
  e.normalizedAddressHash = hashNormalizedAddress(e);
  return e;
}

export async function writeLog(entry) {
  const now = new Date();
  const safe = sanitizeEntry(entry);
  try {
    const created = await prisma.validationLog.create({
      data: {
        route: safe.route || "",
        status: safe.status || "",
        action: safe.action || null,
        message: safe.message || null,
        shopDomain: safe.shopDomain || null,
        contextSource: safe.contextSource || null,
        addressZip: safe.addressZip || null,
        addressCity: safe.addressCity || null,
        addressProvince: safe.addressProvince || null,
        addressCountry: safe.addressCountry || null,
        providerResponseId: safe.providerResponseId || null,
      },
    });
    return { id: created.id, ts: new Date(created.ts).getTime(), ...safe };
  } catch (e) {
    const row = { id: String(memSeq++), ts: now.getTime(), ...safe };
    mem.push(row);
    if (mem.length > 2000) mem.splice(0, mem.length - 2000);
    return row;
  }
}

export async function readLogs({ limit = 100, filter = null } = {}) {
  try {
    const rows = await prisma.validationLog.findMany({ orderBy: { ts: "desc" }, take: limit });
    let mapped = rows.map((r) => {
      const obj = {
        id: r.id,
        ts: new Date(r.ts).getTime(),
        route: r.route,
        status: r.status,
        action: r.action,
        message: r.message,
        shopDomain: r.shopDomain,
        contextSource: r.contextSource,
        addressZip: r.addressZip,
        addressCity: r.addressCity,
        addressProvince: r.addressProvince,
        addressCountry: r.addressCountry,
        providerResponseId: r.providerResponseId,
      };
      obj.normalizedAddressHash = hashNormalizedAddress(obj);
      return obj;
    });
    if (filter) mapped = mapped.filter(filter);
    return mapped.slice(0, limit);
  } catch (e) {
    let out = [...mem].reverse();
    if (filter) out = out.filter(filter);
    return out.slice(0, limit);
  }
}

export async function cleanupOldLogs() {
  const days = Number(process.env.LOG_TTL_DAYS || 90);
  const ttlDays = Number.isFinite(days) && days > 0 ? days : 90;
  const cutoff = new Date(Date.now() - ttlDays * 24 * 3600 * 1000);
  try {
    const res = await prisma.validationLog.deleteMany({ where: { ts: { lt: cutoff } } });
    // Also trim memory fallback
    for (let i = mem.length - 1; i >= 0; i--) {
      const row = mem[i];
      if ((row.ts || 0) < cutoff.getTime()) mem.splice(i, 1);
    }
    return { deleted: res.count || 0, cutoff: cutoff.toISOString() };
  } catch (e) {
    // DB unavailable; only trim memory fallback
    const before = mem.length;
    for (let i = mem.length - 1; i >= 0; i--) {
      const row = mem[i];
      if ((row.ts || 0) < cutoff.getTime()) mem.splice(i, 1);
    }
    return { deleted: 0, trimmedMem: before - mem.length, cutoff: cutoff.toISOString() };
  }
}
