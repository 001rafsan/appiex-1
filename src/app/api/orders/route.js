// Next.js 15 App Router — Appiex Real-Time Shared Client Orders API
// GET    /api/orders -> returns list of client orders and inquiries
// POST   /api/orders -> receives new orders from website contact/order forms
// PUT    /api/orders -> updates order status (new, discussion, confirmed, completed)
// DELETE /api/orders -> removes an order

import fs from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/appiex_client_orders_shared_v2.json';
const STREAM_TOPIC = 'appiex_orders_stream_v2_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;
const REDIS_KEY = 'appiex:client_orders:v2';

// Default initial state: clean 0 orders
if (!globalThis.__APPIEX_ORDERS_STORE_V2) {
  globalThis.__APPIEX_ORDERS_STORE_V2 = {
    updatedAt: 1,
    lastCloudPublishAt: 0,
    orders: [],
    deletedIds: []
  };
  globalThis.__APPIEX_ORDERS_LAST_HYDRATE = 0;
}

function getMemStore() {
  const mem = globalThis.__APPIEX_ORDERS_STORE_V2;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const disk = JSON.parse(raw);
      if (disk && typeof disk === 'object' && disk.updatedAt) {
        if (!mem.updatedAt || disk.updatedAt > mem.updatedAt) {
          mem.updatedAt = disk.updatedAt;
          mem.lastCloudPublishAt = disk.lastCloudPublishAt || mem.lastCloudPublishAt || 0;
          mem.orders = Array.isArray(disk.orders) ? disk.orders : mem.orders;
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
      orders: mem.orders,
      deletedIds: (mem.deletedIds || []).slice(-200)
    }), 'utf8');
  } catch (e) {}
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

async function publishOrdersSnapshot(store) {
  const snapshot = {
    updatedAt: store.updatedAt,
    orders: store.orders,
    deletedIds: store.deletedIds || []
  };
  await writeToUpstash(snapshot);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch(STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'X-Cache': 'yes'
      },
      body: JSON.stringify(snapshot),
      signal: controller.signal
    }).catch(() => {});
    clearTimeout(timer);
  } catch (e) {}
}

async function hydrateFromCloudStream(mem, force = false) {
  const now = Date.now();
  if (!force && now - (globalThis.__APPIEX_ORDERS_LAST_HYDRATE || 0) < 2500) {
    return;
  }
  globalThis.__APPIEX_ORDERS_LAST_HYDRATE = now;

  const redisData = await readFromUpstash();
  if (redisData && redisData.updatedAt && redisData.updatedAt > (mem.updatedAt || 0)) {
    mem.updatedAt = redisData.updatedAt;
    if (Array.isArray(redisData.orders)) mem.orders = redisData.orders;
    if (Array.isArray(redisData.deletedIds)) mem.deletedIds = redisData.deletedIds;
    saveMemStore(mem);
    return;
  }

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
          if (Array.isArray(payload.orders)) mem.orders = payload.orders;
          if (Array.isArray(payload.deletedIds)) mem.deletedIds = payload.deletedIds;
          updated = true;
        }
      } catch (e) {}
    }
    if (updated) saveMemStore(mem);

    if (mem.orders && mem.orders.length > 0 && now - (mem.lastCloudPublishAt || 0) > 5 * 3600 * 1000) {
      mem.lastCloudPublishAt = now;
      await publishOrdersSnapshot(mem);
    }
  } catch (e) {}
}

export async function GET() {
  const store = getMemStore();
  await hydrateFromCloudStream(store, false);
  return NextResponse.json({
    success: true,
    count: store.orders.length,
    orders: store.orders,
    updatedAt: store.updatedAt
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

    const store = getMemStore();
    await hydrateFromCloudStream(store, true);

    const newOrder = {
      id: body.id || ('ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      name: (body.name || 'Inbound Prospect').trim(),
      email: (body.email || '').trim(),
      phone: (body.phone || '').trim(),
      service: body.service || 'Web Development & UI/UX',
      budget: body.budget || '$5k-$10k',
      message: (body.message || '').trim(),
      channel: body.channel || 'Website Contact Form',
      status: body.status || 'new',
      date: body.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }),
      timestamp: body.timestamp || Date.now()
    };

    const deletedSet = new Set(store.deletedIds || []);
    if (!deletedSet.has(newOrder.id) && !store.orders.some(o => o.id === newOrder.id)) {
      store.orders.unshift(newOrder);
    }
    store.updatedAt = Math.max(Date.now(), (store.updatedAt || 0) + 1);
    store.lastCloudPublishAt = store.updatedAt;
    saveMemStore(store);

    await publishOrdersSnapshot(store);

    return NextResponse.json({
      success: true,
      order: newOrder,
      totalOrders: store.orders.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const store = getMemStore();
    await hydrateFromCloudStream(store, true);
    const idx = store.orders.findIndex(o => o.id === body.id);
    if (idx !== -1) {
      store.orders[idx] = Object.assign({}, store.orders[idx], body);
      store.updatedAt = Math.max(Date.now(), (store.updatedAt || 0) + 1);
      store.lastCloudPublishAt = store.updatedAt;
      saveMemStore(store);
      await publishOrdersSnapshot(store);
      return NextResponse.json({ success: true, order: store.orders[idx] });
    }
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const store = getMemStore();
    await hydrateFromCloudStream(store, true);
    store.orders = store.orders.filter(o => o.id !== id);
    store.deletedIds = Array.from(new Set([...(store.deletedIds || []), id])).slice(-200);
    store.updatedAt = Math.max(Date.now(), (store.updatedAt || 0) + 1);
    store.lastCloudPublishAt = store.updatedAt;
    saveMemStore(store);
    await publishOrdersSnapshot(store);

    return NextResponse.json({ success: true, remaining: store.orders.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
