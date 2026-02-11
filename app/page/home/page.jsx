// components/Hero.tsx
"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import "./home.css";

export default function Hero() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme or system preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <section className="hero">
      <div className="hero-container">

        {/* Theme toggle (top-right corner) */}
        {/* <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle dark/light mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button> */}

        <div className="content-grid">

          {/* Left - Text content */}
          <div className="left-content">
            <div className="badges">
              <span className="badge ai">✦ AI-Powered Study Tool</span>
              <span className="badge lang">🌐 20+ Languages</span>
            </div>

            <h1 className="headline">
              Transform Your Study Materials into
              <span className="highlight"> Interactive Quizzes</span> &{" "}
              <span className="highlight">Smart Flashcards</span>
            </h1>

            <p className="subtitle">
              Upload your study materials in 20+ languages and let AI create
              personalized quizzes and flashcards. Master your subjects with
              dynamic learning tools, track your progress, and ace your exams
              with confidence.
            </p>

            <div className="trust">
              <div className="avatars">
                {/* You can replace with real avatar images */}
                <div className="avatar">M</div>
                <div className="avatar">A</div>
                <div className="avatar">S</div>
              </div>
              <span>Trusted by 4,000+ students worldwide</span>
            </div>

            <div className="cta-group">
              <button className="btn primary">Start Learning Now →</button>
              <button className="btn secondary">See How It Works</button>
            </div>
          </div>

          {/* Right - Video / Mockup area */}
          <div className="right-content">
            <div className="mockup-container">
              {/* You can replace this div with <video>, <iframe> or screenshot */}
              <div className="video-placeholder">
                <span>Video / Interactive Demo Here</span>
                <p>(paste your video embed / player code here)</p>
              </div>

              {/* Optional floating label like in screenshot */}
              <div className="floating-label">
                <div className="icon">📚</div>
                <span>Smart Learning</span>
              </div>

              <div className="status-badge">
                Showing 1 result
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}