"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  loadQuiz,
  loadQuizProgress,
  saveMCQAnswer,
  saveTFAnswer,
  saveSAAnswer,
  computeQuizStats,
  clearQuizProgress,
} from "@/lib/quizStore";
import "./quiz.css";

// ── Section config ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "mcq", label: "Multiple Choice", icon: "📝", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  { id: "tf",  label: "True / False",    icon: "✓✗",  color: "#38bdf8", bg: "rgba(56,189,248,0.1)"  },
  { id: "sa",  label: "Short Answer",    icon: "💬", color: "#fb923c", bg: "rgba(251,146,60,0.1)"   },
];

// ── Accuracy scorer for short answers (keyword matching) ──────────────────

function scoreShortAnswer(userAnswer, keyPoints) {
  if (!userAnswer.trim()) return 0;
  const ua   = userAnswer.toLowerCase();
  const hits = keyPoints.filter((kp) => {
    const words = kp.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return words.some((w) => ua.includes(w));
  });
  return Math.round((hits.length / Math.max(keyPoints.length, 1)) * 100);
}

export default function QuizPage() {
  const router = useRouter();

  const [quiz,      setQuiz]      = useState(null);
  const [progress,  setProgress]  = useState({ mcq: {}, tf: {}, sa: {} });
  const [stats,     setStats]     = useState(null);
  const [activeTab, setActiveTab] = useState("mcq");
  const [saInputs,  setSaInputs]  = useState({});   // {id: text}
  const [revealed,  setRevealed]  = useState({});   // {id: true} — SA revealed
  const [animate,   setAnimate]   = useState(null); // id of last answered
  const [started,   setStarted]   = useState(false); // Quiz started state
  const sectionRef = useRef(null);

  useEffect(() => {
    const stored = loadQuiz();
    const prog   = loadQuizProgress();
    if (stored?.quiz) {
      setQuiz(stored.quiz);
      setProgress(prog);
      setStats(computeQuizStats(stored.quiz, prog));
      
      // Auto-start if there's already progress
      const hasProgress = Object.keys(prog.mcq).length > 0 || 
                         Object.keys(prog.tf).length > 0 || 
                         Object.keys(prog.sa).length > 0;
      if (hasProgress) {
        setStarted(true);
      }
    }
  }, []);

  // ── Answer handlers ───────────────────────────────────────────────────────

  const handleMCQ = (q, selected) => {
    if (progress.mcq[q.id]) return;
    const correct = selected.startsWith(q.correct);
    const updated = saveMCQAnswer(q.id, selected, correct);
    setProgress(updated);
    setStats(computeQuizStats(quiz, updated));
    setAnimate(q.id);
  };

  const handleTF = (q, selected) => {
    if (progress.tf[q.id] !== undefined) return;
    const correct = selected === q.correct;
    const updated = saveTFAnswer(q.id, selected, correct);
    setProgress(updated);
    setStats(computeQuizStats(quiz, updated));
    setAnimate(q.id);
  };

  const handleSASubmit = (q) => {
    const answer = (saInputs[q.id] || "").trim();
    if (!answer || progress.sa[q.id]) return;
    const score   = scoreShortAnswer(answer, q.keyPoints || []);
    const updated = saveSAAnswer(q.id, answer, score);
    setProgress(updated);
    setStats(computeQuizStats(quiz, updated));
    setRevealed((prev) => ({ ...prev, [q.id]: true }));
    setAnimate(q.id);
  };

  const handleReset = () => {
    if (!confirm("Reset all quiz progress?")) return;
    clearQuizProgress();
    const fresh = { mcq: {}, tf: {}, sa: {} };
    setProgress(fresh);
    setRevealed({});
    setSaInputs({});
    setStats(computeQuizStats(quiz, fresh));
    setStarted(false);
  };

  // ── Empty state (no quiz) ─────────────────────────────────────────────────

  if (!quiz) return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>Quiz</h1><p>Test your knowledge</p></div>
      </div>
      <div className="page qz-empty-page">
        <div className="qz-empty-card">
          <span className="qz-empty-icon">🧠</span>
          <h2>No quiz yet</h2>
          <p>Upload study material from Content Intake to generate a quiz automatically.</p>
          <button className="qz-cta-btn" onClick={() => router.push("/page/dashboard/content-intake")}>
            Go to Content Intake →
          </button>
        </div>
      </div>
    </>
  );

  // ── Quiz ready screen (show before starting) ──────────────────────────────

  const mcqTotal = quiz.mcq?.length         || 0;
  const tfTotal  = quiz.trueFalse?.length   || 0;
  const saTotal  = quiz.shortAnswer?.length || 0;
  const total    = mcqTotal + tfTotal + saTotal;

  if (!started) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left"><h1>Quiz</h1><p>Your quiz is ready</p></div>
        </div>
        <div className="page qz-empty-page">
          <div className="qz-ready-card">
            <div className="qz-ready-icon">✨</div>
            <h2 className="qz-ready-title">Quiz Ready!</h2>
            <p className="qz-ready-subtitle">
              {total} questions generated and ready to test your knowledge
            </p>

            <div className="qz-ready-breakdown">
              <div className="qz-ready-stat">
                <span className="qz-rs-icon">📝</span>
                <span className="qz-rs-label">Multiple Choice</span>
                <span className="qz-rs-count">{mcqTotal} questions</span>
              </div>
              <div className="qz-ready-stat">
                <span className="qz-rs-icon">✓✗</span>
                <span className="qz-rs-label">True / False</span>
                <span className="qz-rs-count">{tfTotal} questions</span>
              </div>
              <div className="qz-ready-stat">
                <span className="qz-rs-icon">💬</span>
                <span className="qz-rs-label">Short Answer</span>
                <span className="qz-rs-count">{saTotal} questions</span>
              </div>
            </div>

            <button 
              className="qz-cta-btn qz-start-btn" 
              onClick={() => setStarted(true)}
            >
              Start Quiz →
            </button>

            <button 
              className="qz-ghost-btn qz-secondary-link" 
              onClick={() => router.push("/page/dashboard/flashcard")}
            >
              🃏 Study Flashcards First
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Main quiz view (after start button clicked) ───────────────────────────

  const scoreColor = (s) => s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444";

  const mcqDone  = Object.keys(progress.mcq).length;
  const tfDone   = Object.keys(progress.tf).length;
  const saDone   = Object.keys(progress.sa).length;
  const answered = mcqDone + tfDone + saDone;
  const overallPct = total === 0 ? 0 : Math.round((answered / total) * 100);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Quiz</h1>
          <p>{answered} of {total} answered · score {stats?.overallScore ?? 0}%</p>
        </div>
        <div className="topbar-right">
          <button className="qz-ghost-btn" onClick={() => router.push("/page/dashboard/flashcard")}>🃏 Flashcards</button>
          <button className="qz-ghost-btn" onClick={handleReset}>↺ Reset</button>
        </div>
      </div>

      <div className="page qz-page">

        {/* ── Master progress bar ── */}
        <div className="qz-master-progress">
          <div className="qz-mp-header">
            <span className="qz-mp-title">Overall Progress</span>
            <span className="qz-mp-pct">{overallPct}%</span>
          </div>
          <div className="qz-mp-track">
            <div className="qz-mp-fill" style={{ width: `${overallPct}%` }}>
              {overallPct > 5 && <div className="qz-mp-glow" />}
            </div>
          </div>

          {/* Section progress pills */}
          <div className="qz-section-pills">
            {SECTIONS.map((s) => {
              const done  = s.id === "mcq" ? mcqDone  : s.id === "tf" ? tfDone  : saDone;
              const tot   = s.id === "mcq" ? mcqTotal : s.id === "tf" ? tfTotal : saTotal;
              const pct   = tot === 0 ? 0 : Math.round((done / tot) * 100);
              return (
                <div
                  key={s.id}
                  className={`qz-pill ${activeTab === s.id ? "qz-pill--active" : ""}`}
                  style={{ "--sc": s.color, "--sbg": s.bg }}
                  onClick={() => setActiveTab(s.id)}
                >
                  <span className="qz-pill-icon">{s.icon}</span>
                  <span className="qz-pill-label">{s.label}</span>
                  <div className="qz-pill-track">
                    <div className="qz-pill-fill" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <span className="qz-pill-count">{done}/{tot}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Score summary ── */}
        {answered > 0 && (
          <div className="qz-score-strip">
            {[
              { label: "MCQ Accuracy", val: mcqDone === 0 ? "—" : `${Math.round((Object.values(progress.mcq).filter(v=>v.correct).length / mcqDone) * 100)}%`, color: "#a78bfa" },
              { label: "T/F Accuracy", val: tfDone  === 0 ? "—" : `${Math.round((Object.values(progress.tf).filter(v=>v.correct).length  / tfDone)  * 100)}%`, color: "#38bdf8" },
              { label: "Avg SA Score", val: saDone  === 0 ? "—" : `${Math.round(Object.values(progress.sa).reduce((a,v)=>a+(v.score||0),0) / saDone)}%`,       color: "#fb923c" },
              { label: "Overall",      val: `${stats?.overallScore ?? 0}%`, color: scoreColor(stats?.overallScore ?? 0) },
            ].map((s) => (
              <div key={s.label} className="qz-score-chip">
                <span className="qz-score-val" style={{ color: s.color }}>{s.val}</span>
                <span className="qz-score-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab content ── */}
        <div className="qz-tab-content" ref={sectionRef}>

          {/* ── MCQ ── */}
          {activeTab === "mcq" && (
            <div className="qz-section">
              <div className="qz-section-head">
                <div className="qz-section-icon" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>📝</div>
                <div>
                  <h2 className="qz-section-title">Multiple Choice</h2>
                  <p className="qz-section-sub">Select the best answer for each question</p>
                </div>
              </div>
              <div className="qz-questions">
                {quiz.mcq?.map((q, qi) => {
                  const ans    = progress.mcq[q.id];
                  const locked = !!ans;
                  return (
                    <div key={q.id} className={`qz-question-card ${animate === q.id ? "qz-question-card--pop" : ""}`}>
                      <div className="qz-q-header">
                        <span className="qz-q-num">Q{qi + 1}</span>
                        {locked && (
                          <span className={`qz-result-badge ${ans.correct ? "qz-result-badge--correct" : "qz-result-badge--wrong"}`}>
                            {ans.correct ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <p className="qz-q-text">{q.question}</p>
                      <div className="qz-options">
                        {q.options?.map((opt, oi) => {
                          const letter     = opt.charAt(0);
                          const isSelected = ans?.selected?.charAt(0) === letter;
                          const isCorrect  = letter === q.correct;
                          let state = "";
                          if (locked) {
                            if (isCorrect)       state = "correct";
                            else if (isSelected) state = "wrong";
                            else                 state = "dim";
                          }
                          return (
                            <button
                              key={oi}
                              className={`qz-option qz-option--${state || "idle"}`}
                              onClick={() => handleMCQ(q, opt)}
                              disabled={locked}
                            >
                              <span className="qz-option-letter">{letter}</span>
                              <span className="qz-option-text">{opt.slice(3)}</span>
                              {locked && isCorrect  && <span className="qz-option-tick">✓</span>}
                              {locked && isSelected && !isCorrect && <span className="qz-option-tick">✗</span>}
                            </button>
                          );
                        })}
                      </div>
                      {locked && q.explanation && (
                        <div className="qz-explanation">
                          <span className="qz-exp-icon">💡</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── True / False ── */}
          {activeTab === "tf" && (
            <div className="qz-section">
              <div className="qz-section-head">
                <div className="qz-section-icon" style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>✓✗</div>
                <div>
                  <h2 className="qz-section-title">True / False</h2>
                  <p className="qz-section-sub">Is each statement true or false?</p>
                </div>
              </div>
              <div className="qz-questions qz-questions--tf">
                {quiz.trueFalse?.map((q, qi) => {
                  const ans    = progress.tf[q.id];
                  const locked = ans !== undefined;
                  return (
                    <div key={q.id} className={`qz-question-card qz-question-card--tf ${animate === q.id ? "qz-question-card--pop" : ""}`}>
                      <div className="qz-q-header">
                        <span className="qz-q-num">{qi + 1}</span>
                        {locked && (
                          <span className={`qz-result-badge ${ans.correct ? "qz-result-badge--correct" : "qz-result-badge--wrong"}`}>
                            {ans.correct ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <p className="qz-q-text qz-q-text--statement">"{q.statement}"</p>
                      <div className="qz-tf-row">
                        {[true, false].map((val) => {
                          const label   = val ? "True" : "False";
                          const isAns   = ans?.selected === val;
                          const isRight = q.correct === val;
                          let state = "idle";
                          if (locked) {
                            if (isRight)    state = "correct";
                            else if (isAns) state = "wrong";
                            else            state = "dim";
                          }
                          return (
                            <button
                              key={label}
                              className={`qz-tf-btn qz-tf-btn--${state}`}
                              onClick={() => handleTF(q, val)}
                              disabled={locked}
                            >
                              <span className="qz-tf-icon">{val ? "✓" : "✗"}</span>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {locked && q.explanation && (
                        <div className="qz-explanation">
                          <span className="qz-exp-icon">💡</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Short Answer ── */}
          {activeTab === "sa" && (
            <div className="qz-section">
              <div className="qz-section-head">
                <div className="qz-section-icon" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>💬</div>
                <div>
                  <h2 className="qz-section-title">Short Answer</h2>
                  <p className="qz-section-sub">Write your answer — scored by keyword accuracy</p>
                </div>
              </div>
              <div className="qz-questions">
                {quiz.shortAnswer?.map((q, qi) => {
                  const ans      = progress.sa[q.id];
                  const locked   = !!ans;
                  const isReveal = revealed[q.id] || locked;
                  const score    = ans?.score ?? null;
                  return (
                    <div key={q.id} className={`qz-question-card ${animate === q.id ? "qz-question-card--pop" : ""}`}>
                      <div className="qz-q-header">
                        <span className="qz-q-num">Q{qi + 1}</span>
                        {locked && score !== null && (
                          <span
                            className="qz-sa-score-badge"
                            style={{ color: scoreColor(score), borderColor: `${scoreColor(score)}44`, background: `${scoreColor(score)}18` }}
                          >
                            {score}% match
                          </span>
                        )}
                      </div>
                      <p className="qz-q-text">{q.question}</p>

                      <textarea
                        className={`qz-sa-textarea ${locked ? "qz-sa-textarea--locked" : ""}`}
                        placeholder="Type your answer here…"
                        value={locked ? ans.answer : (saInputs[q.id] || "")}
                        onChange={(e) => !locked && setSaInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        disabled={locked}
                        rows={3}
                      />

                      {!locked && (
                        <button
                          className="qz-sa-submit"
                          onClick={() => handleSASubmit(q)}
                          disabled={!(saInputs[q.id] || "").trim()}
                        >
                          Submit Answer →
                        </button>
                      )}

                      {isReveal && (
                        <div className="qz-sa-reveal">
                          <div className="qz-sa-reveal-label">Model Answer</div>
                          <p className="qz-sa-model-answer">{q.modelAnswer}</p>
                          {q.keyPoints?.length > 0 && (
                            <div className="qz-sa-keypoints">
                              <span className="qz-sa-kp-label">Key points:</span>
                              {q.keyPoints.map((kp, i) => {
                                const ua    = (ans?.answer || "").toLowerCase();
                                const words = kp.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
                                const hit   = words.some((w) => ua.includes(w));
                                return (
                                  <span key={i} className={`qz-kp-chip ${hit ? "qz-kp-chip--hit" : "qz-kp-chip--miss"}`}>
                                    {hit ? "✓" : "✗"} {kp}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Bottom nav ── */}
        <div className="qz-bottom-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`qz-bottom-btn ${activeTab === s.id ? "qz-bottom-btn--active" : ""}`}
              style={{ "--sc": s.color }}
              onClick={() => setActiveTab(s.id)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

      </div>
    </>
  );
}