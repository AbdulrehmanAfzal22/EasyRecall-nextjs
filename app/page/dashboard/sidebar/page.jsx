"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Layers, BrainCircuit,
  ClipboardList, BarChart2, HelpCircle,
  ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react";
import "./sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/page/dashboard/dash-home", icon: LayoutDashboard },
  { label: "Documents", href: "/page/dashboard/content-intake", icon: FileText },
  { label: "Flashcard Decks", href: "/dashboard/flashcards", icon: Layers },
  { label: "Quizzes", href: "/dashboard/quizzes", icon: BrainCircuit },
  { label: "Quiz Attempts", href: "/dashboard/attempts", icon: ClipboardList },
  { label: "Flashcard Progress", href: "/dashboard/progress", icon: BarChart2 },
  { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];

export default function Sidebar({ isDark, onToggleTheme }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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