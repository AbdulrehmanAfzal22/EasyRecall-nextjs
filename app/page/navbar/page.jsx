"use client";
import { useState, useEffect, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import "./navbar.css";
import Image from "next/image";
import logo from "../../../public/assets/logo.png";

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ── Theme init ───────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  /* ── Lock body scroll when mobile menu is open ────── */
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  /* ── Close menu on Escape key ─────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Close menu when resizing to desktop ─────────── */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── Theme toggle ─────────────────────────────────── */
  const toggleTheme = useCallback(() => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  }, [isDark]);

  /* ── Close mobile menu on link click ─────────────── */
  const handleMobileLinkClick = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-inner">

            {/* ── LEFT: Logo ────────────────────────── */}
            <div className="logo-wrapper">
              <a href="/" className="logo-link" onClick={handleMobileLinkClick}>
                <Image
                  src={logo}
                  alt="EasyRecall"
                  className="logo-image"
                  priority
                />
              </a>
              <span className="domain">EasyRecall</span>
            </div>

            {/* ── CENTER: Desktop nav ───────────────── */}
            <div className="nav-links-desktop">
              <a href="#features"    className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <a href="#pricing"     className="nav-link">Pricing</a>
              <a href="#faq"         className="nav-link">FAQ</a>
              <a href="/blog"        className="nav-link">Blog</a>
              <div className="free-tools">
                Free Tools
                <span className="green-dot">●</span>
              </div>
            </div>

            {/* ── RIGHT: Actions ────────────────────── */}
            <div className="right-section">
              {/* Theme toggle — visible on all breakpoints */}
              <button
                onClick={toggleTheme}
                className="theme-btn"
                aria-label="Toggle theme"
                title="Toggle dark/light mode"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Desktop-only sign-in & CTA */}
              <a href="/sign-in"     className="signin-link">Sign in</a>
              <a href="/get-started" className="cta-button">Get Started</a>

              {/* Hamburger — hidden on desktop via CSS */}
              <button
                className={`hamburger-btn${menuOpen ? " open" : ""}`}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ────────────────────────── */}
      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          <a
            href="#features"
            className="mobile-nav-link"
            onClick={handleMobileLinkClick}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="mobile-nav-link"
            onClick={handleMobileLinkClick}
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="mobile-nav-link"
            onClick={handleMobileLinkClick}
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="mobile-nav-link"
            onClick={handleMobileLinkClick}
          >
            FAQ
          </a>
          <a
            href="/blog"
            className="mobile-nav-link"
            onClick={handleMobileLinkClick}
          >
            Blog
          </a>

          <div className="mobile-free-tools">
            Free Tools
            <span className="green-dot">●</span>
          </div>
        </nav>

        <div className="mobile-divider" />

        <div className="mobile-actions">
          <a
            href="/sign-in"
            className="mobile-signin-link"
            onClick={handleMobileLinkClick}
          >
            Sign in
          </a>
          <a
            href="/get-started"
            className="mobile-cta-button"
            onClick={handleMobileLinkClick}
          >
            Get Started
          </a>
        </div>
      </div>
    </>
  );
}