# View Transitions

**Version 1.0.0**  
April 2026

> **Note:**  
> This document is for agents and LLMs to follow when implementing  
> view transitions in Solid 2.0 applications.

---

## Abstract

Guide for implementing smooth, native-feeling animations using the browser's View Transition API. Covers the `<ViewTransition>` component, `addTransitionType`, CSS view transition pseudo-elements, shared element transitions, resource reveals, list reorder, and directional navigation.

---

## Quick Start

### Core Imports

```tsx
// Solid 2.0 imports
import { ViewTransition } from "@solidjs/web"
import { startTransition, addTransitionType } from "solid-js"
import { Show } from "solid-js"  // For async boundaries
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

## Solid 2.0 Specifics

### Show Instead of Suspense

```tsx
// Solid uses Show for conditional rendering with fallback
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
- `key` prop changes force remount

```tsx
// Works in Solid
<ViewTransition key={id()} name={`item-${id()}`}>
  <Item item={item()} />
</ViewTransition>
```

---

## Reference Files

For detailed guidance, see:

- **`references/implementation.md`** — Step-by-step implementation workflow
- **`references/css-recipes.md`** — Ready-to-use CSS animation recipes
- **`references/patterns.md`** — Animation timing, troubleshooting
- **`references/tanstack-start.md`** — TanStack Solid Start specific patterns

---

## Core Concepts

### When to Animate

Every `<ViewTransition>` should communicate a spatial relationship or continuity. If you can't articulate what it communicates, don't add it.

| Priority | Pattern | What it communicates |
| -------- | ------- | ------------------- |
| 1 | **Shared element** (`name`) | "Same thing — going deeper" |
| 2 | **Suspense reveal** | "Data loaded" |
| 3 | **List identity** (per-item `key`) | "Same items, new arrangement" |
| 4 | **State change** (`enter`/`exit`) | "Something appeared/disappeared" |
| 5 | **Route change** (layout-level) | "Going to a new place" |

### Animation Triggers

| Trigger | When it fires |
|---------|---------------|
| **enter** | VT first inserted during a Transition |
| **exit** | VT first removed during a Transition |
| **update** | DOM mutations inside a VT |
| **share** | Named VT unmounts and another with same `name` mounts |

### Props Reference

```tsx
<ViewTransition
  default="none"           // "auto" | "none" | class-name
  enter="fade-in"          // string | { [type]: class }
  exit="fade-out"          // string | { [type]: class }
  share="morph"            // string | { [type]: class }
  name="unique-id"         // For shared element transitions
>
  {children}
</ViewTransition>
```

Always use `default="none"` and explicitly enable only desired triggers.

---

## Common Patterns

### Programmatic Navigation

```tsx
import { useNavigate } from "@tanstack/solid-router"
import { startTransition, addTransitionType } from "solid-js"

function ProductCard({ product }) {
  const navigate = useNavigate()

  const handleClick = () => {
    startTransition(() => {
      addTransitionType("nav-forward")
      navigate({
        to: "/products/$productId",
        params: { productId: product.id }
      })
    })
  }

  return (
    <ViewTransition name={`product-${product.id}`}>
      <div onClick={handleClick}>
        <Image src={product.image} />
      </div>
    </ViewTransition>
  )
}
```

### Shared Elements Across Routes

```tsx
// List page
<For each={products()}>
  {(product) => (
    <ViewTransition name={`product-${product.id}`}>
      <Image src={product.thumbnail} />
    </ViewTransition>
  )}
</For>

// Detail page  
<ViewTransition name={`product-${product.id}`}>
  <Image src={product.fullImage} />
</ViewTransition>
```

### Directional Navigation

```tsx
// Reusable wrapper
function DirectionalTransition({ children }) {
  return (
    <ViewTransition
      enter={{
        'nav-forward': 'slide-from-right',
        'nav-back': 'slide-from-left',
        default: 'none'
      }}
      exit={{
        'nav-forward': 'slide-to-left',
        'nav-back': 'slide-to-right',
        default: 'none'
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}

// Usage in route component
function ProductDetailPage() {
  return (
    <DirectionalTransition>
      <ProductContent />
    </DirectionalTransition>
  )
}
```

### Two-Layer Pattern (Directional + Resource Reveal)

Directional slides + resource reveals coexist because they fire at different moments:

```tsx
function ProductDetailPage() {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'slide-from-right', default: 'none' }}
      exit={{ 'nav-forward': 'slide-to-left', default: 'none' }}
      default="none"
    >
      <Show
        fallback={
          <ViewTransition exit="slide-down">
            <ProductSkeleton />
          </ViewTransition>
        }
        when={product()}
      >
        {(product) => (
          <ViewTransition enter="slide-up" default="none">
            <ProductContent product={product} />
          </ViewTransition>
        )}
      </Show>
    </ViewTransition>
  )
}
```

---

## TanStack Solid Start Quick Reference

### Vite Configuration

No special configuration needed. Standard TanStack Solid Start setup:

```ts
// vite.config.ts
import { tanstackStart } from "@tanstack/solid-start/plugin/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tanstackStart()],
})
```

### Layout-Level VT

**Do NOT add a layout-level VT wrapping `<Outlet />` if child routes have their own VTs.** Nested VTs never fire enter/exit when inside a parent VT.

### Link Component with Transitions

Since TanStack Router's `Link` doesn't have a `transitionTypes` prop, create a wrapper:

```tsx
import { Link, useNavigate } from "@tanstack/solid-router"
import { addTransitionType, startTransition } from "solid-js"

export function TransitionLink(props) {
  const navigate = useNavigate()

  return (
    <Link
      {...props}
      onClick={(e) => {
        if (props.transitionType) {
          e.preventDefault()
          startTransition(() => {
            addTransitionType(props.transitionType)
            navigate({
              to: props.to,
              params: props.params,
              search: props.search,
            })
          })
        }
        props.onClick?.(e)
      }}
    />
  )
}

// Usage
<TransitionLink
  to="/products/$productId"
  params={{ productId: "1" }}
  transitionType="nav-forward"
>
  View Product
</TransitionLink>
```

### Same-Route Dynamic Segments

When navigating between dynamic segments of the same route, use `key` + `name` + `share`:

```tsx
function CollectionPage() {
  const { slug } = useParams()

  return (
    <Show when={collection()}>
      {(collection) => (
        <ViewTransition
          key={slug()}
          name={`collection-${slug()}`}
          share="auto"
          default="none"
        >
          <CollectionContent collection={collection} />
        </ViewTransition>
      )}
    </Show>
  )
}
```

---

## Accessibility

Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

See `references/css-recipes.md` for complete accessibility CSS.
