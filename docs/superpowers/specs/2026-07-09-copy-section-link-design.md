# Copy-link buttons on section headers

## Purpose

Users want to share a link that opens a style guide at a specific accordion
section. The deep-linking already works — `assets/js/scripts.js` reads
`?styleguide=X&tab=stn-K&accordion=subtype-M` on load, activates the chapter
tab, expands the section, and scrolls to it — and the address bar already
updates as you navigate. The only gap is a convenient way to grab that URL
without fishing it out of the address bar.

This feature adds a hover/focus-revealed "copy link" button to each accordion
section header.

## Scope

- **In:** copy-link button on each accordion section header.
- **Out:** chapter tabs (already easy to link via the address bar), an
  always-visible touch variant, tooltip libraries, HTTP clipboard fallback.

## Behaviour

- Each `.accordion-header` gets a small link icon, hidden until the header is
  hovered or receives keyboard focus (`:hover` / `:focus-within`).
- Clicking it copies the section's deep-link URL to the clipboard and briefly
  swaps the button's accessible label / visible state to "Copied!" for ~1.2s.
- No navigation and no expand/collapse — clicking copy must not toggle the
  section.

## The URL it copies

Built from the section's own DOM, independent of current page state (copying a
collapsed section still yields the correct link):

1. Section's parent `.tab-pane` → `id="sgt-K"` → tab param `stn-K`.
2. Section button's `data-bs-target="#subtype-M"` → accordion param `subtype-M`.
3. Preserve the current `styleguide` query param.
4. Result: `https://<host><path>?styleguide=X&tab=stn-K&accordion=subtype-M`.

This is exactly the format `scripts.js` already consumes, so no new activation
code is required.

## Implementation

Fewest files, no PHP template edits.

1. **`assets/js/scripts.js`** — on `DOMContentLoaded`, iterate
   `.accordion-button`; for each, inject a sibling
   `<button type="button" class="copy-section-link">` into its
   `.accordion-header` (sibling of the toggle button, **not** nested — nested
   buttons are invalid HTML). Wire `click`:
   - `event.stopPropagation()` so it doesn't toggle the accordion.
   - Build the URL as above.
   - `navigator.clipboard.writeText(url)`.
   - Swap to "Copied!" state, revert after ~1.2s.
2. **`assets/sass/`** — small style block for positioning + hover/focus reveal;
   recompile with `npm run build:css`.

## Accessibility

- Real `<button type="button">` with `aria-label="Copy link to this section"`.
- Revealed on `:hover` and `:focus-within` so keyboard users can reach it;
  tab order lands on it after the section's toggle button.
- Feedback text uses `aria-live="polite"` so "Copied!" is announced.

## Clipboard

`navigator.clipboard.writeText` requires a secure context (HTTPS) — fine in
production. No `execCommand` fallback (only add if plain-HTTP staging must
work).

## Verification

- Load a guide, hover a section header → link icon appears.
- Keyboard-tab to the header → icon appears, is focusable.
- Click icon → URL on clipboard matches
  `?styleguide=…&tab=stn-K&accordion=subtype-M` for that section; section does
  not toggle; "Copied!" shows then reverts.
- Paste the copied URL into a fresh tab → correct chapter active, correct
  section expanded and scrolled into view.
