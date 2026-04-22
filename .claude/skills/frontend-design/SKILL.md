---
name: frontend-design
description: Create and review distinctive, production-grade frontend interfaces. Use when building new UI or auditing existing components for design quality, conventions and accessibility.
allowed-tools: Read Glob Grep Write Bash
---

Use this skill in two modes depending on the request:
- **Create** — building a new component, page or feature UI from scratch
- **Review** — auditing existing files for design quality, conventions and accessibility

If no argument is passed in review mode, scan all files under `src/`.

---

## CREATE mode

### Design thinking (do this before writing any code)

Understand the context and commit to a clear aesthetic direction:
- **Purpose**: what problem does this interface solve? Who uses it?
- **Tone**: SaaS-style — clean, minimal, easy to scan (Stripe / Linear / Notion). Intentional hierarchy; nothing decorative without purpose.
- **Differentiation**: what makes this screen memorable without sacrificing clarity?
- **Constraints**: project conventions (see below), performance, accessibility.

### Implementation rules

**Styling — non-negotiable:**
- **Tailwind utility classes** for all layout, spacing, borders, and static styles
- **No hex/rgb in JSX** — colors come from design system tokens only (after theme migration: CSS variables; until then: `theme.*` tokens via inline style are the legacy exception)
- **No manual `font-size`, `font-weight`, `line-height`** — reference `typography.ts` variants
- **Inline `style={{}}`** only for runtime-computed values (e.g., `top: tooltipY`) — never for colors, typography, or static spacing
- **No CSS Modules, styled-components, or CSS-in-JS**

**Content:**
- User-facing strings via `t()` — add keys to both `en.json` and `es.json`
- `'use client'` only where hooks, events or browser APIs are used

### Design quality to aim for

- **Motion**: one well-orchestrated animation at a key moment creates more impact than scattered micro-interactions. Use Tailwind `transition-*` for hover/state changes; prioritise page load reveals and meaningful state transitions.
- **Spatial composition**: avoid predictable centered columns with equal spacing everywhere. Use asymmetry, generous negative space, deliberate visual hierarchy, or grid-breaking elements where appropriate.
- **Depth & atmosphere**: large flat solid backgrounds are a missed opportunity — consider subtle gradients or textures that add character without noise.
- **Consistency**: spacing rhythm, border-radius and shadow values must align with the existing visual system.

---

## REVIEW mode

### Convention violations (flag as errors)

- **Hex/rgb color in JSX or CSS** — must use design system tokens
- **Manual `font-size`, `font-weight`, `line-height` in components** — must use `typography.ts` variants
- **Inline `style={{}}` for colors, typography, or static spacing** — use Tailwind instead
- **CSS Modules, styled-components, or CSS-in-JS** — not allowed
- **Hardcoded user-facing strings outside `t()`** — must be in both locale files

### Accessibility
- Interactive elements with icon-only content must have `aria-label`
- Form inputs must have associated `<label>` or `aria-label`
- Color contrast: flag combinations likely to fail WCAG AA (4.5:1 normal text, 3:1 large)
- No `onClick` on non-interactive elements (`div`, `span`) — use `button`

### Component quality
- `'use client'` only where hooks, events or browser APIs are used
- No logic inside layout components — structure and style only
- Loading and error states handled where applicable

### Design quality
- **Motion**: flag transitions that feel like filler; key moments should feel intentional
- **Spatial composition**: flag purely uniform centered layouts where visual hierarchy could be stronger
- **Depth**: flag large flat surfaces that could benefit from subtle texture or gradient
- **Consistency**: flag one-off spacing, radius or shadow values that break the visual rhythm

## Output format (review)

Group findings by file. For each issue:
- **Location**: file path + line number
- **Severity**: error (convention violation) | warning (design quality)
- **Issue**: what's wrong
- **Fix**: concrete suggestion

If everything looks good, say so explicitly.
