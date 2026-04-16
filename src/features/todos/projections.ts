import type { Todo, TodoDashboardSnapshot, TodoGroup, TodoGroupKey, TodoStats } from "../../api/todo-schema"

const todayDate = (): string => new Date().toISOString().slice(0, 10)

const compareDueDates = (left: string | null, right: string | null): number => {
  if (left === right) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  return left.localeCompare(right)
}

const compareTodos = (left: Todo, right: Todo): number => {
  const completedOrder = Number(left.completed) - Number(right.completed)
  if (completedOrder !== 0) {
    return completedOrder
  }

  const dueDateOrder = compareDueDates(left.dueDate, right.dueDate)
  if (dueDateOrder !== 0) {
    return dueDateOrder
  }

  return right.updatedAt - left.updatedAt
}

const classifyTodo = (todo: Todo, today: string): TodoGroupKey => {
  if (todo.completed) {
    return "completed"
  }

  if (todo.dueDate === null) {
    return "unscheduled"
  }

  if (todo.dueDate < today) {
    return "overdue"
  }

  if (todo.dueDate === today) {
    return "today"
  }

  return "upcoming"
}

export const deriveTodoStats = (todos: ReadonlyArray<Todo>, today: string = todayDate()): TodoStats =>
  todos.reduce<TodoStats>(
    (stats, todo) => {
      const kind = classifyTodo(todo, today)
      return {
        total: stats.total + 1,
        active: stats.active + (todo.completed ? 0 : 1),
        completed: stats.completed + (kind === "completed" ? 1 : 0),
        overdue: stats.overdue + (kind === "overdue" ? 1 : 0),
        dueToday: stats.dueToday + (kind === "today" ? 1 : 0),
        upcoming: stats.upcoming + (kind === "upcoming" ? 1 : 0),
        unscheduled: stats.unscheduled + (kind === "unscheduled" ? 1 : 0)
      }
    },
    {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      upcoming: 0,
      unscheduled: 0
    }
  )

export const deriveTodoGroups = (todos: ReadonlyArray<Todo>, today: string = todayDate()): ReadonlyArray<TodoGroup> => {
  const buckets: Record<TodoGroupKey, Array<Todo>> = {
    overdue: [],
    today: [],
    upcoming: [],
    unscheduled: [],
    completed: []
  }

  for (const todo of [...todos].sort(compareTodos)) {
    buckets[classifyTodo(todo, today)].push(todo)
  }

  const definitions: ReadonlyArray<{ readonly key: TodoGroupKey; readonly label: string }> = [
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Due today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "unscheduled", label: "Unscheduled" },
    { key: "completed", label: "Completed" }
  ]

  return definitions.map(({ key, label }) => ({
    key,
    label,
    count: buckets[key].length,
    todos: buckets[key]
  }))
}

export const deriveTodoDashboardSnapshot = (
  todos: ReadonlyArray<Todo>,
  today: string = todayDate()
): TodoDashboardSnapshot => {
  const ordered = [...todos].sort(compareTodos)

  return {
    todos: ordered,
    stats: deriveTodoStats(ordered, today),
    groups: deriveTodoGroups(ordered, today)
  }
}
