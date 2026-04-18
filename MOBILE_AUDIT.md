# Mobile Optimisation Audit

**Date:** 2026-04-18  
**Sites audited:** mydojo.software, petcare.software, mytattoo.software, mydriveschool.software  
**Framework:** Astro 5.x (mydriveschool: Astro 4.x), Tailwind CSS, TypeScript  
**Styling:** Tailwind JIT + `global.css` custom component layer  
**Navigation component:** `src/components/Navigation.astro` (identical pattern across all 4 sites)  
**Global layout:** `src/layouts/BaseLayout.astro`  
**Global CSS:** `src/styles/global.css`

---

## Findings

### 1.1 Viewport & meta

| Site | viewport meta | max-scale/user-scalable | theme-color |
|------|--------------|------------------------|-------------|
| mydojo.software | ✅ `width=device-width, initial-scale=1.0` | ✅ None | ❌ Missing |
| petcare.software | ✅ | ✅ | ❌ Missing |
| mytattoo.software | ✅ | ✅ | ❌ Missing |
| mydriveschool.software | ✅ | ✅ | ❌ Missing |

**Finding 1.1.A — Missing `theme-color`** · Severity: **Low**  
- Files: All 4 `src/layouts/BaseLayout.astro`  
- Problem: No `<meta name="theme-color">` — mobile browser chrome stays default grey instead of brand navy.  
- Fix: Add `<meta name="theme-color" content="#1A1A2E" />` to `<head>`.

---

### 1.2 Burger menu / mobile navigation — **Critical known bug**

All four sites share the identical pattern:

```html
<!-- nav is position: fixed top-0 left-0 right-0 -->
<div class="md:hidden hidden" id="mobile-menu">
  <div class="px-4 py-4 bg-white border-t border-gray-100 shadow-lg">
    <!-- nav links — can be very long (mydriveschool has 17 links) -->
  </div>
</div>
```

```js
mobileBtn?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('hidden');
});
```

**Finding 1.2.A — Mobile menu clips below viewport (no scroll)** · Severity: **Critical**  
- Files: All 4 `src/components/Navigation.astro`, inner content div  
- Current: The inner `div` has no `max-height` or `overflow-y: auto`. The fixed nav expands downward. On a 667px-tall viewport (iPhone SE), the menu on mydriveschool (17 items) is ~500px of links — items at the bottom are unreachable.  
- Fix: Add `overflow-y-auto overscroll-contain max-h-[calc(100dvh-4rem)]` to the inner content div. (`4rem` = `h-16` nav height on mobile.)

**Finding 1.2.B — No `aria-expanded` or `aria-controls` on burger button** · Severity: **Critical** (accessibility)  
- Files: All 4 `src/components/Navigation.astro` line ~101–110 (mydojo), equivalent in others  
- Current: `<button ... aria-label="Open menu">` — no state indication. Screen readers cannot announce open/closed state.  
- Fix: Add `aria-expanded="false" aria-controls="mobile-menu"` to button; toggle in JS.

**Finding 1.2.C — No `Escape` key handler** · Severity: **Critical** (accessibility/keyboard)  
- Files: All 4 `src/components/Navigation.astro` `<script>` block  
- Current: Menu can only be closed by clicking the burger again. No keyboard escape path.  
- Fix: Add `keydown` listener for `Escape` that closes menu and returns focus to trigger.

**Finding 1.2.D — No body scroll lock** · Severity: **High**  
- Files: All 4 `src/components/Navigation.astro` `<script>` block  
- Current: When menu is open, the underlying page body remains scrollable, causing confusing two-layer scroll behavior.  
- Fix: Set `document.body.style.overflow = 'hidden'` on open; restore on close.

**Finding 1.2.E — `overscroll-behavior: contain` missing** · Severity: **Medium**  
- Once overflow-y-auto is added (1.2.A fix), rubber-band scroll on iOS can bleed through to the body.  
- Fix: `overscroll-contain` Tailwind class on the scrollable container.

**Finding 1.2.F — mytattoo mobile nav omits dropdown sub-items** · Severity: **Medium**  
- File: `mytattoo.software/src/components/Navigation.astro` lines 69–73  
- Current: The mobile nav only renders the top-level link for "Software", not the 6 sub-pages (booking, scheduling, app, artist, calculator). Mobile users can't navigate to these pages.  
- Fix: Add the same `link.dropdown` rendering block that mydojo and petcare have.

