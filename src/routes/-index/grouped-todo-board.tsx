import type { TodoGroup } from "../../api/todo-schema"
import { Button } from "../../design-system/components/Button"
import { Card } from "../../design-system/components/Card"
import { EmptyState } from "../../design-system/components/EmptyState"
import { ErrorState } from "../../design-system/components/ErrorState"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { useDashboard, useDashboardGroups, useDashboardStats } from "./dashboard-context"
import { DashboardFilters, type DashboardFilter } from "./dashboard-filters"
import { TodoGroupSection } from "./todo-group-section"

const filterGroups = (
  groups: ReadonlyArray<TodoGroup>,
  filter: DashboardFilter
): ReadonlyArray<TodoGroup> => {
  switch (filter) {
    case "all":
      return groups
    case "active":
      return groups.filter((group) => group.key !== "completed")
    case "overdue":
      return groups.filter((group) => group.key === "overdue")
    case "unscheduled":
      return groups.filter((group) => group.key === "unscheduled")
    case "completed":
      return groups.filter((group) => group.key === "completed")
  }
}

type GroupedTodoBoardProps = {
  readonly activeFilter: DashboardFilter
  readonly onChangeFilter: (filter: DashboardFilter) => void
}

export function GroupedTodoBoard(props: GroupedTodoBoardProps) {
  const { loading, error, refetch } = useDashboard()
  const stats = useDashboardStats()
  const groups = useDashboardGroups()

  // Handle loading state
  if (loading()) {
    return (
      <Card>
        <Stack gap="l">
          <Text tone="muted">Loading dashboard views…</Text>
        </Stack>
      </Card>
    )
  }

  // Handle error state
  if (error()) {
    return (
      <Card>
        <Stack gap="l">
          <ErrorState
            title="Dashboard views unavailable"
            description="The grouped board could not be refreshed."
            actionLabel="Retry"
            onAction={refetch}
          />
        </Stack>
      </Card>
    )
  }

  const currentStats = stats()
  const currentGroups = groups()

  // If we have no data yet, show loading (shouldn't happen if no error, but safety check)
  if (!currentStats || !currentGroups) {
    return (
      <Card>
        <Stack gap="l">
          <Text tone="muted">Loading dashboard views…</Text>
        </Stack>
      </Card>
    )
  }

  const visibleGroups = filterGroups(currentGroups, props.activeFilter)
  const populated = visibleGroups.filter((group) => group.count > 0)
  const totalVisibleTodos = populated.reduce((count, group) => count + group.todos.length, 0)

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

        <DashboardFilters
          activeFilter={props.activeFilter}
          onChange={props.onChangeFilter}
          stats={currentStats}
        />

        {totalVisibleTodos === 0 ? (
          <EmptyState
            title="No work in this view"
            description="Try another filter or add a task with a due date."
          />
        ) : (
          <Stack gap="l">
            {populated.map((group) => (
              <TodoGroupSection group={group} />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
