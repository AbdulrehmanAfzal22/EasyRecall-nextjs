"use client";
import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";
import "./dash-home/dashboard.css";
import { useAuth } from "../AuthProvider.jsx";
import { useRouter, useSearchParams } from "next/navigation";

const PLAN_FLAG_KEY = "er_plan_paid";

const OWNER_EMAILS = [
  "musa@gmail.com",
];

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDark, setIsDark] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  /* ─────────────────────────────────────────────
     1️⃣ Redirect if not logged in
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  /* ─────────────────────────────────────────────
     2️⃣ Detect theme
  ───────────────────────────────────────────── */
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  /* ─────────────────────────────────────────────
     3️⃣ Check Subscription
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && user) {
      const checkSubscription = async () => {
        let paid = false;

        const isOwner = OWNER_EMAILS.includes(user.email?.toLowerCase());
        if (isOwner) {
          setHasActivePlan(true);
          setShowUpgradeModal(false);
          return;
        }

        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("../../../lib/firebase");
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const subData = userSnap.data().subscription;
            if (subData?.status === "active") {
              paid = true;
            }
          }
        } catch (err) {
          console.warn("Subscription check failed:", err);
        }

        // Fallback localStorage
        if (!paid) {
          paid = localStorage.getItem(PLAN_FLAG_KEY) === "true";
        }

        setHasActivePlan(paid);
        setShowUpgradeModal(!paid);
      };

      checkSubscription();
    }
  }, [loading, user]);

  /* ─────────────────────────────────────────────
     4️⃣ Handle SkipCash Success
  ───────────────────────────────────────────── */
  useEffect(() => {
    const status = searchParams.get("skipcash_status");
    const plan = searchParams.get("plan") || "monthly";

    if (status === "success" && user?.uid) {
      console.log("💳 PAYMENT SUCCESS", { userId: user.uid, plan });

      localStorage.setItem(PLAN_FLAG_KEY, "true");
      localStorage.setItem("payment_just_completed", "true");

      fetch("/api/reset-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          plan,
        }),
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ Usage Reset:", data);

          // Clean URL without reload
          router.replace("/page/dashboard/dash-home");
        })
        .catch(err => {
          console.error("Reset failed:", err);
          router.replace("/page/dashboard/dash-home");
        });
    }
  }, [searchParams, user?.uid, router]);

  /* ─────────────────────────────────────────────
     5️⃣ Lock Scroll if Modal Open
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (showUpgradeModal && !hasActivePlan) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showUpgradeModal, hasActivePlan]);

  /* ─────────────────────────────────────────────
     Theme Toggle
  ───────────────────────────────────────────── */
  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;

    if (newIsDark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    setIsDark(newIsDark);
  };

  const handleUpgradeClick = () => {
    router.push("/page/pricing");
  };

  return (
    <div className={`dashboard-wrapper ${isDark ? "dark" : "light"}`}>
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="dashboard-content">
        {children}
      </main>

      {showUpgradeModal && !hasActivePlan && (
        <div className="upgrade-overlay">
          <div className="upgrade-modal">
            <h2 className="upgrade-title">
              Upgrade your plan to use EasyRecall
            </h2>
            <p className="upgrade-text">
              Your account is created, but you need to activate a paid plan
              before you can access dashboard features.
            </p>

            <button className="upgrade-btn" onClick={handleUpgradeClick}>
              Upgrade plan to continue
            </button>

            <button
              className="upgrade-back-btn"
              onClick={() => router.push("/")}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}