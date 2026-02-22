"use client";

import { Upload, Layers, Target, ClipboardList, BarChart2, ArrowRight } from "lucide-react";
import { useUserStats } from "../../../hooks/useUserStats";
import { auth } from "../../../../lib/firebase";
import "./dashboard.css";

const MODULES = [
  { icon: Upload,        name: "Content Intake",  desc: "Upload notes, slides, or chapters to generate study material automatically." },
  { icon: Layers,        name: "Flashcards",       desc: "Spaced repetition cards adapted to your recall performance." },
  { icon: Target,        name: "Recall Game",      desc: "Self-assess your mastery with intentional recall scoring." },
  { icon: ClipboardList, name: "Test Yourself",    desc: "Simulate exam conditions with adaptive quiz questions." },
  { icon: BarChart2,     name: "Study Tracker",    desc: "Track sessions, recall trends, and readiness at a glance." },
];

export default function Dashboard() {
  const user = auth.currentUser;
  const stats = useUserStats();

  // Get user's first name from email or display name
  const getUserName = () => {
    if (!user) return "there";
    if (user.displayName) return user.displayName.split(" ")[0];
    if (user.email) return user.email.split("@")[0];
    return "there";
  };

  return (
    <>
      <div className="page">
        {/* HERO */}
        <div className="hero">
          <div>
            <p className="hero-greeting">
              Good {getTimeOfDay()} {user ? `${getUserName()}` : ""} — let's study smarter
            </p>
            <h2 className="hero-title">Welcome to<br />EasyRecall</h2>
            <p className="hero-sub">
              Input once → recall repeatedly → remember efficiently.<br />
              Your AI-driven study companion that builds real memory.
            </p>
            <button className="hero-btn">Get Started →</button>
          </div>
          <div className="hero-emoji">🧠</div>
        </div>

        {/* STATS - NOW REAL-TIME */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">
              {stats.loading ? "—" : stats.cardsReviewed}
            </div>
            <div className="stat-label">Cards Reviewed Today</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-num yellow">
              {stats.loading ? "—" : stats.dayStreak}
            </div>
            <div className="stat-label">Day Streak</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-num green">
              {stats.loading ? "—" : stats.mastered}
            </div>
            <div className="stat-label">Mastered</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-num blue">
              {stats.loading ? "—" : `${stats.readiness}%`}
            </div>
            <div className="stat-label">Readiness</div>
          </div>
        </div>

        {/* MODULES */}
        <div className="modules-header">
          <div className="modules-label">Modules</div>
          <div className="modules-title">Everything you need</div>
        </div>

        <div className="modules-grid">
          {MODULES.map(({ icon: Icon, name, desc }) => (
            <button key={name} className="module-card">
              <div className="module-icon"><Icon size={20} /></div>
              <div>
                <div className="module-name">{name}</div>
                <div className="module-desc">{desc}</div>
              </div>
              <ArrowRight size={18} className="module-arrow" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Helper function to get time of day greeting
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}