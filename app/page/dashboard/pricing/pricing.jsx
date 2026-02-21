"use client";

import { useState, useEffect } from "react";
import "./pricing.css";

export default function PricingSection() {
  const [themeDark, setThemeDark] = useState(false);
  const [billingYearly, setBillingYearly] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setThemeDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setThemeDark(false);
    }
  }, []);

  const handleThemeToggle = () => {
    if (themeDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setThemeDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setThemeDark(true);
    }
  };

  const handleBillingToggle = () => {
    setBillingYearly((prev) => !prev);
  };

  return (
    <section className="pricing-hero">
      <div className="pricing-wrapper">
        <h2 className="main-title">Start Learning Smarter Today</h2>
        <p className="main-subtitle">Choose the plan that best fits your study needs.</p>

        {/* Billing toggle */}
        <div className="billing-switch-container">
          <span className={`switch-label ${!billingYearly ? "active" : ""}`}>Monthly</span>

          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={billingYearly}
              onChange={handleBillingToggle}
            />
            <span className="toggle-slider"></span>
          </label>

          <span className={`switch-label ${billingYearly ? "active" : ""}`}>
            Yearly
            <span className="save-pill">Save 20%</span>
          </span>
        </div>

        {/* Pricing card with animation trigger */}
        <div
          className={`pricing-card ${billingYearly ? "yearly-mode" : "monthly-mode"}`}
          key={billingYearly ? "yearly" : "monthly"} // forces re-mount for animation
        >
          <div className="card-header">
            <h3 className="plan-title">Premium</h3>
            <span className="badge-recommended">Recommended</span>
          </div>

          <div className="price-block">
            <span className="currency">$</span>
            <span className="amount">{billingYearly ? "49" : "4.99"}</span>
            <span className="billing-period">/{billingYearly ? "yr" : "mo"}</span>
          </div>

          <ul className="feature-list">
            <li>Unlimited document uploads</li>
            <li>Unlimited quiz generations</li>
            <li>Up to 40 questions per quiz</li>
            <li>Instant answer feedback</li>
            <li>Performance tracking & insights</li>
            <li>View source during quizzes</li>
            <li>Export quiz & study data</li>
            <li>Priority email support</li>
            <li>Unlimited flashcard decks (40 cards each)</li>
          </ul>

          <div className="limits-section">
            <div className="limit-row">
              <span>Max file size</span>
              <span>10 MB / document</span>
            </div>
            <div className="limit-row">
              <span>Monthly quizzes</span>
              <span>Unlimited</span>
            </div>
          </div>

          <button className="start-button">Get Started</button>
        </div>
      </div>
    </section>
  );
}