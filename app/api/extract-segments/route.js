// app/api/extract-segments/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { content, fileName } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const systemPrompt = `You are an expert content analyst. Extract and segment educational content into logical units.

Return ONLY this JSON structure (no markdown, no extra text):
{
  "groups": [
    {
      "id": "g1",
      "title": "Thematic group name",
      "segments": [
        {
          "id": "s1",
          "type": "topic|concept|statement|fact|definition",
          "title": "Short title max 8 words",
          "content": "2-4 sentences of extracted/paraphrased content",
          "keywords": ["word1", "word2", "word3"]
        }
      ]
    }
  ]
}

Types:
- topic: broad subject area or section
- concept: abstract idea, theory, or principle  
- statement: key claim, argument, or thesis
- fact: specific data point, statistic, or concrete detail
- definition: formal definition of a term

Rules:
- 2-4 groups based on themes
- 3-6 segments per group
- 10-18 total segments
- 2-3 keywords per segment
- Return ONLY valid JSON`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-opus-4-5",
        max_tokens: 4096,
        system:     systemPrompt,
        messages: [{
          role:    "user",
          content: `Extract segments from "${fileName}":\n\n${content.slice(0, 40000)}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: "AI extraction failed", details: err.error?.message },
        { status: 502 }
      );
    }

    const aiData  = await response.json();
    const rawText = aiData.content?.[0]?.text ?? "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", details: rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    // Compute stats
    const allSegs = parsed.groups?.flatMap(g => g.segments) ?? [];
    parsed.stats = {
      totalSegments: allSegs.length,
      topics:        allSegs.filter(s => s.type === "topic").length,
      concepts:      allSegs.filter(s => s.type === "concept").length,
      statements:    allSegs.filter(s => s.type === "statement").length,
      facts:         allSegs.filter(s => s.type === "fact").length,
      definitions:   allSegs.filter(s => s.type === "definition").length,
      wordCount:     content.trim().split(/\s+/).length,
      fileName,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("extract-segments error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}