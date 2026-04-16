import type { TodoSeed } from "./todos-repository"
import { layerFromTodoSeed } from "../features/todos/application"

export const todoSeeds = {
  empty: [] satisfies TodoSeed,
  singleCompleted: [
    {
      title: "Seeded completed todo",
      completed: true,
      dueDate: null,
      updatedAt: 1
    }
  ] satisfies TodoSeed,
  mixedState: [
    {
      title: "Alpha todo",
      completed: false,
      dueDate: null,
      updatedAt: 1
    },
    {
      title: "Bravo done",
      completed: true,
      dueDate: null,
      updatedAt: 2
    },
    {
      title: "Charlie todo",
      completed: false,
      dueDate: null,
      updatedAt: 3
    }
  ] satisfies TodoSeed
} as const

export type TodoSeedName = keyof typeof todoSeeds

export const makeTodosApplicationTestLayer = (
  seedName: TodoSeedName = "empty"
) => layerFromTodoSeed(todoSeeds[seedName])
