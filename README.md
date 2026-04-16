# effect-tanstack-solid

Solid Start + Effect todo dashboard using a canonical server snapshot flow.

## Architecture overview

The app is now migrated from local in-memory CRUD to persistent, async, canonical snapshot behavior.

- **Persistence boundary**: `src/db/todos-repository.ts` (PGlite-backed PostgreSQL persisted in `data/pglite` by default)
- **Application use-cases**: `src/features/todos/application.ts`
- **Read-model derivation**: `src/features/todos/projections.ts`
- **HTTP API**: `src/routes/api/$.ts`
- **Client API adapter**: `src/api/api-client.ts`
- **Async atom state model**: `src/atoms.ts`
- **UI composition**: `src/routes/-index/*` using `src/design-system/*`

The client reads from one canonical `dashboardSnapshotAtom` and derives:
- todos
- stats
- grouped board

Mutations (`create/update/delete`) return the latest canonical snapshot and immediately replace local snapshot state.

## Behavior guarantees

- Create/update/delete persist across refresh.
- Refresh actions re-fetch canonical server snapshot state.
- Edit flow is functional and persists.
- Async loading/error states are shown for dashboard and mutations.

## Run

```bash
bun install
bun run dev
```

## Validate

```bash
bun run check
bun run test
bun run build
```

## Manual smoke checklist

After `bun run dev`:

1. Create a todo, refresh page -> todo remains.
2. Toggle completion, refresh page -> state remains.
3. Edit title/date, refresh page -> edits remain.
4. Delete todo, refresh page -> item stays deleted.
5. Use dashboard refresh -> canonical snapshot refetches.

## Notes

- `react-grab` remains dev-only and is loaded in `src/routes/__root.tsx` behind `import.meta.env.DEV && !import.meta.env.SSR`.
- Local persistence uses embedded PostgreSQL through `@electric-sql/pglite` with data stored in `data/pglite`.
