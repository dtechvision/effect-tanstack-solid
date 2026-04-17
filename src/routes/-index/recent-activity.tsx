import { Badge } from "../../design-system/components/Badge"
import { Card } from "../../design-system/components/Card"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { useDashboard, useDashboardTodos } from "./dashboard-context"
import { formatTodoDate } from "./todo-date"
import type { Todo } from "../../api/todo-schema"

export function RecentActivity() {
  const { loading, error } = useDashboard()
  const todos = useDashboardTodos()

  // Handle loading state
  if (loading()) {
    return (
      <Card>
        <Stack gap="m">
          <Text tone="muted">Loading recent activity…</Text>
        </Stack>
      </Card>
    )
  }

  // Handle error state
  if (error()) {
    return (
      <Card>
        <Stack gap="m">
          <Text tone="muted">Recent activity unavailable.</Text>
        </Stack>
      </Card>
    )
  }

  const currentTodos = todos()

  if (!currentTodos || currentTodos.length === 0) {
    return (
      <Card>
        <Stack gap="m">
          <Stack gap="2xs">
            <Heading as="h2" tone="section">Recent activity</Heading>
            <Text tone="muted">The canonical list powers this panel and the grouped board.</Text>
          </Stack>
          <Text tone="muted">No activity yet.</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card>
      <Stack gap="m">
        <Stack gap="2xs">
          <Heading as="h2" tone="section">Recent activity</Heading>
          <Text tone="muted">The canonical list powers this panel and the grouped board.</Text>
        </Stack>
        <Stack gap="s">
          {currentTodos.slice(0, 5).map((todo: Todo) => (
            <Stack gap="2xs">
              <Text>{todo.title}</Text>
              <Inline gap="xs" wrap>
                <Badge tone={todo.completed ? "success" : "neutral"}>
                  {todo.completed ? "Completed" : "Open"}
                </Badge>
                {todo.dueDate !== null ? <Badge tone="accent">Due {formatTodoDate(todo.dueDate)}</Badge> : null}
                {todo.dueDate === null && !todo.completed ? <Badge tone="neutral">Unscheduled</Badge> : null}
              </Inline>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
