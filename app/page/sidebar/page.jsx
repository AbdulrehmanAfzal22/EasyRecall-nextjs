"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Layers,
  BrainCircuit,
  ClipboardList,
  BarChart2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard",          href: "/dashboard",           icon: LayoutDashboard },
  { label: "Documents",          href: "/dashboard/documents", icon: FileText },
  { label: "Flashcard Decks",    href: "/dashboard/flashcards",icon: Layers },
  { label: "Quizzes",            href: "/dashboard/quizzes",   icon: BrainCircuit },
  { label: "Quiz Attempts",      href: "/dashboard/attempts",  icon: ClipboardList },
  { label: "Flashcard Progress", href: "/dashboard/progress",  icon: BarChart2 },
  { label: "Help & Support",     href: "/dashboard/help",      icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      {/* ── Collapse toggle ── */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed((p) => !p)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* ── Nav items ── */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " active" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="sidebar-icon" />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}