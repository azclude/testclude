# CLAUDE.md

## Project Overview

Static landing page (LP) for "はじめて注文住宅相談LINE" — a LINE-based consultation service for first-time custom home builders. No build system, no package manager, no external dependencies beyond Google Fonts CDN. Content is in Japanese.

## File Structure

```
├── index.html                        # Main LP (11 sections, ~571 lines)
├── hitokuchi-banushi-yametoke.html    # Secondary article page
├── assets/
│   ├── style.css                     # All styles (~1244 lines, CSS variables for theming)
│   └── main.js                       # Vanilla JS (~82 lines, IIFE pattern)
├── .github/workflows/deploy.yml      # GitHub Pages auto-deploy on push to main
└── README.md                         # Operational docs (Japanese)
```

## Development Workflow

### Local Development

Open `index.html` directly in a browser. No build step, dev server, or compilation needed.

### Deployment

Pushes to `main` trigger automatic GitHub Pages deployment via `.github/workflows/deploy.yml`. The entire repository root is uploaded as the deployment artifact.

### No Build Tools

There is no `package.json`, no linter, no formatter, no test framework. All validation is manual/visual.

## Code Conventions

### HTML

- Language: `lang="ja"`
- Sections separated by numbered HTML comments: `<!-- ========== 1) ヘッダー ========== -->`
- Semantic elements: `<header>`, `<section>`, `<footer>`, `<nav>`, `<details>`/`<summary>` for FAQ
- Native HTML5 accordion for FAQ (no custom JS accordion)
- Proper heading hierarchy: `h1` (hero) > `h2` (sections) > `h3` (subsections)
- Accessibility: `aria-label` on interactive elements, `aria-hidden` on decorative SVGs

### CSS (`assets/style.css`)

- **Design tokens** in `:root` — colors, typography, spacing, layout, shadows, border-radius, transitions
- **BEM naming**: `.block__element--modifier` (e.g., `.header__nav-link`, `.card--promise`)
- **State classes**: `.is-active`, `.is-open`, `.is-visible`
- **Mobile-first** responsive design; single breakpoint at `960px`
- **Section comments** delimit component groups: `/* ---- Header ---- */`
- Primary color: `--color-primary: #06C755` (LINE green)
- Uses `clamp()` for fluid font sizing

### JavaScript (`assets/main.js`)

- Wrapped in an IIFE with `'use strict'`
- Vanilla JS only — no frameworks or libraries
- `IntersectionObserver` for scroll-triggered animations with fallback
- `getElementById` / `querySelector` for DOM access
- Passive scroll listeners: `{ passive: true }`
- Feature detection before using browser APIs

## Placeholder URLs (TODO Items)

These placeholders in `index.html` must be replaced before production:

| Placeholder | Purpose | Locations |
|---|---|---|
| `#TODO_LINE_URL` | LINE friend-add URL | Header CTA, Hero CTA, Final CTA (3 total) |
| `#TODO_PRIVACY_URL` | Privacy policy link | Footer |
| `#TODO_TERMS_URL` | Terms of service link | Footer |

## Key Design Decisions

- **No JavaScript frameworks**: intentionally vanilla for simplicity and performance
- **No build pipeline**: deploy static files directly
- **Progressive enhancement**: page works without JS; animations are additive
- **`prefers-reduced-motion`**: animations disabled for users who prefer reduced motion
- **Google Fonts via CDN**: "Noto Sans JP" (body) and "Inter" (accent); preconnect hints in `<head>`
- **External hero image**: loaded from Pexels CDN (`loading="eager"`)

## When Making Changes

- Edit CSS variables in `:root` to change colors, fonts, or spacing globally
- Keep the BEM naming convention for new CSS classes
- Wrap new JS in the existing IIFE or create a new one with `'use strict'`
- Maintain the numbered section comment pattern in HTML
- Test at both desktop (>960px) and mobile (<960px) widths
- Verify all `#TODO_*` placeholders are addressed before deploying
