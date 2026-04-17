# Error Handling: Solid + Effect RPC

This guide covers error handling patterns for the Effect RPC + Solid 2.0 architecture.

## Error Types

### 1. RPC Client Errors (`RpcClientError`)

Errors from the RPC client itself - network issues, serialization problems, protocol errors.

```typescript
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

// Type guard
if (RpcClientError.isRpcClientError(error)) {
  // Handle RPC client error
}
```

### 2. Schema Validation Errors

Errors from Effect Schema validation - invalid input data, type mismatches.

```typescript
import * as Schema from "effect/Schema"

// Schema.parse returns Either
const result = Schema.decodeUnknownEither(CreateTodoInput)(rawData)
```

### 3. Business Logic Errors (`TodoNotFound`)

Domain-specific errors defined in the RPC schema.

```typescript
// Defined in domain-rpc.ts
Rpc.make("update", {
  success: TodoDashboardSnapshot,
  error: TodoNotFound,  // <-- business error
  payload: { id: TodoId, input: UpdateTodoInput },
})
```

### 4. Runtime Errors

Unexpected errors - bugs, unhandled cases, external system failures.

## Error Handling Patterns

### Pattern 1: Basic Try/Catch with toError

Simplest approach - convert any error to Error and display message.

```tsx
import { toError } from "@/api/api-client"

async function handleSubmit() {
  try {
    await createTodoRpc(title, dueDate)
  } catch (err) {
    const error = toError(err)
    setError(error.message)
  }
}
```

### Pattern 2: RPC Error Type Discrimination

Distinguish between RPC client errors and business errors.

```tsx
import { isRpcError } from "@/api/api-client"
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

async function handleSubmit() {
  try {
    await createTodoRpc(title, dueDate)
  } catch (err) {
    if (RpcClientError.isRpcClientError(err)) {
      // Network/protocol error
      setError("Connection failed. Please try again.")
    } else if (isBusinessError(err, "TodoNotFound")) {
      // Business logic error
      setError("Todo not found. It may have been deleted.")
    } else {
      // Unknown error
      setError(toError(err).message)
    }
  }
}
```

### Pattern 3: Effect's Structured Error Handling

Use Effect's error channels for full type safety.

```typescript
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"

const program = Effect.gen(function* () {
  const client = yield* ApiClient
  
  // Errors are typed - Effect<Success, Error, Context>
  const result = yield* client.rpc.todos_update({ 
    id: todoId, 
    input: updates 
  }).pipe(
    Effect.catchAll((error) => {
      // Handle TodoNotFound
      return Effect.succeed(null) // or retry, or fail with different error
    })
  )
  
  return result
})

// Run and handle at boundary
const result = await Effect.runPromise(program)
```

### Pattern 4: Global Error Boundary

Catch errors at the route level.

```tsx
// routes/__root.tsx
export const Route = createFileRoute("/__root")({
  component: RootComponent,
  errorComponent: ErrorComponent,
})

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  )
}
```

### Pattern 5: Retry with Exponential Backoff

Use Effect's built-in retry for transient failures.

```typescript
import * as Schedule from "effect/Schedule"

const withRetry = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.retry({
      schedule: Schedule.exponential("100 millis").pipe(
        Schedule.intersect(Schedule.recurs(3))
      ),
      while: (error) => isNetworkError(error) // only retry network errors
    })
  )
```

## Error Handling Utilities

### isBusinessError

Check if error is a specific business error type.

```typescript
export function isBusinessError<E extends { _tag: string }>(
  error: unknown,
  tag: E["_tag"]
): error is E {
  return typeof error === "object" && 
    error !== null && 
    "_tag" in error && 
    error._tag === tag
}

// Usage
if (isBusinessError(error, "TodoNotFound")) {
  // error is typed as TodoNotFound
  console.log(error.id) // safe access
}
```

### isNetworkError

Check if error is a network/connection issue.

```typescript
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

export function isNetworkError(error: unknown): boolean {
  if (!RpcClientError.isRpcClientError(error)) return false
  
  // Check for specific network error codes
  return error._tag === "RequestFail" || 
    error._tag === "ConnectionError" ||
    (error.message?.includes("fetch") ?? false)
}
```

### createErrorMessage

Create user-friendly error messages.

```typescript
export function createErrorMessage(error: unknown): string {
  // RPC client errors
  if (RpcClientError.isRpcClientError(error)) {
    switch (error._tag) {
      case "RequestFail":
        return "Failed to connect to server. Please check your connection."
      case "SchemaError":
        return "Invalid data received from server."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }
  
  // Business errors
  if (isBusinessError(error, "TodoNotFound")) {
    return "This todo no longer exists. It may have been deleted."
  }
  
  // Default
  return toError(error).message
}
```

## Component Error State Pattern

Standard pattern for components with async operations:

```tsx
function TodoItem(props: { todo: Todo }) {
  // Error state at component level
  const [error, setError] = createSignal<string | null>(null)
  const [isLoading, setIsLoading] = createSignal(false)
  const { refetch } = useDashboard()

  const handleOperation = async (operation: () => Promise<void>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await operation()
      refetch() // Refresh on success
    } catch (err) {
      setError(createErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card tone={error() ? "danger" : "default"}>
      {/* Content */}
      
      <Show when={error()}>
        <Inline gap="xs">
          <Text tone="danger">{error()}</Text>
          <Button 
            variant="secondary" 
            onClick={() => { setError(null); refetch() }}
          >
            Retry
          </Button>
        </Inline>
      </Show>
    </Card>
  )
}
```

## Global Error Store (Alternative)

For app-wide error handling, use a global store:

```typescript
// stores/error-store.ts
import { createStore } from "solid-js/store"

interface AppError {
  id: string
  message: string
  timestamp: number
  type: "rpc" | "business" | "unknown"
}

const [errors, setErrors] = createStore<AppError[]>([])

export function addError(error: unknown) {
  const appError: AppError = {
    id: crypto.randomUUID(),
    message: createErrorMessage(error),
    timestamp: Date.now(),
    type: classifyError(error),
  }
  setErrors(errors => [...errors, appError])
}

export function clearError(id: string) {
  setErrors(errors => errors.filter(e => e.id !== id))
}

export function useErrors() {
  return errors
}
```

## Best Practices

1. **Always handle errors at the boundary** - Components should catch and display
2. **Use typed errors when possible** - Effect's error channels provide type safety
3. **Distinguish error types** - Network vs business vs validation need different UX
4. **Provide retry mechanisms** - For transient failures, allow users to retry
5. **Log errors appropriately** - Use Effect's built-in logging for observability
6. **Never swallow errors** - Always at least log unexpected errors
7. **Use error boundaries** - Catch unexpected errors at route/component level

## Testing Error Handling

```typescript
// Test RPC errors
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"

const mockRpcError = RpcClientError.make({
  _tag: "RequestFail",
  message: "Network error"
})

// Test business errors
const mockNotFound: TodoNotFound = {
  _tag: "TodoNotFound",
  id: 123
}
```
