"use client"

import "./dashboard.css";

export default function DashboardPage() {
  return (
    <div className="dash-page">
      {/* ── Header ── */}
      <div className="dash-header">
        <h1 className="dash-title">Welcome, abdulrehman! 👋</h1>
        <p className="dash-subtitle">Here's your learning progress overview</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-stats">
        <div className="stat-card">
          <span className="stat-label">Learning Progress</span>
          <span className="stat-value">0 of 0</span>
          <span className="stat-note">Start your learning journey!</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Score</span>
          <span className="stat-value">0.0%</span>
          <span className="stat-note">Personal Best: 0.0% ↗</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Study Streak</span>
          <span className="stat-value">0 Days</span>
          <span className="stat-note">Start your streak today! 🔥</span>
        </div>
      </div>

      {/* ── Plan usage ── */}
      <div className="plan-card">
        <div className="plan-card-header">
          <div>
            <h2 className="plan-title">Free Plan Usage</h2>
            <p className="plan-subtitle">Your limits for February 2026</p>
          </div>
          <button className="upgrade-btn">⊕ Upgrade to Premium</button>
        </div>

        <div className="usage-list">
          {[
            { label: "Monthly Documents",      used: 0, max: 2,  color: "#6366f1" },
            { label: "Monthly Quizzes",         used: 0, max: 3,  color: "#f59e0b" },
            { label: "Monthly Flashcard Decks", used: 0, max: 3,  color: "#22c55e" },
          ].map(({ label, used, max, color }) => (
            <div className="usage-row" key={label}>
              <div className="usage-meta">
                <span className="usage-label">{label}</span>
                <span className="usage-count">{used}/{max}</span>
              </div>
              <div className="usage-track">
                <div
                  className="usage-fill"
                  style={{ width: `${(used / max) * 100}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="plan-footer">
          Need more?{" "}
          <a href="/upgrade" className="plan-upgrade-link">
            Upgrade to Premium →
          </a>
        </div>
      </div>
    </div>
  );
}