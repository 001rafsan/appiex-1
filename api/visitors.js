// Appiex Real-Time Website Visitor Telemetry API (Zero-Quota Multi-Layer Store + Live SSE Stream)
// POST   /api/visitors   -> public: record a live website open (filters out bots, syncs to memory + /tmp + cloud stream)
// GET    /api/visitors   -> admin only (x-admin-key): returns all daily visitors sorted newest-first
// DELETE /api/visitors   -> admin only: wipe all history (fresh reset)
import fs from 'fs';

const ADMIN_KEY = process.env.ADMIN_KEY || 'rtx5090';
// --- OWASP / CLOUDFLARE SECURITY HARDENING ---
const rateLimitMap = new Map();
const authFailMap = new Map();

function isRateLimited(ip, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  // Periodic cleanup
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

function getAllowedOrigin(req) {
  const origin = req.headers['origin'] || '';
  if (/^https?:\/\/(?:[a-z0-9-]+\.)*(?:appiex\.com|localhost|127\.0\.0\.1)(?::[0-9]+)?$/i.test(origin)) {
    return origin;
  }
  return 'https://appiex.com';
}

const TMP_FILE = '/tmp/appiex_visitors_v5.json';
const STREAM_TOPIC = 'appiex_visitors_stream_v5_rtx5090';
const STREAM_URL = 'https://ntfy.sh/' + STREAM_TOPIC;

// Initialize in-memory store on the warm serverless instance
if (!globalThis.__APPIEX_VISITOR_STORE_V5) {
  globalThis.__APPIEX_VISITOR_STORE_V5 = {
    resetAt: 0,
    hydratedAt: 0,
    visitors: {} // keyed by visitorUUID
  };
}

function getMemStore() {
  const mem = globalThis.__APPIEX_VISITOR_STORE_V5;
  // Also merge from /tmp if available
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

// Hydrate from cloud stream on cold start or periodic sync so multi-instance never drops a visitor
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

function send(res, status, body, req) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const allowedOrigin = req ? getAllowedOrigin(req) : 'https://appiex.com';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return null; } }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 200000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

function sanitize(s, max) {
  return String(s == null ? '' : s).slice(0, max || 300);
}

// Detect automated search engine crawlers / bots so only real human visitors are shown
function isCrawlerBot(req, ip, ua) {
  const userAgent = String(ua || req.headers['user-agent'] || '').toLowerCase();
  if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|facebookexternalhit|ia_archiver|ahrefsbot|semrushbot|dotbot|mj12bot|petalbot|bytespider|gptbot|claudebot|applebot|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|headlesschrome|phantomjs|prerender|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i.test(userAgent)) {
    return true;
  }
  const ipStr = String(ip || '').trim();
  // Googlebot / Google crawler IP ranges (66.249.*.*)
  if (ipStr.startsWith('66.249.') || ipStr.startsWith('64.233.') || ipStr.startsWith('157.55.39.') || ipStr.startsWith('40.77.167.') || ipStr.startsWith('207.46.13.')) {
    return true;
  }
  return false;
}

// Format Bangladesh Standard Time (UTC+6) readable time & date
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
    }); // YYYY-MM-DD in Asia/Dhaka
    return { timeStr, dateStr };
  } catch (e) {
    const d = new Date(ms);
    return {
      timeStr: d.toISOString().slice(11, 19),
      dateStr: d.toISOString().split('T')[0]
    };
  }
}

export default async function handler(req, res) {
  const clientIp = ((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || 'unknown').trim();

  // 1. Rate limiting on all incoming requests (60 req/min per IP)
  if (isRateLimited(clientIp, 80, 60000)) {
    return send(res, 429, { ok: false, error: 'Too many requests. Please slow down.' }, req);
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return send(res, 204, {}, req);
  }if (req.method === 'OPTIONS') {
    return send(res, 200, { ok: true });
  }

  try {
    const mem = getMemStore();

    if (req.method === 'POST') {
      const body = await readBody(req);
      const rec = body && body.record;
      if (!rec || !rec.visitorUUID || !/^[A-Za-z0-9_-]{6,64}$/.test(rec.visitorUUID)) {
        return send(res, 400, { ok: false, error: 'invalid record' });
      }

      const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const clientIp = fwd || sanitize(rec.ip, 60);

      // Ignore crawler bots so admin only sees real people opening the website
      if (isCrawlerBot(req, clientIp, req.headers['user-agent'])) {
        return send(res, 200, { ok: true, ignoredBot: true });
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const dhaka = getDhakaFormattedTime(nowMs);

      const existing = mem.visitors[rec.visitorUUID];
      const firstSeenIso = (existing && existing.firstSeen) ? existing.firstSeen : nowIso;
      const firstEntryTime = (existing && existing.entryTime && !rec.isNewOpen) ? existing.entryTime : dhaka.timeStr;

      const cityHeader = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : '';
      const countryHeader = req.headers['x-vercel-ip-country'] || '';

      const pagePath = sanitize(rec.page || '/', 300);
      const pageTitle = sanitize(rec.pageTitle || 'Appiex Website', 200);

      // Build clean page journey (pages opened by this visitor)
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
        ip: clientIp || 'Live IP',
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

      // Only publish to cloud stream when a user opens a page or logs in (not passive heartbeat)
      if (!body.heartbeat) {
        await publishToCloudStream({ type: 'VISIT', record: clean });
      }

      return send(res, 200, {
        ok: true,
        serverTime: nowIso,
        serverTs: nowMs,
        entryTime: dhaka.timeStr
      });
    }

    if (isAuthBlocked(clientIp)) {
      return send(res, 403, { ok: false, error: 'Access temporarily blocked due to repeated auth failures.' }, req);
    }

    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_KEY) {
      recordAuthFailure(clientIp);
      return send(res, 401, { ok: false, error: 'unauthorized' }, req);
    }

    if (req.method === 'GET') {
      await hydrateFromCloudStream(mem, false);
      const nowMs = Date.now();
      const dhakaToday = getDhakaFormattedTime(nowMs).dateStr;

      const records = Object.values(mem.visitors)
        .filter((r) => r && (r.serverTs || 0) >= mem.resetAt && !isCrawlerBot(req, r.ip, ''))
        .sort((a, b) => (b.serverTs || 0) - (a.serverTs || 0))
        .slice(0, 200);

      return send(res, 200, {
        ok: true,
        serverTime: new Date(nowMs).toISOString(),
        serverTs: nowMs,
        todayDate: dhakaToday,
        streamTopic: STREAM_TOPIC,
        visitors: records
      });
    }

    if (req.method === 'DELETE') {
      const count = Object.keys(mem.visitors).length;
      const resetAt = Date.now();
      mem.resetAt = resetAt;
      mem.visitors = {};
      saveMemStore(mem);
      await publishToCloudStream({ type: 'RESET', resetAt });
      return send(res, 200, { ok: true, deleted: count, resetAt });
    }

    return send(res, 405, { ok: false, error: 'method not allowed' });
  } catch (err) {
    return send(res, 500, { ok: false, error: String((err && err.message) || err) });
  }
}
