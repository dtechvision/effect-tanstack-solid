import type { CreateTodoInput, Todo, UpdateTodoInput } from "../../api/todo-schema"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as PubSub from "effect/PubSub"

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

/**
 * TodoEventSink service - publish domain events.
 * Uses PubSub internally for fan-out capabilities.
 */
export class TodoEventSink extends Context.Service<TodoEventSink, {
  readonly publish: (event: TodoEvent) => Effect.Effect<void>
  readonly subscribe: () => Effect.Effect<PubSub.PubSub<TodoEvent>, never, never>
}>()("TodoEventSink") {
  /**
   * Noop implementation for tests.
   */
  static readonly noop = Layer.succeed(TodoEventSink, {
    publish: () => Effect.void,
    subscribe: () => Effect.sync(() => {
      throw new Error("Cannot subscribe to noop sink")
    }),
  })

  /**
   * Live implementation with in-memory PubSub.
   */
  static readonly live = Layer.effect(
    TodoEventSink,
    Effect.gen(function*() {
      const pubsub = yield* PubSub.unbounded<TodoEvent>()

      return TodoEventSink.of({
        publish: (event) => PubSub.publish(pubsub, event),
        subscribe: () => Effect.succeed(pubsub),
      })
    })
  )

  /**
   * Custom handler implementation for testing.
   */
  static makeWithHandler = (
    onPublish: (event: TodoEvent) => void
  ): Layer.Layer<TodoEventSink> =>
    Layer.succeed(TodoEventSink, {
      publish: (event) => Effect.sync(() => onPublish(event)),
      subscribe: () => Effect.sync(() => {
        throw new Error("Cannot subscribe to handler-based sink")
      }),
    })
}

