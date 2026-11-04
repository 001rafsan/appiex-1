// Next.js 15 App Router — Appiex Real-Time Website Visitor Telemetry API
// POST   /api/visitors   -> public: record a live website open (filters out bots, syncs to memory + /tmp + cloud stream)
// GET    /api/visitors   -> admin only (x-admin-key): returns all daily visitors sorted newest-first
// DELETE /api/visitors   -> admin only: wipe all history (fresh reset)
import fs from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_KEY = process.env.ADMIN_KEY || 'rtx5090';
// --- OWASP / CLOUDFLARE SECURITY HARDENING ---
const rateLimitMap = new Map();
const authFailMap = new Map();

function isRateLimited(ip, limit = 80, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }
  return entry.count > limit;
}

function isAuthBlocked(ip, maxFails = 15, windowMs = 900000) {
  const now = Date.now();
  const entry = authFailMap.get(ip) || { fails: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.fails = 0;
    entry.resetAt = now + windowMs;
    authFailMap.set(ip, entry);
    return false;
  }
  return entry.fails >= maxFails;
}

function recordAuthFailure(ip) {
  const now = Date.now();
  const entry = authFailMap.get(ip) || { fails: 0, resetAt: now + 900000 };
  entry.fails++;
  authFailMap.set(ip, entry);
}

function getAllowedOrigin(request) {
  const origin = request.headers.get('origin') || '';
  if (/^https?:\/\/(?:[a-z0-9-]+\.)*(?:appiex\.com|localhost|127\.0\.0\.1)(?::[0-9]+)?$/i.test(origin)) {
    return origin;
  }
  return 'https://appiex.com';
}

const TMP_FILE = '/tmp/appiex_visitors_v5.json';
const STREAM_TOPIC = 'appiex_visitors_stream_v5_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;

if (!globalThis.__APPIEX_VISITOR_STORE_V5) {
  globalThis.__APPIEX_VISITOR_STORE_V5 = {
    resetAt: 0,
    hydratedAt: 0,
    visitors: {}
  };
}

function getMemStore() {
  const mem = globalThis.__APPIEX_VISITOR_STORE_V5;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const disk = JSON.parse(raw);
      if (disk && typeof disk === 'object') {
        if (disk.resetAt && disk.resetAt > mem.resetAt) {
          mem.resetAt = disk.resetAt;
          mem.visitors = {};
        }
        if (disk.visitors && typeof disk.visitors === 'object') {
          for (const [uuid, rec] of Object.entries(disk.visitors)) {
            const recTs = rec.serverTs || Date.parse(rec.lastActive || rec.timestamp) || 0;
            if (recTs >= mem.resetAt) {
              const cur = mem.visitors[uuid];
              const curTs = cur ? (cur.serverTs || Date.parse(cur.lastActive || cur.timestamp) || 0) : 0;
              if (!cur || recTs >= curTs) {
                mem.visitors[uuid] = rec;
              }
            }
          }
        }
      }
    }
  } catch (e) {}
  return mem;
}

function saveMemStore(mem) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify({
      resetAt: mem.resetAt,
      visitors: mem.visitors
    }), 'utf8');
  } catch (e) {}
}

async function hydrateFromCloudStream(mem, force = false) {
  const now = Date.now();
  if (!force && mem.hydratedAt && (now - mem.hydratedAt) < 4000 && Object.keys(mem.visitors).length > 0) {
    return;
  }
  mem.hydratedAt = now;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
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
        if (payload.type === 'RESET' && payload.resetAt) {
          if (payload.resetAt > mem.resetAt) {
            mem.resetAt = payload.resetAt;
            for (const k of Object.keys(mem.visitors)) {
              if ((mem.visitors[k].serverTs || 0) < mem.resetAt) {
                delete mem.visitors[k];
              }
            }
          }
        } else if (payload.type === 'VISIT' && payload.record && payload.record.visitorUUID) {
          const rec = payload.record;
          const recTs = rec.serverTs || (env.time ? env.time * 1000 : Date.now());
          rec.serverTs = recTs;
          if (recTs >= mem.resetAt) {
            const existing = mem.visitors[rec.visitorUUID];
            const existingTs = existing ? (existing.serverTs || 0) : 0;
            if (!existing || recTs >= existingTs) {
              mem.visitors[rec.visitorUUID] = rec;
            }
          }
        }
      } catch (e) {}
    }
    saveMemStore(mem);
  } catch (e) {}
}

