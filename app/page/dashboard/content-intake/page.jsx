"use client";
import { useState, useRef } from "react";
import { FileText, X, CheckCircle, Loader2, Check } from "lucide-react";

const SAMPLE_FILES = [
  { name: "Biology_Chapter3.pdf", size: "842KB", type: "pdf" },
  { name: "History_Notes.docx",   size: "210KB", type: "doc" },
];

const SAMPLE_TOPICS = [
  { name: "Cell Biology & Mitochondria", concepts: 12 },
  { name: "World War II Timeline",       concepts: 8  },
  { name: "Photosynthesis Process",      concepts: 9  },
  { name: "Cold War & Geopolitics",      concepts: 6  },
  { name: "DNA & Genetic Replication",  concepts: 11 },
];

function formatSize(bytes) {
  if (bytes < 1024)    return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function ContentIntake() {
  const [files, setFiles]           = useState([]);
  const [drag, setDrag]             = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [done, setDone]             = useState(false);
  const [topics, setTopics]         = useState([]);
  const inputRef = useRef();

  const addFiles = (incoming) => {
    const arr = Array.from(incoming).map((f) => ({
      id:   Math.random().toString(36).slice(2),
      name: f.name,
      size: formatSize(f.size),
      type: f.name.split(".").pop().toLowerCase(),
    }));
    setFiles((prev) => [...prev, ...arr]);
    setDone(false);
    setTopics([]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const loadSamples = () => {
    setFiles(SAMPLE_FILES.map((f) => ({ ...f, id: Math.random().toString(36).slice(2) })));
    setDone(false);
    setTopics([]);
  };

  const handleProcess = () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => {
          setProcessing(false);
          setDone(true);
          setTopics(SAMPLE_TOPICS.map((t) => ({ ...t, selected: true })));
        }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 220);
  };

  const toggleTopic = (i) =>
    setTopics((prev) => prev.map((t, idx) => (idx === i ? { ...t, selected: !t.selected } : t)));

  return (
    <>
      {/* TOPBAR — uses same .topbar class from dashboard.css */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Content Intake</h1>
          <p>Input once · recall repeatedly · remember efficiently</p>
        </div>
      </div>

      {/* PAGE — reuses .page from dashboard.css */}
      <div className="page" style={{ maxWidth: 900 }}>

        <div className="section-label">Module 1</div>
        <div className="section-title">Content Intake</div>
        <p className="section-desc">
          Upload your notes, slides, or chapters. Memorise automatically extracts topics
          and generates all study tools — no manual setup needed.
        </p>

        {/* UPLOAD ZONE */}
        {!done && (
          <div
            className={`upload-zone ${drag ? "drag-over" : ""}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              style={{ display: "none" }}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <span className="upload-icon">📂</span>
            <div className="upload-title">Drop files here or click to browse</div>
            <div className="upload-sub">Supports PDF, DOCX, PPTX, TXT — any study material</div>
          </div>
        )}

        {/* FILE LIST */}
        {files.length > 0 && !done && (
          <div className="file-list">
            {files.map((f) => (
              <div key={f.id} className="file-item">
                <div className="file-icon-box">
                  <FileText size={17} />
                </div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-size">{f.size}</div>
                </div>
                <button className="file-remove" onClick={() => removeFile(f.id)}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        {!done && (
          <div className="action-row">
            <button className="ci-btn ci-ghost" onClick={loadSamples}>Load sample files</button>
            {files.length > 0 && !processing && (
              <button className="ci-btn ci-primary" onClick={handleProcess}>Process Files →</button>
            )}
            {processing && (
              <button className="ci-btn ci-primary" disabled>
                <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} /> Processing…
              </button>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {processing && (
          <div className="processing-bar">
            <div className="processing-label">
              <div className="spinner" />
              Extracting topics and building study tools…
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {done && (
          <>
            <div className="success-box">
              <div className="success-icon"><CheckCircle size={22} /></div>
              <div>
                <div className="success-title">Content processed successfully</div>
                <div className="success-sub">
                  We found {topics.length} topics across {files.length} file{files.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                className="ci-btn ci-ghost"
                style={{ marginLeft: "auto" }}
                onClick={() => { setDone(false); setFiles([]); setTopics([]); }}
              >
                Upload more
              </button>
            </div>

            <div className="topics-section">
              <div className="topics-label">Extracted Topics — select to include</div>
              <div className="topics-list">
                {topics.map((t, i) => (
                  <div key={i} className="topic-item" onClick={() => toggleTopic(i)}>
                    <div className={`topic-check ${t.selected ? "checked" : ""}`}>
                      {t.selected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="topic-name">{t.name}</span>
                    <span className="topic-count">{t.concepts} concepts</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="ci-btn ci-primary">Build Study Plan →</button>
              </div>
            </div>
          </>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}