// app/api/skipcash/webhook/route.js
// Webhook handler for Skipcash payment notifications.
// Verifies the signature, records the payment, and updates user subscription.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

async function verifySignature(body, signature, secret) {
  const computedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return computedSignature === signature;
}

// Parse uid and plan from Custom1 (er_uid:xxx:plan:yyy) or from paymentSessions lookup
function parseCustom1(custom1) {
  if (!custom1 || typeof custom1 !== 'string') return null;
  const match = custom1.match(/^er_uid:([^:]+):plan:(monthly|yearly)$/);
  if (match) return { uid: match[1], planKey: match[2] };
  return null;
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-skipcash-signature');
    const secret = process.env.SKIPCASH_SECRET || '';

    if (!secret) {
      console.error('Missing SKIPCASH_SECRET for webhook verification');
      return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
    }

    const isValid = await verifySignature(rawBody, signature, secret);
    if (!isValid) {
      console.error('Invalid Skipcash webhook signature', { signature });
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse webhook payload', e);
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    console.log('Skipcash webhook received', { eventType: event.type, sessionId: event.session_id });

    if (event.type === 'payment.succeeded') {
      const { session_id, amount, currency, customer_id, metadata, custom1 } = event;
      const adminDb = getAdminDb();

      // Resolve uid: Custom1 first, then paymentSessions lookup, then customer_id fallback
      let uid = null;
      let planKey = 'monthly';
      const fromCustom1 = parseCustom1(custom1 || event.Custom1 || metadata?.custom1);
      if (fromCustom1) {
        uid = fromCustom1.uid;
        planKey = fromCustom1.planKey;
      }
      if (!uid) {
        const sessionSnap = await adminDb.collection('paymentSessions').doc(String(session_id)).get();
        if (sessionSnap.exists) {
          const data = sessionSnap.data();
          uid = data?.uid;
          planKey = data?.planKey || (amount === 9.99 ? 'yearly' : 'monthly');
        }
      }
      if (!uid && customer_id) uid = customer_id;
      if (!uid) {
        console.warn('Could not resolve user for payment', { session_id, custom1, metadata });
        return NextResponse.json({ ok: true }); // Ack to avoid retries
      }

      // Map amount to plan if not set
      if (!planKey) planKey = amount === 9.99 ? 'yearly' : 'monthly';

      // Store payment with account details under users/{uid}/payments
      const paymentDoc = {
        sessionId: session_id,
        amount,
        currency: currency || 'USD',
        planKey,
        status: 'completed',
        source: 'skipcash',
        metadata: metadata || {},
        createdAt: FieldValue.serverTimestamp(),
      };

      await adminDb.collection('users').doc(uid).collection('payments').doc(session_id).set(paymentDoc, { merge: true });

      // Update user subscription (so same paid account opens when they return)
      await adminDb.collection('users').doc(uid).set({
        subscription: {
          status: 'active',
          plan: planKey,
          lastPaymentAt: FieldValue.serverTimestamp(),
          sessionId: session_id,
          amount,
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Set usage plan and initialize usage doc (uploads: 0, chats: 0)
      const now = new Date();
      const cycleKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageRef = adminDb.collection('users').doc(uid).collection('usage').doc(cycleKey);
      const usageSnap = await usageRef.get();
      if (usageSnap.exists) {
        await usageRef.update({ plan: planKey });
      } else {
        await usageRef.set({ uploads: 0, chats: 0, plan: planKey });
      }

      // Also keep global payments record for backwards compat
      await adminDb.collection('payments').doc(session_id).set({
        sessionId: session_id,
        amount,
        currency: currency || 'USD',
        uid,
        planKey,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
        source: 'skipcash',
      }, { merge: true });

      console.log('Payment recorded', { sessionId: session_id, uid, planKey, amount });
      return NextResponse.json({ ok: true });
    }

    if (event.type === 'payment.failed') {
      const { session_id, reason } = event;
      const adminDb = getAdminDb();
      await adminDb.collection('payments').doc(session_id).set({
        sessionId: session_id,
        status: 'failed',
        reason,
        failedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.warn('Payment failed webhook', { sessionId: session_id, reason });
      return NextResponse.json({ ok: true });
    }

    console.log('Unhandled webhook event type', event.type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error', err);
    return NextResponse.json({ error: 'server_error', detail: String(err) }, { status: 500 });
  }
}
