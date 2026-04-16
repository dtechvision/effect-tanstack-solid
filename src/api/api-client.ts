import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as RpcClient from "effect/unstable/rpc/RpcClient"
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization"
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient"
import { DomainRpc } from "./domain-rpc"

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

/**
 * REST API client (fallback when RPC endpoint not active).
 */
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

export function isRpcError(error: unknown): error is { _tag: "RpcClientError" } {
  return error !== null && 
    typeof error === "object" && 
    "_tag" in error && 
    error._tag === "RpcClientError"
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  return new Error(String(err))
}
