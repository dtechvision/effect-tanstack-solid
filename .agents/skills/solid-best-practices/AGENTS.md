# Solid 2.0 Best Practices

**Version 1.0.0**  
Adapted from Vercel Engineering React patterns  
April 2026

> **Note:**  
> This document is for agents and LLMs to follow when maintaining,  
> generating, or refactoring Solid 2.0 codebases. Adapted from React patterns  
> for Solid's fine-grained reactivity model.

---

## Abstract

Comprehensive performance optimization guide for Solid 2.0 applications. Contains 40+ rules across 8 categories, prioritized by impact from critical (eliminating waterfalls, reducing bundle size) to incremental (advanced patterns). Each rule includes detailed explanations, real-world examples comparing incorrect vs. correct implementations.

**Key difference from React:** Solid uses fine-grained reactivity, not re-renders. Components execute once, and signals update only the specific DOM nodes they affect.

---

## Table of Contents

1. [Eliminating Waterfalls](#1-eliminating-waterfalls) — **CRITICAL**
2. [Bundle Size Optimization](#2-bundle-size-optimization) — **CRITICAL**
3. [Server-Side Performance](#3-server-side-performance) — **HIGH**
4. [Client-Side Data Fetching](#4-client-side-data-fetching) — **MEDIUM-HIGH**
5. [Reactivity Optimization](#5-reactivity-optimization) — **MEDIUM**
6. [Rendering Performance](#6-rendering-performance) — **MEDIUM**
7. [JavaScript Performance](#7-javascript-performance) — **LOW-MEDIUM**
8. [Advanced Patterns](#8-advanced-patterns) — **LOW**

---

## 1. Eliminating Waterfalls — CRITICAL

Waterfalls are sequences where each async operation waits for the previous one to complete. Eliminate them for optimal loading performance.

### 1.1 Check Cheap Conditions Before Async Flags

Don't await to check a condition that could be checked synchronously.

**Solid context:** With Effect RPC, use `runApi` only after cheap checks.

```tsx
// ❌ Waterfall: awaits before checking cheap condition
function Dashboard() {
  const [user] = createResource(() => runApi(client => client.rpc.getUser()))
  
  return (
    <Show when={user()}>
      {u => (
        <Show when={u().isActive}>
          <DataPanel />
        </Show>
      )}
    </Show>
  )
}

// ✅ No waterfall: check cheap condition first
function Dashboard() {
  const [user] = createResource(() => runApi(client => client.rpc.getUser()))
  
  // Check isActive before fetching data
  const [data] = createResource(
    () => user()?.isActive ? user() : null,
    (u) => u ? runApi(client => client.rpc.getData()) : null
  )
  
  return <DataPanel data={data()} />
}
```

### 1.2 Defer Await Until Needed

Move async operations into branches where they're actually required.

```tsx
// ❌ Always fetches both, even if only one is used
function ProductPage() {
  const [details] = createResource(() => 
    runApi(client => client.rpc.getDetails())
  )
  const [reviews] = createResource(() => 
    runApi(client => client.rpc.getReviews())
  )
  
  return (
    <div>
      <ProductDetails details={details()} />
      <Show when={showReviews()}>
        <Reviews reviews={reviews()} />
      </Show>
    </div>
  )
}

// ✅ Reviews fetched only when tab is active
function ProductPage() {
  const [details] = createResource(() => 
    runApi(client => client.rpc.getDetails())
  )
  
  const [reviews] = createResource(
    () => showReviews() ? true : null,
    () => runApi(client => client.rpc.getReviews())
  )
  
  return (
    <div>
      <ProductDetails details={details()} />
      <Show when={showReviews()}>
        <Reviews reviews={reviews()} />
      </Show>
    </div>
  )
}
```

### 1.3 Promise.all() for Independent Operations

Start independent promises together.

```tsx
// ❌ Sequential (waterfall)
async function loadData() {
  const user = await runApi(client => client.rpc.getUser())
  const orders = await runApi(client => client.rpc.getOrders())
  const preferences = await runApi(client => client.rpc.getPreferences())
  return { user, orders, preferences }
}

// ✅ Parallel with Promise.all
async function loadData() {
  const [user, orders, preferences] = await Promise.all([
    runApi(client => client.rpc.getUser()),
    runApi(client => client.rpc.getOrders()),
    runApi(client => client.rpc.getPreferences())
  ])
  return { user, orders, preferences }
}

// ✅ Or use a single RPC call returning all data
async function loadData() {
  return runApi(client => client.rpc.getDashboardSnapshot())
}
```

### 1.4 Use Show Component for Async Boundaries

Use Solid's `Show` component for conditional rendering with fallbacks.

```tsx
// ❌ Manual loading states
function UserProfile() {
  const [user, { loading }] = createResource(() => 
    runApi(client => client.rpc.getUser())
  )
  
  return (
    <div>
      {loading() ? (
        <LoadingSpinner />
      ) : user() ? (
        <div>{user().name}</div>
      ) : (
        <ErrorMessage />
      )}
    </div>
  )
}

// ✅ Show component with fallback
function UserProfile() {
  const [user] = createResource(() => 
    runApi(client => client.rpc.getUser())
  )
  
  return (
    <Show
      when={user()}
      fallback={<LoadingSpinner />}
    >
      {u => <div>{u.name}</div>}
    </Show>
  )
}
```

---

## 2. Bundle Size Optimization — CRITICAL

### 2.1 Avoid Barrel File Imports

Import directly from source files, not from index.ts barrel exports.

```tsx
// ❌ Barrel import (imports everything in the barrel)
import { Button, Card, Input } from "@/components"

// ✅ Direct import (tree-shakeable)
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Input } from "@/components/Input"
```

### 2.2 Dynamic Imports for Heavy Components

Use Solid's `lazy()` for code-splitting heavy components.

```tsx
// ❌ Static import (always in bundle)
import { HeavyChart } from "@/components/HeavyChart"

// ✅ Dynamic import (lazy-loaded)
const HeavyChart = lazy(() => import("@/components/HeavyChart"))

function Dashboard() {
  return (
    <Show when={showChart()}>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={data()} />
      </Suspense>
    </Show>
  )
}
```

### 2.3 Defer Non-Critical Third-Party Libraries

Load analytics, monitoring, and non-essential libraries after hydration.

```tsx
// ❌ Blocks initial render
import { analytics } from "@/lib/analytics"
analytics.init()

// ✅ Deferred loading
createEffect(() => {
  if (typeof window !== "undefined") {
    // Load after initial paint
    requestIdleCallback(() => {
      import("@/lib/analytics").then(m => m.analytics.init())
    })
  }
})
```

---

## 3. Server-Side Performance — HIGH

### 3.1 Effect RPC for Type-Safe Server Calls

Use Effect RPC for all server communication with automatic request deduplication.

```tsx
// ✅ Effect RPC client
import { runApi } from "@/api/api-client"

function TodoList() {
  const [todos] = createResource(() => 
    runApi(client => client.rpc.todos_list())
  )
  
  return (
    <Show when={todos()}>
      {items => <ul>{items.map(todo => <li>{todo.title}</li>)}</ul>}
    </Show>
  )
}
```

### 3.2 Parallel Data Fetching with Effect

Structure Effect programs to parallelize independent operations.

```tsx
// ✅ Effect parallelization
import * as Effect from "effect/Effect"

const loadDashboard = Effect.gen(function* () {
  const [stats, groups, todos] = yield* Effect.all([
    Effect.promise(() => runApi(c => c.rpc.todos_stats())),
    Effect.promise(() => runApi(c => c.rpc.todos_groups())),
    Effect.promise(() => runApi(c => c.rpc.todos_list()))
  ], { concurrency: "unbounded" })
  
  return { stats, groups, todos }
})
```

### 3.3 Cross-Request LRU Caching

Use Effect's caching for expensive operations.

```tsx
// ✅ Effect caching
import * as Cache from "effect/Cache"

const getExpensiveData = Effect.gen(function* () {
  const cache = yield* Cache.make({
    capacity: 100,
    timeToLive: "5 minutes"
  })
  
  return yield* cache.get("key", () => 
    Effect.promise(() => runApi(c => c.rpc.expensiveOperation()))
  )
})
```

---

## 4. Client-Side Data Fetching — MEDIUM-HIGH

### 4.1 Use TanStack Query for Automatic Deduplication

Consider TanStack Query for complex client-side data fetching scenarios.

```tsx
// ✅ TanStack Query integration (optional)
import { createQuery } from "@tanstack/solid-query"

function UserProfile() {
  const query = createQuery(() => ({
    queryKey: ["user", userId()],
    queryFn: () => runApi(c => c.rpc.getUser({ id: userId() }))
  }))
  
  return (
    <Show when={query.data} fallback={<Loading />}>
      {user => <div>{user.name}</div>}
    </Show>
  )
}
```

### 4.2 Deduplicate Global Event Listeners

Share listeners across components instead of creating per-component.

```tsx
// ❌ Creates listener per component
function ScrollTracker() {
  createEffect(() => {
    const handler = () => setScroll(window.scrollY)
    window.addEventListener("scroll", handler)
    onCleanup(() => window.removeEventListener("scroll", handler))
  })
}

// ✅ Shared listener (single source of truth)
const [scrollY, setScrollY] = createSignal(0)

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => setScrollY(window.scrollY), 
    { passive: true }
  )
}

function ScrollTracker() {
  return <div>Scroll: {scrollY()}</div>
}
```

---

## 5. Reactivity Optimization — MEDIUM

Solid's fine-grained reactivity means components don't re-render. Instead, individual signal updates flow to specific DOM nodes. Optimize signal granularity.

### 5.1 Calculate Derived State During Component Execution

```tsx
// ❌ Separate signal + effect
function Cart() {
  const [items, setItems] = createSignal([])
  const [total, setTotal] = createSignal(0)
  
  createEffect(() => {
    setTotal(items().reduce((sum, item) => sum + item.price, 0))
  })
  
  return <div>Total: {total()}</div>
}

// ✅ Derived value (automatically reactive)
function Cart() {
  const [items, setItems] = createSignal([])
  const total = () => items().reduce((sum, item) => sum + item.price, 0)
  
  return <div>Total: {total()}</div>
}

// ✅ Or memoize if expensive
function Cart() {
  const [items, setItems] = createSignal([])
  const total = createMemo(() => 
    items().reduce((sum, item) => sum + item.price, 0)
  )
  
  return <div>Total: {total()}</div>
}
```

### 5.2 Split Independent Signals

```tsx
// ❌ Combined object signal (triggers on any change)
function UserProfile() {
  const [user, setUser] = createSignal({
    name: "",
    email: "",
    preferences: {}
  })
  
  return (
    <div>
      <NameDisplay name={user().name} />
      <EmailDisplay email={user().email} />
    </div>
  )
}

// ✅ Granular signals (independent updates)
function UserProfile() {
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [preferences, setPreferences] = createSignal({})
  
  return (
    <div>
      <NameDisplay name={name()} />
      <EmailDisplay email={email()} />
    </div>
  )
}
```

### 5.3 No Need for useCallback

In Solid, functions are naturally stable - they don't cause re-renders because components don't re-render.

```tsx
// ❌ React: need useCallback
const handleClick = useCallback(() => {
  doSomething()
}, [dep])

// ✅ Solid: functions are stable
function Button(props: { onClick: () => void }) {
  const handleClick = () => {
    console.log("clicked")  // Runs when clicked, not on every "render"
    props.onClick()
  }
  
  return <button onClick={handleClick}>Click</button>
}
```

### 5.4 Use Lazy State Initialization

For expensive initial values, pass a function to createSignal.

```tsx
// ❌ Runs on every component execution
const [data, setData] = createSignal(computeExpensiveValue())

// ✅ Only runs once on initialization
const [data, setData] = createSignal(() => computeExpensiveValue())
```

### 5.5 Use Refs for Transient Values

For values that change frequently but don't need to trigger updates:

```tsx
function Canvas() {
  const canvasRef: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null = null
  
  onMount(() => {
    ctx = canvasRef.getContext("2d")
  })
  
  const handleMouseMove = (e: MouseEvent) => {
    // Use ref directly, no signal needed for position
    const rect = canvasRef.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    ctx?.fillRect(x, y, 2, 2)
  }
  
  return <canvas ref={canvasRef} onMouseMove={handleMouseMove} />
}
```

---

## 6. Rendering Performance — MEDIUM

### 6.1 Don't Define Components Inside Components

```tsx
// ❌ Inner component recreated (not in Solid, but still bad practice)
function Parent() {
  const Inner = () => <div>{props.value}</div>
  return <Inner />
}

// ✅ Top-level component
function Inner(props: { value: string }) {
  return <div>{props.value}</div>
}

function Parent() {
  return <Inner value={value()} />
}
```

### 6.2 Hoist Static JSX Elements

```tsx
// ❌ Creates new element reference each time
function List() {
  return (
    <div>
      <span>Static header</span>
      <For each={items()}>{item => <div>{item}</div>}</For>
    </div>
  )
}

// ✅ Static part hoisted
const StaticHeader = <span>Static header</span>

function List() {
  return (
    <div>
      {StaticHeader}
      <For each={items()}>{item => <div>{item}</div>}</For>
    </div>
  )
}
```

---

## 7. JavaScript Performance — LOW-MEDIUM

### 7.1 Avoid Layout Thrashing

Don't read layout properties after writes in the same frame.

```tsx
// ❌ Layout thrashing
function BadList() {
  const items = () => {
    // Read
    const height = element.getBoundingClientRect().height
    // Write
    element.style.height = `${height * 2}px`
    // Read again (forces layout)
    const newHeight = element.getBoundingClientRect().height
  }
}

// ✅ Batch reads and writes
function GoodList() {
  const items = () => {
    // All reads first
    const heights = elements.map(el => el.getBoundingClientRect().height)
    // All writes after
    elements.forEach((el, i) => {
      el.style.height = `${heights[i] * 2}px`
    })
  }
}
```

### 7.2 Use Set/Map for O(1) Lookups

```tsx
// ❌ O(n) lookup
const hasItem = (id: string) => items().some(item => item.id === id)

// ✅ O(1) lookup
const itemSet = createMemo(() => new Set(items().map(i => i.id)))
const hasItem = (id: string) => itemSet().has(id)
```

### 7.3 Use flatMap to Map and Filter in One Pass

```tsx
// ❌ Two passes
const activeNames = items()
  .filter(item => item.active)
  .map(item => item.name)

// ✅ Single pass
const activeNames = items().flatMap(item => 
  item.active ? [item.name] : []
)
```

---

## 8. Advanced Patterns — LOW

### 8.1 Context with Stores for Selective Updates

```tsx
// ❌ Context with signal (subscribers re-run on any change)
const AppContext = createContext<{ user: Accessor<User> }>()

// ✅ Context with store (fine-grained updates)
const AppContext = createContext<{ user: Store<User> }>()

function UserName() {
  const { user } = useContext(AppContext)
  return <div>{user.name}</div>  // Only updates when name changes
}
```

### 8.2 Store Event Handlers

Solid functions are stable, but if you need to swap implementations:

```tsx
function Component() {
  const [handler, setHandler] = createSignal(() => console.log("default"))
  
  const onClick = () => handler()()
  
  return (
    <div>
      <button onClick={onClick}>Action</button>
      <button onClick={() => setHandler(() => () => console.log("new"))}>
        Change Handler
      </button>
    </div>
  )
}
```

### 8.3 Batch Multiple Updates

```tsx
// ❌ Multiple signal updates (each triggers independently)
const updateUser = () => {
  setName("New")
  setEmail("new@example.com")
  setAge(30)
}

// ✅ Batched update (single notification)
import { batch } from "solid-js"

const updateUser = () => {
  batch(() => {
    setName("New")
    setEmail("new@example.com")
    setAge(30)
  })
}
```

---

## Summary: React → Solid Mappings

| React | Solid 2.0 | Notes |
|-------|-----------|-------|
| `useState(initial)` | `createSignal(initial)` | Add `()` to read value |
| `useEffect(fn, deps)` | `createEffect(fn)` | Automatic dependency tracking |
| `useMemo(fn, deps)` | `createMemo(fn)` | Automatic dependency tracking |
| `useCallback(fn, deps)` | **Not needed** | Functions are stable |
| `useRef(initial)` | `let ref = initial` | Or use signals for reactive refs |
| `useContext(Context)` | `useContext(Context)` | Same API |
| `Suspense` | `Show` + `lazy` | Different pattern |
| `startTransition` | `startTransition` | From `solid-js` |
| `useNavigate` | `useNavigate` | From `@tanstack/solid-router` |

## Key Solid Principles

1. **Fine-grained reactivity:** Only updated values trigger DOM changes
2. **Components run once:** No re-renders, setup happens once
3. **Signals are getters:** Call `signal()` to read current value
4. **Effects track automatically:** No dependency arrays needed
5. **Functions are stable:** No useCallback equivalent needed
6. **Show over Suspense:** Explicit conditional rendering
