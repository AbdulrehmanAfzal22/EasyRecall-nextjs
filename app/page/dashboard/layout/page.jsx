"use client";

import { useState, useEffect } from "react";
import Sidebar from "../sidebar/page";
import "../dash-home/dashboard.css";

export default function DashboardLayout({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && prefersDark);

    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;

    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <div className={`dashboard-shell ${isDark ? "dark-mode" : ""}`}>
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="dashboard-main">
        {children} {/* 🔥 THIS IS VERY IMPORTANT */}
      </main>
    </div>
  );
}
