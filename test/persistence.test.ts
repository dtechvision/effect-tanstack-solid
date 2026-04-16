import { rm } from "node:fs/promises"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import {
  createTodo,
  getTodoDashboardSnapshot,
  removeTodo,
  runTodosApp,
  updateTodo
} from "../src/features/todos/application"

const pgliteDir = join(process.cwd(), "data", "pglite")

beforeEach(async () => {
  await rm(pgliteDir, { force: true, recursive: true })
})

describe("todo persistence via PGlite", () => {
  it("persists created todos across subsequent snapshot reads", async () => {
    await runTodosApp(createTodo({ title: "Created task", dueDate: "2027-03-04" }))

    const firstRead = await runTodosApp(getTodoDashboardSnapshot)
    const secondRead = await runTodosApp(getTodoDashboardSnapshot)

    expect(firstRead.todos.some((todo) => todo.title === "Created task")).toBe(true)
    expect(secondRead.todos.some((todo) => todo.title === "Created task")).toBe(true)
  })

  it("persists updates across subsequent snapshot reads", async () => {
    await runTodosApp(updateTodo(1, { title: "Alpha updated", completed: true, dueDate: "2028-09-10" }))

    const snapshot = await runTodosApp(getTodoDashboardSnapshot)
    const updated = snapshot.todos.find((todo) => todo.id === 1)

    expect(updated?.title).toBe("Alpha updated")
    expect(updated?.completed).toBe(true)
    expect(updated?.dueDate).toBe("2028-09-10")
  })

  it("persists deletions and keeps deleted ids absent after refresh reads", async () => {
    await runTodosApp(removeTodo(2))

    const afterDelete = await runTodosApp(getTodoDashboardSnapshot)
    const afterRefreshRead = await runTodosApp(getTodoDashboardSnapshot)

    expect(afterDelete.todos.some((todo) => todo.id === 2)).toBe(false)
    expect(afterRefreshRead.todos.some((todo) => todo.id === 2)).toBe(false)
  })
})
