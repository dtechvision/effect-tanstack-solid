import { createFileRoute } from "@tanstack/solid-router"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as HttpRouter from "effect/unstable/http/HttpRouter"
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse"
import * as RpcSerialization from "effect/unstable/rpc/RpcSerialization"
import * as RpcServer from "effect/unstable/rpc/RpcServer"
import { DomainRpc } from "../../api/domain-rpc"
import {
  createTodo,
  getTodoDashboardSnapshot,
  removeTodo,
  runTodosApp,
  TodosApplicationLive,
  updateTodo,
} from "../../features/todos/application"
import type { CreateTodoInput, UpdateTodoInput } from "../../api/todo-schema"
import { TodosRpcLive } from "./-lib/todos-rpc-live"

// ------------------- RPC Router -------------------

/**
 * RPC router layer - handles POST /api/rpc
 */
export const RpcRouter = RpcServer
  .layer(DomainRpc, {
    spanPrefix: "rpc",
    disableFatalDefects: true,
  })
  .pipe(
    Layer.provide(TodosRpcLive),
    Layer.provide(RpcServer.layerProtocolHttp({ path: "/api/rpc" })),
    Layer.provide(RpcSerialization.layerNdjson)
  )

// ------------------- Health Check -------------------

const HealthRoute = Effect.succeed(HttpServerResponse.json({ status: "ok" }))

// ------------------- HTTP REST API Handlers -------------------

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })

const notFound = (message: string): Response => json({ message }, 404)

const badRequest = (message: string): Response => json({ message }, 400)

const parseTodoId = (pathname: string): number | null => {
  const parts = pathname.split("/").filter(Boolean)
  const idText = parts[parts.length - 1]
  const id = Number(idText)
  if (!Number.isInteger(id)) return null
  return id
}

// ------------------- Server Runtime -------------------

const memoMap = Layer.makeMemoMapUnsafe()

/**
 * Development console logger.
 */
const DevConsoleLive = process.env.NODE_ENV === "development"
  ? Logger.layer([Logger.consolePretty()], { mergeWithExisting: true })
  : Layer.empty

/**
 * Server runtime with todos app + logging.
 */
const ServerRuntimeLive = TodosApplicationLive.pipe(
  Layer.provideMerge(DevConsoleLive)
)

// Merge RPC router with health check
// Note: We're not including REST routes here because they're handled separately
const AppLayer = Layer.mergeAll(RpcRouter).pipe(
  Layer.provideMerge(ServerRuntimeLive)
)

// Create web handler from Effect layers
const { handler: rpcHandler } = HttpRouter.toWebHandler(AppLayer, { memoMap })

// ManagedRuntime for use in loaders/server functions
export const serverRuntime = ManagedRuntime.make(ServerRuntimeLive, { memoMap })

// ------------------- REST Handlers (manual) -------------------

const handleGet = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)

  if (url.pathname === "/api/todos/snapshot") {
    return json(await runTodosApp(getTodoDashboardSnapshot))
  }

  if (url.pathname === "/api/health") {
    return json({ status: "ok" })
  }

  return notFound("Route not found")
}

const handlePost = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)

  if (url.pathname === "/api/todos") {
    const input = (await request.json()) as CreateTodoInput
    return json(await runTodosApp(createTodo(input)), 201)
  }

  return notFound("Route not found")
}

const handlePatch = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)

  if (!url.pathname.startsWith("/api/todos/")) {
    return notFound("Route not found")
  }

  const id = parseTodoId(url.pathname)
  if (id === null) return badRequest("Todo id must be an integer")

  const input = (await request.json()) as UpdateTodoInput
  try {
    return json(await runTodosApp(updateTodo(id, input)))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return notFound(message)
  }
}

const handleDelete = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)

  if (!url.pathname.startsWith("/api/todos/")) {
    return notFound("Route not found")
  }

  const id = parseTodoId(url.pathname)
  if (id === null) return badRequest("Todo id must be an integer")

  try {
    return json(await runTodosApp(removeTodo(id)))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return notFound(message)
  }
}

// ------------------- Route Export -------------------

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleGet(request),
      POST: ({ request }) => {
        const url = new URL(request.url)
        // Route RPC calls to Effect handler (handle both /api/rpc and /api/rpc/)
        if (url.pathname === "/api/rpc" || url.pathname === "/api/rpc/") {
          return rpcHandler(request)
        }
        return handlePost(request)
      },
      PATCH: ({ request }) => handlePatch(request),
      DELETE: ({ request }) => handleDelete(request),
    },
  },
})
