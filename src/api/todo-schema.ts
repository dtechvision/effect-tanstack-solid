import * as Schema from "effect/Schema"

/**
 * Todo ID - plain number for compatibility with existing code.
 */
export const TodoId = Schema.Number
export type TodoId = typeof TodoId.Type

/**
 * ISO date string (YYYY-MM-DD format).
 * Uses pattern validation for the date format.
 */
export const TodoDate = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/, {
      description: "UTC calendar day in YYYY-MM-DD format",
    })
  )
)
export type TodoDate = typeof TodoDate.Type

/**
 * Single todo item.
 */
export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
  dueDate: Schema.NullOr(TodoDate),
  updatedAt: Schema.Number,
})
export type Todo = typeof Todo.Type

/**
 * Todo statistics.
 */
export const TodoStats = Schema.Struct({
  total: Schema.Number,
  active: Schema.Number,
  completed: Schema.Number,
  overdue: Schema.Number,
  dueToday: Schema.Number,
  upcoming: Schema.Number,
  unscheduled: Schema.Number,
})
export type TodoStats = typeof TodoStats.Type

/**
 * Todo group key.
 */
export const TodoGroupKey = Schema.String
export type TodoGroupKey = typeof TodoGroupKey.Type

/**
 * Group of todos by category.
 */
export const TodoGroup = Schema.Struct({
  key: TodoGroupKey,
  label: Schema.String,
  count: Schema.Number,
  todos: Schema.Array(Todo),
})
export type TodoGroup = typeof TodoGroup.Type

/**
 * Complete dashboard snapshot.
 */
export const TodoDashboardSnapshot = Schema.Struct({
  todos: Schema.Array(Todo),
  stats: TodoStats,
  groups: Schema.Array(TodoGroup),
})
export type TodoDashboardSnapshot = typeof TodoDashboardSnapshot.Type

/**
 * Input for creating a todo.
 */
export const CreateTodoInput = Schema.Struct({
  title: Schema.NonEmptyString,
  dueDate: Schema.NullOr(TodoDate),
})
export type CreateTodoInput = typeof CreateTodoInput.Type

/**
 * Input for updating a todo.
 * For simplicity, using optional fields instead of Option types
 * to match the existing UI expectations.
 */
export const UpdateTodoInput = Schema.Struct({
  title: Schema.optional(Schema.NonEmptyString),
  completed: Schema.optional(Schema.Boolean),
  dueDate: Schema.optional(Schema.NullOr(TodoDate)),
})
export type UpdateTodoInput = typeof UpdateTodoInput.Type

/**
 * Filter options for todo views.
 */
export type TodoFilter = "all" | "active" | "overdue" | "unscheduled" | "completed"

/**
 * Error returned when a todo is not found.
 */
export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
  "TodoNotFound",
  {
    id: TodoId,
  },
  { httpApiStatus: 404 }
) {}
