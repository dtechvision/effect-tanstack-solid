import { createContext, useContext, type JSX, type Accessor, createSignal } from "solid-js"
import { runApi, apiClient, toError } from "../../api/api-client"
import type { TodoDashboardSnapshot, TodoStats, TodoGroup, Todo } from "../../api/todo-schema"

/**
 * Dashboard context type - provides snapshot data and refetch capability.
 */
type DashboardContextValue = {
  /** The current dashboard snapshot (undefined while loading) */
  snapshot: Accessor<TodoDashboardSnapshot | undefined>
  /** Whether the snapshot is currently loading */
  loading: Accessor<boolean>
  /** Any error that occurred during loading */
  error: Accessor<Error | undefined>
  /** Refetch the dashboard data */
  refetch: () => void
}

const DashboardContext = createContext<DashboardContextValue>()

/**
 * Provider component that fetches and shares dashboard data.
 * Uses Effect RPC client for type-safe server communication.
 */
export function DashboardProvider(props: { readonly children: JSX.Element }) {
  const [snapshot, setSnapshot] = createSignal<TodoDashboardSnapshot | undefined>(undefined)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<Error | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    setError(undefined)
    try {
      // Use Effect RPC client
      const data: TodoDashboardSnapshot = await runApi(client => client.rpc.todos_snapshot())
      setSnapshot(() => data)
    } catch (err) {
      setError(() => toError(err))
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  void fetchData()

  const value: DashboardContextValue = {
    snapshot,
    loading,
    error,
    refetch: fetchData
  }

  // In Solid 2.0, createContext returns something that needs to be cast to a Provider
  const Provider = DashboardContext as unknown as (props: { value: DashboardContextValue; children: JSX.Element }) => JSX.Element

  return (
    <Provider value={value}>
      {props.children}
    </Provider>
  )
}

/**
 * Hook to access the dashboard context.
 * Must be used within a DashboardProvider.
 */
export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return ctx
}

/**
 * Hook to get just the stats from the dashboard.
 * Returns undefined while loading.
 */
export function useDashboardStats(): Accessor<TodoStats | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.stats
}

/**
 * Hook to get just the groups from the dashboard.
 * Returns undefined while loading.
 */
export function useDashboardGroups(): Accessor<ReadonlyArray<TodoGroup> | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.groups
}

/**
 * Hook to get just the todos from the dashboard.
 * Returns undefined while loading.
 */
export function useDashboardTodos(): Accessor<ReadonlyArray<Todo> | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.todos
}

/**
 * Helper to create a todo via Effect RPC.
 */
export async function createTodoRpc(
  title: string,
  dueDate: string | null
): Promise<TodoDashboardSnapshot> {
  return runApi(client => client.rpc.todos_create({ input: { title, dueDate } }))
}

/**
 * Helper to update a todo via Effect RPC.
 */
export async function updateTodoRpc(
  id: number,
  updates: { title?: string; dueDate?: string | null; completed?: boolean }
): Promise<TodoDashboardSnapshot> {
  return runApi(client => client.rpc.todos_update({ id, input: updates }))
}

/**
 * Helper to delete a todo via Effect RPC.
 */
export async function deleteTodoRpc(id: number): Promise<TodoDashboardSnapshot> {
  return runApi(client => client.rpc.todos_remove({ id }))
}

/**
 * Type guard for RPC client errors.
 */
export function isRpcError(error: unknown): error is { _tag: "RpcClientError" } {
  return error !== null && 
    typeof error === "object" && 
    "_tag" in error && 
    error._tag === "RpcClientError"
}

// Re-export toError for convenience
export { toError }
