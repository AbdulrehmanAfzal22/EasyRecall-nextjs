# OpenAI Flashcard Generator - Setup Guide

## Overview
This feature integrates OpenAI's GPT-4 Mini model to automatically generate flashcards from your study content. The workflow is:

1. **Upload Content** → Content Intake page (upload files)
2. **Process & Extract Topics** → Automatic topic extraction
3. **Generate Flashcards** → OpenAI creates Q&A pairs
4. **Study** → Interactive flashcard viewer

## Installation

### 1. Install Dependencies
```bash
npm install
```

This installs the OpenAI SDK and other required packages.

### 2. Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign in or create an account
3. Generate a new API key
4. Copy the key (you won't be able to view it again)

### 3. Configure Environment Variables
Edit `.env.local` in the project root and add your API key:
```env
OPENAI_API_KEY=sk_test_xxxxxxxxxxxxx
```

## Usage

### Step 1: Content Intake
1. Navigate to `/page/dashboard/content-intake`
2. Upload study files (PDF, DOCX, PPTX, TXT)
   - Or click "Load sample files" to test with examples
3. Click "Process Files"

### Step 2: Select Topics
1. Topics will be extracted automatically
2. Select which topics to include in flashcard generation
3. Click "Generate Flashcards with AI"

### Step 3: Study Flashcards
1. Automatically redirected to `/page/flashcard`
2. Click cards to flip and reveal answers
3. Use Previous/Next to navigate
4. Click Reset to start over

## How It Works

### API Route: `/api/generate-flashcards`
**Endpoint:** `POST /api/generate-flashcards`

**Request:**
```json
{
  "content": "Study material text...",
  "fileNames": "Biology_Chapter3.pdf, History_Notes.docx",
  "numCards": 10
}
```

**Response:**
```json
{
  "success": true,
  "flashcards": [
    {
      "question": "What is photosynthesis?",
      "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
    }
  ],
  "count": 10
}
```

### Data Storage
- Flashcards are stored in browser **localStorage** under key `generatedFlashcards`
- Persists across page refreshes
- Clear by deleting the localStorage key or clicking "Upload more"

## Customization

### Adjust Number of Flashcards
In [content-intake/page.jsx](app/page/dashboard/content-intake/page.jsx), modify:
```javascript
numCards: Math.min(selectedTopics.length * 3, 20)
```

### Change GPT Model
In [app/api/generate-flashcards/route.js](app/api/generate-flashcards/route.js), modify:
```javascript
model: "gpt-4o-mini" // Change to "gpt-4", "gpt-4o", etc.
```

### Modify Prompt Template
Edit the `prompt` variable in the API route to customize flashcard generation style.

## Troubleshooting

### "OpenAI API key not configured"
- Check `.env.local` exists and `OPENAI_API_KEY` is set
- Restart the dev server: `npm run dev`

### "Invalid JSON response from OpenAI"
- The API might be returning markdown-wrapped JSON
- The code attempts to extract JSON automatically
- Check OpenAI status page: https://status.openai.com

### Rate Limiting
- Free tier has limited requests per minute
- Wait a moment and try again
- Upgrade your OpenAI plan for higher limits

### Poor Quality Flashcards
- Try with shorter, more specific content
- Use clearer source material
- Adjust the `temperature` parameter (0.7 = balanced; lower = more consistent)

## File Structure
```
app/
├── api/
│   └── generate-flashcards/
│       └── route.js          # OpenAI API integration
├── page/
│   ├── dashboard/
│   │   └── content-intake/
│   │       └── page.jsx      # Upload & topic selection
│   └── flashcard/
│       ├── page.jsx          # Flashcard viewer
│       └── flashcard.css     # Card flip animation
└── ...
```

## Performance Tips

1. **Limit card generation** - Start with 10-15 cards for better quality
2. **Use quality source material** - Clear, well-organized content produces better flashcards
3. **Batch requests** - Generate once, study multiple times (no additional API calls)
4. **Monitor API usage** - Check https://platform.openai.com/account/usage/limits

## API Costs

- **GPT-4 Mini**: ~$0.00015 per 1K input tokens, $0.0006 per 1K output tokens
- Average generation: ~1000-2000 tokens per request
- Example: 10 flashcards ≈ $0.002-0.003 per request

## Future Enhancements

- [ ] Save flashcard sets to database
- [ ] User accounts and sync
- [ ] Spaced repetition algorithm
- [ ] Multiple choice questions
- [ ] Image extraction and processing
- [ ] Support for audio/video content
- [ ] Batch API for faster processing
