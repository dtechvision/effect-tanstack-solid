import { describe, expect, it } from "vitest"
import { deriveTodoDashboardSnapshot } from "../src/features/todos/projections"

describe("todo dashboard projections", () => {
  it("derives coherent stats and groups", () => {
    const snapshot = deriveTodoDashboardSnapshot(
      [
        {
          id: 1,
          title: "Completed",
          completed: true,
          dueDate: null,
          updatedAt: 1
        },
        {
          id: 2,
          title: "Open",
          completed: false,
          dueDate: null,
          updatedAt: 2
        }
      ],
      "2026-01-01"
    )

    expect(snapshot.stats.total).toBe(2)
    expect(snapshot.stats.completed).toBe(1)
    expect(snapshot.stats.unscheduled).toBe(1)
    expect(snapshot.groups.find((group) => group.key === "completed")?.count).toBe(1)
    expect(snapshot.groups.find((group) => group.key === "unscheduled")?.count).toBe(1)
  })

  it("classifies overdue and upcoming todos by due date", () => {
    const snapshot = deriveTodoDashboardSnapshot(
      [
        {
          id: 10,
          title: "Past",
          completed: false,
          dueDate: "2000-01-01",
          updatedAt: 10
        },
        {
          id: 11,
          title: "Future",
          completed: false,
          dueDate: "2999-01-01",
          updatedAt: 11
        }
      ],
      "2026-01-01"
    )

    expect(snapshot.stats.overdue).toBe(1)
    expect(snapshot.stats.upcoming).toBe(1)
    expect(snapshot.groups.find((group) => group.key === "overdue")?.count).toBe(1)
    expect(snapshot.groups.find((group) => group.key === "upcoming")?.count).toBe(1)
  })
})
