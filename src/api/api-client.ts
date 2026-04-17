import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as RpcClient from "effect/unstable/rpc/RpcClient"
import * as RpcClientError from "effect/unstable/rpc/RpcClientError"
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization"
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient"
import { DomainRpc } from "./domain-rpc"
import type { TodoNotFound } from "./todo-schema"

const getBaseUrl = (
  baseWindow: { readonly location: { readonly origin: string } } | null | undefined = 
    typeof window === "undefined" ? null : window
): string => baseWindow ? baseWindow.location.origin : "http://localhost:3000"

const RpcConfigLive = RpcClient
  .layerProtocolHttp({
    url: `${getBaseUrl()}/api/rpc`,
  })
  .pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]))

export class ApiClient extends Context.Service<ApiClient>()(
  "ApiClient",
  {
    make: Effect.gen(function*() {
      const rpcClient = yield* RpcClient.make(DomainRpc)
      return {
        rpc: rpcClient,
      }
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide([RpcConfigLive, FetchHttpClient.layer]),
  )
}

/**
 * Run an API effect with the client.
 */
export const runApi = <A, E>(
  fn: (client: { rpc: any }) => Effect.Effect<A, E, any>
): Promise<A> => {
  const program = Effect.gen(function* () {
    const client = yield* ApiClient
    return yield* fn(client)
  }).pipe(Effect.provide(ApiClient.layer))
  return Effect.runPromise(program as Effect.Effect<A, E, never>)
}

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

/**
 * Type guard for RPC client errors (network, serialization, protocol).
 * 
 * @example
 * ```typescript
 * try {
 *   await runApi(c => c.rpc.todos_update({ id, input }))
 * } catch (err) {
 *   if (isRpcError(err)) {
 *     // Handle connection/serialization error
 *   }
 * }
 * ```
 */
export function isRpcError(error: unknown): error is RpcClientError.RpcClientError {
  return error instanceof RpcClientError.RpcClientError
}

/**
 * Check if error is a specific business error by its _tag.
 * 
 * @example
 * ```typescript
 * if (isBusinessError(err, "TodoNotFound")) {
 *   // err is typed as TodoNotFound
 *   console.log(err.id) // safe access
 * }
 * ```
 */
export function isBusinessError<E extends { _tag: string }>(
  error: unknown,
  tag: E["_tag"]
): error is E {
  return typeof error === "object" && 
    error !== null && 
    "_tag" in error && 
    error._tag === tag
}

/**
 * Check if error is a network/connection issue.
 * Useful for deciding whether to retry.
 */
export function isNetworkError(error: unknown): boolean {
  if (!isRpcError(error)) return false
  
  // Check error message for network indicators
  const message = String(error.message || "").toLowerCase()
  return message.includes("fetch") || 
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout")
}

/**
 * Convert any error to a standard Error object.
 * Safe to use with unknown catch values.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === "string") return new Error(err)
  if (typeof err === "object" && err !== null) {
    // Try to extract message from various error shapes
    const message = 
      "message" in err && typeof err.message === "string" 
        ? err.message 
        : "_tag" in err && typeof err._tag === "string"
          ? `Error: ${err._tag}`
          : JSON.stringify(err)
    return new Error(message)
  }
  return new Error(String(err))
}

/**
 * Create user-friendly error message from any error.
 * Handles RPC errors, business errors, and unknown errors.
 */
export function createErrorMessage(error: unknown): string {
  // RPC client errors (network, serialization, protocol)
  if (isRpcError(error)) {
    const message = String(error.message || "").toLowerCase()
    
    if (message.includes("fetch") || message.includes("network")) {
      return "Connection failed. Please check your internet connection and try again."
    }
    
    if (message.includes("timeout")) {
      return "Request timed out. The server may be busy. Please try again."
    }
    
    if (message.includes("schema") || message.includes("decode")) {
      return "Invalid data received from server. Please refresh the page."
    }
    
    return "An unexpected error occurred. Please try again."
  }
  
  // Business logic errors
  if (isBusinessError<TodoNotFound>(error, "TodoNotFound")) {
    return "This item no longer exists. It may have been deleted by another user."
  }
  
  // Default: use error message or stringify
  return toError(error).message
}

/**
 * Log error with context for debugging.
 * Preserves full error information while displaying friendly message.
 */
export function logError(context: string, error: unknown): void {
  if (isRpcError(error)) {
    console.error(`[${context}] RPC Error:`, {
      tag: error._tag,
      message: error.message,
      error,
    })
  } else if (typeof error === "object" && error !== null && "_tag" in error) {
    console.error(`[${context}] Business Error:`, {
      tag: error._tag,
      error,
    })
  } else {
    console.error(`[${context}] Unexpected Error:`, error)
  }
}

// ============================================
// REST FALLBACK (when RPC endpoint not active)
// ============================================

import type {
  CreateTodoInput,
  TodoDashboardSnapshot,
  UpdateTodoInput
} from "./todo-schema"

const assertOk = async (response: Response): Promise<Response> => {
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with ${response.status}`)
  }
  return response
}

const parseJson = async <T>(response: Response): Promise<T> => response.json() as Promise<T>

/**
 * REST API client (fallback when RPC endpoint not active).
 */
export const apiClient = {
  getSnapshot: async (): Promise<TodoDashboardSnapshot> =>
    fetch("/api/todos/snapshot")
      .then(assertOk)
      .then(parseJson<TodoDashboardSnapshot>),

  createTodo: async (input: CreateTodoInput): Promise<TodoDashboardSnapshot> =>
    fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
      .then(assertOk)
      .then(parseJson<TodoDashboardSnapshot>),

  updateTodo: async (id: number, input: UpdateTodoInput): Promise<TodoDashboardSnapshot> =>
    fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
      .then(assertOk)
      .then(parseJson<TodoDashboardSnapshot>),

  deleteTodo: async (id: number): Promise<TodoDashboardSnapshot> =>
    fetch(`/api/todos/${id}`, {
      method: "DELETE"
    })
      .then(assertOk)
      .then(parseJson<TodoDashboardSnapshot>)
}
