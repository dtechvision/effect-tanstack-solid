# Migration Checklist & Handoff Instructions

## Objective
Migrate `effect-tanstack-solid` from a local in-memory todo demo to a baseline-parity architecture (persistence, async state, robust UI behavior, and design-system composition), using `~/git/effect-tanstack-baseline/src` as reference.

---

## Source of truth for target behavior
- Reference codebase: `~/git/effect-tanstack-baseline/src`
- Current codebase: `./src`

Target parity themes:
1. Persistent CRUD (delete survives refresh)
2. Canonical dashboard snapshot flow
3. Async loading/error/retry UX
4. Functional edit flow
5. Design-system-driven UI composition

---

## Constraints
- Keep TypeScript strict (no `any`, no unjustified casts).
- Minimize dependencies; prefer existing project stack.
- Keep changes incremental and test-backed.
- Preserve SSR/client boundaries for TanStack Start + Solid.
- Keep `react-grab` dev-only loading in place.

---

## Phase 0 — Preparation

### Checklist
- [ ] Create a feature branch (do not work on `main`/`master`).
- [ ] Run baseline checks before changes:
  - [ ] `bun run check`
  - [ ] `bun run test`
  - [ ] `bun run build`
- [ ] Capture current behavior notes:
  - [ ] Delete is non-persistent.
  - [ ] Edit button is placeholder.
  - [ ] Refresh does not refetch backend state.

### Handoff note
Start with behavior inventory and baseline snapshots so regressions are obvious.

---

## Phase 1 — Introduce persistence backbone

### Target
Replace local-only atom mutations with API-backed, canonical snapshot updates.

### Checklist
- [ ] Add `src/api` module(s):
  - [ ] `todo-schema.ts` (Todo, stats, grouped snapshot, create/update inputs)
  - [ ] `domain-api.ts` / `domain-rpc.ts` equivalents for this repo shape
  - [ ] `api-client.ts`
- [ ] Add `src/db` module(s):
  - [ ] `schema.ts`
  - [ ] `todos-repository.ts` with create/list/update/remove
  - [ ] optional test support seed helper (`todos-test-support.ts`)
- [ ] Add server route endpoint(s) under `src/routes/api` for CRUD + snapshot.
- [ ] Add feature/application layer (`src/features/todos/*`) to compute snapshot/stats/groups from canonical store.
- [ ] Wire runtime layer(s) for server/client initialization.

### Acceptance criteria
- [ ] Create/update/delete persist across refresh.
- [ ] App can boot with persisted todos.
- [ ] No TypeScript/lint regressions.

### Handoff note
Do not touch UI yet beyond minimal plumbing. Prove persistence first.

---

## Phase 2 — Async atom model and canonical snapshot wiring

### Target
Move UI reads/writes to a remote snapshot atom + mutation atoms.

### Checklist
- [ ] Replace `src/atoms.ts` local-only model with async result model:
  - [ ] `dashboardSnapshotAtom` (remote + writable wrapper)
  - [ ] `todosAtom`, `todoStatsAtom`, `todoGroupsAtom` projections
  - [ ] `createTodoAtom`, `updateTodoAtom`, `deleteTodoAtom`
- [ ] Ensure each successful mutation updates local canonical snapshot immediately from server response.
- [ ] Ensure refresh atom/function refetches remote snapshot.
- [ ] Keep robust type contracts for IDs/dates and optional update fields.

### Acceptance criteria
- [ ] Deletion persists and UI reflects server truth.
- [ ] Refresh button actually re-fetches canonical snapshot.
- [ ] Mutation failures are observable in state.

### Handoff note
Once this phase lands, the “root cause” persistence issue is resolved.

---

## Phase 3 — Component decomposition and behavior parity

### Target
Split monolithic `App.tsx` into focused components with complete interaction flow.

### Checklist
- [ ] Refactor `src/App.tsx` into route-local feature components (or equivalent structure):
  - [ ] create-todo-form
  - [ ] dashboard-stats
  - [ ] grouped-todo-board
  - [ ] dashboard-filters
  - [ ] todo-group-section
  - [ ] todo-item
  - [ ] recent-activity
- [ ] Implement fully functional edit flow:
  - [ ] edit mode state
  - [ ] title/date form
  - [ ] save/cancel
  - [ ] mutation wiring
- [ ] Add loading/disabled states for actions.
- [ ] Add error banners/retry affordances for failed async operations.

### Acceptance criteria
- [ ] Edit works end-to-end and persists.
- [ ] Delete/create/toggle all show proper loading and error behavior.
- [ ] UI text accurately reflects architecture (no misleading “server-derived” claims if absent).

### Handoff note
This phase makes behavior user-complete and operationally safe.

---

## Phase 4 — Styling migration to design system

