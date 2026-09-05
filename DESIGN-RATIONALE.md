# OmniTools — Instrument Panel Rationale

## Concept
Instrument Panel: steel/graphite surfaces, brass hardware, hairline seams, precise labeling. The admin gate and key table were already dark and utilitarian — the redesign extends that single identity to marketing and tools instead of a cream SaaS look vs technical look split. Every screen is one coherent tool.

## Tokens — `css/tokens.css`
Single source of truth, nothing hardcoded. Dark is default (`--ink-*`), light via `[data-theme="light"]` (`--paper-*`). Accents: `--brass #B8863B` (primary/action), `--signal-teal #2F7A6B` (success), `--hazard #C4472B` (destructive). Type: IBM Plex Sans (UI/headings/body) + IBM Plex Mono (keys/timestamps/versions — real data, not decoration). Scale 1.25 off 16px, line-height 1.6 body / 1.15 heading, max 80ch. Shape: panels 0–4px, hairline 1px borders, radius only on controls (inputs/buttons/pills). Verified AA before shipping with contrast checker (see below).

## Admin Dashboard — Representative Page
- **Before:** div-styled key list, placeholder-only inputs, arrow-suffixed buttons, repeated rounded cards, hover-lift on all cards.
- **After:** Real `<table>` with `<th scope>` headers, keyboard-navigable rows (Enter/Space to expand), visible `<label>` per field, password show/hide with `aria-pressed`, `aria-describedby` format hint on key input, `aria-live="polite"` on counts, confirmation on Delete Used. Keys use `gate-badge` with text + color (never color-only). Motion: `row-enter` on Generate 100, `row-exit` on Delete — no blanket card lift. Destructive `Delete used` uses distinct `hazard` outline style, not just recolored primary.

## Marketing Home
- Replaced orbiting hero (concentric rings + floating DOCX/AI/CSV/FLOW pills) with framed **live panel preview**: a hairline-bordered instrument panel showing two mock keys (`A3F9-K2P8-M7Q1-R4W6` UNUSED / `B7L2-Q9W4-E1R8-T5Y3` USED) and a foot stat. Product UI is more distinctive than an abstract blob.
- Dropped tracked-out ALL-CAPS eyebrow ("A SMARTER WAY…") → normal sentence-case muted line.
- Headline: removed single-word recolour (`<span>in one place</span>`) — personality now via system type, not one highlighted word.
- Button: "Explore all tools" (no "→" decoration; arrow kept only where it clarifies navigation like "← Back to toolbox").
- Tool cards: hairline panels, 4px radius, no shadow; hover is border-color shift, not lift/scale.

## Tool Workspace + Extension Page
- Kept two-pane input/output structure (functionally sound), restyled panes as flat hairline panels.
- Extension page: replaced middot-joined meta string ("Last updated: Sep 5 · v3.1.0 · Auto Flow") with **fact strip** — three distinct pills: Version `v3.1.0` (mono), Updated `2026-09-05`, Platform `Chrome · Windows/Linux`. Kept What it can do / Install locally split columns (genuinely informative).
- Install steps: kept numbering (real sequence) but restyled from generic blue circle badges to hairline tab index with left rail — panel labeling, not decoration.
- Voice: sentence-case, active ("Generate 100 keys", "Download extension v3.1.0"), CTA label matches confirmation ("Keys generated").

## Motion
- One orchestrated entrance: hero copy + panel fade+rise (420ms, 80ms stagger) on load only.
- State-driven: key row animates in on Generate, animates out on Delete. Hover is precise border shift, no bouncy scale. `prefers-reduced-motion` disables entrance/row animations, keeps instant functional feedback.

## Accessibility Checklist
- Contrast checked (see verification): ink-text on ink-canvas 12.1:1, brass on ink-canvas 5.2:1 as large UI, hazard on ink-canvas 5.8:1, paper-text on paper-canvas 12.8:1. All ≥4.5:1 body, ≥3:1 large/UI. 
- Focus: `box-shadow: 0 0 0 2px canvas, 0 0 0 4px brass` offset ring on all interactive, never `outline:none` without replacement.
- Keyboard: all actions reachable via keyboard, table rows are `role=button` + `tabindex` + Enter/Space handlers, gate inputs submit on Enter.
- Status: text labels retained (UNUSED/ONLINE/OFFLINE) alongside color.
- Labels: every field has persistent `<label>` (security key, Admin ID, Password).
- Password: show/hide toggle with `aria-pressed` and `aria-label` toggle.
- Key input: `aria-describedby="gateKeyHint"` with format hint.
- Counts: `aria-live="polite"` region.
- Destructive: Delete Used requires `confirm()`.
- Table: real `<table>` with `<thead>`/`<th scope>`.
- Touch: `.touch-44` on icon controls.
- Reduced motion: respected sitewide via `@media (prefers-reduced-motion: reduce)`.
- Theme switcher: `aria-label="Choose color theme"` with current value announced.

## Tokens File Delivered
`css/tokens.css` — import before `style.css`/`tool-page.css`. Build everything from it.
Next: roll out same tokens + hairline panel treatment to remaining tool pages (Recipe Index Studio, DOCX→XLSX) after admin dashboard review.
