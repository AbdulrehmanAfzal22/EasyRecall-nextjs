// app/api/skipcash/create-session/route.js
// Production server-side Skipcash session creation.
// Creates a session via Skipcash API using KEYID/SECRET and returns the checkout URL.

import { NextResponse } from 'next/server';
import crypto from 'crypto';

function toCents(amount) {
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function generateSignature(data, secret) {
  // Sign request body with secret using HMAC SHA256
  return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
}

// Fetch with timeout fallback for older Node versions
async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const amount = Number(body?.amount ?? 0);

    // Only allow hardcoded amounts for safety
    const allowed = [4.99, 9.99];
    if (!allowed.includes(amount)) {
      console.warn('Invalid amount requested', { amount, allowed });
      return NextResponse.json({ error: 'invalid_amount', amount }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const MODE = process.env.SKIPCASH_MODE || 'live'; // 'mock' or 'live' (default: live)

    // ───────────────────────────────────────────────────
    // MOCK MODE: Return simulated checkout URL (for development)
    // ───────────────────────────────────────────────────
    if (MODE === 'mock') {
      const mockSessionId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const mockCheckoutUrl = `${origin}/skipcash-mock.html?amount=${amount}&sessionId=${mockSessionId}&return_url=${encodeURIComponent(`${origin}/dashboard/pricing`)}`;
      
      console.log('✓ MOCK MODE: Returning simulated checkout', {
        mode: 'mock',
        sessionId: mockSessionId,
        amount,
        url: mockCheckoutUrl,
      });

      return NextResponse.json({
        url: mockCheckoutUrl,
        sessionId: mockSessionId,
        mode: 'mock',
      });
    }

    // ───────────────────────────────────────────────────
    // LIVE MODE: Call real Skipcash API
    // ───────────────────────────────────────────────────

    // Read credentials from server env (NEVER expose to client)
    const KEYID = process.env.SKIPCASH_KEYID || '';
    const SECRET = process.env.SKIPCASH_SECRET || '';
    const SKIPCASH_API = process.env.SKIPCASH_API || 'https://api.skipcash.io/v1/checkout/sessions';

    if (!KEYID || !SECRET) {
      console.error('Missing Skipcash credentials', { hasKeyId: !!KEYID, hasSecret: !!SECRET });
      return NextResponse.json({ error: 'misconfigured_provider', detail: 'Missing KEYID or SECRET' }, { status: 500 });
    }

    const cents = toCents(amount);

    // Use production URLs from environment, fallback to origin for local dev
    const successUrl = process.env.SKIPCASH_SUCCESS_URL || `${origin}/dashboard/pricing?status=success`;
    const cancelUrl = process.env.SKIPCASH_CANCEL_URL || `${origin}/dashboard/pricing?status=cancel`;
    const webhookUrl = process.env.SKIPCASH_WEBHOOK_URL || `${origin}/api/skipcash/webhook`;

    // Build session creation payload
    const sessionData = {
      amount: cents,
      currency: 'USD',
      description: 'EasyRecall Premium Subscription',
      client_key: process.env.SKIPCASH_CLIENTKEY || '',
      webhook_key: process.env.SKIPCASH_WEBHOOKKEY || '',
      success_url: successUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl,
    };

    // Generate signature for authentication
    const signature = generateSignature(sessionData, SECRET);

    console.log('Creating Skipcash LIVE session', {
      mode: 'live',
      amount,
      cents,
      SKIPCASH_API,
      hasKeyId: !!KEYID,
      hasSecret: !!SECRET,
    });

    // Call Skipcash API to create session with timeout
    let response;
    try {
      response = await fetchWithTimeout(SKIPCASH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KeyID': KEYID,
          'X-Signature': signature,
        },
        body: JSON.stringify(sessionData),
      }, 10000);
    } catch (fetchErr) {
      console.error('Fetch to Skipcash API failed', {
        url: SKIPCASH_API,
        error: fetchErr.message,
        code: fetchErr.code,
        name: fetchErr.name,
      });
      return NextResponse.json(
        { error: 'api_unreachable', detail: fetchErr.message },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Skipcash API error response', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'provider_error', status: response.status, detail: responseText.substring(0, 200) },
        { status: 502 }
      );
    }

    let session;
    try {
      session = await response.json();
    } catch (parseErr) {
      console.error('Failed to parse Skipcash response', parseErr);
      return NextResponse.json({ error: 'invalid_response', detail: 'Provider returned invalid JSON' }, { status: 502 });
    }

    // Extract the checkout URL from the session response
    const checkoutUrl = session.checkout_url || session.url || session.checkoutUrl;
    if (!checkoutUrl) {
      console.error('Skipcash session missing checkout URL', { session });
      return NextResponse.json(
        { error: 'missing_checkout_url', detail: 'Provider response missing checkout_url field' },
        { status: 500 }
      );
    }

    console.log('✓ Skipcash LIVE session created successfully', { url: checkoutUrl, sessionId: session.id });
    return NextResponse.json({ url: checkoutUrl, sessionId: session.id, mode: 'live' });
  } catch (err) {
    console.error('Session creation error', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return NextResponse.json(
      { error: 'server_error', detail: err.message },
      { status: 500 }
    );
  }
}
