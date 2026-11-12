// Next.js 15 App Router — Appiex Real-Time Shared Monthly Sales Ledger API
// GET  /api/sales -> returns shared monthly sales, items, and active months
// POST /api/sales -> saves/updates sales, merges safely, and synchronizes across all admins
import fs from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/appiex_monthly_sales_shared_v2.json';
const STREAM_TOPIC = 'appiex_sales_ledger_sync_v2_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;
const REDIS_KEY = 'appiex:monthly_sales:v2';

// Default initial state starts clean at $0
const DEFAULT_SALES_STORE = {
  updatedAt: 1,
  lastCloudPublishAt: 0,
  selectedMonthId: '2026-11',
  months: [
    { id: '2026-11', name: 'November 2026', status: 'active', closedAt: null, notes: 'Active sales cycle' }
  ],
  items: [],
  deletedIds: []
};

if (!globalThis.__APPIEX_SALES_STORE_V2) {
  globalThis.__APPIEX_SALES_STORE_V2 = JSON.parse(JSON.stringify(DEFAULT_SALES_STORE));
  globalThis.__APPIEX_SALES_LAST_HYDRATE = 0;
}

function getMemStore() {
  const mem = globalThis.__APPIEX_SALES_STORE_V2;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const disk = JSON.parse(raw);
      if (disk && typeof disk === 'object' && disk.updatedAt) {
        if (!mem.updatedAt || disk.updatedAt > mem.updatedAt) {
          mem.updatedAt = disk.updatedAt;
          mem.lastCloudPublishAt = disk.lastCloudPublishAt || mem.lastCloudPublishAt || 0;
          mem.selectedMonthId = disk.selectedMonthId || mem.selectedMonthId;
          mem.months = Array.isArray(disk.months) ? disk.months : mem.months;
          mem.items = Array.isArray(disk.items) ? disk.items : mem.items;
          mem.deletedIds = Array.isArray(disk.deletedIds) ? disk.deletedIds : (mem.deletedIds || []);
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
      lastCloudPublishAt: mem.lastCloudPublishAt || 0,
      selectedMonthId: mem.selectedMonthId,
      months: mem.months,
      items: mem.items,
      deletedIds: (mem.deletedIds || []).slice(-200)
    }), 'utf8');
  } catch (e) {}
}

