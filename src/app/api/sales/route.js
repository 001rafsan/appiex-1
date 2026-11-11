// Next.js 15 App Router — Appiex Real-Time Shared Monthly Sales Ledger API
// GET  /api/sales -> returns shared monthly sales, items, and active months
// POST /api/sales -> saves/updates sales, synchronizes across all admins via memory, disk & cloud stream
import fs from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/appiex_monthly_sales_shared.json';
const STREAM_TOPIC = 'appiex_sales_stream_v1_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;

// Default initial state starts clean at $0
const DEFAULT_SALES_STORE = {
  updatedAt: 1,
  selectedMonthId: '2026-11',
  months: [
    { id: '2026-11', name: 'November 2026', status: 'active', closedAt: null, notes: 'Active sales cycle' }
  ],
  items: []
};

if (!globalThis.__APPIEX_SALES_STORE_V1) {
  globalThis.__APPIEX_SALES_STORE_V1 = JSON.parse(JSON.stringify(DEFAULT_SALES_STORE));
}

function getMemStore() {
  const mem = globalThis.__APPIEX_SALES_STORE_V1;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const disk = JSON.parse(raw);
      if (disk && typeof disk === 'object' && disk.updatedAt) {
        if (!mem.updatedAt || disk.updatedAt > mem.updatedAt) {
          mem.updatedAt = disk.updatedAt;
          mem.selectedMonthId = disk.selectedMonthId || mem.selectedMonthId;
          mem.months = Array.isArray(disk.months) ? disk.months : mem.months;
          mem.items = Array.isArray(disk.items) ? disk.items : mem.items;
        }
      }
    }
  } catch (e) {}
  return mem;
}

function saveMemStore(mem) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify({
      updatedAt: mem.updatedAt,
      selectedMonthId: mem.selectedMonthId,
      months: mem.months,
      items: mem.items
    }), 'utf8');
  } catch (e) {}
}

async function hydrateFromCloudStream(mem) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(STREAM_URL + '/json?poll=1&since=all', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-store' }
    });
    clearTimeout(timer);
    if (!resp.ok) return;
    const text = await resp.text();
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const env = JSON.parse(line);
        if (env.event !== 'message' || !env.message) continue;
        const payload = JSON.parse(env.message);
        if (payload && payload.updatedAt && payload.updatedAt > (mem.updatedAt || 0)) {
          mem.updatedAt = payload.updatedAt;
          if (payload.selectedMonthId) mem.selectedMonthId = payload.selectedMonthId;
          if (Array.isArray(payload.months)) mem.months = payload.months;
          if (Array.isArray(payload.items)) mem.items = payload.items;
        }
      } catch (e) {}
    }
    saveMemStore(mem);
  } catch (e) {}
}

async function publishToCloudStream(payloadObj) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch(STREAM_URL, {
      method: 'POST',
      body: JSON.stringify(payloadObj),
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      signal: controller.signal
    });
    clearTimeout(timer);
  } catch (e) {}
}

function sendJson(status, body) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}

export async function GET() {
  const store = getMemStore();
  await hydrateFromCloudStream(store);
  return sendJson(200, {
    ok: true,
    updatedAt: store.updatedAt,
    selectedMonthId: store.selectedMonthId,
    months: store.months,
    items: store.items
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const store = getMemStore();
    const now = Date.now();

    store.updatedAt = now;
    if (body.selectedMonthId) store.selectedMonthId = body.selectedMonthId;
    if (Array.isArray(body.months)) store.months = body.months;
    if (Array.isArray(body.items)) store.items = body.items;

    saveMemStore(store);
    await publishToCloudStream({
      updatedAt: now,
      selectedMonthId: store.selectedMonthId,
      months: store.months,
      items: store.items
    });

    return sendJson(200, {
      ok: true,
      updatedAt: store.updatedAt,
      selectedMonthId: store.selectedMonthId,
      months: store.months,
      items: store.items
    });
  } catch (err) {
    return sendJson(400, { ok: false, error: err.message });
  }
}