async function publishToCloudStream(payloadObj) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(STREAM_URL, {
      method: 'POST',
      body: JSON.stringify(payloadObj),
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      signal: controller.signal
    });
    clearTimeout(timer);
  } catch (e) {}
}

function sendJson(request, status, body) {
  const allowedOrigin = request ? getAllowedOrigin(request) : 'https://appiex.com';
  return new NextResponse(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  });
}

function sanitize(s, max) {
  return String(s == null ? '' : s).slice(0, max || 300);
}

function isCrawlerBot(request, ip, ua) {
  const userAgent = String(ua || (request && request.headers.get('user-agent')) || '').toLowerCase();
  if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|facebookexternalhit|ia_archiver|ahrefsbot|semrushbot|dotbot|mj12bot|petalbot|bytespider|gptbot|claudebot|applebot|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|headlesschrome|phantomjs|prerender|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i.test(userAgent)) {
    return true;
  }
  const ipStr = String(ip || '').trim();
  if (ipStr.startsWith('66.249.') || ipStr.startsWith('64.233.') || ipStr.startsWith('157.55.39.') || ipStr.startsWith('40.77.167.') || ipStr.startsWith('207.46.13.')) {
    return true;
  }
  return false;
}

function getDhakaFormattedTime(ms) {
  try {
    const d = new Date(ms);
    const timeStr = d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const dateStr = d.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Dhaka'
    });
    return { timeStr, dateStr };
  } catch (e) {
    const d = new Date(ms);
    return {
      timeStr: d.toISOString().slice(11, 19),
      dateStr: d.toISOString().split('T')[0]
    };
  }
}

