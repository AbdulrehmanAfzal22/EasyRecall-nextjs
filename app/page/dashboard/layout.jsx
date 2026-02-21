"use client";

import { useState } from "react";
import Sidebar from "../dashboard/sidebar/page";
import "./layout.css";

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