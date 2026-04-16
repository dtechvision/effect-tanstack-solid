import type { CreateTodoInput, TodoDashboardSnapshot, UpdateTodoInput } from "../../api/todo-schema"
import { type TodoSeed, TodosRepository } from "../../db/todos-repository"
import {
  makeTodoEventSinkLayer,
  type TodoEvent,
  TodoEventSink,
  TodoEventSinkNoop
} from "./events"
import {
  deriveTodoDashboardSnapshot,
  deriveTodoGroups,
  deriveTodoStats
} from "./projections"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

const currentTodoDate = Effect.map(
  Clock.currentTimeMillis,
  (now) => new Date(now).toISOString().slice(0, 10)
)

const publishEvent = (event: TodoEvent) =>
  Effect.flatMap(TodoEventSink.asEffect(), (sink) => sink.publish(event))

export const listTodos = Effect
  .flatMap(TodosRepository.asEffect(), (repository) => repository.list)
  .pipe(Effect.withSpan("TodosApp.list"))

export const getTodoStats = Effect
  .all([TodosRepository.asEffect(), currentTodoDate])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(Effect.map((todos) => deriveTodoStats(todos, today)))
    ),
    Effect.withSpan("TodosApp.stats")
  )

export const getTodoDashboardSnapshot = Effect
  .all([TodosRepository.asEffect(), currentTodoDate])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(Effect.map((todos) => deriveTodoDashboardSnapshot(todos, today)))
    ),
    Effect.withSpan("TodosApp.snapshot")
  )

export const getTodoGroups = Effect
  .all([TodosRepository.asEffect(), currentTodoDate])
  .pipe(
    Effect.flatMap(([repository, today]) =>
      repository.list.pipe(Effect.map((todos) => deriveTodoGroups(todos, today)))
    ),
    Effect.withSpan("TodosApp.groups")
  )

export const createTodo = (input: CreateTodoInput) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = yield* Clock.currentTimeMillis
      const todo = yield* repository.create(input)

      yield* publishEvent({
        _tag: "TodoCreated",
        todo,
        input,
        occurredAt
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.create", {
        attributes: {
          "todo.has_due_date": input.dueDate === null ? "false" : "true",
          "todo.title": input.title
        }
      })
    )

export const updateTodo = (id: number, input: UpdateTodoInput) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = yield* Clock.currentTimeMillis
      const todo = yield* repository.update(id, input)

      if (todo === null) {
        return yield* Effect.fail(new Error(`Todo with id ${id} not found`))
      }

      yield* publishEvent({
        _tag: "TodoUpdated",
        todo,
        input,
        occurredAt
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.update", {
        attributes: { "todo.id": id }
      })
    )

export const removeTodo = (id: number) =>
  Effect
    .gen(function*() {
      const repository = yield* TodosRepository
      const occurredAt = yield* Clock.currentTimeMillis
      const removed = yield* repository.remove(id)

      if (!removed) {
        return yield* Effect.fail(new Error(`Todo with id ${id} not found`))
      }

      yield* publishEvent({
        _tag: "TodoRemoved",
        id,
        occurredAt
      })

      return yield* getTodoDashboardSnapshot
    })
    .pipe(
      Effect.withSpan("TodosApp.remove", {
        attributes: { "todo.id": id }
      })
    )

export const TodosApplicationLive = Layer.mergeAll(
  TodosRepository.layer,
  TodoEventSinkNoop
)

export const layerFromTodoSeed = (seed: TodoSeed) =>
  Layer.mergeAll(TodosRepository.layerFromSeed(seed), TodoEventSinkNoop)

export const layerFromTodoSeedWithEvents = (
  seed: TodoSeed,
  onPublish: (event: TodoEvent) => void
) =>
  Layer.mergeAll(
    TodosRepository.layerFromSeed(seed),
    makeTodoEventSinkLayer(onPublish)
  )

export const runTodosApp = <A, E>(
  effect: Effect.Effect<A, E, TodosRepository | TodoEventSink>
) => Effect.runPromise(effect.pipe(Effect.provide(TodosApplicationLive)))