function getClientIp(request) {
  return ((request.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim();
}

export async function OPTIONS(request) {
  return sendJson(request, 204, {});
}

export async function POST(request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 80, 60000)) {
    return sendJson(request, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }

  try {
    const mem = getMemStore();
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      body = null;
    }

    const rec = body && body.record;
    if (!rec || !rec.visitorUUID || !/^[A-Za-z0-9_-]{6,64}$/.test(rec.visitorUUID)) {
      return sendJson(request, 400, { ok: false, error: 'invalid record' });
    }

    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const resolvedIp = fwd || sanitize(rec.ip, 60);

    if (isCrawlerBot(request, resolvedIp, request.headers.get('user-agent'))) {
      return sendJson(request, 200, { ok: true, ignoredBot: true });
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const dhaka = getDhakaFormattedTime(nowMs);

    const existing = mem.visitors[rec.visitorUUID];
    const firstSeenIso = (existing && existing.firstSeen) ? existing.firstSeen : nowIso;
    const firstEntryTime = (existing && existing.entryTime && !rec.isNewOpen) ? existing.entryTime : dhaka.timeStr;

    const cityHeader = request.headers.get('x-vercel-ip-city') ? decodeURIComponent(request.headers.get('x-vercel-ip-city')) : '';
    const countryHeader = request.headers.get('x-vercel-ip-country') || '';

    const pagePath = sanitize(rec.page || '/', 300);
    const pageTitle = sanitize(rec.pageTitle || 'Appiex Website', 200);

    let journey = Array.isArray(existing && existing.pageJourney) ? existing.pageJourney.slice(-20) : [];
    if (Array.isArray(rec.pageJourney) && rec.pageJourney.length > journey.length) {
      journey = rec.pageJourney.slice(-20);
    }
    const lastStep = journey[journey.length - 1];
    if (!lastStep || lastStep.page !== pagePath) {
      journey.push({
        page: pagePath,
        title: pageTitle.replace(/— Appiex.*|\|.*$/g, '').trim() || pagePath,
        time: dhaka.timeStr,
        timestamp: nowIso
      });
    }

    const clean = {
      id: sanitize(rec.id || ('VIS-' + nowMs), 60),
      visitorUUID: rec.visitorUUID,
      sessionUUID: sanitize(rec.sessionUUID, 60),
      name: sanitize(rec.name, 120),
      email: sanitize(rec.email, 160),
      phone: sanitize(rec.phone, 40),
      page: pagePath,
      pageTitle: pageTitle,
      referrer: sanitize(rec.referrer || 'Direct Traffic', 80),
      device: sanitize(rec.device || 'Desktop / Mobile', 60),
      browser: sanitize(rec.browser || 'Web Browser', 60),
      isRealLogin: !!rec.isRealLogin,
      isIdentified: !!rec.isIdentified,
      type: sanitize(rec.type || 'Live Visitor', 60),
      ip: resolvedIp || 'Live IP',
      city: cityHeader || sanitize(rec.city || 'Dhaka', 80),
      country: countryHeader || sanitize(rec.country || 'BD', 80),
      serverTs: nowMs,
      entryTime: dhaka.timeStr,
      firstEntryTime: firstEntryTime,
      date: dhaka.dateStr,
      timestamp: nowIso,
      lastActive: nowIso,
      firstSeen: firstSeenIso,
      pageJourney: journey,
      actionsList: [
        {
          time: dhaka.timeStr,
          action: 'Opened Website (' + pagePath + ')',
          target: pagePath,
          page: pagePath,
          timestamp: nowIso
        }
      ]
    };

    mem.visitors[rec.visitorUUID] = clean;
    saveMemStore(mem);

    if (!body.heartbeat) {
      await publishToCloudStream({ type: 'VISIT', record: clean });
    }

    return sendJson(request, 200, {
      ok: true,
      serverTime: nowIso,
      serverTs: nowMs,
      entryTime: dhaka.timeStr
    });
  } catch (err) {
    return sendJson(request, 500, { ok: false, error: String((err && err.message) || err) });
  }
}

export async function GET(request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 80, 60000)) {
    return sendJson(request, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }
  if (isAuthBlocked(clientIp)) {
    return sendJson(request, 403, { ok: false, error: 'Access temporarily blocked due to repeated auth failures.' });
  }

  const key = request.headers.get('x-admin-key');
  if (key !== ADMIN_KEY) {
    recordAuthFailure(clientIp);
    return sendJson(request, 401, { ok: false, error: 'unauthorized' });
  }

  try {
    const mem = getMemStore();
    await hydrateFromCloudStream(mem, false);
    const nowMs = Date.now();
    const dhakaToday = getDhakaFormattedTime(nowMs).dateStr;

    const records = Object.values(mem.visitors)
      .filter((r) => r && (r.serverTs || 0) >= mem.resetAt && !isCrawlerBot(request, r.ip, ''))
      .sort((a, b) => (b.serverTs || 0) - (a.serverTs || 0))
      .slice(0, 200);

    return sendJson(request, 200, {
      ok: true,
      serverTime: new Date(nowMs).toISOString(),
      serverTs: nowMs,
      todayDate: dhakaToday,
      streamTopic: STREAM_TOPIC,
      visitors: records
    });
  } catch (err) {
    return sendJson(request, 500, { ok: false, error: String((err && err.message) || err) });
  }
}

export async function DELETE(request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 80, 60000)) {
    return sendJson(request, 429, { ok: false, error: 'Too many requests. Please slow down.' });
  }
  if (isAuthBlocked(clientIp)) {
    return sendJson(request, 403, { ok: false, error: 'Access temporarily blocked due to repeated auth failures.' });
  }

  const key = request.headers.get('x-admin-key');
  if (key !== ADMIN_KEY) {
    recordAuthFailure(clientIp);
    return sendJson(request, 401, { ok: false, error: 'unauthorized' });
  }

  try {
    const mem = getMemStore();
    const count = Object.keys(mem.visitors).length;
    const resetAt = Date.now();
    mem.resetAt = resetAt;
    mem.visitors = {};
    saveMemStore(mem);
    await publishToCloudStream({ type: 'RESET', resetAt });
    return sendJson(request, 200, { ok: true, deleted: count, resetAt });
  } catch (err) {
    return sendJson(request, 500, { ok: false, error: String((err && err.message) || err) });
  }
}
