import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { content, fileNames, numCards = 10 } = await request.json();

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are an expert educator creating study flashcards.

Given the following study material${fileNames ? ` from "${fileNames}"` : ""}, create exactly ${numCards} flashcards in JSON format.

Each flashcard should have:
- "question": A clear, concise question
- "answer": A comprehensive but concise answer

The flashcards should:
1. Cover key concepts and facts
2. Be at an appropriate difficulty level
3. Progress from basic to more complex concepts
4. Be suitable for self-study

Study Material:
${content}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "flashcards": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ]
}`;

    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = message.choices[0].message.content;
    
    // Parse the JSON response
    let flashcardsData;
    try {
      flashcardsData = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON response from OpenAI");
      }
    }

    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      return Response.json(
        { error: "Invalid flashcard format in response" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      flashcards: flashcardsData.flashcards,
      count: flashcardsData.flashcards.length,
    });
  } catch (error) {
    console.error("Flashcard generation error:", error);
    return Response.json(
      { error: error.message || "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
