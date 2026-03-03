"use client";
import { useState, useEffect } from "react";
import Sidebar from "./sidebar/page";
import "./layout-sidebar.css";
import "./dash-home/dashboard.css";
import { useAuth } from "../AuthProvider.jsx";
import { useRouter } from "next/navigation";

const PLAN_FLAG_KEY = "er_plan_paid";

const OWNER_EMAILS = [
  "musa@gmail.com",
  // add more owner/admin emails here if needed
];

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const isOwner = OWNER_EMAILS.includes(user.email?.toLowerCase());
      if (isOwner) {
        setHasActivePlan(true);
        setShowUpgradeModal(false);
        return;
      }
      let paid = false;
      try {
        // First check Firebase subscription
        const checkSubscription = async () => {
          try {
            const { doc: firebaseDoc, getDoc } = await import("firebase/firestore");
            const { db } = await import("../../../lib/firebase");
            const userRef = firebaseDoc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const subData = userSnap.data().subscription;
              if (subData && subData.status === 'active') {
                paid = true;
              }
            }
          } catch (err) {
            console.warn("Could not fetch subscription from Firebase:", err);
          }

          // Fallback to localStorage
          if (!paid) {
            paid = localStorage.getItem(PLAN_FLAG_KEY) === "true";
          }

          setHasActivePlan(paid);
          setShowUpgradeModal(!paid);
        };
        
        checkSubscription();
      } catch {
        paid = false;
        setHasActivePlan(false);
        setShowUpgradeModal(true);
      }
    }
  }, [loading, user]);
  
  // If user is redirected back from SkipCash with a success flag, mark paid and clean URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('skipcash_status');
      const plan = params.get('plan') || 'monthly';
      if (status === 'success' && user?.uid) {
        console.log('💳 PAYMENT SUCCESS - Resetting usage immediately', { userId: user.uid, plan });
        
        try { localStorage.setItem(PLAN_FLAG_KEY, 'true'); } catch {}
        // Set flag that payment just happened - child pages will detect this
        try { localStorage.setItem('payment_just_completed', 'true'); } catch {}
        
        // IMMEDIATELY reset usage - don't wait for webhook
        fetch('/api/reset-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            plan: plan,
          }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('✅ DEBUG: Usage reset response:', data);
            // Force a quick refresh to show updated usage
            setTimeout(() => {
              window.location.href = '/page/dashboard';
            }, 500);
          })
          .catch(err => {
            console.error('❌ ERROR resetting usage:', err);
            // Still navigate even if reset failed
            setTimeout(() => {
              window.location.href = '/page/dashboard';
            }, 500);
          });
        
        return; // Exit early to let the redirect happen
      }
    } catch (err) {
      console.error('Dashboard payment detection error:', err);
    }
  }, [router, user?.uid]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showUpgradeModal && !hasActivePlan) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showUpgradeModal, hasActivePlan]);

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

      {/*
        ✅ Overlay lives here — OUTSIDE <main> — so that
        overflow:auto on .dashboard-content does NOT create
        a stacking context that traps position:fixed children.
      */}
      {showUpgradeModal && !hasActivePlan && (
        <div className="upgrade-overlay">
          <div className="upgrade-modal">
            <h2 className="upgrade-title">Upgrade your plan to use EasyRecall</h2>
            <p className="upgrade-text">
              Your account is created, but you need to activate a paid plan
              before you can access the dashboard features.
            </p>
            <button className="upgrade-btn" onClick={handleUpgradeClick}>
  Upgrade plan to continue
</button>
<button className="upgrade-back-btn" onClick={() => router.push("/")}>
  ← Back to Home
</button>
          </div>
        </div>
      )}
    </div>
  );
}