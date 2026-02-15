# Francis Says No Prompt Pack

## 1) Master System Prompt (Persistent)

Use this as your persistent system/developer instruction:

```text
You are building Francis Says No, a renovation budget intelligence dashboard for first-time homeowners in Singapore. Build only within MVP scope: project budget, zones, wishlist items, expenses, budget-vs-spent visibility, health score, and proactive spend alerts. Keep out of scope: marketplace, contractor matching, AI chat assistant, cross-user benchmarking, mobile app, heavy server logic.

Technical constraints:
- Next.js App Router, React, strict TypeScript
- Tailwind with CSS variables and class-based dark mode
- Zustand for shared UI state only
- React Query for client-side async state
- Firebase Auth via service abstraction
- Static-export compatible and deployable to Vercel or Firebase App Hosting

Architecture constraints:
- No business logic in UI components
- No direct SDK calls in UI
- Services handle data access and integrations
- Hooks orchestrate service/query/store usage
- Keep functions focused and modular
- No `any`, no dead code, no commented-out code

Data invariants:
- Expenses are the canonical financial source
- Financial intelligence must be computed from budget/allocation/expense aggregates, not persisted as static fields
```

## 2) Feature Task Prompt Template

Copy, fill, and use this per feature:

```text
Context:
Francis Says No is a renovation budget intelligence dashboard focused on clarity, low setup, and proactive guidance for first-time homeowners in Singapore.

Task:
Implement: <feature_name>

In Scope:
- <must-have capability 1>
- <must-have capability 2>

Out of Scope:
- Marketplace, contractor matching, AI chat assistant, cross-user benchmarking, mobile app
- Any unrelated refactor

Hard Constraints:
- Next.js App Router + strict TypeScript
- No business logic in components
- No direct SDK usage in UI
- Services for data access, hooks for orchestration
- Zustand only for shared UI state
- React Query for async client fetching
- Tailwind + CSS variables; black/white/grey palette; border radius 0
- Static-export compatible

Data Rules:
- Use expenses as canonical source for spending calculations
- Compute derived metrics at query/service/domain layer; do not persist derived intelligence fields

Output Contract:
- Return only changed files and code
- Keep functions short and focused
- No fake data unless explicitly requested
- No test scaffolding unless explicitly requested

Acceptance Criteria:
- <behavior criterion 1>
- <behavior criterion 2>
- Lint, typecheck, and build pass
```

## 3) Definition of Done Checklist

- Scope aligns with MVP and does not introduce out-of-scope features.
- Components are presentational; business logic sits in hooks/services.
- No direct SDK usage inside UI components.
- Strict typing preserved (`any` not used).
- Derived financial intelligence is computed, not statically stored.
- Styling follows design language (black/white/grey, radius `0`, minimal dashboard).
- Dark mode remains class-based and token-driven via CSS variables.
- Static-export compatibility is preserved.
- No dead code, debug logs, or commented-out blocks.
- Lint, typecheck, and production build succeed.

## 4) Guardrail Snippets

Use these exact snippets in future prompts when needed:

- "Do not add business logic inside UI components."
- "Do not call SDK clients directly from components; use services."
- "Keep Zustand state UI-oriented and minimal."
- "Use React Query for async client state and fetching."
- "Use expenses as the single source of truth for spend calculations."
- "Compute intelligence from data; do not store precomputed intelligence fields."

## 5) Prompt Pack Maintenance Workflow

1. Treat `README.md` as the single source of truth.
2. When product direction changes, update this file and `.cursor/rules/francis-core-guidelines.mdc` in the same commit.
3. Keep prompts imperative, concise, and stable in section order.
4. Add a dated changelog entry below for each revision.
5. Re-run affected prompts on one recent task to verify drift has not been introduced.

### Changelog
- 2026-02-15: Initial prompt pack generated from README.
