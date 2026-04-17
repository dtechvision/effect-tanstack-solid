import { Card } from "../../design-system/components/Card"
import { Page } from "../../design-system/components/Page"
import { PageHeader } from "../../design-system/components/PageHeader"
import { Text } from "../../design-system/components/Text"
import { Grid } from "../../design-system/primitives/Grid"
import { Stack } from "../../design-system/primitives/Stack"
import { CreateTodoForm } from "./create-todo-form"
import { DashboardProvider } from "./dashboard-context"
import { DashboardStats } from "./dashboard-stats"
import { GroupedTodoBoard } from "./grouped-todo-board"
import { RecentActivity } from "./recent-activity"

export function App() {
  return (
    <DashboardProvider>
      <Page>
        <Stack gap="xl">
          <PageHeader
            title="Todo control room"
            description="A richer todo dashboard that keeps the canonical list, grouped board, and summary counts synchronized from one mutation response."
          />
          <CreateTodoForm />
          <DashboardStats />

          <Grid layout="dashboard">
            <GroupedTodoBoard />

            <Stack gap="l">
              <RecentActivity />
              <Card tone="subtle">
                <Stack gap="s">
                  <Text>This sample intentionally goes beyond flat CRUD.</Text>
                  <Text tone="muted">
                    It demonstrates server-derived dashboard snapshots, SSR hydration of multiple read models, and disciplined UI composition through the current design system.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Grid>

          <Card>
            <Stack gap="2xs">
              <Text>Ordnung muss sein!</Text>
              <Text tone="muted">© 2026 Built with German Precision 🇩🇪</Text>
            </Stack>
          </Card>
        </Stack>
      </Page>
    </DashboardProvider>
  )
}
