---
name: solid-best-practices
description: Solid 2.0 performance optimization guidelines adapted from Vercel React patterns. This skill should be used when writing, reviewing, or refactoring Solid code to ensure optimal performance patterns. Triggers on tasks involving Solid components, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel (adapted for Solid)
  version: "1.0.0"
  source: "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices"
  imported: "2026-04-16"
  commit: "dc8367e"
  modified: true
  modifications:
    - skill: "react-best-practices"
      adapted_to: "solid-best-practices"
      changes:
        - "useState → createSignal"
        - "useEffect → createEffect"
        - "useMemo → createMemo"
        - "remove useCallback (not needed in Solid)"
        - "Suspense → Show component"
        - "React.startTransition → Solid.startTransition"
      reason: "Project uses Solid 2.0 instead of React"
---

# Solid 2.0 Best Practices

Comprehensive performance optimization guide for Solid 2.0 applications, adapted from Vercel React patterns. Contains 70 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new Solid components
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing Solid code
- Optimizing bundle size or load times

## Solid vs React Quick Reference

| React | Solid 2.0 | Notes |
|-------|-----------|-------|
| `useState` | `createSignal` | Reactive primitives |
| `useEffect` | `createEffect` | Re-runs when dependencies change |
| `useMemo` | `createMemo` | Computed values |
| `useCallback` | **Not needed** | Functions are stable in Solid |
| `Suspense` | `Show` component | Conditional rendering with fallback |
| `startTransition` | `startTransition` | From `solid-js` |
| `useNavigate` | `useNavigate` | From `@tanstack/solid-router` |
| Props | Props | Same API |

## Rule Categories by Priority

| Priority | Category                  | Impact      | Prefix       |
| -------- | ------------------------- | ----------- | ------------ |
| 1        | Eliminating Waterfalls    | CRITICAL    | `async-`     |
| 2        | Bundle Size Optimization  | CRITICAL    | `bundle-`    |
| 3        | Server-Side Performance   | HIGH        | `server-`    |
| 4        | Client-Side Data Fetching | MEDIUM-HIGH | `client-`    |
| 5        | Re-render Optimization    | MEDIUM      | `rerender-`  |
| 6        | Rendering Performance     | MEDIUM      | `rendering-` |
| 7        | JavaScript Performance    | LOW-MEDIUM  | `js-`        |
| 8        | Advanced Patterns         | LOW         | `advanced-`  |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` - Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies
- `async-api-routes` - Start promises early, await late in API routes
- `async-suspense-boundaries` - Use Show component for async boundaries

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

- `client-swr-dedup` - Use TanStack Query for automatic request deduplication
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Use passive listeners for scroll
- `client-localstorage-schema` - Version and minimize localStorage data

### 5. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-memo` - Extract expensive work into memoized components
- `rerender-memo-with-default-value` - Hoist default non-primitive props
- `rerender-derived-state` - Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` - Derive state during render, not effects
- `rerender-no-inline-components` - Don't define components inside components
- `rerender-lazy-state-init` - Pass function to createSignal for expensive values
- `rerender-split-combined-hooks` - Split signals with independent dependencies
- `rerender-ref-transient-values` - Use refs for transient frequent values

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

## Key Solid Patterns

### Signals Over Props

```tsx
// ❌ React style - derived in effect
function Counter(props: { initial: number }) {
  const [count, setCount] = createSignal(props.initial)
  const doubled = () => count() * 2 // Derived value
}

// ✅ Solid style - fine-grained
function Counter(props: { initial: number }) {
  const [count, setCount] = createSignal(props.initial)
  const doubled = createMemo(() => count() * 2) // Memoized derived
}
```

### No useCallback Needed

```tsx
// ❌ React - need useCallback for stable reference
function Button({ onClick, children }: { onClick: () => void; children: any }) {
  const handleClick = useCallback(() => {
    console.log('clicked')
    onClick()
  }, [onClick])
  return <button onClick={handleClick}>{children}</button>
}

// ✅ Solid - functions are naturally stable
function Button(props: { onClick: () => void; children: any }) {
  const handleClick = () => {
    console.log('clicked')
    props.onClick()
  }
  return <button onClick={handleClick}>{props.children}</button>
}
```

### Show Instead of Suspense

```tsx
// ❌ React - Suspense for async boundaries
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// ✅ Solid - Show component
<Show when={data()} fallback={<Loading />}>
  {(data) => <Component data={data} />}
</Show>
```

### Effects Run Immediately

```tsx
// Solid - createEffect runs immediately and tracks dependencies
function Clock() {
  const [time, setTime] = createSignal(new Date())
  
  createEffect(() => {
    // Runs immediately, then re-runs when time() changes
    console.log('Time is:', time().toLocaleTimeString())
  })
  
  return <div>{time().toLocaleTimeString()}</div>
}
```
