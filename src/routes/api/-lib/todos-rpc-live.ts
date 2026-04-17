import { DomainRpc } from "../../../api/domain-rpc"
import type {
  CreateTodoInput,
  Todo,
  TodoDashboardSnapshot,
  TodoGroup,
  TodoId,
  TodoNotFound,
  TodoStats,
  UpdateTodoInput,
} from "../../../api/todo-schema"
import {
  createTodo,
  getTodoDashboardSnapshot,
  getTodoGroups,
  getTodoStats,
  listTodos,
  removeTodo,
  TodosApplicationLive,
  updateTodo,
} from "../../../features/todos/application"
import * as Effect from "effect/Effect"

/**
 * RPC handler implementations.
 * Each handler is a named Effect with tracing and proper layer provision.
 */

export const todos_list = (): Effect.Effect<ReadonlyArray<Todo>, never, never> =>
  Effect.gen(function*() {
    return yield* listTodos
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_list")
  )

export const todos_stats = (): Effect.Effect<TodoStats, never, never> =>
  Effect.gen(function*() {
    return yield* getTodoStats
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_stats")
  )

export const todos_groups = (): Effect.Effect<ReadonlyArray<TodoGroup>, never, never> =>
  Effect.gen(function*() {
    return yield* getTodoGroups
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_groups")
  )

export const todos_snapshot = (): Effect.Effect<TodoDashboardSnapshot, never, never> =>
  Effect.gen(function*() {
    return yield* getTodoDashboardSnapshot
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_snapshot")
  )

export const todos_getById = (_payload: { id: TodoId }): Effect.Effect<Todo, TodoNotFound, never> =>
  Effect.gen(function*() {
    const todos = yield* listTodos
    const todo = todos.find((t) => t.id === _payload.id)
    
    if (todo === undefined) {
      return yield* Effect.fail({ _tag: "TodoNotFound" as const, id: _payload.id } as TodoNotFound)
    }
    
    return todo
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_getById")
  )

export const todos_create = (payload: { input: CreateTodoInput }): Effect.Effect<TodoDashboardSnapshot, never, never> =>
  Effect.gen(function*() {
    return yield* createTodo(payload.input)
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_create")
  )

/**
 * Maps plain Error to TodoNotFound for RPC contract compliance.
 */
const mapToTodoNotFound = (id: TodoId) => 
  Effect.mapError((error: Error) => 
    ({ _tag: "TodoNotFound" as const, id }) as TodoNotFound
  )

export const todos_update = (payload: { id: TodoId; input: UpdateTodoInput }): Effect.Effect<TodoDashboardSnapshot, TodoNotFound, never> =>
  Effect.gen(function*() {
    return yield* updateTodo(payload.id, payload.input).pipe(
      mapToTodoNotFound(payload.id)
    )
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_update")
  )

export const todos_remove = (payload: { id: TodoId }): Effect.Effect<TodoDashboardSnapshot, TodoNotFound, never> =>
  Effect.gen(function*() {
    return yield* removeTodo(payload.id).pipe(
      mapToTodoNotFound(payload.id)
    )
  }).pipe(
    Effect.provide(TodosApplicationLive),
    Effect.withSpan("RpcHandler.todos_remove")
  )

/**
 * Handlers object for RpcServer.
 */
const handlers = {
  todos_list,
  todos_stats,
  todos_groups,
  todos_snapshot,
  todos_getById,
  todos_create,
  todos_update,
  todos_remove,
}

/**
 * Layer providing the RPC handlers.
 */
export const TodosRpcLive = DomainRpc.toLayer(
  Effect.succeed(handlers).pipe(
    Effect.tap(() => Effect.logInfo("RPC handlers initialized"))
  )
)
