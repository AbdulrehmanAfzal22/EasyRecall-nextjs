"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";
import "./dash-home/dashboard.css";

const PLAN_FLAG_KEY = "er_plan_paid";

export default function DashboardLayout({ children }) {
  // Auth check and redirect
  const { user, loading } = require("../AuthProvider.jsx").useAuth();
  const router =
    typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

  const [isDark, setIsDark] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user && router) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Read theme from HTML class (set by root layout script)
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      let paid = false;
      try {
        paid = localStorage.getItem(PLAN_FLAG_KEY) === "true";
      } catch {
        paid = false;
      }
      setHasActivePlan(paid);
      if (!paid) {
        setShowUpgradeModal(true);
      }
    }
  }, [loading, user]);

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
    if (!router) return;
    // Navigate to a full pricing page so the user can choose a plan
    router.push("/page/pricing");
  };

  return (
    <div className={`dashboard-wrapper ${isDark ? "dark" : "light"}`}>
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="dashboard-content">
        {children}

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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}