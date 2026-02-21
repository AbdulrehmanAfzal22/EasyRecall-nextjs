"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Layers, BrainCircuit,
  ClipboardList, BarChart2, HelpCircle,
  ChevronLeft, ChevronRight, Sun, Moon,Target,
} from "lucide-react";
import { LineChart, TrendingUp, Activity, CheckCircle } from "lucide-react";
import "./sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/page/dashboard/dash-home", icon: LayoutDashboard },
  { label: "Documents", href: "/page/dashboard/content-intake", icon: FileText },
  { label: "Flashcard Decks", href: "/page/dashboard/flashcard", icon: Layers },
  { label: "Flashcard Progress", href: "/page/dashboard/progress-flashcard", icon: BarChart2 },
  { label: "Quizzes", href: "/page/dashboard/quiz", icon: BrainCircuit },
  { label: "Quiz Attempts", href: "/page/dashboard/quiz-attempts", icon: ClipboardList },

  { label: "Help & Support", href: "/page/dashboard/help", icon: HelpCircle },
 
];

export default function Sidebar({ isDark, onToggleTheme }) {
  const pathname = usePathname();
const [collapsed, setCollapsed] = useState(
  typeof window !== "undefined" && window.innerWidth <= 900
);
  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-top-row">
        <button className="sidebar-icon-btn" onClick={onToggleTheme} title={isDark ? "Light mode" : "Dark mode"}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="sidebar-icon-btn" onClick={() => setCollapsed((p) => !p)} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link${pathname === href ? " active" : ""}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}