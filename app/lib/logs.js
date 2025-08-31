import prisma from "../db.server";

// Fallback in-memory store if DB is unavailable
const mem = [];
let memSeq = 1;

export async function writeLog(entry) {
  const now = new Date();
  try {
    const created = await prisma.validationLog.create({
      data: {
        route: entry.route || "",
        status: entry.status || "",
        action: entry.action || null,
        message: entry.message || null,
        shopDomain: entry.shopDomain || null,
        contextSource: entry.contextSource || null,
        addressZip: entry.addressZip || null,
        addressCity: entry.addressCity || null,
        addressProvince: entry.addressProvince || null,
        addressCountry: entry.addressCountry || null,
        providerResponseId: entry.providerResponseId || null,
      },
    });
    return { id: created.id, ts: new Date(created.ts).getTime(), ...entry };
  } catch (e) {
    const row = { id: String(memSeq++), ts: now.getTime(), ...entry };
    mem.push(row);
    if (mem.length > 2000) mem.splice(0, mem.length - 2000);
    return row;
  }
}

export async function readLogs({ limit = 100, filter = null } = {}) {
  try {
    const rows = await prisma.validationLog.findMany({ orderBy: { ts: "desc" }, take: limit });
    let mapped = rows.map((r) => ({
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
    }));
    if (filter) mapped = mapped.filter(filter);
    return mapped.slice(0, limit);
  } catch (e) {
    let out = [...mem].reverse();
    if (filter) out = out.filter(filter);
    return out.slice(0, limit);
  }
}
