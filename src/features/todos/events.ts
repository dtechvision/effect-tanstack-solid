import type { CreateTodoInput, Todo, UpdateTodoInput } from "../../api/todo-schema"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

export type TodoEvent =
  | {
      readonly _tag: "TodoCreated"
      readonly todo: Todo
      readonly input: CreateTodoInput
      readonly occurredAt: number
    }
  | {
      readonly _tag: "TodoUpdated"
      readonly todo: Todo
      readonly input: UpdateTodoInput
      readonly occurredAt: number
    }
  | {
      readonly _tag: "TodoRemoved"
      readonly id: number
      readonly occurredAt: number
    }

export interface TodoEventSink {
  readonly publish: (event: TodoEvent) => Effect.Effect<void>
}

export const TodoEventSink: Context.Service<TodoEventSink, TodoEventSink> =
  Context.Service<TodoEventSink>("TodoEventSink")

export const TodoEventSinkNoop = Layer.succeed(TodoEventSink, {
  publish: () => Effect.void
})

export const makeTodoEventSinkLayer = (
  onPublish: (event: TodoEvent) => void
): Layer.Layer<TodoEventSink> =>
  Layer.succeed(TodoEventSink, {
    publish: (event) => Effect.sync(() => onPublish(event))
  })
