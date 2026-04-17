---
name: solid-best-practices
description: Solid 2.0 performance optimization guidelines. Use when writing, reviewing, or refactoring Solid code to ensure optimal performance patterns. Triggers on tasks involving Solid components, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  version: "1.0.0"
  updated: "2026-04-16"
---

# Solid 2.0 Best Practices

Comprehensive performance optimization guide for Solid 2.0 applications. Contains 70 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new Solid components
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing Solid code
- Optimizing bundle size or load times

## Core Solid 2.0 Primitives

| Primitive | Purpose | Example |
|-----------|---------|---------|
| `createSignal` | Reactive state | `const [count, setCount] = createSignal(0)` |
| `createEffect` | Side effects | `createEffect(() => console.log(count()))` |
| `createMemo` | Computed values | `const doubled = createMemo(() => count() * 2)` |
| `createResource` | Async data | `const [data] = createResource(fetcher)` |
| `Show` | Conditional rendering | `<Show when={data()} fallback={<Loading />}>` |
| `For` | List rendering | `<For each={items()}>{item => <Item />}</For>` |

## Rule Categories by Priority

| Priority | Category                  | Impact      | Prefix       |
| -------- | ------------------------- | ----------- | ------------ |
| 1        | Eliminating Waterfalls    | CRITICAL    | `async-`     |
| 2        | Bundle Size Optimization  | CRITICAL    | `bundle-`    |
| 3        | Server-Side Performance   | HIGH        | `server-`    |
| 4        | Client-Side Data Fetching | MEDIUM-HIGH | `client-`    |
| 5        | Reactivity Optimization   | MEDIUM      | `reactive-`  |
| 6        | Rendering Performance     | MEDIUM      | `rendering-` |
| 7        | JavaScript Performance    | LOW-MEDIUM  | `js-`        |
| 8        | Advanced Patterns         | LOW         | `advanced-`  |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` - Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-api-routes` - Start promises early, await late in API routes
- `async-show-boundaries` - Use Show component for async boundaries

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-analyzable-paths` - Prefer statically analyzable import and file-system paths
- `bundle-dynamic-imports` - Use lazy() for heavy components
- `bundle-defer-third-party` - Load analytics/logging after hydration
- `bundle-conditional` - Load modules only when feature is activated
- `bundle-preload` - Preload on hover/focus for perceived speed

### 3. Server-Side Performance (HIGH)

- `server-auth-actions` - Authenticate server actions like API routes
- `server-cache-signal` - Use signals for per-request deduplication
- `server-cache-lru` - Use LRU cache for cross-request caching
- `server-dedup-props` - Avoid duplicate serialization
- `server-hoist-static-io` - Hoist static I/O to module level
- `server-no-shared-module-state` - Avoid module-level mutable request state
- `server-serialization` - Minimize data passed to client components
- `server-parallel-fetching` - Restructure components to parallelize fetches
- `server-parallel-nested-fetching` - Chain nested fetches per item in Promise.all

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-atom-initial-values` - Pre-seed async atoms with `initialValue` to prevent null dereference
- `client-tanstack-query-dedup` - Use TanStack Query for automatic deduplication
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Use passive listeners for scroll
- `client-localstorage-schema` - Version and minimize localStorage data

### 5. Reactivity Optimization (MEDIUM)

- `reactive-defer-reads` - Don't subscribe to state only used in callbacks
- `reactive-memo` - Use createMemo for expensive computations
- `reactive-derived-state` - Derive state during render, not effects
- `reactive-split-signals` - Split independent signals for granular updates
- `reactive-no-inline-components` - Don't define components inside components
- `reactive-lazy-state-init` - Pass function to createSignal for expensive values
- `reactive-ref-transient` - Use refs for transient frequent values

### 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-avoid-memoizing-everything` - Only memo when there's clear benefit
- `js-object-creation` - Avoid creating objects in render/derived
- `js-array-methods` - Be aware of array method performance in hot paths

### 8. Advanced Patterns (LOW)

- `advanced-context-selective` - Split context or use stores for selective reads
- `advanced-store-normalization` - Normalize data in stores
- `advanced-batch-updates` - Batch multiple signal updates

## Key Solid Principles

1. **Fine-grained reactivity:** Only updated values trigger DOM changes
2. **Components run once:** No re-renders, setup happens once
3. **Signals are getters:** Call `signal()` to read current value
4. **Effects track automatically:** No dependency arrays needed
5. **Functions are stable:** No callback memoization needed
6. **Show over conditionals:** Explicit conditional rendering with fallback

---

## Effect Atoms with @effect/atom-solid

When using Effect atoms with `@effect/atom-solid`, async atoms initialize to `null` internally before the atom mounts to the registry. Effect's `AsyncResult` type guards (`isWaiting`, `isSuccess`, `isFailure`) access `._tag` directly and crash when passed `null`.

### Pattern: Pre-seed Atoms with useAtomInitialValues

Always pre-seed async atoms with `AsyncResult.initial()` to prevent null dereference:

```tsx
import { useAtomInitialValues, useAtomValue } from "@effect/atom-solid"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

function DashboardProvider(props) {
  // Pre-seed the atom with Initial state to prevent null dereference
  useAtomInitialValues([[dashboardSnapshotAtom, AsyncResult.initial(true)]])
  
  // Now useAtomValue never returns null - safe to use AsyncResult guards
  const result = useAtomValue(() => dashboardSnapshotAtom)
  
  const loading = () => AsyncResult.isWaiting(result())
  const error = () => AsyncResult.isFailure(result()) ? result().cause : null
  
  return <Provider value={{ loading, error }}>{props.children}</Provider>
}
```

### Why This Matters

Without pre-seeding:
- `useAtomValue` returns `null` initially (Solid signal initializes to null)
- `AsyncResult.isWaiting(null)` throws "Cannot read properties of null (reading '_tag')"
- Error occurs during SSR/hydration, caught by TanStack Router as uncaught

With pre-seeding:
- Atom has valid `AsyncResult.Initial` state from first render
- Type guards work correctly without null checks
- No wrapper functions needed

### Validation

Add tests to verify the pattern:

```typescript
import { expect, test } from "vitest"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

test("AsyncResult.initial(true) is valid waiting state", () => {
  const initial = AsyncResult.initial(true)
  expect(AsyncResult.isInitial(initial)).toBe(true)
  expect(AsyncResult.isWaiting(initial)).toBe(true)
})

test("direct guards throw on null", () => {
  // Proves why pre-seeding is necessary
  expect(() => AsyncResult.isWaiting(null)).toThrow()
})
```
