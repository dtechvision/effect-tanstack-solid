import type { TodoStats } from "../../api/todo-schema"
import { Tabs } from "../../design-system/components/Tabs"

export const dashboardFilterKeys = ["all", "active", "overdue", "unscheduled", "completed"] as const

export type DashboardFilter = typeof dashboardFilterKeys[number]

type DashboardFiltersProps = {
  readonly activeFilter: DashboardFilter
  readonly onChange: (filter: DashboardFilter) => void
  readonly stats: TodoStats
}

export function DashboardFilters(props: DashboardFiltersProps) {
  return (
    <Tabs
      id="todos"
      activeTab={props.activeFilter}
      onChange={props.onChange}
      items={[
        { key: "all", label: "All work", count: props.stats.total },
        { key: "active", label: "Active", count: props.stats.active },
        { key: "overdue", label: "Overdue", count: props.stats.overdue },
        { key: "unscheduled", label: "Unscheduled", count: props.stats.unscheduled },
        { key: "completed", label: "Completed", count: props.stats.completed }
      ]}
    />
  )
}
