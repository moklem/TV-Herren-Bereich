# Plan: LLM-based PDF Team Extraction + Mobile Layout Fix

## Context

The current PDF import mechanism uses rigid regex patterns that fail on most PDF formats, causing 0 teams found. Two issues to fix:
1. Replace regex parsing with OpenRouter LLM call
2. Fix mobile layout in ImportMatchesPDF.js

## Change 1: Server-side LLM extraction (`server/routes/eventRoutes.js`)

**Replace lines 314–448** (the entire regex parsing + response block) with an OpenRouter LLM call.

Keep: `pdfParse(req.file.buffer)`, `const text = pdfData.text`

Remove: `hallMap`, `halleMatch`, `matchedLines`, `unmatchedLines`, the entire for-loop, the regex patterns.

Add after `const text = pdfData.text`:

```javascript
// LLM-based match extraction via OpenRouter
const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://inteam.onrender.com',
    'X-Title': 'InTeam Volleyball'
  },
  body: JSON.stringify({
    model: 'nvidia/nemotron-nano-12b-v2-vl:free',
    messages: [{
      role: 'user',
      content: `Extract all volleyball match entries from this German schedule PDF text. Return ONLY a valid JSON array with no other text or markdown code fences. Each element must have exactly these fields: {"nr": number, "datum": "DD.MM.YYYY", "zeit": "HH:MM", "teamA": "string", "teamB": "string", "location": "string"}\n\nPDF Text:\n${text}`
    }],
    temperature: 0.1
  })
});

if (!llmRes.ok) {
  const errText = await llmRes.text();
  throw new Error(`OpenRouter API error: ${llmRes.status} - ${errText}`);
}

const llmData = await llmRes.json();
const rawContent = llmData.choices?.[0]?.message?.content || '[]';

// Extract JSON array — LLM may wrap output in markdown code fences
let matches = [];
const jsonArrayMatch = rawContent.match(/\[[\s\S]*\]/);
if (jsonArrayMatch) {
  matches = JSON.parse(jsonArrayMatch[0]);
}

// Normalize fields and filter out incomplete entries
matches = matches
  .map(m => ({
    nr: parseInt(m.nr) || 0,
    datum: (m.datum || '').trim(),
    zeit: (m.zeit || '').trim(),
    teamA: (m.teamA || '').trim(),
    teamB: (m.teamB || '').trim(),
    halleCode: '',
    location: (m.location || '').trim()
  }))
  .filter(m => m.datum && m.teamA && m.teamB);

const teams = [...new Set([...matches.map(m => m.teamA), ...matches.map(m => m.teamB)])].sort();

res.json({ matches, teams, totalMatches: matches.length });
```

**Environment variable**: Add `OPENROUTER_API_KEY` to Render backend environment.

---

## Change 2: Client mobile layout (`client/src/pages/coach/ImportMatchesPDF.js`)

5 targeted edits:

**A — Stepper** (line ~426): Add `alternativeLabel`
```javascript
// Before:
<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
// After:
<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
```

**B — Paper padding** (line ~425): Responsive padding
```javascript
// Before:
<Paper elevation={3} sx={{ p: 3 }}>
// After:
<Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
```

**C — Page title** (line ~420): Smaller title on mobile
```javascript
// Before:
<Typography variant="h4" component="h1">
  Spielplan importieren (PDF)
</Typography>
// After:
<Typography variant="h5" component="h1">
  Spielplan importieren (PDF)
</Typography>
```

**D — Table container** (line ~544): Horizontal scrolling
```javascript
// Before:
<TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
// After:
<TableContainer component={Paper} variant="outlined" sx={{ mt: 2, overflowX: 'auto' }}>
```

**E — Upload button** (line ~478): Full-width on mobile
```javascript
// Before:
<Button
  variant="contained"
  onClick={handleUploadPDF}
  disabled={!pdfFile || uploading}
  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
>
// After:
<Button
  variant="contained"
  onClick={handleUploadPDF}
  disabled={!pdfFile || uploading}
  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
  sx={{ width: { xs: '100%', sm: 'auto' } }}
>
```

---

## Files Modified
- `server/routes/eventRoutes.js`
- `client/src/pages/coach/ImportMatchesPDF.js`

## Environment Variable Required
- `OPENROUTER_API_KEY` → add to Render backend service (user provides key)

## Verification
1. Upload a real PDF → teams populate in step 2 dropdown
2. Mobile (375px): Stepper labels below icons, no overflow
3. Match table scrolls horizontally
4. Upload button full-width on mobile
