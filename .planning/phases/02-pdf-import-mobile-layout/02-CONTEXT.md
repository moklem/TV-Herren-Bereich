# Phase 2: PDF Import + Mobile Layout - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the coach event page to render correctly on mobile — no layout overflow, no bottom navigation overlap — and ensure the PDF import button is accessible and usable on small screens. The PDF import feature must allow coaches to successfully import match schedules from volleyball federation PDFs.

Creating new event types, modifying player features, or adding new pages is out of scope.

</domain>

<decisions>
## Implementation Decisions

### PDF file selection
- Use native device file picker (not camera scan or drag-and-drop)
- Standard `<input type="file" accept=".pdf">` approach — works reliably on iOS and Android

### Loading / parsing feedback
- Show a spinner with "Importing PDF..." text while parsing is in progress
- No silent processing — coach must know the app is working

### Post-parse result flow
- After successful parse, show a **review list** of found matches before importing
- Coach selects which matches to add, then confirms — not auto-imported
- Confirmation step prevents accidental bulk import

### Duplicate handling
- If a parsed match already exists as an event: **show a warning**
- Warning format: "[N] matches already exist — skip them or import anyway?"
- Coach can choose: skip duplicates or overwrite existing events

### Claude's Discretion
- PDF import button placement on mobile (FAB, header, drawer menu — pick what fits the existing coach event page layout)
- Layout fix strategy (add `pb: 10` per project conventions, or adjust container structure if needed)
- Scope of layout fix across other coach pages (fix event page; fix others only if same root cause and low risk)
- Error feedback when PDF parsing fails (empty parse result, wrong format, unsupported federation) — show clear inline error message, no crash

</decisions>

<specifics>
## Specific Ideas

- The review list before import should feel like a confirmation dialog or bottom sheet — not a full new page — keeping the flow lightweight on mobile

</specifics>

<deferred>
## Deferred Ideas

- Camera scan / OCR for printed schedule photos — significantly more complex, belongs in its own phase
- Scheduled/recurring import of PDFs — future phase

</deferred>

---

*Phase: 02-pdf-import-mobile-layout*
*Context gathered: 2026-02-24*
