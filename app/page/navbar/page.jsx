"use client";
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import './navbar.css';
import Image from "next/image";
import logo from "../../../public/assets/logo.png";   // ← this import is correct

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">

          {/* LEFT: Logo area */}
          <div className="logo-wrapper">
            <a href="/" className="logo-link">
              <Image
                src={logo}           // ← use the imported value here
                alt="StudyLab"
                className="logo-image"
               
              />
            </a>
            <span className="domain">EasyRecall</span>
          </div>

          {/* CENTER: Navigation links */}
          <div className="nav-links-desktop">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <a href="/blog" className="nav-link">Blog</a>

            <div className="free-tools">
              Free Tools
              <span className="green-dot">●</span>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="right-section">
            <button
              onClick={toggleTheme}
              className="theme-btn"
              aria-label="Toggle theme"
              title="Toggle dark/light mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <a href="/sign-in" className="signin-link">Sign in</a>

            <a href="/get-started" className="cta-button">
              Get Started
            </a>
          </div>

        </div>
      </div>
    </nav>
  );
}

