import type { CreateTodoInput, Todo, UpdateTodoInput } from "../api/todo-schema"
import { todosTable, type TodoSeedRecord } from "./schema"
import { asc, desc, eq, sql } from "drizzle-orm"
import { drizzle as drizzlePglite } from "drizzle-orm/pglite"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { Buffer } from "node:buffer"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import postgres from "postgres"

export type TodoSeed = ReadonlyArray<TodoSeedRecord>

type RepositoryDatabaseConfig =
  | {
      readonly kind: "pglite"
      readonly dataDir: string | undefined
    }
  | {
      readonly kind: "postgres"
      readonly databaseUrl: string
    }

type TodoRepository = {
  readonly list: Effect.Effect<ReadonlyArray<Todo>>
  readonly create: (input: CreateTodoInput) => Effect.Effect<Todo>
  readonly update: (id: number, input: UpdateTodoInput) => Effect.Effect<Todo | null>
  readonly remove: (id: number) => Effect.Effect<boolean>
}

type UpdatePatch = {
  readonly title: string
  readonly completed: boolean
  readonly dueDate: string | null
  readonly updatedAt: number
}

type Row = typeof todosTable.$inferSelect

const defaultPGliteDir = join(process.cwd(), "data", "pglite")

const normalizeDueDate = (value: string | null): string | null => {
  if (value === null) {
    return null
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

const dueDateFromRow = (row: Row): string | null => {
  const camelCaseValue = row.dueDate
  if (camelCaseValue !== undefined) {
    return normalizeDueDate(camelCaseValue)
  }

  const snakeCaseValue = (row as unknown as Record<string, unknown>)["due_date"]
  if (typeof snakeCaseValue === "string" || snakeCaseValue === null) {
    return normalizeDueDate(snakeCaseValue)
  }

  return null
}

const toTodo = (row: Row): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
  dueDate: dueDateFromRow(row),
  updatedAt: row.updatedAt
})

const createTodoTableSql = sql`
  CREATE TABLE IF NOT EXISTS todos (
    id serial PRIMARY KEY,
    title text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    due_date text,
    updated_at bigint NOT NULL
  )
`

const todoMigrationSql = [
  sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date text`,
  sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_at bigint`,
  sql`UPDATE todos SET updated_at = EXTRACT(EPOCH FROM NOW())::bigint * 1000 WHERE updated_at IS NULL`,
  sql`
    UPDATE todos
    SET due_date = NULL
    WHERE due_date IS NOT NULL
      AND due_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  `
] as const

const defaultSeed: TodoSeed = [
  {
    title: "Solid + Effect Atom setup",
    completed: true,
    dueDate: null,
    updatedAt: Date.now()
  },
  {
    title: "Migrate dashboard interactions",
    completed: false,
    dueDate: null,
    updatedAt: Date.now()
  }
]

const liveDatabaseConfig = Effect.gen(function*() {
  const databaseUrl = yield* Config.option(Config.string("DATABASE_URL"))
  const pgliteDataDir = yield* Config.string("PGLITE_DATA_DIR").pipe(
    Config.orElse(() => Config.succeed(defaultPGliteDir))
  )

  return Option.match(databaseUrl, {
    onNone: () => ({ kind: "pglite", dataDir: pgliteDataDir } as const),
    onSome: (url) => ({ kind: "postgres", databaseUrl: url } as const)
  }) satisfies RepositoryDatabaseConfig
})

const makeCrudRepository = (queries: {
  readonly listRows: () => Promise<Array<Row>>
  readonly countRows: () => Promise<number>
  readonly insertSeedRows: (seed: TodoSeed) => Promise<void>
  readonly insertRow: (input: CreateTodoInput, now: number) => Promise<Row | undefined>
  readonly findRowById: (id: number) => Promise<Row | undefined>
  readonly updateRow: (id: number, patch: UpdatePatch) => Promise<Row | undefined>
  readonly deleteRow: (id: number) => Promise<boolean>
}): Effect.Effect<TodoRepository> =>
  Effect.gen(function*() {
    const count = yield* Effect.promise(() => queries.countRows())
    if (count === 0) {
      yield* Effect.promise(() => queries.insertSeedRows(defaultSeed))
    }

    return {
      list: Effect.promise(() => queries.listRows().then((rows) => rows.map(toTodo))),

      create: (input: CreateTodoInput) =>
        Effect.gen(function*() {
          const row = yield* Effect.promise(() => queries.insertRow(input, Date.now()))
          if (row === undefined) {
            return yield* Effect.die(new Error("Todo insert did not return a row"))
          }

          return toTodo(row)
        }),

      update: (id: number, input: UpdateTodoInput) =>
        Effect.gen(function*() {
          const current = yield* Effect.promise(() => queries.findRowById(id))
          if (current === undefined) {
            return null
          }

          const updated = yield* Effect.promise(() =>
            queries.updateRow(id, {
              title: input.title !== undefined ? input.title.trim() : current.title,
              completed: input.completed ?? current.completed,
              dueDate: input.dueDate !== undefined ? normalizeDueDate(input.dueDate) : dueDateFromRow(current),
              updatedAt: Date.now()
            })
          )

          return updated === undefined ? null : toTodo(updated)
        }),

      remove: (id: number) => Effect.promise(() => queries.deleteRow(id))
    }
  })

