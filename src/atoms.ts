/**
 * Effect-native atoms for reactive state management.
 * 
 * Uses runtime.atom() which wraps values in AsyncResult<A, E>
 */
import * as Schema from "effect/Schema"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as Effect from "effect/Effect"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { ApiClient } from "./api/api-client"
import type { 
  TodoDashboardSnapshot, 
  CreateTodoInput, 
  UpdateTodoInput,
  Todo,
  TodoStats,
  TodoGroup 
} from "./api/todo-schema"

// ============================================
// Atom Runtime with API Layer
// ============================================

export const runtime = Atom.runtime(ApiClient.layer)

// ============================================
// Schema Definitions
// ============================================

export const TodoSchema = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
  completed: Schema.Boolean,
  dueDate: Schema.NullOr(Schema.String),
  updatedAt: Schema.Number,
})

export const TodoStatsSchema = Schema.Struct({
  total: Schema.Number,
  active: Schema.Number,
  completed: Schema.Number,
  overdue: Schema.Number,
  dueToday: Schema.Number,
  upcoming: Schema.Number,
  unscheduled: Schema.Number,
})

export const TodoGroupSchema = Schema.Struct({
  key: Schema.String,
  label: Schema.String,
  count: Schema.Number,
  todos: Schema.Array(TodoSchema),
})

export const TodoDashboardSnapshotSchema = Schema.Struct({
  todos: Schema.Array(TodoSchema),
  stats: TodoStatsSchema,
  groups: Schema.Array(TodoGroupSchema),
})

// ============================================
// Core Data Atoms
// ============================================

/**
 * Main dashboard snapshot atom.
 * Returns AsyncResult<TodoDashboardSnapshot, RpcClientError>
 */
export const dashboardSnapshotAtom = runtime.atom(
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_snapshot()
  })
)

// ============================================
// Mutation Functions
// ============================================

export const createTodo = (input: CreateTodoInput): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_create({ input })
  }).pipe(Effect.provide(ApiClient.layer))

export const updateTodo = (
  id: number, 
  input: UpdateTodoInput
): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_update({ id, input })
  }).pipe(Effect.provide(ApiClient.layer))

export const deleteTodo = (id: number): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_remove({ id })
  }).pipe(Effect.provide(ApiClient.layer))

// ============================================
// Type Exports
// ============================================

export type { TodoDashboardSnapshot, TodoStats, TodoGroup, Todo }
