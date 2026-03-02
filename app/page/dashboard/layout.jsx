"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";
import "./dash-home/dashboard.css";

export default function DashboardLayout({ children }) {
    // Auth check and redirect
    const { user, loading } = require("../AuthProvider.jsx").useAuth();
    const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

    useEffect(() => {
      if (!loading && !user && router) {
        router.replace("/");
      }
    }, [user, loading, router]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Read theme from HTML class (set by root layout script)
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;
    
    if (newIsDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(newIsDark);
  };

  return (
    <div className={`dashboard-wrapper ${isDark ? "dark" : "light"}`}>
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}