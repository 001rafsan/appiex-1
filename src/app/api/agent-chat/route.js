import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function stripMarkdown(text) {
  return String(text || '')
    .replace(/[*_`#>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const lang = String(body?.lang || 'en-US');
    const stats = body?.stats || {};

    if (!message) {
      return NextResponse.json({ reply: 'Please say or type something.' }, { status: 400 });
    }

    const systemPrompt = [
      'You are Appiex AgentHub AI, a friendly, smart, concise voice assistant for Adil at Appiex Digital Engineering.',
      `Current live agency metrics: Monthly Sales $${stats.salesTotalUSD ?? 0} (${stats.salesCount ?? 0} entries), Client Orders ${stats.ordersCount ?? 0}, Daily Website Views ${stats.visitorsCount ?? 0}.`,
      lang.startsWith('bn')
        ? 'Reply naturally in concise Bengali (Bangla) suitable for voice speech, 1 to 3 short sentences, no markdown.'
        : 'Reply naturally in concise spoken English (or Bengali if the user wrote/spoke in Bengali), 1 to 3 short sentences, no markdown or bullet lists.'
    ].join(' ');

    // 1. If GEMINI_API_KEY is configured in Vercel
    if (process.env.GEMINI_API_KEY) {
      try {
        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }]
            }),
            signal: AbortSignal.timeout(7000)
          }
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          const txt = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) return NextResponse.json({ reply: stripMarkdown(txt) });
        }
      } catch {}
    }

    // 2. Free zero-key conversational LLM via Pollinations
    try {
      const pRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          model: 'openai',
          seed: 42
        }),
        signal: AbortSignal.timeout(7500)
      });
      if (pRes.ok) {
        const txt = await pRes.text();
        if (txt && txt.trim().length > 1 && !txt.includes('<!DOCTYPE')) {
          return NextResponse.json({ reply: stripMarkdown(txt).slice(0, 420) });
        }
      }
    } catch {}

    // 3. DuckDuckGo Instant Answer fallback
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_html=1&skip_disambig=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (ddgRes.ok) {
        const ddg = await ddgRes.json();
        const ans = ddg?.AbstractText || ddg?.Answer;
        if (ans) {
          return NextResponse.json({ reply: stripMarkdown(ans).slice(0, 320) });
        }
      }
    } catch {}

    // 4. Smart local fallback
    const reply = lang.startsWith('bn')
      ? `আপনি "${message}" বলেছেন। বর্তমানে Appiex-এ মোট সেলস $${stats.salesTotalUSD ?? 0}, অর্ডার ${stats.ordersCount ?? 0}টি এবং আজকের ভিজিটর ${stats.visitorsCount ?? 0} জন।`
      : `I heard "${message}". Right now Appiex has $${stats.salesTotalUSD ?? 0} in monthly sales, ${stats.ordersCount ?? 0} orders, and ${stats.visitorsCount ?? 0} daily views. Ask me anything or say open sales, orders, or analytics.`;

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { reply: 'Sorry, I had trouble processing that. Please try again.' },
      { status: 500 }
    );
  }
}
