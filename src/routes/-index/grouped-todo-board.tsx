import { createMemo, For, Show } from "solid-js"
import type { Todo, TodoGroup } from "../../api/todo-schema"
import { Button } from "../../design-system/components/Button"
import { Card } from "../../design-system/components/Card"
import { EmptyState } from "../../design-system/components/EmptyState"
import { ErrorState } from "../../design-system/components/ErrorState"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { useDashboard, useDashboardFilter } from "./dashboard-context"
import { DashboardFilters } from "./dashboard-filters"
import { TodoGroupSection } from "./todo-group-section"
import { todayTodoDate } from "./todo-date"

/**
 * Filter individual todos based on the selected filter.
 */
function filterTodos(todos: ReadonlyArray<Todo>, filter: string): ReadonlyArray<Todo> {
  const today = todayTodoDate()
  
  switch (filter) {
    case "all":
      return todos
    case "active":
      return todos.filter((todo) => !todo.completed)
    case "overdue":
      return todos.filter((todo) => !todo.completed && todo.dueDate !== null && todo.dueDate < today)
    case "unscheduled":
      return todos.filter((todo) => !todo.completed && todo.dueDate === null)
    case "completed":
      return todos.filter((todo) => todo.completed)
    default:
      return todos
  }
}

/**
 * Regroup filtered todos by their category.
 */
function groupFilteredTodos(todos: ReadonlyArray<Todo>): ReadonlyArray<TodoGroup> {
  const today = todayTodoDate()
  
  const buckets: Record<string, Array<Todo>> = {
    overdue: [],
    today: [],
    upcoming: [],
    unscheduled: [],
    completed: []
  }
  
  for (const todo of todos) {
    if (todo.completed) {
      buckets.completed.push(todo)
    } else if (todo.dueDate === null) {
      buckets.unscheduled.push(todo)
    } else if (todo.dueDate < today) {
      buckets.overdue.push(todo)
    } else if (todo.dueDate === today) {
      buckets.today.push(todo)
    } else {
      buckets.upcoming.push(todo)
    }
  }
  
  const groupDefs: Array<{ key: string; label: string }> = [
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Due today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "unscheduled", label: "Unscheduled" },
    { key: "completed", label: "Completed" }
  ]
  
  return groupDefs
    .map(({ key, label }) => ({
      key,
      label,
      count: buckets[key].length,
      todos: buckets[key] as readonly Todo[]
    }))
    .filter((group) => group.count > 0) as unknown as TodoGroup[]
}

export function GroupedTodoBoard() {
  const { loading, error, refetch, snapshot } = useDashboard()
  const { activeFilter, setActiveFilter } = useDashboardFilter()

  // Memoized filtered todos - automatically re-computes when activeFilter changes
  const filteredTodos = createMemo(() => {
    const snap = snapshot()
    if (!snap) return []
    return filterTodos(snap.todos, activeFilter())
  })

  // Memoized grouped todos - automatically re-computes when filteredTodos changes
  const filteredGroups = createMemo(() => groupFilteredTodos(filteredTodos()))

  // Total visible count
  const totalVisible = createMemo(() => filteredTodos().length)

  return (
    <Card>
      <Stack gap="l">
        <Inline align="between" wrap>
          <Stack gap="2xs">
            <Heading as="h2" tone="section">Execution board</Heading>
            <Text tone="muted">One mutation refreshes the canonical list, grouped board, and summary counts.</Text>
          </Stack>
          <Button variant="secondary" onClick={refetch}>Refresh</Button>
        </Inline>

        <Show when={snapshot()}>
          {(snap) => (
            <DashboardFilters
              activeFilter={activeFilter()}
              onChange={setActiveFilter}
              stats={snap().stats}
            />
          )}
        </Show>

        <Show when={loading()}>
          <Text tone="muted">Loading dashboard views…</Text>
        </Show>

        <Show when={error()}>
          <ErrorState
            title="Dashboard views unavailable"
            description="The grouped board could not be refreshed."
            actionLabel="Retry"
            onAction={refetch}
          />
        </Show>

        <Show when={!loading() && !error() && snapshot()}>
          <Show when={totalVisible() > 0} fallback={
            <EmptyState
              title="No work in this view"
              description={`Filter "${activeFilter()}" shows no tasks. Try another filter or add a task.`}
            />
          }>
            <Stack gap="l">
              <For each={filteredGroups()}>
                {(group) => <TodoGroupSection group={group()} />}
              </For>
            </Stack>
          </Show>
        </Show>
      </Stack>
    </Card>
  )
}