const makePostgresRepository = (databaseUrl: string) =>
  Effect
    .gen(function*() {
      const client = postgres(databaseUrl, { prepare: false })
      const db = drizzlePostgres(client, { schema: { todosTable } })

      yield* Effect.promise(() => db.execute(createTodoTableSql))
      yield* Effect.forEach(todoMigrationSql, (statement) => Effect.promise(() => db.execute(statement)))
      yield* Effect.addFinalizer(() => Effect.promise(() => client.end()))

      return yield* makeCrudRepository({
        listRows: () =>
          db
            .select()
            .from(todosTable)
            .orderBy(
              asc(todosTable.completed),
              asc(todosTable.dueDate),
              desc(todosTable.updatedAt)
            ),

        countRows: async () => {
          const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(todosTable)
          return Number(row?.count ?? 0)
        },

        insertSeedRows: async (seed: TodoSeed) => {
          if (seed.length === 0) return

          await db.insert(todosTable).values(
            seed.map((item) => ({
              title: item.title,
              completed: item.completed,
              dueDate: normalizeDueDate(item.dueDate),
              updatedAt: item.updatedAt ?? Date.now()
            }))
          )
        },

        insertRow: (input: CreateTodoInput, now: number) =>
          db
            .insert(todosTable)
            .values({
              title: input.title.trim(),
              completed: false,
              dueDate: normalizeDueDate(input.dueDate),
              updatedAt: now
            })
            .returning()
            .then(([row]) => row),

        findRowById: (id: number) =>
          db
            .select()
            .from(todosTable)
            .where(eq(todosTable.id, id))
            .limit(1)
            .then(([row]) => row),

        updateRow: (id: number, patch: UpdatePatch) =>
          db
            .update(todosTable)
            .set(patch)
            .where(eq(todosTable.id, id))
            .returning()
            .then(([row]) => row),

        deleteRow: (id: number) =>
          db
            .delete(todosTable)
            .where(eq(todosTable.id, id))
            .returning({ id: todosTable.id })
            .then(([row]) => row !== undefined)
      })
    })
    .pipe(Effect.orDie)

const makePGliteRepository = (
  dataDir: string | undefined,
  seed: TodoSeed = []
) =>
  Effect
    .gen(function*() {
      if (dataDir !== undefined) {
        yield* Effect.promise(() => mkdir(dataDir, { recursive: true }))
      }

      const PGlite = yield* Effect.promise(async () => {
        if (globalThis.Buffer === undefined) {
          globalThis.Buffer = Buffer
        }

        const module = await import("@electric-sql/pglite")
        return module.PGlite
      })

      const client = yield* Effect.sync(() => (dataDir === undefined ? new PGlite() : new PGlite(dataDir)))
      const db = drizzlePglite({ client, schema: { todosTable } })

      yield* Effect.promise(() => db.execute(createTodoTableSql))
      yield* Effect.forEach(todoMigrationSql, (statement) => Effect.promise(() => db.execute(statement)))
      yield* Effect.addFinalizer(() => Effect.promise(() => client.close()))

      const insertSeedRows = async (rows: TodoSeed): Promise<void> => {
        if (rows.length === 0) return

        await db.insert(todosTable).values(
          rows.map((item) => ({
            title: item.title,
            completed: item.completed,
            dueDate: normalizeDueDate(item.dueDate),
            updatedAt: item.updatedAt ?? Date.now()
          }))
        )
      }

      if (seed.length > 0) {
        yield* Effect.promise(() => db.delete(todosTable))
        yield* Effect.promise(() => insertSeedRows(seed))
      }

      return yield* makeCrudRepository({
        listRows: () =>
          db
            .select()
            .from(todosTable)
            .orderBy(
              asc(todosTable.completed),
              asc(todosTable.dueDate),
              desc(todosTable.updatedAt)
            ),

        countRows: async () => {
          const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(todosTable)
          return Number(row?.count ?? 0)
        },

        insertSeedRows,

        insertRow: (input: CreateTodoInput, now: number) =>
          db
            .insert(todosTable)
            .values({
              title: input.title.trim(),
              completed: false,
              dueDate: normalizeDueDate(input.dueDate),
              updatedAt: now
            })
            .returning()
            .then(([row]) => row),

        findRowById: (id: number) =>
          db
            .select()
            .from(todosTable)
            .where(eq(todosTable.id, id))
            .limit(1)
            .then(([row]) => row),

        updateRow: (id: number, patch: UpdatePatch) =>
          db
            .update(todosTable)
            .set(patch)
            .where(eq(todosTable.id, id))
            .returning()
            .then(([row]) => row),

        deleteRow: (id: number) =>
          db
            .delete(todosTable)
            .where(eq(todosTable.id, id))
            .returning({ id: todosTable.id })
            .then(([row]) => row !== undefined)
      })
    })
    .pipe(Effect.orDie)

const makeRepository = (config: RepositoryDatabaseConfig) =>
  config.kind === "postgres"
    ? makePostgresRepository(config.databaseUrl)
    : makePGliteRepository(config.dataDir)

const makeLiveRepository = Effect.flatMap(liveDatabaseConfig, makeRepository).pipe(Effect.orDie)

export class TodosRepository extends Context.Service<TodosRepository>()("TodosRepository", {
  make: makeLiveRepository
}) {
  static readonly layer = Layer.effect(this, this.make)

  static readonly testLayer = this.layerFromConfig({
    kind: "pglite",
    dataDir: undefined
  })

  static layerFromConfig(config: RepositoryDatabaseConfig): Layer.Layer<TodosRepository> {
    return Layer.effect(this, makeRepository(config))
  }

  static layerFromSeed(seed: TodoSeed): Layer.Layer<TodosRepository> {
    return Layer.effect(this, makePGliteRepository(undefined, seed))
  }
}
