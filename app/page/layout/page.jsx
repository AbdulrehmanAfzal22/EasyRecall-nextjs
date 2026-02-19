"use client"
import Sidebar from "../sidebar/page";
import DashboardPage from "../dashboard/page";
import "./layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-shell">
      {/* ── LEFT: Sidebar (shared across all dashboard pages) ── */}
      <Sidebar />

      
     
      <main className="dashboard-main">
        <DashboardPage/>
      </main>
    </div>
  );
}