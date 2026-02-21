"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadFlashcards, loadProgress, computeStats, clearProgress, saveSession } from "@/lib/flashcardStore";
import "./progress.css";

const RATING_META = [
  { id: 0, label: "Don't Know",   emoji: "😶", color: "#ef4444", grad: "linear-gradient(135deg,#ef4444,#b91c1c)" },
  { id: 1, label: "A Little Bit", emoji: "🤔", color: "#f59e0b", grad: "linear-gradient(135deg,#f59e0b,#b45309)" },
  { id: 2, label: "Very Well",    emoji: "🎯", color: "#10b981", grad: "linear-gradient(135deg,#10b981,#059669)" },
];

export default function FlashcardProgress() {
  const router = useRouter();
  const [cards,    setCards]    = useState([]);
  const [progress, setProgress] = useState({});
  const [stats,    setStats]    = useState(null);
  const [tab,      setTab]      = useState("overview"); // overview | breakdown

  useEffect(() => {
    const stored = loadFlashcards();
    const prog   = loadProgress();
    if (stored?.cards) {
      setCards(stored.cards);
      setProgress(prog);
      setStats(computeStats(stored.cards, prog));
    }
  }, []);

  const handleReset = () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    clearProgress();
    const fresh = {};
    setProgress(fresh);
    setStats(computeStats(cards, fresh));
  };

  const handleRestart = () => {
    clearProgress();
    saveSession(0);
    router.push("/page/dashboard/flashcard");
  };

  /* ── empty ── */
  if (!stats) return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>Progress</h1><p>Your learning journey</p></div>
      </div>
      <div className="page fcp-empty-page">
        <div className="fcp-empty-card">
          <span style={{ fontSize: 52 }}>📊</span>
          <h2>No data yet</h2>
          <p>Complete some flashcard reviews to see your progress here.</p>
          <button className="ci-btn ci-primary" onClick={() => router.push("/page/dashboard/flashcard")}>
            Start Studying →
          </button>
        </div>
      </div>
    </>
  );

  const scoreColor =
    stats.accuracy >= 70 ? "#10b981" :
    stats.accuracy >= 40 ? "#f59e0b" :
    "#ef4444";

  const circumference = 2 * Math.PI * 52;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Progress</h1>
          <p>{stats.seen} of {stats.total} cards reviewed · {stats.mastered} mastered</p>
        </div>
        <div className="topbar-right">
          <button className="ci-btn ci-ghost ci-btn-sm" onClick={() => router.push("/page/dashboard/flashcard")}>
            ← Back to Cards
          </button>
        </div>
      </div>

      <div className="page fcp-page">

        {/* ── Score ring + stat chips ── */}
        <div className="fcp-hero">
          <div className="fcp-ring-wrap">
            <svg viewBox="0 0 120 120" className="fcp-ring-svg">
              <circle cx="60" cy="60" r="52" className="fcp-ring-track" />
              <circle
                cx="60" cy="60" r="52"
                className="fcp-ring-fill"
                style={{
                  stroke: scoreColor,
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - stats.accuracy / 100),
                }}
              />
            </svg>
            <div className="fcp-ring-inner">
              <div className="fcp-ring-pct" style={{ color: scoreColor }}>{stats.accuracy}%</div>
              <div className="fcp-ring-tag">accuracy</div>
            </div>
          </div>

          <div className="fcp-stat-grid">
            <div className="fcp-stat">
              <span className="fcp-stat-num">{stats.total}</span>
              <span className="fcp-stat-label">Total cards</span>
            </div>
            <div className="fcp-stat">
              <span className="fcp-stat-num">{stats.seen}</span>
              <span className="fcp-stat-label">Reviewed</span>
            </div>
            <div className="fcp-stat">
              <span className="fcp-stat-num">{stats.unseen}</span>
              <span className="fcp-stat-label">Remaining</span>
            </div>
            <div className="fcp-stat fcp-stat--highlight">
              <span className="fcp-stat-num" style={{ color: "#10b981" }}>{stats.mastered}</span>
              <span className="fcp-stat-label">Mastered</span>
            </div>
          </div>
        </div>

        {/* ── Mastery bar ── */}
        <div className="fcp-section">
          <div className="fcp-section-header">
            <span className="fcp-section-title">Mastery Breakdown</span>
            <span className="fcp-mastery-pct">{stats.masteryPct}% of all cards mastered</span>
          </div>
          <div className="fcp-bar">
            {RATING_META.map((r) => {
              const count = stats.counts[r.id] || 0;
              const pct   = stats.total === 0 ? 0 : (count / stats.total) * 100;
              return (
                <div
                  key={r.id}
                  className="fcp-bar-seg"
                  style={{ width: `${pct}%`, background: r.grad }}
                  title={`${r.label}: ${count}`}
                />
              );
            })}
            {/* unseen */}
            <div
              className="fcp-bar-seg fcp-bar-seg--unseen"
              style={{ width: `${(stats.unseen / stats.total) * 100}%` }}
              title={`Unseen: ${stats.unseen}`}
            />
          </div>
          <div className="fcp-legend">
            {RATING_META.map((r) => (
              <div key={r.id} className="fcp-legend-item">
                <div className="fcp-legend-dot" style={{ background: r.color }} />
                <span>{r.label}: <strong>{stats.counts[r.id] || 0}</strong></span>
              </div>
            ))}
            <div className="fcp-legend-item">
              <div className="fcp-legend-dot fcp-legend-dot--unseen" />
              <span>Unseen: <strong>{stats.unseen}</strong></span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="fcp-tabs">
          <button className={`fcp-tab ${tab === "overview"   ? "fcp-tab--active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
          <button className={`fcp-tab ${tab === "breakdown"  ? "fcp-tab--active" : ""}`} onClick={() => setTab("breakdown")}>All Cards</button>
        </div>

        {/* ── Overview cards ── */}
        {tab === "overview" && (
          <div className="fcp-overview-grid">
            {RATING_META.map((r) => {
              const count = stats.counts[r.id] || 0;
              const pct   = stats.seen === 0 ? 0 : Math.round((count / stats.seen) * 100);
              return (
                <div key={r.id} className="fcp-ov-card" style={{ "--rc": r.color }}>
                  <div className="fcp-ov-top-bar" style={{ background: r.grad }} />
                  <div className="fcp-ov-emoji">{r.emoji}</div>
                  <div className="fcp-ov-count">{count}</div>
                  <div className="fcp-ov-label">{r.label}</div>
                  <div className="fcp-ov-sub">{pct}% of reviewed</div>
                  <div className="fcp-ov-mini-bar">
                    <div style={{ width: `${pct}%`, background: r.color, height: "100%", borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Card breakdown ── */}
        {tab === "breakdown" && (
          <div className="fcp-breakdown">
            {cards.map((card, i) => {
              const p     = progress[i];
              const rMeta = p ? RATING_META[p.rating] : null;
              return (
                <div key={i} className="fcp-card-row">
                  <span className="fcp-row-num">{i + 1}</span>
                  <span className="fcp-row-q">{card.question}</span>
                  <span
                    className="fcp-row-badge"
                    style={rMeta
                      ? { color: rMeta.color, background: `${rMeta.color}18`, borderColor: `${rMeta.color}40` }
                      : {}
                    }
                  >
                    {rMeta ? `${rMeta.emoji} ${rMeta.label}` : "— Unseen"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="fcp-actions">
          <button className="ci-btn ci-primary" onClick={handleRestart}>
            ↺ Restart Session
          </button>
          <button className="ci-btn ci-ghost" onClick={handleReset}>
            Reset Progress
          </button>
          <button className="ci-btn ci-ghost" onClick={() => router.push("/page/dashboard/content-intake")}>
            Upload New Content
          </button>
        </div>

      </div>
    </>
  );
}