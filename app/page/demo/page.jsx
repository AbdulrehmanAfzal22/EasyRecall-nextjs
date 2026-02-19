"use client";
import { useState, useEffect, useRef } from "react";
import "./demo.css";

// ── SAMPLE DATA ──────────────────────────────────────────
const SAMPLE_CARDS = [
  { id:1, topic:"Biology", question:"What is the powerhouse of the cell?", answer:"The mitochondria — it generates most of the cell's supply of ATP through cellular respiration." },
  { id:2, topic:"History", question:"In what year did World War II end?", answer:"World War II ended in 1945 — V-E Day (Victory in Europe) was May 8 and V-J Day (Victory over Japan) was September 2." },
  { id:3, topic:"Physics", question:"What is Newton's Second Law of Motion?", answer:"Force equals mass times acceleration (F = ma). The acceleration of an object depends on the net force and its mass." },
  { id:4, topic:"Chemistry", question:"What is the atomic number of Carbon?", answer:"Carbon has an atomic number of 6, meaning it has 6 protons in its nucleus." },
  { id:5, topic:"Mathematics", question:"What is the Pythagorean theorem?", answer:"In a right-angled triangle: a² + b² = c², where c is the hypotenuse (the side opposite the right angle)." },
];

const TEST_QUESTIONS = [
  { id:1, type:"multiple", topic:"Biology", question:"Which organelle is responsible for photosynthesis?", options:["Mitochondria","Nucleus","Chloroplast","Ribosome"], correct:2 },
  { id:2, type:"truefalse", topic:"History", question:"The Berlin Wall fell in 1989.", options:["True","False"], correct:0 },
  { id:3, type:"multiple", topic:"Physics", question:"Which law states that every action has an equal and opposite reaction?", options:["First Law","Second Law","Third Law","Law of Gravity"], correct:2 },
  { id:4, type:"short", topic:"Chemistry", question:"What is the chemical symbol for water?", answer:"H2O", hint:"H₂O" },
  { id:5, type:"truefalse", topic:"Mathematics", question:"Pi (π) is exactly equal to 22/7.", options:["True","False"], correct:1 },
];

const TOPICS = [
  { name:"Biology", cards:12, color:"green" },
  { name:"History", cards:8, color:"yellow" },
  { name:"Physics", cards:15, color:"blue" },
  { name:"Chemistry", cards:10, color:"blue" },
  { name:"Mathematics", cards:7, color:"yellow" },
];

// ── ICONS ────────────────────────────────────────────────
const Icon = ({ name }) => {
  const icons = {
    home:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    upload:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    cards:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    recall:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/></svg>,
    test:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    tracker:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
    check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
    arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>,
    refresh:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  };
  return <span style={{display:"inline-flex",alignItems:"center",width:"1em",height:"1em"}}>{icons[name]}</span>;
};

const BrainLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="rgba(26,95,212,0.2)"/>
    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="22">🧠</text>
  </svg>
);

// ── NAV ──────────────────────────────────────────────────
const NAV = [
  { id:"home",    icon:"home",    label:"Dashboard" },
  { id:"upload",  icon:"upload",  label:"Content Intake" },
  { id:"cards",   icon:"cards",   label:"Flashcards" },
  { id:"recall",  icon:"recall",  label:"Recall Game" },
  { id:"test",    icon:"test",    label:"Test Yourself" },
  { id:"tracker", icon:"tracker", label:"Study Tracker" },
];

