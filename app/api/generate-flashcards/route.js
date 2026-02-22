// ─────────────────────────────────────────────────────────────────────────────
// FIXED: app/api/generate-flashcards/route.js
// Changes:
//   1. model → "gpt-4o" (gpt-4o-mini doesn't reliably support json_object mode)
//   2. Added better error logging
// ─────────────────────────────────────────────────────────────────────────────

import { OpenAI } from "openai";

// Configure route for longer timeout (Vercel: up to 60s on Pro, Netlify: varies)
export const maxDuration = 60; // seconds

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is missing in environment variables");
      return Response.json({ 
        error: "OpenAI API key not configured. Please check your environment variables.",
        details: "The OPENAI_API_KEY environment variable is missing or empty."
      }, { status: 500 });
    }

    // Initialize OpenAI client inside the handler (lazy initialization)
    // This prevents build-time errors when the API key is not available
    const openai = new OpenAI({ apiKey });

    const { content, fileNames, numCards = 10 } = await request.json();

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // ── Run both generations in parallel ──────────────────────────────────
    const [flashcardRes, quizRes] = await Promise.all([

      // ── 1. Flashcards ──
      openai.chat.completions.create({
        model: "gpt-4o",                         // ✅ FIXED: was gpt-4o-mini
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
{ "flashcards": [{ "question": "...", "answer": "..." }] }`,
        }],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),

      // ── 2. Quiz ──
      openai.chat.completions.create({
        model: "gpt-4o",                         // ✅ FIXED: was gpt-4o-mini
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
}`,
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
      console.error("Bad AI response:", { flashcardsData, quizData }); // helps debug
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
    
    // Provide more specific error messages
    let errorMessage = "Failed to generate content";
    let errorDetails = error.message || "Unknown error";
    
    if (error instanceof Error) {
      // Network/connection errors
      if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Connection error: Unable to reach OpenAI API";
        errorDetails = "Please check your internet connection and try again.";
      }
      // API key errors
      else if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("authentication")) {
        errorMessage = "Authentication error: Invalid OpenAI API key";
        errorDetails = "Please verify your OPENAI_API_KEY environment variable is correct.";
      }
      // Rate limit errors
      else if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "Rate limit exceeded";
        errorDetails = "Too many requests. Please wait a moment and try again.";
      }
      // Timeout errors
      else if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout";
        errorDetails = "The request took too long. Please try with shorter content or fewer cards.";
      }
      else {
        errorMessage = error.message || errorMessage;
      }
    }
    
    return Response.json({ 
      error: errorMessage,
      details: errorDetails,
      type: error.constructor?.name || "Error"
    }, { status: 500 });
  }
}