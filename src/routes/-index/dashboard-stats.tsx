import { Show } from "solid-js"
import { StatCard } from "../../design-system/components/StatCard"
import { Text } from "../../design-system/components/Text"
import { Grid } from "../../design-system/primitives/Grid"
import { useDashboard, useDashboardStats } from "./dashboard-context"

export function DashboardStats() {
  const { loading, error } = useDashboard()
  const stats = useDashboardStats()

  return (
    <Show
      when={!loading() && !error() && stats()}
      fallback={<Text tone="muted">Loading dashboard summary…</Text>}
    >
      {() => {
        const s = stats()!
        return (
          <Grid layout="stats">
            <StatCard label="Total" value={s.total} helper="All tracked work" />
            <StatCard
              label="Active"
              value={s.active}
              helper={`${s.dueToday} due today · ${s.upcoming} upcoming`}
              tone="accent"
            />
            <StatCard label="Overdue" value={s.overdue} helper="Needs attention now" tone="danger" />
            <StatCard label="Unscheduled" value={s.unscheduled} helper="No due date yet" />
          </Grid>
        )
      }}
    </Show>
  )
}
