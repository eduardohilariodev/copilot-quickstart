---
description: Next.js and Tailwind conventions for the web app
applyTo: "apps/web/**/*.tsx,apps/web/**/*.ts,packages/ui/**/*.tsx"
---

## Next.js Conventions

- Use App Router (`app/` directory) — no Pages Router
- Default to Server Components; add `'use client'` only when needed
- Use `next/image` for all images; never raw `<img>`
- Fetch data in Server Components or Route Handlers, not in client components
- Use `loading.tsx` and `error.tsx` for Suspense boundaries

## Tailwind CSS

- Use Tailwind utility classes — avoid custom CSS unless unavoidable
- Extract repeated patterns into `@acme/ui` components, not `@apply`
- Follow mobile-first responsive: `sm:` → `md:` → `lg:`
- Use design tokens from `tailwind.config.ts` (colors, spacing, fonts)

## Component Patterns

- Co-locate components with their route in `_components/` subdirectory
- Shared components live in `packages/ui/src/`
- Props interfaces named `{Component}Props` (e.g., `ButtonProps`)
- Use `forwardRef` for components that wrap native elements

## State & Data

- Server state: React Server Components + `fetch` with `revalidate`
- Client state: `useState` / `useReducer` for local; avoid global stores
- Forms: use Server Actions with `useFormState` / `useFormStatus`
- Validate inputs with Zod schemas shared between client and server
