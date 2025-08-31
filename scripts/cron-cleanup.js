#!/usr/bin/env node
import { cleanupOldLogs } from "../app/lib/logs.js";

async function run() {
  try {
    const res = await cleanupOldLogs();
    console.log(JSON.stringify({ ok: true, ...res }));
    process.exit(0);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }));
    process.exit(1);
  }
}

run();

