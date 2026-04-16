# Composition Patterns

**Version 1.0.0**  
April 2026

> **Note:**  
> This document is for agents and LLMs to follow when maintaining,  
> generating, or refactoring Solid 2.0 codebases using composition.

---

## Abstract

Composition patterns for building flexible, maintainable components. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals. These patterns make codebases easier for both humans and AI agents to work with as they scale.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture) — **HIGH**
   - 1.1 [Avoid Boolean Prop Proliferation](#11-avoid-boolean-prop-proliferation)
   - 1.2 [Use Compound Components](#12-use-compound-components)
2. [State Management](#2-state-management) — **MEDIUM**
   - 2.1 [Decouple State Management from UI](#21-decouple-state-management-from-ui)
   - 2.2 [Define Generic Context Interfaces for Dependency Injection](#22-define-generic-context-interfaces-for-dependency-injection)
   - 2.3 [Lift State into Provider Components](#23-lift-state-into-provider-components)
3. [Implementation Patterns](#3-implementation-patterns) — **MEDIUM**
   - 3.1 [Create Explicit Component Variants](#31-create-explicit-component-variants)
   - 3.2 [Prefer Composing Children Over Render Props](#32-prefer-composing-children-over-render-props)

---

## 1. Component Architecture

**Impact: HIGH**

Fundamental patterns for structuring components to avoid prop proliferation and enable flexible composition.

### 1.1 Avoid Boolean Prop Proliferation

**Impact: CRITICAL (prevents unmaintainable component variants)**

Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize component behavior. Each boolean doubles possible states and creates unmaintainable conditional logic. Use composition instead.

**Incorrect: boolean props create exponential complexity**

```tsx
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header />
      <Input />
      {isDMThread
        ? <AlsoSendToDMField id={dmId} />
        : isThread
        ? <AlsoSendToChannelField id={channelId} />
        : null}
      {isEditing
        ? <EditActions />
        : isForwarding
        ? <ForwardActions />
        : <DefaultActions />}
      <Footer onSubmit={onSubmit} />
    </form>
  )
}
```

**Correct: composition eliminates conditionals**

```tsx
// Channel composer
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Thread composer - adds "also send to channel" field
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <AlsoSendToChannelField id={channelId} />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Edit composer - different footer actions
function EditComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.CancelEdit />
        <Composer.SaveEdit />
      </Composer.Footer>
    </Composer.Frame>
  )
}
```

Each variant is explicit about what it renders. We can share internals without sharing a single monolithic parent.

### 1.2 Use Compound Components

**Impact: HIGH (enables flexible composition without prop drilling)**

Structure complex components as compound components with a shared context. Each subcomponent accesses shared state via context, not props. Consumers compose the pieces they need.

**Pattern:**

```tsx
// 1. Create context
const ComposerContext = createContext<{
  value: Accessor<string>
  setValue: (v: string) => void
  submit: () => void
}>()

// 2. Provider component with state
function ComposerFrame(props: { children: JSX.Element }) {
  const [value, setValue] = createSignal("")
  
  const submit = () => {
    console.log("Submitted:", value())
  }
  
  return (
    <ComposerContext.Provider value={{ value, setValue, submit }}>
      <form>{props.children}</form>
    </ComposerContext.Provider>
  )
}

// 3. Subcomponents use context
function ComposerInput() {
  const ctx = useContext(ComposerContext)
  return (
    <input
      value={ctx?.value()}
      onInput={e => ctx?.setValue(e.currentTarget.value)}
    />
  )
}

function ComposerSubmit() {
  const ctx = useContext(ComposerContext)
  return <button onClick={ctx?.submit}>Submit</button>
}

// 4. Export namespace
export const Composer = {
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
}
```

**Usage:**

```tsx
<Composer.Frame>
  <Composer.Input />
  <Composer.Submit />
</Composer.Frame>
```

---

## 2. State Management

**Impact: MEDIUM**

Patterns for managing state in composed components.

### 2.1 Decouple State Management from UI

**Impact: HIGH (enables testing, swapping implementations)**

The provider is the only place that knows how state is managed. UI components receive state and callbacks via context, not implementation details.

**Incorrect: UI knows implementation**

```tsx
// UI knows it's using signals
function CounterDisplay() {
  const [count] = useContext(CounterContext)
  return <div>{count()}</div>  // Signal access leaked
}
```

**Correct: UI receives plain values**

```tsx
// UI receives plain values
function CounterDisplay() {
  const { count } = useContext(CounterContext)
  return <div>{count()}</div>  // Context provides accessor
}

// Provider decides implementation
function CounterProvider(props: { children: JSX.Element }) {
  const [count, setCount] = createSignal(0)
  
  return (
    <CounterContext.Provider value={{ count, setCount }}>
      {props.children}
    </CounterContext.Provider>
  )
}
```

### 2.2 Define Generic Context Interfaces for Dependency Injection

**Impact: MEDIUM (enables swapping implementations, testing)**

Define a generic interface for context, then provide different implementations.

```tsx
// Generic interface
interface UserService {
  user: Accessor<User | null>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const UserContext = createContext<UserService>()

// Real implementation
function RealUserProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<User | null>(null)
  
  const login = async (email: string, password: string) => {
    const result = await runApi(c => c.rpc.login({ email, password }))
    setUser(result)
  }
  
  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {props.children}
    </UserContext.Provider>
  )
}

// Mock implementation for testing
function MockUserProvider(props: { 
  children: JSX.Element
  mockUser: User 
}) {
  const user = () => props.mockUser
  const login = async () => {}
  const logout = () => {}
  
  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {props.children}
    </UserContext.Provider>
  )
}
```

### 2.3 Lift State into Provider Components

**Impact: MEDIUM (enables sibling communication without prop drilling)**

When siblings need to share state, lift it into a provider above both.

```tsx
// ❌ Siblings can't communicate
function Parent() {
  return (
    <div>
      <InputSection />  {/* has the input value */}
      <PreviewSection />  {/* needs the input value */}
    </div>
  )
}

// ✅ Provider shares state
function FormProvider(props: { children: JSX.Element }) {
  const [value, setValue] = createSignal("")
  
  return (
    <FormContext.Provider value={{ value, setValue }}>
      {props.children}
    </FormContext.Provider>
  )
}

function Parent() {
  return (
    <FormProvider>
      <InputSection />
      <PreviewSection />
    </FormProvider>
  )
}
```

---

## 3. Implementation Patterns

**Impact: MEDIUM**

Specific patterns for common composition scenarios.

### 3.1 Create Explicit Component Variants

**Impact: MEDIUM (clearer than boolean modes)**

Instead of `variant="primary" | "secondary" | "danger"`, create explicit components.

```tsx
// ❌ String variant (runtime errors, less discoverable)
<Button variant="primay"> {/* typo! */}

// ✅ Explicit components (compile-time checking, autocomplete)
<PrimaryButton>
<SecondaryButton>
<DangerButton>

// Implementation: share base styles
function Button(props: { 
  tone: "primary" | "secondary" | "danger"
  children: JSX.Element 
}) {
  return (
    <button class={`btn btn-${props.tone}`}>
      {props.children}
    </button>
  )
}

export function PrimaryButton(props: { children: JSX.Element }) {
  return <Button tone="primary">{props.children}</Button>
}

export function SecondaryButton(props: { children: JSX.Element }) {
  return <Button tone="secondary">{props.children}</Button>
}
```

### 3.2 Prefer Composing Children Over Render Props

**Impact: MEDIUM (simpler API, better TypeScript inference)**

Use children for composition.

```tsx
// ✅ Children composition
<DataTable data={items}>
  {item => <Row item={item} />}
</DataTable>

// Or with For component
<For each={items()}>
  {item => <Row item={item} />}
</For>
```

**Solid's `For` and `Show` components exemplify this pattern:**

```tsx
// For - iterates with keyed updates
<For each={todos()}>
  {(todo) => <TodoItem todo={todo} />}
</For>

// Show - conditional with fallback
<Show when={user()} fallback={<LoginPrompt />}>
  {(user) => <Dashboard user={user} />}
</Show>

// Switch/Match - multiple conditions
<Switch fallback={<NotFound />}>
  <Match when={route() === "home"}>
    <HomePage />
  </Match>
  <Match when={route() === "about"}>
    <AboutPage />
  </Match>
</Switch>
```

---

## Solid 2.0 Composition

Solid's component model makes composition natural:

1. **Components run once** - setup happens in component body
2. **Props are reactive** - passed as-is, reading triggers updates
3. **Context is the same** - `createContext`, `useContext`, `Provider`
4. **No re-renders** - children are stable references
5. **Slots via props** - `children` prop for nested content

**Key features:**

- No `key` prop needed (Solid tracks identity automatically)
- No `useMemo` for children (they're already stable)
- `Show` instead of conditional rendering with `&&`
- `For` instead of `map` for lists (proper keying)