function mergeItems(existingItems, incomingItems, deletedSet) {
  const byId = new Map();
  for (const item of existingItems || []) {
    if (item && item.id && !deletedSet.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  for (const item of incomingItems || []) {
    if (!item || !item.id || deletedSet.has(item.id)) continue;
    const prev = byId.get(item.id);
    if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function mergeMonths(existingMonths, incomingMonths) {
  const byId = new Map();
  for (const m of existingMonths || []) {
    if (m && m.id) byId.set(m.id, m);
  }
  for (const m of incomingMonths || []) {
    if (m && m.id) {
      const prev = byId.get(m.id);
      if (!prev || m.status === 'closed') {
        byId.set(m.id, m);
      }
    }
  }
  return Array.from(byId.values());
}

async function readFromUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const resp = await fetch(`${url}/get/${REDIS_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && data.result) {
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
  } catch (e) {}
  return null;
}

async function writeToUpstash(payload) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/set/${REDIS_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
}

async function hydrateFromCloudStream(mem, force = false) {
  const now = Date.now();
  if (!force && now - (globalThis.__APPIEX_SALES_LAST_HYDRATE || 0) < 2500) {
    return;
  }
  globalThis.__APPIEX_SALES_LAST_HYDRATE = now;

  // 1. Try Upstash Redis if configured
  const redisData = await readFromUpstash();
  if (redisData && redisData.updatedAt && redisData.updatedAt > (mem.updatedAt || 0)) {
    mem.updatedAt = redisData.updatedAt;
    if (redisData.selectedMonthId) mem.selectedMonthId = redisData.selectedMonthId;
    if (Array.isArray(redisData.months)) mem.months = redisData.months;
    if (Array.isArray(redisData.items)) mem.items = redisData.items;
    if (Array.isArray(redisData.deletedIds)) mem.deletedIds = redisData.deletedIds;
    saveMemStore(mem);
    return;
  }

  // 2. Fallback / Primary free cloud stream via ntfy.sh using since=12h (since=all returns empty on ntfy.sh)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(STREAM_URL + '/json?poll=1&since=12h', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-store' }
    });
    clearTimeout(timer);
    if (!resp.ok) return;
    const text = await resp.text();
    const lines = text.split('\n').filter(Boolean);
    let updated = false;
    for (const line of lines) {
      try {
        const env = JSON.parse(line);
        if (env.event !== 'message' || !env.message) continue;
        const payload = JSON.parse(env.message);
        if (payload && payload.updatedAt && payload.updatedAt > (mem.updatedAt || 0)) {
          mem.updatedAt = payload.updatedAt;
          mem.lastCloudPublishAt = Math.max(mem.lastCloudPublishAt || 0, (env.time || 0) * 1000);
          if (payload.selectedMonthId) mem.selectedMonthId = payload.selectedMonthId;
          if (Array.isArray(payload.months)) mem.months = payload.months;
          if (Array.isArray(payload.items)) mem.items = payload.items;
          if (Array.isArray(payload.deletedIds)) mem.deletedIds = payload.deletedIds;
          updated = true;
        }
      } catch (e) {}
    }
    if (updated) {
      saveMemStore(mem);
    }

    // Keep-alive: if stored data is > 5 hours old in ntfy, refresh it so 12h TTL never expires
    if (mem.items && mem.items.length > 0 && now - (mem.lastCloudPublishAt || 0) > 5 * 3600 * 1000) {
      mem.lastCloudPublishAt = now;
      await publishToCloudStream({
        updatedAt: mem.updatedAt,
        selectedMonthId: mem.selectedMonthId,
        months: mem.months,
        items: mem.items,
        deletedIds: mem.deletedIds || []
      });
    }
  } catch (e) {}
}

async function publishToCloudStream(payloadObj) {
  await writeToUpstash(payloadObj);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(STREAM_URL, {
      method: 'POST',
      body: JSON.stringify(payloadObj),
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'X-Cache': 'yes'
      },
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
  await hydrateFromCloudStream(store, false);
  return sendJson(200, {
    ok: true,
    updatedAt: store.updatedAt,
    selectedMonthId: store.selectedMonthId,
    months: store.months,
    items: store.items,
    deletedIds: store.deletedIds || []
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const store = getMemStore();
    // Always hydrate latest cloud state before writing so concurrent edits never wipe another admin's data
    await hydrateFromCloudStream(store, true);

    const now = Math.max(Date.now(), (store.updatedAt || 0) + 1);
    const deletedSet = new Set([...(store.deletedIds || []), ...(Array.isArray(body.deletedIds) ? body.deletedIds : [])]);

    if (body.mergeMode === 'union') {
      // Safe union merge (used when syncing local unsaved items on mount)
      store.items = mergeItems(store.items, body.items, deletedSet);
      store.months = mergeMonths(store.months, body.months);
      if (!store.selectedMonthId && body.selectedMonthId) {
        store.selectedMonthId = body.selectedMonthId;
      }
    } else {
      // Explicit user action (Add / Edit / Delete / Status / Finalize)
      if (body.selectedMonthId) store.selectedMonthId = body.selectedMonthId;
      if (Array.isArray(body.months)) store.months = mergeMonths(store.months, body.months);
      if (Array.isArray(body.items)) {
        if (body.baseUpdatedAt && body.baseUpdatedAt < store.updatedAt && !body.forceReplace) {
          // Concurrent edit happened on another screen: merge items instead of clobbering!
          store.items = mergeItems(store.items, body.items, deletedSet);
        } else {
          store.items = body.items.filter(i => i && i.id && !deletedSet.has(i.id));
        }
      }
    }

    store.deletedIds = Array.from(deletedSet).slice(-200);
    store.updatedAt = now;
    store.lastCloudPublishAt = now;

    saveMemStore(store);
    await publishToCloudStream({
      updatedAt: store.updatedAt,
      selectedMonthId: store.selectedMonthId,
      months: store.months,
      items: store.items,
      deletedIds: store.deletedIds
    });

    return sendJson(200, {
      ok: true,
      updatedAt: store.updatedAt,
      selectedMonthId: store.selectedMonthId,
      months: store.months,
      items: store.items,
      deletedIds: store.deletedIds
    });
  } catch (err) {
    return sendJson(400, { ok: false, error: err.message });
  }
}