### Target
Move from ad-hoc CSS classes to reusable primitives/components.

### Checklist
- [ ] Add/port design system foundation:
  - [ ] tokens/classes (`src/design-system/foundation/*`)
  - [ ] primitives (`Stack`, `Inline`, `Grid`, `Surface`, etc.)
  - [ ] components (`Card`, `Button`, `Badge`, `TextField`, `Checkbox`, `Text`, `Heading`, etc.)
  - [ ] `registry.ts` if required by local DS policy
- [ ] Replace direct `.card/.todo-row/.badge` style usage in feature UI with DS components.
- [ ] Slim down `src/index.css` to app-global/base concerns only.
- [ ] Validate dark/light and responsive behavior.

### Acceptance criteria
- [ ] No visual regressions on key paths.
- [ ] Consistent spacing, tones, and component semantics.
- [ ] Styling logic centralized; component CSS duplication reduced.

### Handoff note
Keep the migration incremental; avoid giant all-at-once restyles.

---

## Phase 5 — Tests and verification hardening

### Target
Back behavior with tests equivalent to migrated capabilities.

### Checklist
- [ ] Unit tests for atoms/application flows:
  - [ ] snapshot projections
  - [ ] create/update/delete mutation state transitions
- [ ] Component tests:
  - [ ] create form validation + submit
  - [ ] todo item toggle/edit/delete interactions
  - [ ] loading and error UI states
- [ ] Persistence tests (node environment) with seeded DB support.
- [ ] Optional visual tests for critical components.
- [ ] Keep/extend existing `test/atoms.test.ts` as needed.

### Acceptance criteria
- [ ] `bun run check` passes
- [ ] `bun run test` passes
- [ ] `bun run build` passes
- [ ] New persistence and edit behaviors covered by tests

### Handoff note
No phase is complete without tests for new behavior.

---

## Phase 6 — Documentation and developer handoff

### Checklist
- [ ] Update `README.md` to reflect real architecture and run/validate commands.
- [ ] Add architecture note for data flow:
  - [ ] API/DB/application boundaries
  - [ ] snapshot read model
  - [ ] mutation update strategy
- [ ] Document known differences vs baseline (if any intentionally remain).
- [ ] Document `react-grab` setup as dev-only.

### Acceptance criteria
- [ ] New contributor can run app and understand persistence model quickly.
- [ ] Docs no longer claim unsupported behavior.

---

## Implementation order (recommended)
1. Persistence backbone (Phase 1)
2. Async atoms (Phase 2)
3. Edit + behavior parity (Phase 3)
4. DS styling migration (Phase 4)
5. Tests (Phase 5)
6. Docs/handoff cleanup (Phase 6)

---

## Minimal file-level task map

### Create / Port
- [ ] `src/api/*`
- [ ] `src/db/*`
- [ ] `src/features/todos/*`
- [ ] `src/routes/api/*`
- [ ] `src/design-system/*` (if migrating DS)
- [ ] `src/routes/-index/*` (or Solid-equivalent feature split)

### Modify
- [ ] `src/atoms.ts`
- [ ] `src/App.tsx` (or replace with composed entry)
- [ ] `src/routes/index.tsx`
- [ ] `src/index.css`
- [ ] `README.md`
- [ ] tests under `test/` and/or `src/**/*.test.ts[x]`

---

## Handoff instructions for next engineer/agent

Use this exact execution protocol:

1. **Start**
   - Confirm branch isolation.
   - Run baseline validation commands.

2. **Deliver in small PR-sized commits**
   - Commit 1: persistence/repository/api plumbing
   - Commit 2: async atoms + snapshot wiring
   - Commit 3: functional edit + loading/error UX
   - Commit 4: DS migration
   - Commit 5: tests
   - Commit 6: docs

3. **After each commit**
   - Run relevant checks (at least `bun run check`, targeted tests).
   - Keep commit message intent-focused.

4. **Final verification gate**
   - `bun run check`
   - `bun run test`
   - `bun run build`
   - Manual smoke:
     - create persists
     - toggle persists
     - edit persists
     - delete persists after refresh
     - refresh refetches canonical state

5. **Final report format**
   - List changed files
   - Summarize behavior changes
   - Include any intentional non-parity gaps
   - Include validation output summary

---

## Risks to watch
- Mixing local optimistic state with canonical snapshot in inconsistent ways.
- Creating UI that claims server-derived behavior while still local-only.
- Large unreviewable style rewrites without functional tests.
- Breaking SSR/client boundaries when introducing client-only behavior.

---

## Done definition
Migration is complete when:
- Persistent CRUD works reliably.
- Async loading/error states are implemented.
- Edit is functional and persisted.
- UI composition is modular (and design-system based if selected).
- Tests and docs are updated and green.
