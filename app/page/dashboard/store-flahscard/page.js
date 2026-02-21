// flashcardStore.js
// Drop this in your lib/ or utils/ folder and import where needed.

const KEYS = {
  CARDS: "mem_fc_cards",
  PROGRESS: "mem_fc_progress",
  SESSION: "mem_fc_session",
};

// ─── Cards ──────────────────────────────────────────────────────────────────

export function saveFlashcards(cards, meta = {}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.CARDS, JSON.stringify({ cards, meta: { ...meta, savedAt: Date.now() } }));
  localStorage.removeItem(KEYS.SESSION); // reset cursor
}

export function loadFlashcards() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEYS.CARDS)); } catch { return null; }
}

// ─── Progress ────────────────────────────────────────────────────────────────
// rating: 0 = don't know | 1 = a little bit | 2 = very well

export function loadProgress() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEYS.PROGRESS)) || {}; } catch { return {}; }
}

export function saveRating(cardIndex, rating) {
  const p = loadProgress();
  p[cardIndex] = { rating, seenCount: (p[cardIndex]?.seenCount || 0) + 1, lastSeen: Date.now() };
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(p));
  return p;
}

export function clearProgress() {
  localStorage.removeItem(KEYS.PROGRESS);
}

// ─── Session (current card index) ────────────────────────────────────────────

export function saveSession(i) { localStorage.setItem(KEYS.SESSION, String(i)); }
export function loadSession()  { const v = localStorage.getItem(KEYS.SESSION); return v !== null ? parseInt(v, 10) : 0; }

// ─── Stats ────────────────────────────────────────────────────────────────────

export function computeStats(cards, progress) {
  const total   = cards.length;
  const counts  = { 0: 0, 1: 0, 2: 0 };
  Object.values(progress).forEach(({ rating }) => { counts[rating] = (counts[rating] || 0) + 1; });
  const seen    = Object.keys(progress).length;
  const unseen  = total - seen;
  const accuracy   = seen === 0 ? 0 : Math.round(((counts[1] + counts[2]) / seen) * 100);
  const masteryPct = total === 0 ? 0 : Math.round((counts[2] / total) * 100);
  return { total, seen, unseen, counts, accuracy, mastered: counts[2], masteryPct };
}