---

### 1.3 Touch targets

**Finding 1.3.A — Burger button below 44px minimum** · Severity: **High**  
- Files: All 4 `src/components/Navigation.astro` burger button  
- Current: `class="md:hidden p-2 ..."` with `w-6 h-6` SVG = 8+24+8 = 40px. WCAG 2.5.5 requires 44×44px.  
- Fix: Add `min-w-[44px] min-h-[44px] flex items-center justify-center` to button class.

**Finding 1.3.B — Cookie consent buttons below 44px** · Severity: **Medium**  
- Files: `mydojo.software`, `petcare.software`, `mytattoo.software` `src/components/CookieConsent.astro`  
- Current: `class="btn-secondary text-sm px-6 py-2"` — `.btn` has `py-3` but `py-2` overrides it. 8+8+24 ≈ 40px.  
- Not an issue on mydriveschool (already uses `py-2.5`).  
- Fix: Change `py-2` → `py-2.5` on both consent buttons.

---

### 1.4 Typography & inputs

**Finding 1.4.A — `.input` class has no explicit font-size** · Severity: **Medium**  
- Files: All 4 `src/styles/global.css`  
- Current: `.input { @apply w-full px-4 py-3 ... }` — no font-size set. Inputs inherit from body (16px in Tailwind default, so currently safe). But if body rem changes or a parent sets a smaller size, inputs would inherit and trigger iOS auto-zoom on focus.  
- Fix: Add `text-base` (16px) to the `.input` utility class to make it explicit.

---

### 1.5 Layout & overflow

No global `width: 100vw` found. `overflow-hidden` on hero sections is correct scoping (clipping decorative backgrounds, not content). No horizontal overflow triggers found at code level.

---

### 1.6 Viewport units

**Finding 1.6.A — `min-h-screen` on `<body>`** · Severity: **Low**  
- Files: All 4 `src/layouts/BaseLayout.astro`  
- Current: `<body class="min-h-screen flex flex-col">` — `screen` maps to `100vh`. On mobile Safari, `100vh` can be slightly taller than the visible area due to the address bar, causing a small gap. `min-h-dvh` is more accurate.  
- Impact: Low for `min-height`; body content fills the screen regardless. No clipping occurs. Noting for completeness.

No `h-screen` (fixed-height) usage found — the critical case is `h-screen` / `h-[100vh]`, not `min-h`.

---

### 1.7 Safe-area insets

**Finding 1.7.A — Fixed nav has no safe-area-inset padding** · Severity: **Low**  
- Files: All 4 `src/components/Navigation.astro`  
- Current: `<nav class="fixed top-0 left-0 right-0 ...">` — on notched iPhones, content at the very edge of the nav can be obscured.  
- The nav has `px-4` via `container-custom` which provides some clearance. No content is edge-to-edge inside the nav.  
- Risk is low; noting for reference.

---

### 1.8 Hover & touch

**Finding 1.8.A — Desktop dropdown menus are hover-only** · Severity: **Medium**  
- Files: All 4 `src/components/Navigation.astro` desktop dropdown  
- Current: `group-hover:opacity-100 group-hover:visible` — dropdown only appears on hover. Touch-screen users on desktop-width viewports (tablets in landscape) cannot access dropdown items.  
- Fix: Not addressed in this audit pass (requires JS refactor of desktop nav). Noted for future sprint. Mobile users are served by the inline mobile menu, so no regression for primary mobile use case.

---

### 1.9 Performance

- Fonts loaded via `media="print" onload="this.media='all'"` — correct non-blocking pattern. ✅  
- Google Analytics loaded conditionally after cookie consent — no render-blocking scripts. ✅  
- Hero images: Sections use CSS `background-image` or Astro `<Image>` components; no `loading="lazy"` on above-fold images found. ✅  
- `ComparisonTable.astro` already has `overflow-x: auto; -webkit-overflow-scrolling: touch` — tables are handled. ✅

---

### 1.11 Forms

