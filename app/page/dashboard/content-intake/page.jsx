"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveFlashcards } from "../store-flahscard/page";
import { saveQuiz } from "@/lib/quizStore";
import "./content-intake.css";

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "#ef4444", label: "PDF"  },
  doc:  { icon: "📝", color: "#3b82f6", label: "DOC"  },
  docx: { icon: "📝", color: "#3b82f6", label: "DOCX" },
  ppt:  { icon: "📊", color: "#f97316", label: "PPT"  },
  pptx: { icon: "📊", color: "#f97316", label: "PPTX" },
  txt:  { icon: "📃", color: "#a78bfa", label: "TXT"  },
  md:   { icon: "✦",  color: "#a78bfa", label: "MD"   },
};

function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: "📁", color: "#6b7280", label: ext.toUpperCase() };
}

function formatSize(bytes) {
  if (bytes < 1024)    return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function FloatingOrbs() {
  return (
    <div className="ci-orbs" aria-hidden="true">
      {[...Array(6)].map((_, i) => <div key={i} className={`ci-orb ci-orb--${i + 1}`} />)}
    </div>
  );
}

export default function ContentIntake() {
  const router = useRouter();
  const inputRef = useRef();

  const [inputMode,   setInputMode]   = useState("file"); // "file" | "text"
  const [pastedText,  setPastedText]  = useState("");
  const [files,       setFiles]       = useState([]);
  const [rawFiles,    setRawFiles]    = useState([]);
  const [numCards,    setNumCards]    = useState(10);
  const [drag,        setDrag]        = useState(false);
  const [dragCount,   setDragCount]   = useState(0);
  const [generating,  setGenerating]  = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [done,        setDone]        = useState(false);
  const [cardCount,   setCardCount]   = useState(0);
  const [error,       setError]       = useState("");

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setDragCount((c) => { if (c === 0) setDrag(true); return c + 1; });
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragCount((c) => { const n = c - 1; if (n === 0) setDrag(false); return n; });
  }, []);
  const handleDragOver  = useCallback((e) => { e.preventDefault(); }, []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault(); setDrag(false); setDragCount(0);
    addFiles(e.dataTransfer.files);
  }, []);

  const addFiles = (incoming) => {
    const arr  = Array.from(incoming);
    const meta = arr.map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, size: formatSize(f.size), ...getFileType(f.name) }));
    setFiles((prev) => [...prev, ...meta]);
    setRawFiles((prev) => [...prev, ...arr]);
    setDone(false); setError("");
  };

  const removeFile = (id) => {
    const idx = files.findIndex((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setRawFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setFiles([]); setRawFiles([]);
    setPastedText("");
    setDone(false); setError("");
  };
  const openPicker = () => inputRef.current?.click();

  const handleGenerate = async () => {
    setError(""); setGenerating(true); setGenProgress(0);
    let p = 0;
    const ticker = setInterval(() => { p += Math.random() * 10 + 3; setGenProgress(Math.min(p, 87)); }, 280);

    try {
      let combined = "", fileNames = "";

      if (inputMode === "text") {
        combined  = pastedText.trim();
        fileNames = "Pasted text";
        if (!combined) throw new Error("Please paste some text content first.");
      } else {
        for (const file of rawFiles) {
          const text = await file.text();
          combined  += (combined ? "\n\n" : "") + text;
          fileNames += (fileNames ? ", " : "") + file.name;
        }
        if (!combined.trim()) throw new Error("Files appear to be empty or unreadable.");
      }

      const res  = await fetch("/api/generate-flashcards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: combined, fileNames, numCards }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      saveFlashcards(data.flashcards, { fileNames, numCards, topic: fileNames });
      if (data.quiz) saveQuiz(data.quiz, { fileNames, topic: fileNames });

      clearInterval(ticker);
      setGenProgress(100);
      await new Promise((r) => setTimeout(r, 500));
      setDone(true); setCardCount(data.count);
    } catch (e) {
      clearInterval(ticker); setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = inputMode === "text"
    ? pastedText.trim().length > 0
    : files.length > 0;

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Content Intake</h1>
          <p>Input once · recall repeatedly · master anything</p>
        </div>
      </div>

      <div className="page ci-page">
        <div className="ci-hero">
          <div className="ci-hero-eyebrow">Powered by GPT-4o</div>
          <h2 className="ci-hero-title">
            Drop your study material.<br />
            <span className="ci-hero-accent">Get flashcards &amp; quiz instantly.</span>
          </h2>
          <p className="ci-hero-sub">
            Upload files or paste text. We generate flashcards + a full quiz automatically.
          </p>
        </div>

        {!done ? (
          <>
            {/* ── Mode tabs ── */}
            <div className="ci-mode-tabs">
              <button
                className={`ci-mode-tab ${inputMode === "file" ? "ci-mode-tab--active" : ""}`}
                onClick={() => setInputMode("file")}
              >
                <span>📁</span> Upload Files
              </button>
              <button
                className={`ci-mode-tab ${inputMode === "text" ? "ci-mode-tab--active" : ""}`}
                onClick={() => setInputMode("text")}
              >
                <span>✏️</span> Paste Text
              </button>
            </div>

            {/* ── File upload mode ── */}
            {inputMode === "file" && (
              <>
                <div
                  className={`ci-dropzone ${drag ? "ci-dropzone--active" : ""} ${files.length ? "ci-dropzone--has-files" : ""}`}
                  onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  onClick={files.length === 0 ? openPicker : undefined}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openPicker()}
                >
                  <input ref={inputRef} type="file" multiple accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx"
                    style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  <FloatingOrbs />
                  {files.length === 0 ? (
                    <div className="ci-drop-empty">
                      <div className="ci-drop-icon-ring">
                        <svg className="ci-drop-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 4v12M6 10l6-6 6 6"/><path d="M4 20h16"/>
                        </svg>
                      </div>
                      <div className="ci-drop-title">{drag ? "Release to upload" : "Drag & drop your files here"}</div>
                      <div className="ci-drop-subtitle">or <button className="ci-drop-browse-link" onClick={(e) => { e.stopPropagation(); openPicker(); }}>browse files</button> from your computer</div>
                      <div className="ci-drop-formats">
                        {["PDF","DOCX","PPTX","TXT","MD"].map((f) => <span key={f} className="ci-format-chip">{f}</span>)}
                      </div>
                      <div className="ci-drop-generates">
                        <span className="ci-generates-chip">🃏 Flashcards</span>
                        <span className="ci-generates-chip">📝 MCQ</span>
                        <span className="ci-generates-chip">✓✗ True / False</span>
                        <span className="ci-generates-chip">💬 Short Answer</span>
                      </div>
                    </div>
                  ) : (
                    <div className="ci-files-grid">
                      {files.map((f) => (
                        <div key={f.id} className="ci-file-card" style={{ "--fc": f.color }}>
                          <div className="ci-file-card-top">
                            <span className="ci-file-ext-badge">{f.label}</span>
                            <button className="ci-file-remove" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>✕</button>
                          </div>
                          <div className="ci-file-icon">{f.icon}</div>
                          <div className="ci-file-name" title={f.name}>{f.name}</div>
                          <div className="ci-file-size">{f.size}</div>
                        </div>
                      ))}
                      <button className="ci-add-more-tile" onClick={(e) => { e.stopPropagation(); openPicker(); }}>
                        <span className="ci-add-more-icon">+</span><span>Add more</span>
                      </button>
                    </div>
                  )}
                  {drag && <div className="ci-drag-overlay" />}
                </div>

                {files.length > 0 && (
                  <div className="ci-config-row">
                    <div className="ci-config-left">
                      <div className="ci-config-item">
                        <span className="ci-config-label">Files selected</span>
                        <span className="ci-config-value">{files.length}</span>
                      </div>
                      <button className="ci-clear-btn" onClick={clearAll}>Clear all</button>
                    </div>
                    <div className="ci-config-right">
                      <span className="ci-config-label">Flashcards to generate</span>
                      <div className="ci-stepper">
                        <button className="ci-stepper-btn" onClick={() => setNumCards((n) => Math.max(3, n - 1))}>−</button>
                        <span className="ci-stepper-val">{numCards}</span>
                        <button className="ci-stepper-btn" onClick={() => setNumCards((n) => Math.min(30, n + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Text paste mode ── */}
            {inputMode === "text" && (
              <div className="ci-text-panel">
                <textarea
                  className="ci-text-area"
                  placeholder="Paste your notes, textbook content, lecture slides text, or anything you want to study…"
                  value={pastedText}
                  onChange={(e) => { setPastedText(e.target.value); setDone(false); setError(""); }}
                  rows={14}
                />
                <div className="ci-text-footer">
                  <span className="ci-text-meta">
                    {wordCount > 0
                      ? `${wordCount} words · ${pastedText.length} characters`
                      : "Start typing or paste your content above"}
                  </span>
                  <div className="ci-config-right">
                    <span className="ci-config-label">Flashcards to generate</span>
                    <div className="ci-stepper">
                      <button className="ci-stepper-btn" onClick={() => setNumCards((n) => Math.max(3, n - 1))}>−</button>
                      <span className="ci-stepper-val">{numCards}</span>
                      <button className="ci-stepper-btn" onClick={() => setNumCards((n) => Math.min(30, n + 1))}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Generate button ── */}
            {canGenerate && !generating && (
              <button className="ci-generate-btn" onClick={handleGenerate}>
                <span className="ci-generate-btn-icon">⚡</span>
                Generate Flashcards + Quiz
                <span className="ci-generate-btn-arrow">→</span>
              </button>
            )}

            {generating && (
              <div className="ci-loading-block">
                <div className="ci-loading-header">
                  <div className="ci-loading-dots"><span /><span /><span /></div>
                  <span className="ci-loading-label">Generating flashcards + MCQ + True/False + Short Answer…</span>
                </div>
                <div className="ci-progress-track">
                  <div className="ci-progress-fill" style={{ width: `${genProgress}%` }}>
                    <div className="ci-progress-glow" />
                  </div>
                </div>
                <div className="ci-progress-pct">{Math.round(genProgress)}%</div>
              </div>
            )}

            {error && <div className="ci-error-box"><span className="ci-error-icon">⚠</span>{error}</div>}
          </>
        ) : (
          <div className="ci-success-state">
            <div className="ci-success-burst">
              <div className="ci-success-ring ci-success-ring--1" />
              <div className="ci-success-ring ci-success-ring--2" />
              <div className="ci-success-ring ci-success-ring--3" />
              <div className="ci-success-checkmark">✓</div>
            </div>
            <h3 className="ci-success-title">Study material ready!</h3>
            <p className="ci-success-sub">{cardCount} flashcards · 15 quiz questions generated</p>
            <div className="ci-success-cards-row">
              <div className="ci-success-type-card" onClick={() => router.push("/page/dashboard/flashcard")}>
                <span className="ci-stc-icon">🃏</span>
                <span className="ci-stc-label">Flashcards</span>
                <span className="ci-stc-count">{cardCount} cards</span>
              </div>
              <div className="ci-success-type-card" onClick={() => router.push("/page/dashboard/quiz")}>
                <span className="ci-stc-icon">📝</span>
                <span className="ci-stc-label">Quiz</span>
                <span className="ci-stc-count">15 questions</span>
              </div>
            </div>
            <div className="ci-success-actions">
              <button className="ci-generate-btn" onClick={() => router.push("/page/dashboard/quiz")}>
                <span className="ci-generate-btn-icon">🧠</span>Take the Quiz<span className="ci-generate-btn-arrow">→</span>
              </button>
              <button className="ci-outline-btn" onClick={() => router.push("/page/dashboard/flashcard")}>🃏 Study Flashcards</button>
              <button className="ci-text-btn" onClick={clearAll}>Upload new content</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}