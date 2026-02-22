"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

export function useUserStats() {

  const user = auth.currentUser;

  const [stats, setStats] = useState({
    cardsReviewed: 0,
    dayStreak: 0,
    mastered: 0,
    readiness: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setStats({
        cardsReviewed: 0,
        dayStreak: 0,
        mastered: 0,
        readiness: 0,
        loading: false
      });
      return;
    }

    const userStatsRef = doc(db, "userStats", user.uid);

    const unsubscribe = onSnapshot(
      userStatsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          const totalCards = data.totalCards || 0;
          const masteredCards = data.masteredCards || 0;

          const readinessPercent =
            totalCards > 0
              ? Math.round((masteredCards / totalCards) * 100)
              : 0;

          const lastStudyDate = data.lastStudyDate?.toDate();
          const dayStreak = calculateStreak(
            lastStudyDate,
            data.currentStreak || 0
          );

          setStats({
            cardsReviewed: data.cardsReviewedToday || 0,
            dayStreak,
            mastered: masteredCards,
            readiness: readinessPercent,
            loading: false
          });
        } else {
          setStats({
            cardsReviewed: 0,
            dayStreak: 0,
            mastered: 0,
            readiness: 0,
            loading: false
          });
        }
      },
      (error) => {
        console.error("Error fetching user stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  return stats;
}

// Helper function
function calculateStreak(lastStudyDate, currentStreak) {
  if (!lastStudyDate) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastStudy = new Date(
    lastStudyDate.getFullYear(),
    lastStudyDate.getMonth(),
    lastStudyDate.getDate()
  );

  const diffTime = today - lastStudy;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak;

  return 0;
}