# Frontend Instructions

---
description: Frontend UI development conventions and patterns
applyTo: "**/*.tsx,**/*.jsx,apps/web/**,src/components/**,src/pages/**,src/app/**"
---

<!--
  Path-specific instructions for frontend/UI code.
  Place at: .github/instructions/frontend.instructions.md
  Keep under 40 lines.
-->

## Component Patterns

- Prefer functional components with hooks
- Co-locate component, styles, types, and tests in same directory
- Extract reusable logic into custom hooks
- Keep components under 150 lines — split if larger

## State Management

- Local state for UI-only concerns (useState/useReducer)
- Global state only for data shared across distant components
- Derive computed values — don't store what you can calculate
- Avoid prop drilling beyond 2 levels — use context or composition

## Styling

- Follow the project's chosen approach (CSS modules, Tailwind, styled-components)
- Use design tokens / theme values, not hardcoded colors or spacing
- Mobile-first responsive design

## Accessibility

- All interactive elements must be keyboard-navigable
- Images need meaningful alt text (or empty alt for decorative)
- Use semantic HTML elements (button, nav, main, section)
- ARIA attributes only when semantic HTML isn't sufficient

## Performance

- Lazy-load routes and heavy components
- Memoize expensive computations (useMemo) and stable callbacks (useCallback)
- Avoid re-renders from unstable references in props
