"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import "./flashcard.css";

export default function Flashcard() {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("generatedFlashcards");
    if (stored) {
      try {
        const cards = JSON.parse(stored);
        setFlashcards(cards);
      } catch (e) {
        console.error("Error loading flashcards:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 20 }}>
        <div>No flashcards yet. Generate some from the content intake!</div>
        <Link href="/page/dashboard/content-intake">
          <button style={{
            padding: "10px 20px",
            backgroundColor: "#4a5f8f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}>
            Go to Content Intake
          </button>
        </Link>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <div className="fc-wrapper">
      {/* TOPBAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        borderBottom: "1px solid #eee",
        backgroundColor: "#f8f9fb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/page/dashboard">
            <button style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              fontSize: "20px",
              padding: "8px",
            }}>
              <Home size={20} />
            </button>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              Flashcard Study
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
        </div>
        <button
          onClick={resetDeck}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            backgroundColor: "#f0f0f0",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            color: "#333",
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div style={{
        height: "4px",
        backgroundColor: "#eee",
        margin: "20px",
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          backgroundColor: "#4a5f8f",
          width: `${progress}%`,
          transition: "width 0.3s ease",
        }} />
      </div>

      {/* CARD CONTAINER */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "500px",
        padding: "40px 20px",
      }}>
        <div
          className={`fc-card ${flipped ? "is-flipped" : ""}`}
          style={{
            width: "100%",
            maxWidth: "700px",
            cursor: "pointer",
          }}
          onClick={() => setFlipped(!flipped)}
        >
          {/* FRONT */}
          <div className="fc-front">
            <div>
              <p className="fc-label">Question</p>
              <h2 className="fc-title">{currentCard.question}</h2>
            </div>
            <button
              className="fc-button"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
            >
              Reveal Answer
            </button>
          </div>

          {/* BACK */}
          <div className="fc-back">
            <div>
              <p className="fc-label">Answer</p>
              <h2 className="fc-title">{currentCard.answer}</h2>
            </div>
            <button
              className="fc-button"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(false);
              }}
            >
              Back to Question ↺
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
        borderTop: "1px solid #eee",
        backgroundColor: "#f8f9fb",
      }}>
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            backgroundColor: currentIndex === 0 ? "#e0e0e0" : "#4a5f8f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentIndex === 0 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <span style={{ fontSize: "14px", color: "#666" }}>
          {currentIndex + 1} / {flashcards.length}
        </span>

        <button
          onClick={nextCard}
          disabled={currentIndex === flashcards.length - 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            backgroundColor: currentIndex === flashcards.length - 1 ? "#e0e0e0" : "#4a5f8f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: currentIndex === flashcards.length - 1 ? "not-allowed" : "pointer",
            opacity: currentIndex === flashcards.length - 1 ? 0.5 : 1,
          }}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
