"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";

export default function DashboardLayout({ children }) {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`dashboard-wrapper ${isDark ? "dark" : "light"}`}>
      <Sidebar
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}