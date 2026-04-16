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
 * Each handler returns an Effect that matches the RPC schema types.
 */
const handlers = {
  todos_list: (): Effect.Effect<ReadonlyArray<Todo>, never, never> =>
    listTodos.pipe(Effect.provide(TodosApplicationLive)),

  todos_stats: (): Effect.Effect<TodoStats, never, never> =>
    getTodoStats.pipe(Effect.provide(TodosApplicationLive)),

  todos_groups: (): Effect.Effect<ReadonlyArray<TodoGroup>, never, never> =>
    getTodoGroups.pipe(Effect.provide(TodosApplicationLive)),

  todos_snapshot: (): Effect.Effect<TodoDashboardSnapshot, never, never> =>
    getTodoDashboardSnapshot.pipe(Effect.provide(TodosApplicationLive)),

  // Not implemented - returns not found error
  todos_getById: (_payload: { id: TodoId }): Effect.Effect<Todo, TodoNotFound, never> =>
    Effect.fail({ id: _payload.id, _tag: "TodoNotFound" } as unknown as TodoNotFound),

  todos_create: (payload: { input: CreateTodoInput }): Effect.Effect<TodoDashboardSnapshot, never, never> =>
    createTodo(payload.input).pipe(Effect.provide(TodosApplicationLive)),

  // These use plain Error from application layer - cast to TodoNotFound for RPC
  todos_update: (payload: { id: TodoId; input: UpdateTodoInput }): Effect.Effect<TodoDashboardSnapshot, TodoNotFound, never> =>
    updateTodo(payload.id, payload.input).pipe(
      Effect.provide(TodosApplicationLive),
      Effect.mapError(() => ({ id: payload.id, _tag: "TodoNotFound" } as unknown as TodoNotFound))
    ),

  todos_remove: (payload: { id: TodoId }): Effect.Effect<TodoDashboardSnapshot, TodoNotFound, never> =>
    removeTodo(payload.id).pipe(
      Effect.provide(TodosApplicationLive),
      Effect.mapError(() => ({ id: payload.id, _tag: "TodoNotFound" } as unknown as TodoNotFound))
    ),
}

/**
 * Layer providing the RPC handlers.
 */
export const TodosRpcLive = DomainRpc.toLayer(Effect.succeed(handlers))
