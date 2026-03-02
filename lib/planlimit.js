// ============================================================
//  PLAN LIMITS — edit this file to change any limit
//  Location: lib/planLimits.js
// ============================================================

export const PLAN_LIMITS = {
  //  ── $4.99/month plan ────────────────────────────────────
  monthly: {
    uploads: 10,       // max file uploads per billing cycle
    chats:   100,      // max chat messages per billing cycle
    label:   "Pro",
  },

  //  ── $9.99/year plan ──────────────────────────────────────
  yearly: {
    uploads: 20,       // max file uploads per billing cycle
    chats:   200,      // max chat messages per billing cycle
    label:   "Premium",
  },

  //  ── Owner / bypass emails (always unlimited) ─────────────
  ownerEmails: [
    "musa@gmail.com",
    // add more admin emails here
  ],
};

// ── Helper: get limits for a plan key ───────────────────────
export function getLimits(planKey) {
  return PLAN_LIMITS[planKey] ?? PLAN_LIMITS.monthly;
}

// ── Helper: check if email bypasses all limits ───────────────
export function isOwner(email) {
  return PLAN_LIMITS.ownerEmails.includes(email?.toLowerCase());
}