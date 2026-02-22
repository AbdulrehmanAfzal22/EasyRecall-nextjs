"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { loadDocuments, deleteDocument, formatDate } from "../../../../lib/service"; // ✅ fixed import
import "./document.css";

// ── Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS = {
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
  flash:    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  quiz:     "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4",
  trash:    "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  upload:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  grid:     "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  clock:    "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-14v4l3 3",
  chevron:  "M9 18l6-6-6-6",
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  book:     "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
};

const FILE_COLORS = {
  pdf: "#ef4444", docx: "#3b82f6", doc: "#3b82f6",
  pptx: "#f97316", ppt: "#f97316", txt: "#8b5cf6", md: "#8b5cf6",
};
const fileColor = (t) => FILE_COLORS[t?.toLowerCase()] ?? "#6b7280";

// ── Delete confirmation modal ─────────────────────────────────────────────
function DeleteModal({ doc, onConfirm, onCancel, deleting }) {
  return (
    <div className="dc-modal-backdrop" onClick={onCancel}>
      <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dc-modal-icon">
          <Icon d={ICONS.trash} size={22} />
        </div>
        <h3 className="dc-modal-title">Delete document?</h3>
        <p className="dc-modal-body">
          <strong>{doc.topic}</strong> and all its flashcards and quiz data will be permanently removed.
        </p>
        <div className="dc-modal-actions">
          <button className="dc-btn dc-btn-ghost" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="dc-btn dc-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expandable concept card ───────────────────────────────────────────────
function ConceptCard({ doc, onStudy, onQuiz, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const fc = fileColor(doc.fileType);

  // Extract key concepts from flashcards
  const concepts = doc.flashcards?.slice(0, expanded ? doc.flashcards.length : 3) ?? [];
  const hasMore   = (doc.flashcards?.length ?? 0) > 3;

  // Quiz summary
  const mcqCount  = doc.quiz?.mcq?.length         ?? 0;
  const tfCount   = doc.quiz?.trueFalse?.length    ?? 0;
  const saCount   = doc.quiz?.shortAnswer?.length  ?? 0;

  // Flashcard progress
  const progressDone  = doc.flashcardProgress ? Object.keys(doc.flashcardProgress).length : 0;
  const progressTotal = doc.flashcardCount || 0;
  const progressPct   = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

  return (
    <div className={`dc-concept-card ${expanded ? "dc-concept-card--expanded" : ""}`}>
      {/* ── Top accent bar ── */}
      <div className="dc-concept-accent" style={{ background: `linear-gradient(90deg, ${fc}, ${fc}88)` }} />

      {/* ── Header ── */}
      <div className="dc-concept-header" onClick={() => setExpanded((v) => !v)}>
        <div className="dc-concept-header-left">
          <div className="dc-file-badge" style={{ background: `${fc}18`, borderColor: `${fc}35`, color: fc }}>
            <Icon d={ICONS.file} size={12} />
            {(doc.fileType || "TXT").toUpperCase()}
          </div>
          <div>
            <h3 className="dc-concept-title">{doc.topic}</h3>
            <div className="dc-concept-meta">
              <span><Icon d={ICONS.clock} size={11} />{formatDate(doc.createdAt)}</span>
              <span>·</span>
              <span>{doc.flashcardCount ?? 0} flashcards</span>
              <span>·</span>
              <span>{mcqCount + tfCount + saCount} quiz Qs</span>
            </div>
          </div>
        </div>
        <div className="dc-concept-header-right">
          <button className="dc-card-delete" onClick={(e) => { e.stopPropagation(); onDelete(doc); }} title="Delete">
            <Icon d={ICONS.trash} size={14} />
          </button>
          <div className={`dc-chevron ${expanded ? "dc-chevron--open" : ""}`}>
            <Icon d={ICONS.chevron} size={16} />
          </div>
        </div>
      </div>

      {/* ── Progress bar (always visible) ── */}
      {progressTotal > 0 && (
        <div className="dc-mini-progress">
          <div className="dc-mini-progress-track">
            <div className="dc-mini-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="dc-mini-progress-label">{progressPct}% studied</span>
        </div>
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="dc-concept-body">

          {/* Key concepts from flashcards */}
          {concepts.length > 0 && (
            <div className="dc-concept-section">
              <div className="dc-concept-section-title">
                <Icon d={ICONS.key} size={13} /> Key Concepts
              </div>
              <div className="dc-keypoints">
                {concepts.map((card, i) => (
                  <div key={i} className="dc-keypoint">
                    <div className="dc-keypoint-q">{card.question}</div>
                    <div className="dc-keypoint-a">{card.answer}</div>
                  </div>
                ))}
                {hasMore && !expanded && (
                  <button className="dc-show-more" onClick={() => setExpanded(true)}>
                    +{doc.flashcards.length - 3} more concepts
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz breakdown */}
          {(mcqCount + tfCount + saCount) > 0 && (
            <div className="dc-concept-section">
              <div className="dc-concept-section-title">
                <Icon d={ICONS.quiz} size={13} /> Quiz Breakdown
              </div>
              <div className="dc-quiz-chips">
                {mcqCount > 0 && (
                  <div className="dc-quiz-chip dc-quiz-chip--mcq">
                    📝 {mcqCount} Multiple Choice
                  </div>
                )}
                {tfCount > 0 && (
                  <div className="dc-quiz-chip dc-quiz-chip--tf">
                    ✓✗ {tfCount} True / False
                  </div>
                )}
                {saCount > 0 && (
                  <div className="dc-quiz-chip dc-quiz-chip--sa">
                    💬 {saCount} Short Answer
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="dc-concept-actions">
            <button className="dc-btn dc-btn-primary" onClick={() => onStudy(doc)}>
              🃏 Study Flashcards
            </button>
            <button className="dc-btn dc-btn-secondary" onClick={() => onQuiz(doc)}>
              📝 Take Quiz
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsed quick actions ── */}
      {!expanded && (
        <div className="dc-concept-quick-actions">
          <button className="dc-btn dc-btn-sm dc-btn-primary" onClick={(e) => { e.stopPropagation(); onStudy(doc); }}>
            🃏 Study
          </button>
          <button className="dc-btn dc-btn-sm dc-btn-secondary" onClick={(e) => { e.stopPropagation(); onQuiz(doc); }}>
            📝 Quiz
          </button>
        </div>
      )}
    </div>
  );
}

// ── Grid card (alternative view) ──────────────────────────────────────────
function DocCard({ doc, onStudy, onQuiz, onDelete }) {
  const fc = fileColor(doc.fileType);
  const mcqCount = doc.quiz?.mcq?.length ?? 0;
  const tfCount  = doc.quiz?.trueFalse?.length ?? 0;
  const saCount  = doc.quiz?.shortAnswer?.length ?? 0;

  const progressDone  = doc.flashcardProgress ? Object.keys(doc.flashcardProgress).length : 0;
  const progressTotal = doc.flashcardCount || 0;
  const progressPct   = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

  return (
    <div className="dc-card">
      <div className="dc-card-top">
        <div className="dc-file-badge" style={{ background: `${fc}18`, borderColor: `${fc}35`, color: fc }}>
          <Icon d={ICONS.file} size={12} />
          {(doc.fileType || "TXT").toUpperCase()}
        </div>
        <button className="dc-card-delete" onClick={() => onDelete(doc)} title="Delete">
          <Icon d={ICONS.trash} size={14} />
        </button>
      </div>

      <h3 className="dc-card-title" title={doc.topic}>{doc.topic}</h3>
      <p className="dc-card-filename">{doc.fileName}</p>

      {/* Preview first concept */}
      {doc.flashcards?.[0] && (
        <div className="dc-card-preview">
          <span className="dc-card-preview-label">First concept</span>
          <p className="dc-card-preview-text">{doc.flashcards[0].question}</p>
        </div>
      )}

      <div className="dc-card-stats">
        <span className="dc-stat"><Icon d={ICONS.flash} size={12} />{doc.flashcardCount ?? 0} cards</span>
        <span className="dc-stat"><Icon d={ICONS.quiz} size={12} />{mcqCount + tfCount + saCount} Qs</span>
        <span className="dc-stat dc-stat-muted"><Icon d={ICONS.clock} size={12} />{formatDate(doc.createdAt)}</span>
      </div>

      {progressTotal > 0 && (
        <div className="dc-card-progress">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-label)", marginBottom: 4 }}>
            <span>Progress</span><span>{progressPct}%</span>
          </div>
          <div className="dc-progress-track">
            <div className="dc-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="dc-card-actions">
        <button className="dc-btn dc-btn-primary" onClick={() => onStudy(doc)}>🃏 Study</button>
        <button className="dc-btn dc-btn-secondary" onClick={() => onQuiz(doc)}>📝 Quiz</button>
      </div>
    </div>
  );
}

// ── Main Documents Page ───────────────────────────────────────────────────
export default function DocumentsPage() {
  const router = useRouter();

  const [uid,       setUid]       = useState(null);
  const [docs,      setDocs]      = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [sortBy,    setSortBy]    = useState("newest");
  const [viewMode,  setViewMode]  = useState("concepts"); // concepts | grid
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // ── Auth listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setUid(user.uid); fetchDocs(user.uid); }
      else      { router.push("/"); }
    });
    return () => unsub();
  }, []);

  // ── Fetch documents ────────────────────────────────────────────────────
  const fetchDocs = async (id) => {
    setLoading(true);
    try {
      const data = await loadDocuments(id);
      setDocs(data);
      setFiltered(data);
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter + sort ──────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...docs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result   = result.filter((d) =>
        d.topic?.toLowerCase().includes(q) ||
        d.fileName?.toLowerCase().includes(q) ||
        d.flashcards?.some((f) => f.question?.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt - a.createdAt) || 0;
      if (sortBy === "oldest") return (a.createdAt - b.createdAt) || 0;
      if (sortBy === "name")   return (a.topic || "").localeCompare(b.topic || "");
      if (sortBy === "cards")  return (b.flashcardCount || 0) - (a.flashcardCount || 0);
      return 0;
    });
    setFiltered(result);
  }, [docs, search, sortBy]);

  // ── Load into localStorage then navigate ──────────────────────────────
  const handleStudy = (doc) => {
    if (doc.flashcards?.length) {
      localStorage.setItem("flashcards",     JSON.stringify(doc.flashcards));
      localStorage.setItem("flashcard_meta", JSON.stringify({ topic: doc.topic, docId: doc.id }));
    }
    router.push("/page/dashboard/flashcard");
  };

  const handleQuiz = (doc) => {
    if (doc.quiz) {
      localStorage.setItem("quiz_data", JSON.stringify({ quiz: doc.quiz, meta: { topic: doc.topic, docId: doc.id } }));
    }
    router.push("/page/dashboard/quiz");
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!delTarget || !uid) return;
    setDeleting(true);
    try {
      await deleteDocument(uid, delTarget.id, delTarget.storagePath);
      setDocs((p) => p.filter((d) => d.id !== delTarget.id));
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(false);
      setDelTarget(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalCards = docs.reduce((a, d) => a + (d.flashcardCount || 0), 0);
  const totalQuiz  = docs.reduce((a, d) => a + (d.quizCount || 0), 0);
  const totalConcepts = docs.reduce((a, d) => a + (d.flashcards?.length || 0), 0);

  return (
    <>
      {delTarget && (
        <DeleteModal
          doc={delTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDelTarget(null)}
          deleting={deleting}
        />
      )}

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>My Library</h1>
          <p>{docs.length} topics · {totalCards} flashcards · {totalQuiz} quiz questions</p>
        </div>
        <button
          className="dc-btn dc-btn-primary"
          style={{ gap: 8, display: "flex", alignItems: "center" }}
          onClick={() => router.push("/page/dashboard/content-intake")}
        >
          <Icon d={ICONS.upload} size={15} />
          Upload New
        </button>
      </div>

      <div className="page">

        {/* ── Summary strip ── */}
        <div className="dc-summary">
          {[
            { label: "Topics",       value: docs.length,    color: "var(--primary)" },
            { label: "Concepts",     value: totalConcepts,  color: "#8b5cf6"        },
            { label: "Flashcards",   value: totalCards,     color: "var(--green)"   },
            { label: "Quiz Questions", value: totalQuiz,    color: "#f97316"        },
          ].map((s) => (
            <div key={s.label} className="dc-summary-card">
              <div className="dc-summary-num" style={{ color: s.color }}>{s.value}</div>
              <div className="dc-summary-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="dc-controls">
          <div className="dc-search-wrap">
            <Icon d={ICONS.search} size={15} />
            <input
              className="dc-search"
              placeholder="Search topics or concepts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="dc-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="dc-controls-right">
            <select className="dc-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="cards">Most cards</option>
            </select>

            <div className="dc-view-toggle">
              <button
                className={`dc-view-btn ${viewMode === "concepts" ? "active" : ""}`}
                onClick={() => setViewMode("concepts")}
                title="Concepts view"
              >
                <Icon d={ICONS.book} size={15} />
              </button>
              <button
                className={`dc-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <Icon d={ICONS.grid} size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="dc-loading">
            <div className="dc-loading-spinner" />
            <p>Loading your library…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dc-empty">
            <div className="dc-empty-icon">
              <Icon d={search ? ICONS.search : ICONS.book} size={32} />
            </div>
            <h3 className="dc-empty-title">
              {search ? `No results for "${search}"` : "Your library is empty"}
            </h3>
            <p className="dc-empty-sub">
              {search
                ? "Try a different search term or search by concept question."
                : "Upload study material and AI will extract all key concepts, flashcards, and quiz questions — they'll all appear here."}
            </p>
            {!search && (
              <button
                className="dc-btn dc-btn-primary"
                style={{ marginTop: 16, gap: 8, display: "inline-flex", alignItems: "center" }}
                onClick={() => router.push("/page/dashboard/content-intake")}
              >
                <Icon d={ICONS.upload} size={15} />
                Upload Your First Topic
              </button>
            )}
          </div>
        ) : viewMode === "concepts" ? (
          <div className="dc-concepts-list">
            {filtered.map((d) => (
              <ConceptCard
                key={d.id}
                doc={d}
                onStudy={handleStudy}
                onQuiz={handleQuiz}
                onDelete={setDelTarget}
              />
            ))}
          </div>
        ) : (
          <div className="dc-grid">
            {filtered.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                onStudy={handleStudy}
                onQuiz={handleQuiz}
                onDelete={setDelTarget}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}