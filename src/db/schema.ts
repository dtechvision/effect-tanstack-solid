import { boolean, pgTable, serial, text, bigint } from "drizzle-orm/pg-core"

export const todosTable = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: text("due_date"),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull()
})

export type TodoRow = typeof todosTable.$inferSelect

export interface TodoSeedRecord {
  readonly title: string
  readonly completed: boolean
  readonly dueDate: string | null
  readonly updatedAt?: number
}
