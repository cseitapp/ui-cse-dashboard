---
name: frontend-skill
description: >-
  Reviews frontend code for correctness, accessibility, performance, and UI
  quality. Use when reviewing pull requests, examining Vue/Nuxt components,
  CSS, templates, client-side logic, or when the user asks for a frontend or UI
  code review.
---

# Frontend Code Review

## Quick Start

1. Detect the stack from `package.json` and existing conventions in the repo.
2. Read changed files and their callers — not just the diff in isolation.
3. Run the checklist below; skip sections that do not apply.
4. Report findings using the feedback format.

## Review Checklist

### Correctness & Logic

- [ ] Component behavior matches requirements and edge cases (empty, loading, error states)
- [ ] Reactive state updates correctly; no stale closures or missing dependencies
- [ ] Event handlers and watchers cleaned up when needed (listeners, timers, subscriptions)
- [ ] API data shapes handled defensively (`??`, optional chaining, fallbacks)
- [ ] Date/number formatting is consistent and locale-aware where needed

### Vue / Nuxt (when applicable)

- [ ] Composition API used idiomatically (`ref`/`computed`/`watch`, not unnecessary `reactive`)
- [ ] Props typed and documented; emits declared explicitly
- [ ] No business logic trapped in templates — extract to composables or script
- [ ] `v-for` has stable `:key`; avoid index keys for mutable lists
- [ ] Async data uses Nuxt patterns (`useFetch`, `useAsyncData`) — not ad-hoc fetches in `onMounted` when server fetch is possible
- [ ] Client-only APIs guarded with `import.meta.client` or `<ClientOnly>`

### Vuetify (when applicable)

- [ ] Density, variant, and color props match surrounding UI
- [ ] Date pickers use correct `view-mode` for the selection granularity (year, month, day)
- [ ] Form fields wire `v-model` / `:model-value` + `@update:model-value` correctly
- [ ] Menus/dialogs close on selection; activator slots used properly

### UI & UX

- [ ] Layout works at common breakpoints (mobile, tablet, desktop)
- [ ] Loading and empty states are visible — not blank screens
- [ ] Interactive elements have clear affordance (hover, focus, disabled styles)
- [ ] Text truncation/overflow handled for long labels and table cells
- [ ] Charts: axis labels readable, legends clear, colors distinguishable

### Accessibility

- [ ] Semantic HTML (`button` for actions, `label` for inputs, heading hierarchy)
- [ ] Icon-only controls have `aria-label` or visible text
- [ ] Focus order is logical; focus styles not removed without replacement
- [ ] Color contrast sufficient for text and chart elements
- [ ] Form errors associated with fields and announced to screen readers

### Performance

- [ ] No unnecessary re-renders (stable computed values, avoid inline object/array literals in templates)
- [ ] Large lists virtualized or paginated when appropriate
- [ ] Heavy imports lazy-loaded or tree-shaken
- [ ] Images use appropriate sizing and lazy loading
- [ ] Chart re-builds avoided when only data changes (update datasets, not destroy/recreate)

### Security

- [ ] No `v-html` with untrusted content
- [ ] User input sanitized before rendering or sending to APIs
- [ ] Secrets and tokens not exposed in client bundles or logs

### Maintainability

- [ ] Changes follow existing file structure, naming, and import style
- [ ] Duplicated UI logic extracted to shared components or composables
- [ ] Magic strings/numbers replaced with named constants where reused
- [ ] Scope is minimal — no unrelated refactors bundled in

## Feedback Format

Group findings by severity:

- **Critical** — Must fix before merge (bugs, security, broken UX, data loss)
- **Suggestion** — Worth improving (readability, a11y gaps, minor perf)
- **Nice to have** — Optional polish (naming, minor style)

For each finding:

1. State the issue in one sentence.
2. Point to the file/line or pattern.
3. Propose a concrete fix or alternative.

**Example:**

> **Suggestion** — `EnergyLineChart.vue` formats `datetime` client-side but the API already returns `period`. Use `item.period` for x-axis labels to stay consistent with the selected date type.

## When Implementing Fixes

- Match surrounding code style and abstractions.
- Prefer the smallest correct diff.
- Reuse existing components (`AppDatePicker`, shared charts, composables) before creating new ones.
- Run linter on edited files before finishing.