// ── SIDEBAR ──────────────────────────────────────────────
function Sidebar({ active, onNav }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo"><BrainLogo /></div>
      {NAV.map(n => (
        <button key={n.id} className={`nav-btn ${active===n.id?"active":""}`} onClick={() => onNav(n.id)}>
          <Icon name={n.icon} />
          <span className="nav-tooltip">{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── HOME ─────────────────────────────────────────────────
function Home({ onNav, stats }) {
  const modules = [
    { id:"upload",  icon:"📥", name:"Content Intake",  desc:"Upload notes, slides, or chapters to generate study material automatically." },
    { id:"cards",   icon:"🃏", name:"Flashcards",       desc:"Spaced repetition cards adapted to your recall performance." },
    { id:"recall",  icon:"🎯", name:"Recall Game",      desc:"Self-assess your mastery with intentional recall scoring." },
    { id:"test",    icon:"📝", name:"Test Yourself",    desc:"Simulate exam conditions with adaptive quiz questions." },
    { id:"tracker", icon:"📊", name:"Study Tracker",    desc:"Track sessions, recall trends, and readiness at a glance." },
  ];
  return (
    <div className="page">
      <div className="home-hero">
        <div>
          <p className="hero-greeting">Good morning — let's study smarter</p>
          <h1 className="hero-title">Welcome to<br/>Memorise</h1>
          <p className="hero-sub">Input once → recall repeatedly → remember efficiently. Your AI-driven study companion that builds real memory.</p>
          <button className="btn btn-primary btn-lg" onClick={() => onNav("upload")}>
            Get Started <Icon name="arrow" />
          </button>
        </div>
        <div className="hero-brain">🧠</div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-num">{stats.cards}</div><div className="stat-label">Cards Reviewed</div></div>
        <div className="stat-card"><div className="stat-num yellow">{stats.streak}</div><div className="stat-label">Day Streak</div></div>
        <div className="stat-card"><div className="stat-num green">{stats.mastered}</div><div className="stat-label">Mastered</div></div>
        <div className="stat-card"><div className="stat-num blue">{stats.readiness}%</div><div className="stat-label">Readiness</div></div>
      </div>

      <div className="section-header">
        <div className="section-label">Modules</div>
        <div className="section-title">Everything you need</div>
      </div>

      <div className="modules-grid">
        {modules.map(m => (
          <div key={m.id} className="module-card" onClick={() => onNav(m.id)}>
            <div className="module-icon">{m.icon}</div>
            <div>
              <div className="module-name">{m.name}</div>
              <div className="module-desc">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── UPLOAD ───────────────────────────────────────────────
function Upload({ onDone }) {
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState(TOPICS.map(t => ({ ...t, selected: false })));
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).map(f => ({ name:f.name, size:(f.size/1024).toFixed(0)+"KB", icon: f.name.endsWith(".pdf")?"📄":"📝" }));
    setFiles(prev => [...prev, ...arr]);
  };

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 2000);
  };

  const toggleTopic = (i) => setTopics(prev => prev.map((t,idx) => idx===i ? { ...t, selected:!t.selected } : t));

  return (
    <div className="page">
      <div className="section-header">
        <div className="section-label">Module 1</div>
        <div className="section-title">Content Intake</div>
        <div className="section-desc">Upload your notes, slides, or chapters. Memorise automatically extracts topics and generates all study tools — no manual setup needed.</div>
      </div>

      {!done ? (
        <>
          <div
            className={`upload-zone ${drag?"drag-over":""}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          >
            <input ref={inputRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
            <div className="upload-icon">📂</div>
            <div className="upload-title">Drop files here or click to browse</div>
            <div className="upload-sub">Supports PDF, DOCX, PPTX, TXT — any study material</div>
          </div>

          {files.length > 0 && (
            <div className="uploaded-files">
              {files.map((f,i) => (
                <div key={i} className="file-item">
                  <span className="file-icon">{f.icon}</span>
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">{f.size}</span>
                  <button className="file-remove" onClick={() => setFiles(prev => prev.filter((_,idx) => idx!==i))}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"flex",gap:12,marginBottom:28}}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFiles([{ name:"Biology_Chapter3.pdf", size:"842KB", icon:"📄" },{ name:"History_Notes.docx", size:"210KB", icon:"📝" }]); }}>
              Load sample files
            </button>
            {files.length > 0 && (
              <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
                {processing ? "Processing…" : "Process Files →"}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card card-blue" style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
              <span style={{fontSize:24}}>✅</span>
              <div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,color:"var(--white)",fontSize:16}}>Content processed successfully</div>
                <div style={{fontSize:13,color:"var(--text-secondary)"}}>We found {TOPICS.length} topics across your materials</div>
              </div>
            </div>
          </div>

          <div className="section-header" style={{marginTop:8,marginBottom:16}}>
            <div className="section-label">Extracted Topics</div>
            <div style={{fontSize:13,color:"var(--text-secondary)"}}>Select topics to include in your study plan</div>
          </div>

          <div className="topics-list">
            {topics.map((t,i) => (
              <div key={i} className="topic-item" onClick={() => toggleTopic(i)}>
                <span className={`topic-check ${t.selected?"checked":""}`}>
                  {t.selected && <Icon name="check" />}
                </span>
                <span className="topic-name">{t.name}</span>
                <span className="topic-count">{t.cards} concepts</span>
              </div>
            ))}
          </div>

          <div style={{marginTop:24}}>
            <button className="btn btn-primary btn-lg" onClick={onDone}>
              Build Study Plan <Icon name="arrow" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── FLASHCARDS ───────────────────────────────────────────
function Flashcards({ onStat }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState({ known:0, unknown:0 });
  const [done, setDone] = useState(false);

  const card = SAMPLE_CARDS[index];
  const total = SAMPLE_CARDS.length;
  const pct = Math.round(((index) / total) * 100);

  const next = (result) => {
    setScores(s => ({ ...s, [result]: s[result]+1 }));
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= total) { setDone(true); onStat("cards"); }
      else setIndex(i => i+1);
    }, 200);
  };

  const restart = () => { setIndex(0); setFlipped(false); setScores({known:0,unknown:0}); setDone(false); };

  if (done) return (
    <div className="page">
      <div className="fc-done">
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <div className="fc-done-title">Session Complete!</div>
        <div className="fc-done-sub">You reviewed all {total} cards.</div>
        <div className="score-grid" style={{maxWidth:340,margin:"0 auto 28px"}}>
          <div className="score-item"><div className="score-num green">{scores.known}</div><div className="score-lbl">Known</div></div>
          <div className="score-item"><div className="score-num red">{scores.unknown}</div><div className="score-lbl">Unknown</div></div>
          <div className="score-item"><div className="score-num blue">{Math.round((scores.known/total)*100)}%</div><div className="score-lbl">Score</div></div>
        </div>
        <button className="btn btn-primary" onClick={restart}><Icon name="refresh"/> Review Again</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="section-header">
        <div className="section-label">Module 2</div>
        <div className="section-title">Flashcards</div>
      </div>

      <div className="flashcard-controls">
        <span className="card-counter">{index+1} / {total}</span>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{width:`${pct}%`}} />
        </div>
        <span style={{fontSize:13,color:"var(--text-muted)"}}>{pct}% complete</span>
      </div>

      <div className="fc-scene">
        <div className={`fc-card ${flipped?"flipped":""}`}>
          <div className="fc-face fc-front">
            <div>
              <p className="fc-label">Question · {card.topic}</p>
              <h2 className="fc-question">{card.question}</h2>
            </div>
            <button className="fc-btn" onClick={() => setFlipped(true)}>
              Reveal Answer ✦
            </button>
          </div>
          <div className="fc-face fc-back">
            <div>
              <p className="fc-label">Answer · {card.topic}</p>
              <div className="fc-answer">
                <div className="fc-answer-highlight">{card.answer}</div>
              </div>
            </div>
            <button className="fc-btn" onClick={() => setFlipped(false)} style={{marginBottom:0,alignSelf:"flex-start"}}>
              ↩ Back
            </button>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="fc-actions" style={{animation:"fadeUp 0.3s ease"}}>
          <button className="fc-action-btn unknown" onClick={() => next("unknown")}>✕ Still Learning</button>
          <button className="fc-action-btn skip" onClick={() => next("unknown")}>→ Skip</button>
          <button className="fc-action-btn known" onClick={() => next("known")}>✓ Got It</button>
        </div>
      )}

      {!flipped && (
        <div style={{textAlign:"center",marginTop:16}}>
          <p style={{fontSize:13,color:"var(--text-muted)"}}>Click the card or press <strong style={{color:"var(--blue-glow)"}}>Reveal Answer</strong></p>
        </div>
      )}
    </div>
  );
}

// ── RECALL GAME ──────────────────────────────────────────
const RECALL_QS = SAMPLE_CARDS.map(c => ({ ...c, revealed:false }));

function RecallGame({ onStat }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({ well:0, some:0, not:0 });
  const [done, setDone] = useState(false);
  const total = RECALL_QS.length;

  const opts = [
    { key:"well", icon:"🟢", label:"Very well",  sub:"I recalled it clearly",  cls:"selected-well" },
    { key:"some", icon:"🟡", label:"Somewhat",   sub:"Partial recall",          cls:"selected-some" },
    { key:"not",  icon:"🔴", label:"Not at all", sub:"I didn't remember this",  cls:"selected-not" },
  ];

  const choose = (k) => { if (!selected) setSelected(k); };

  const next = () => {
    if (selected) setScores(s => ({ ...s, [selected]: s[selected]+1 }));
    setSelected(null); setRevealed(false);
    if (index + 1 >= total) { setDone(true); onStat("recall"); }
    else setIndex(i => i+1);
  };

  if (done) return (
    <div className="page">
      <div className="fc-done">
        <div style={{fontSize:64,marginBottom:16}}>🎯</div>
        <div className="fc-done-title">Recall Session Done!</div>
        <div className="fc-done-sub">Your recall confidence for this session:</div>
        <div className="score-grid" style={{maxWidth:380,margin:"0 auto 28px"}}>
          <div className="score-item"><div className="score-num green">{scores.well}</div><div className="score-lbl">Very Well</div></div>
          <div className="score-item"><div className="score-num yellow">{scores.some}</div><div className="score-lbl">Somewhat</div></div>
          <div className="score-item"><div className="score-num red">{scores.not}</div><div className="score-lbl">Not At All</div></div>
        </div>
        <button className="btn btn-primary" onClick={() => { setIndex(0); setDone(false); setScores({well:0,some:0,not:0}); }}>
          <Icon name="refresh"/> Try Again
        </button>
      </div>
    </div>
  );

  const q = RECALL_QS[index];
  return (
    <div className="page">
      <div className="section-header">
        <div className="section-label">Module 3</div>
        <div className="section-title">Recall Game</div>
        <div className="section-desc">Read the question, think of the answer mentally, then rate your recall honestly.</div>
      </div>

      <div className="recall-card">
        <div className="flashcard-controls" style={{marginBottom:20}}>
          <span className="card-counter">{index+1} / {total}</span>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{width:`${Math.round((index/total)*100)}%`}}/>
          </div>
        </div>

        <div className="card" style={{marginBottom:20}}>
          <p className="recall-topic">📌 {q.topic}</p>
          <p className="recall-question">{q.question}</p>
        </div>

        {!revealed && (
          <button className="btn btn-ghost" style={{marginBottom:20}} onClick={() => setRevealed(true)}>
            Show answer
          </button>
        )}

        {revealed && (
          <div className="reveal-box">
            <p className="reveal-label">Answer</p>
            <p className="reveal-text">{q.answer}</p>
          </div>
        )}

        <p className="recall-prompt">How well did you recall this?</p>
        <div className="recall-options">
          {opts.map(o => (
            <button key={o.key} className={`recall-option ${selected===o.key ? o.cls : ""}`} onClick={() => choose(o.key)}>
              <span className="recall-opt-icon">{o.icon}</span>
              <div>
                <div className="recall-opt-label">{o.label}</div>
                <div className="recall-opt-sub">{o.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <button className="btn btn-primary" onClick={next}>
            Next <Icon name="arrow"/>
          </button>
        )}
      </div>
    </div>
  );
}

// ── TEST MODULE ──────────────────────────────────────────
function TestModule({ onStat }) {
  const [started, setStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shortAns, setShortAns] = useState("");
  const [feedback, setFeedback] = useState(null); // {correct, msg}
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(600); // 10min
  const timerRef = useRef();

  useEffect(() => {
    if (started && !done) {
      timerRef.current = setInterval(() => setTimer(t => { if (t<=1){ clearInterval(timerRef.current); setDone(true); return 0; } return t-1; }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, done]);

  const q = TEST_QUESTIONS[qIdx];
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const submit = () => {
    if (!q) return;
    let correct = false;
    if (q.type === "short") {
      correct = shortAns.trim().toLowerCase().replace(/[^a-z0-9]/g,"") === q.answer.toLowerCase().replace(/[^a-z0-9]/g,"");
    } else {
      correct = selected === q.correct;
    }
    setFeedback({ correct, msg: correct ? "Correct! Well done." : `Not quite. The answer is: ${q.type==="short" ? q.hint : q.options[q.correct]}` });
    setResults(r => [...r, correct]);
  };

  const nextQ = () => {
    setFeedback(null); setSelected(null); setShortAns("");
    if (qIdx + 1 >= TEST_QUESTIONS.length) { setDone(true); onStat("test"); clearInterval(timerRef.current); }
    else setQIdx(i => i+1);
  };

  const score = results.filter(Boolean).length;

  if (!started) return (
    <div className="page">
      <div className="section-header">
        <div className="section-label">Module 4</div>
        <div className="section-title">Test Yourself</div>
        <div className="section-desc">Simulate exam conditions with {TEST_QUESTIONS.length} adaptive questions across multiple formats. Track which areas need more work.</div>
      </div>
      <div className="card card-blue" style={{maxWidth:480,marginBottom:24}}>
        <div style={{fontSize:32,marginBottom:12}}>📝</div>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,color:"var(--white)",fontSize:18,marginBottom:6}}>Ready to test your knowledge?</div>
        <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:20,lineHeight:1.6}}>
          {TEST_QUESTIONS.length} questions · Multiple choice, True/False, Short answer<br/>Time limit: 10 minutes · Immediate feedback
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>
          Start Test <Icon name="arrow"/>
        </button>
      </div>
    </div>
  );

  if (done) {
    const pct = Math.round((score / TEST_QUESTIONS.length) * 100);
    return (
      <div className="page">
        <div className="test-results">
          <div style={{fontSize:48,marginBottom:16}}>📊</div>
          <div className="fc-done-title">Test Complete!</div>
          <div className="fc-done-sub" style={{marginBottom:24}}>Here's how you did</div>
          <div className="result-circle">
            <div className="result-pct">{pct}%</div>
            <div className="result-label">Score</div>
          </div>
          <div className="score-grid" style={{marginBottom:28}}>
            <div className="score-item"><div className="score-num green">{score}</div><div className="score-lbl">Correct</div></div>
            <div className="score-item"><div className="score-num red">{TEST_QUESTIONS.length-score}</div><div className="score-lbl">Wrong</div></div>
            <div className="score-item"><div className="score-num blue">{fmt(600-timer)}</div><div className="score-lbl">Time Used</div></div>
          </div>
          <button className="btn btn-primary" onClick={() => { setStarted(false); setQIdx(0); setResults([]); setDone(false); setTimer(600); }}>
            <Icon name="refresh"/> Retake Test
          </button>
        </div>
      </div>
    );
  }

  const timerClass = timer < 60 ? "danger" : timer < 180 ? "warning" : "";

  return (
    <div className="page">
      <div className="test-header">
        <div>
          <div className="test-q-num">Question {qIdx+1} of {TEST_QUESTIONS.length}</div>
          <div className="progress-bar-wrap" style={{maxWidth:200,marginTop:8}}>
            <div className="progress-bar-fill" style={{width:`${(qIdx/TEST_QUESTIONS.length)*100}%`}}/>
          </div>
        </div>
        <div className={`test-timer ${timerClass}`}>{fmt(timer)}</div>
      </div>

      <div style={{maxWidth:560}}>
        <span className="test-type-badge">{q.type==="multiple"?"Multiple Choice":q.type==="truefalse"?"True / False":"Short Answer"}</span>
        <h2 className="test-question">{q.question}</h2>

        {(q.type==="multiple"||q.type==="truefalse") && (
          <div className="test-options">
            {q.options.map((opt,i) => {
              let cls = "test-option";
              if (feedback) { if (i===q.correct) cls+=" correct"; else if (selected===i) cls+=" wrong"; }
              else if (selected===i) cls+=" selected";
              return (
                <button key={i} className={cls} onClick={() => !feedback && setSelected(i)}>
                  <span className="test-opt-key">{String.fromCharCode(65+i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type==="short" && (
          <textarea
            className="test-input"
            rows={3}
            placeholder="Type your answer here…"
            value={shortAns}
            onChange={e => setShortAns(e.target.value)}
            disabled={!!feedback}
          />
        )}

        {feedback && (
          <div className={`feedback-bar ${feedback.correct?"correct":"wrong"}`}>
            <span>{feedback.correct ? "✓" : "✕"}</span>
            {feedback.msg}
          </div>
        )}

        <div style={{display:"flex",gap:12}}>
          {!feedback ? (
            <button className="btn btn-primary" onClick={submit} disabled={selected===null && !shortAns.trim()}>
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={nextQ}>
              {qIdx+1>=TEST_QUESTIONS.length ? "See Results" : "Next Question"} <Icon name="arrow"/>
            </button>
          )}
          {!feedback && <button className="btn btn-ghost" onClick={nextQ}>Skip</button>}
        </div>
      </div>
    </div>
  );
}

// ── TRACKER ──────────────────────────────────────────────
function Tracker({ stats }) {
  const r = stats.readiness;
  const circ = 2 * Math.PI * 54;
  const offset = circ - (r / 100) * circ;

  const topicProgress = [
    { name:"Biology", pct:78, color:"green" },
    { name:"Physics", pct:62, color:"blue" },
    { name:"Chemistry", pct:45, color:"blue" },
    { name:"History", pct:90, color:"green" },
    { name:"Mathematics", pct:30, color:"yellow" },
  ];

  const sessions = [
    { label:"Flashcards session", time:"Today, 10:32 AM", score:"18/20", dot:"blue" },
    { label:"Recall Game · Biology", time:"Today, 09:15 AM", score:"Very Well", dot:"green" },
    { label:"Test · History", time:"Yesterday, 7:40 PM", score:"85%", dot:"yellow" },
    { label:"Flashcards session", time:"Yesterday, 3:10 PM", score:"14/15", dot:"blue" },
    { label:"Recall Game · Physics", time:"2 days ago", score:"Somewhat", dot:"yellow" },
  ];

  return (
    <div className="page">
      <div className="section-header">
        <div className="section-label">Module 5</div>
        <div className="section-title">Study Tracker</div>
        <div className="section-desc">Lightweight visibility into your study consistency and recall performance over time.</div>
      </div>

      <div className="tracker-grid">
        <div>
          <div className="card" style={{marginBottom:16,textAlign:"center"}}>
            <div className="readiness-ring">
              <svg className="ring-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1a5fd4"/>
                    <stop offset="100%" stopColor="#60a5fa"/>
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="60" cy="60" r="54"/>
                <circle className="ring-fill" cx="60" cy="60" r="54" strokeDasharray={circ} strokeDashoffset={offset}/>
              </svg>
              <div className="ring-label">
                <div className="ring-pct">{r}%</div>
                <div className="ring-sub">Readiness</div>
              </div>
            </div>
            <div style={{fontSize:13,color:"var(--text-secondary)"}}>Overall study readiness</div>
          </div>

          <div className="stats-row" style={{gridTemplateColumns:"repeat(2,1fr)",marginBottom:16}}>
            <div className="stat-card"><div className="stat-num">{stats.cards}</div><div className="stat-label">Cards Reviewed</div></div>
            <div className="stat-card"><div className="stat-num yellow">{stats.streak}</div><div className="stat-label">Day Streak</div></div>
            <div className="stat-card"><div className="stat-num green">{stats.mastered}</div><div className="stat-label">Mastered</div></div>
            <div className="stat-card"><div className="stat-num blue">5</div><div className="stat-label">Sessions</div></div>
          </div>
        </div>

        <div className="card">
          <div className="section-label" style={{marginBottom:16}}>Topic Progress</div>
          <div className="topic-progress-list">
            {topicProgress.map((t,i) => (
              <div key={i} className="tp-item">
                <div className="tp-row">
                  <span className="tp-name">{t.name}</span>
                  <span className="tp-pct">{t.pct}%</span>
                </div>
                <div className="tp-bar">
                  <div className={`tp-fill ${t.color}`} style={{width:`${t.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-label" style={{marginBottom:16}}>Recent Sessions</div>
        <div className="session-log">
          {sessions.map((s,i) => (
            <div key={i} className="session-item">
              <div className={`session-dot ${s.dot}`}/>
              <div className="session-info">
                <div className="session-name">{s.label}</div>
                <div className="session-time">{s.time}</div>
              </div>
              <div className="session-score">{s.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");
  const [stats, setStats] = useState({ cards:47, streak:5, mastered:32, readiness:68 });

  const titles = { home:"Dashboard", upload:"Content Intake", cards:"Flashcards", recall:"Recall Game", test:"Test Yourself", tracker:"Study Tracker" };

  const onStat = (module) => {
    setStats(s => ({
      ...s,
      cards:    module==="cards"   ? s.cards+5 : s.cards,
      mastered: module==="cards"   ? s.mastered+2 : s.mastered,
      readiness:Math.min(100, s.readiness + (module==="test" ? 4 : 2)),
    }));
  };

  return (
    <div className="app">
      <Sidebar active={view} onNav={setView} />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{titles[view]}</div>
            <div className="topbar-sub">Input once · recall repeatedly · remember efficiently</div>
          </div>
          <div className="topbar-right">
            <span className="badge">🔥 {stats.streak} day streak</span>
          </div>
        </div>

        <div key={view}>
          {view==="home"    && <Home    onNav={setView} stats={stats}/>}
          {view==="upload"  && <Upload  onDone={() => setView("cards")}/>}
          {view==="cards"   && <Flashcards onStat={onStat}/>}
          {view==="recall"  && <RecallGame onStat={onStat}/>}
          {view==="test"    && <TestModule onStat={onStat}/>}
          {view==="tracker" && <Tracker stats={stats}/>}
        </div>
      </div>
    </div>
  );
}