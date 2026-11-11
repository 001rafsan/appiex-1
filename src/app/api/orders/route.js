// Next.js 15 App Router — Appiex Real-Time Shared Client Orders API
// GET    /api/orders -> returns list of client orders and inquiries
// POST   /api/orders -> receives new orders from website contact/order forms
// PUT    /api/orders -> updates order status (new, discussion, confirmed, completed)
// DELETE /api/orders -> removes an order

import fs from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/appiex_client_orders_shared.json';
const STREAM_TOPIC = 'appiex_orders_stream_v1_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;

// Default initial state: clean 0 orders
if (!globalThis.__APPIEX_ORDERS_STORE_V1) {
  globalThis.__APPIEX_ORDERS_STORE_V1 = {
    updatedAt: 1,
    orders: []
  };
}

function getMemStore() {
  const mem = globalThis.__APPIEX_ORDERS_STORE_V1;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const disk = JSON.parse(raw);
      if (disk && typeof disk === 'object' && disk.updatedAt) {
        if (!mem.updatedAt || disk.updatedAt > mem.updatedAt) {
          mem.updatedAt = disk.updatedAt;
          mem.orders = Array.isArray(disk.orders) ? disk.orders : mem.orders;
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
      orders: mem.orders
    }), 'utf8');
  } catch (e) {}
}

async function broadcastOrderToCloud(order) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    await fetch(STREAM_URL, {
      method: 'POST',
      headers: {
        'Title': 'New Appiex Client Order: ' + (order.name || 'Inbound Prospect'),
        'Priority': 'urgent',
        'Tags': 'shopping_bags,moneybag,sparkles'
      },
      body: JSON.stringify(order),
      signal: controller.signal
    }).catch(() => {});
    clearTimeout(timer);
  } catch (e) {}
}

export async function GET() {
  const store = getMemStore();
  return NextResponse.json({
    success: true,
    count: store.orders.length,
    orders: store.orders,
    updatedAt: store.updatedAt
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
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

    store.orders.unshift(newOrder);
    store.updatedAt = Date.now();
    saveMemStore(store);

    // Broadcast in background
    broadcastOrderToCloud(newOrder);

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
    const idx = store.orders.findIndex(o => o.id === body.id);
    if (idx !== -1) {
      store.orders[idx] = Object.assign({}, store.orders[idx], body);
      store.updatedAt = Date.now();
      saveMemStore(store);
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
    store.orders = store.orders.filter(o => o.id !== id);
    store.updatedAt = Date.now();
    saveMemStore(store);

    return NextResponse.json({ success: true, remaining: store.orders.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
