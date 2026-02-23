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
    // Log request start for debugging
    console.log("[API] POST /api/generate-flashcards - Request received");
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[API] OPENAI_API_KEY is missing in environment variables");
      return Response.json({ 
        error: "OpenAI API key not configured. Please check your environment variables.",
        details: "The OPENAI_API_KEY environment variable is missing or empty."
      }, { status: 500 });
    }
    console.log("[API] API key found (length:", apiKey.length, ")");

    // Initialize OpenAI client inside the handler (lazy initialization)
    // This prevents build-time errors when the API key is not available
    const openai = new OpenAI({ apiKey });

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("[API] Request body parsed successfully");
    } catch (jsonError) {
      console.error("[API] Failed to parse request JSON:", jsonError);
      return Response.json({ 
        error: "Invalid request format",
        details: "Request body must be valid JSON."
      }, { status: 400 });
    }

    const { content, fileNames, numCards = 10 } = requestBody;

    if (!content || content.trim().length === 0) {
      console.error("[API] Content is empty or missing");
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    console.log("[API] Starting OpenAI API calls - Content length:", content.length, "numCards:", numCards);

    // ── Run both generations in parallel ──────────────────────────────────
    let flashcardRes, quizRes;
    try {
      [flashcardRes, quizRes] = await Promise.all([

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
      console.log("[API] OpenAI API calls completed successfully");
    } catch (openaiError) {
      console.error("[API] OpenAI API call failed:", openaiError);
      // Re-throw to be caught by outer catch block
      throw openaiError;
    }

    // ── Parse responses ───────────────────────────────────────────────────
    const parseJSON = (text) => {
      try { return JSON.parse(text); }
      catch { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
    };

    const flashcardContent = flashcardRes.choices[0]?.message?.content;
    const quizContent = quizRes.choices[0]?.message?.content;

    if (!flashcardContent || !quizContent) {
      console.error("[API] Missing content in OpenAI response:", { 
        flashcardRes: flashcardRes?.choices?.[0], 
        quizRes: quizRes?.choices?.[0] 
      });
      return Response.json({ 
        error: "Invalid response format from AI",
        details: "OpenAI response is missing expected content."
      }, { status: 500 });
    }

    const flashcardsData = parseJSON(flashcardContent);
    const quizData = parseJSON(quizContent);

    if (!flashcardsData?.flashcards || !quizData?.mcq) {
      console.error("[API] Bad AI response format:", { 
        flashcardsData: flashcardsData ? Object.keys(flashcardsData) : null, 
        quizData: quizData ? Object.keys(quizData) : null 
      });
      return Response.json({ 
        error: "Invalid response format from AI",
        details: "AI response does not contain expected flashcard or quiz data."
      }, { status: 500 });
    }

    console.log("[API] Successfully generated", flashcardsData.flashcards.length, "flashcards");
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
    // Safe error logging - extract serializable properties
    const errorInfo = {
      name: error?.name || "Unknown",
      message: error?.message || "Unknown error",
      stack: error?.stack ? String(error.stack).substring(0, 500) : undefined,
    };
    console.error("[API] Generation error:", errorInfo);
    
    // Provide more specific error messages
    let errorMessage = "Failed to generate content";
    let errorDetails = errorInfo.message || "Unknown error";
    const errorType = errorInfo.name || "Error";
    
    // Check error message for specific patterns
    const errorMsgLower = errorInfo.message?.toLowerCase() || "";
    
    // Network/connection errors
    if (errorMsgLower.includes("fetch") || errorMsgLower.includes("network") || 
        errorMsgLower.includes("econnrefused") || errorMsgLower.includes("enotfound")) {
      errorMessage = "Connection error: Unable to reach OpenAI API";
      errorDetails = "Please check your internet connection and try again.";
    }
    // API key errors
    else if (errorMsgLower.includes("api key") || errorMsgLower.includes("401") || 
             errorMsgLower.includes("authentication") || errorMsgLower.includes("unauthorized")) {
      errorMessage = "Authentication error: Invalid OpenAI API key";
      errorDetails = "Please verify your OPENAI_API_KEY environment variable is correct.";
    }
    // Rate limit errors
    else if (errorMsgLower.includes("rate limit") || errorMsgLower.includes("429") ||
             errorMsgLower.includes("quota")) {
      errorMessage = "Rate limit exceeded";
      errorDetails = "Too many requests. Please wait a moment and try again.";
    }
    // Timeout errors
    else if (errorMsgLower.includes("timeout") || errorMsgLower.includes("etimedout") ||
             errorMsgLower.includes("aborted")) {
      errorMessage = "Request timeout";
      errorDetails = "The request took too long. Please try with shorter content or fewer cards.";
    }
    // Parse the error message if available
    else if (errorInfo.message) {
      errorMessage = errorInfo.message;
    }
    
    // Return serializable error response
    try {
      return Response.json({ 
        error: errorMessage,
        details: errorDetails,
        type: errorType
      }, { status: 500 });
    } catch (jsonError) {
      // Fallback if JSON serialization fails
      console.error("[API] Failed to serialize error response:", jsonError);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Failed to process error" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}