# View Transitions

**Version 1.0.0**  
Adapted for Solid 2.0  
April 2026

> **Note:**  
> This document is for agents and LLMs to follow when implementing  
> view transitions in Solid 2.0 applications. Adapted from React patterns  
> for Solid's reactivity model.

---

## Abstract

Guide for implementing smooth, native-feeling animations using the browser's View Transition API in Solid 2.0 applications. Covers the `<ViewTransition>` component, `addTransitionType`, CSS view transition pseudo-elements, shared element transitions, resource reveals, list reorder, and directional navigation.

---

## Quick Start

### Core Imports

```tsx
// Solid 2.0 imports
import { ViewTransition } from "@solidjs/web"
import { startTransition, addTransitionType } from "solid-js"
import { Show } from "solid-js"  // For async boundaries (instead of Suspense)
import { useNavigate } from "@tanstack/solid-router"
```

### Basic Pattern

```tsx
// Wrap component in ViewTransition
<ViewTransition enter="fade-in" exit="fade-out">
  {show() && <Modal />}
</ViewTransition>

// Trigger with startTransition + addTransitionType
startTransition(() => {
  addTransitionType("nav-forward")
  navigate({ to: "/detail" })
})
```

---

## Solid 2.0 Adaptations

### React → Solid Mapping

| React | Solid 2.0 |
|-------|-----------|
| `import { ViewTransition } from "react"` | `import { ViewTransition } from "@solidjs/web"` |
| `import { startTransition } from "react"` | `import { startTransition } from "solid-js"` |
| `<Suspense>` | `<Show>` component |
| `useNavigate` from `@tanstack/react-router` | `useNavigate` from `@tanstack/solid-router` |

### Show Instead of Suspense

```tsx
// React - Suspense for async boundaries
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// Solid - Show with fallback
<Show when={data()} fallback={<Loading />}>
  {(data) => <Component data={data} />}
</Show>

// With ViewTransition
<ViewTransition>
  <Show 
    when={data()} 
    fallback={
      <ViewTransition exit="slide-down">
        <Skeleton />
      </ViewTransition>
    }
  >
    {(data) => (
      <ViewTransition enter="slide-up" default="none">
        <Content data={data} />
      </ViewTransition>
    )}
  </Show>
</ViewTransition>
```

### No Re-renders = Stable References

In Solid, components don't re-render. This means:
- Children passed to `ViewTransition` are stable references
- No need to worry about memoization of children
- `key` prop changes force remount (same as React)

```tsx
// ✅ Works the same in Solid
<ViewTransition key={id()} name={`item-${id()}`}>
  <Item item={item()} />
</ViewTransition>
```

---

## Reference Files

For detailed guidance, see:

- **`references/implementation.md`** — Step-by-step implementation workflow (framework-agnostic)
- **`references/css-recipes.md`** — Ready-to-use CSS animation recipes (framework-agnostic)
- **`references/patterns.md`** — Patterns, animation timing, troubleshooting (framework-agnostic)
- **`references/tanstack-start.md`** — TanStack Solid Start specific patterns

### TanStack Solid Start Quick Reference

```tsx
// Programmatic navigation with transitions
import { useNavigate } from "@tanstack/solid-router"