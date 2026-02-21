// app/api/generate-flashcards/route.js
// Generates flashcards + quiz (MCQ, True/False, Short Answer) in one call

import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const { content, fileNames, numCards = 10 } = await request.json();

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // ── Run both generations in parallel ──────────────────────────────────
    const [flashcardRes, quizRes] = await Promise.all([

      // ── 1. Flashcards ──
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `You are an expert educator. Given the study material below${fileNames ? ` from "${fileNames}"` : ""}, create exactly ${numCards} flashcards.

Each flashcard:
- "question": Clear, focused question testing one concept
- "answer": Concise accurate answer (1–3 sentences)

Order: foundational → complex.

Study Material:
${content}

Return ONLY valid JSON:
{ "flashcards": [{ "question": "...", "answer": "..." }] }`
        }],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),

      // ── 2. Quiz ──
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `You are an expert educator creating a comprehensive quiz. Given the study material below${fileNames ? ` from "${fileNames}"` : ""}, create exactly:
- 5 multiple choice questions (MCQ)
- 5 true/false questions
- 5 short answer questions

Requirements:
MCQ: 4 options (A/B/C/D), exactly one correct answer, plausible distractors
True/False: clear factual statements, balanced mix of true/false
Short Answer: questions answerable in 1–3 sentences, include a model answer for scoring

Study Material:
${content}

Return ONLY valid JSON — no markdown:
{
  "mcq": [
    {
      "id": "mcq_1",
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ],
  "trueFalse": [
    {
      "id": "tf_1",
      "statement": "...",
      "correct": true,
      "explanation": "..."
    }
  ],
  "shortAnswer": [
    {
      "id": "sa_1",
      "question": "...",
      "modelAnswer": "...",
      "keyPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}`
        }],
        temperature: 0.6,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    ]);

    // ── Parse responses ───────────────────────────────────────────────────
    const parseJSON = (text) => {
      try { return JSON.parse(text); }
      catch { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
    };

    const flashcardsData = parseJSON(flashcardRes.choices[0].message.content);
    const quizData       = parseJSON(quizRes.choices[0].message.content);

    if (!flashcardsData?.flashcards || !quizData?.mcq) {
      return Response.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    return Response.json({
      success:    true,
      flashcards: flashcardsData.flashcards,
      count:      flashcardsData.flashcards.length,
      quiz: {
        mcq:         quizData.mcq         || [],
        trueFalse:   quizData.trueFalse   || [],
        shortAnswer: quizData.shortAnswer || [],
      },
    });

  } catch (error) {
    console.error("Generation error:", error);
    return Response.json({ error: error.message || "Failed to generate content" }, { status: 500 });
  }
}