**Finding 1.11.A — Contact form inputs missing `autocomplete` attributes** · Severity: **Low**  
- File: `mydojo.software/src/pages/contact.astro` (and equivalents)  
- Current: `<input type="text" ...>` without `autocomplete="name"`, `autocomplete="email"`, etc.  
- Fix: Add appropriate `autocomplete` values. Not critical; noted for improvement.

---

### 1.12 Accessibility-mobile overlap

**Finding 1.12.A — No skip-to-content link** · Severity: **High**  
- Files: All 4 `src/layouts/BaseLayout.astro`  
- Current: No skip link. Keyboard/screen reader users must tab through all nav items on every page load.  
- Fix: Add a visually-hidden skip link before `<Navigation />` that becomes visible on focus.

---

## Fix Plan (prioritised)

| # | Severity | Finding | Affected Sites | Files |
|---|----------|---------|---------------|-------|
| 1 | Critical | 1.2.A Mobile menu can't scroll | All 4 | Navigation.astro |
| 2 | Critical | 1.2.B Missing aria-expanded | All 4 | Navigation.astro |
| 3 | Critical | 1.2.C No Escape key handler | All 4 | Navigation.astro |
| 4 | High | 1.2.D No body scroll lock | All 4 | Navigation.astro |
| 5 | High | 1.3.A Burger button < 44px | All 4 | Navigation.astro |
| 6 | High | 1.12.A No skip-to-content link | All 4 | BaseLayout.astro |
| 7 | Medium | 1.2.E overscroll-contain missing | All 4 | Navigation.astro |
| 8 | Medium | 1.2.F mytattoo mobile dropdown missing | mytattoo | Navigation.astro |
| 9 | Medium | 1.3.B Cookie consent buttons < 44px | mydojo, petcare, mytattoo | CookieConsent.astro |
| 10 | Medium | 1.4.A .input no explicit font-size | All 4 | global.css |
| 11 | Low | 1.1.A Missing theme-color | All 4 | BaseLayout.astro |

---

## Post-fix Results

*(Updated after fixes are applied)*

### Resolved

| Fix | Commits | Notes |
|-----|---------|-------|
| Mobile menu scroll (1.2.A), aria-expanded (1.2.B), Escape key (1.2.C), body lock (1.2.D), overscroll-contain (1.2.E), burger size (1.3.A) | mydojo 04d3a35 · petcare 2e098a6 · mytattoo b5f5edb · mydriveschool 06c9b98 | All 4 Navigation.astro |
| Skip-to-content link (1.12.A) + theme-color (1.1.A) | mydojo aa9489d · petcare b26214f · mytattoo e40238b · mydriveschool 502ff46 | All 4 BaseLayout.astro |
| mytattoo mobile dropdown sub-items (1.2.F) | mytattoo e40238b | mytattoo Navigation.astro |
| Cookie consent buttons 44px (1.3.B) | mydojo f7ca602 · petcare cef4256 · mytattoo c3b45ad | CookieConsent.astro (mydriveschool already used py-2.5) |
| .input explicit text-base (1.4.A) | mydojo f7ca602 · petcare cef4256 · mytattoo c3b45ad · mydriveschool 355e7ce | All 4 global.css |

### Build verification

All 4 sites built successfully with zero new warnings after all fixes:

| Site | Pages built | SEO verify |
|------|------------|------------|
| mydojo.software | 47 pages | ✅ 33 indexed pages passed |
| petcare.software | 64 pages | ✅ 50 indexed pages passed |
| mytattoo.software | 43 pages | ✅ 35 indexed pages passed |
| mydriveschool.software | 146 pages | ✅ 93 indexed pages passed |

### Code-level viewport verification (320px / 375px / 390px / 768px / 1024px)

- **Mobile menu at 320–390px**: `max-h-[calc(100dvh-4rem)]` limits menu to viewport height minus 64px nav bar; `overflow-y-auto` enables internal scroll. All links reachable. ✅
- **Burger button**: `min-w-[44px] min-h-[44px]` applies at all mobile breakpoints. ✅
- **768px (md breakpoint)**: mobile menu hidden via `md:hidden`; desktop nav shows. No regression. ✅
- **1024px**: Same as 768px. Desktop nav functional. ✅
- **Horizontal scroll**: No `width: 100vw` or fixed pixel widths found. `container-custom` uses `max-w-7xl` + `px-4`. ✅
