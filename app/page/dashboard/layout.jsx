"use client";
import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";
import "./dash-home/dashboard.css";
import { useAuth } from "../AuthProvider.jsx";
import { useRouter } from "next/navigation";

const PLAN_FLAG_KEY = "er_plan_paid";

const OWNER_EMAILS = [
  "musa@gmail.com",
  // add more owner/admin emails here if needed
];

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const isOwner = OWNER_EMAILS.includes(user.email?.toLowerCase());
      if (isOwner) {
        setHasActivePlan(true);
        setShowUpgradeModal(false);
        return;
      }
      let paid = false;
      try {
        paid = localStorage.getItem(PLAN_FLAG_KEY) === "true";
      } catch {
        paid = false;
      }
      setHasActivePlan(paid);
      setShowUpgradeModal(!paid);
    }
  }, [loading, user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showUpgradeModal && !hasActivePlan) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showUpgradeModal, hasActivePlan]);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;
    if (newIsDark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(newIsDark);
  };

  const handleUpgradeClick = () => {
    router.push("/page/pricing");
  };

  return (
    <div className={`dashboard-wrapper ${isDark ? "dark" : "light"}`}>
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="dashboard-content">
        {children}
      </main>

      {/*
        ✅ Overlay lives here — OUTSIDE <main> — so that
        overflow:auto on .dashboard-content does NOT create
        a stacking context that traps position:fixed children.
      */}
      {showUpgradeModal && !hasActivePlan && (
        <div className="upgrade-overlay">
          <div className="upgrade-modal">
            <h2 className="upgrade-title">Upgrade your plan to use EasyRecall</h2>
            <p className="upgrade-text">
              Your account is created, but you need to activate a paid plan
              before you can access the dashboard features.
            </p>
            <button className="upgrade-btn" onClick={handleUpgradeClick}>
  Upgrade plan to continue
</button>
<button className="upgrade-back-btn" onClick={() => router.push("/")}>
  ← Back to Home
</button>
          </div>
        </div>
      )}
    </div>
  );
}