/**
 * Dashboard context - Effect-native reactive state.
 * 
 * Uses Solid 2.0 signals + Effect for data fetching.
 * The atom hooks have hydration issues, so we use the reliable context pattern.
 */
import { createContext, useContext, type JSX, type Accessor, createSignal } from "solid-js"
import type { DashboardFilter } from "./dashboard-filters"
import * as Effect from "effect/Effect"
import { ApiClient } from "../../api/api-client"
import type { TodoDashboardSnapshot, TodoStats, TodoGroup, Todo, CreateTodoInput, UpdateTodoInput } from "../../api/todo-schema"

// ============================================
// Effect Actions
// ============================================

export const createTodo = (input: CreateTodoInput): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_create({ input })
  }).pipe(Effect.provide(ApiClient.layer))

export const updateTodo = (id: number, input: UpdateTodoInput): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_update({ id, input })
  }).pipe(Effect.provide(ApiClient.layer))

export const deleteTodo = (id: number): Effect.Effect<TodoDashboardSnapshot, Error, never> =>
  Effect.gen(function*() {
    const api = yield* ApiClient
    return yield* api.rpc.todos_remove({ id })
  }).pipe(Effect.provide(ApiClient.layer))

// ============================================
// Context Implementation
// ============================================

type DashboardContextValue = {
  snapshot: Accessor<TodoDashboardSnapshot | undefined>
  loading: Accessor<boolean>
  error: Accessor<Error | undefined>
  refetch: () => void
  activeFilter: Accessor<DashboardFilter>
  setActiveFilter: (filter: DashboardFilter) => void
}

const DashboardContext = createContext<DashboardContextValue>()

export function DashboardProvider(props: { readonly children: JSX.Element }) {
  const [snapshot, setSnapshot] = createSignal<TodoDashboardSnapshot | undefined>(undefined)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<Error | undefined>(undefined)
  const [activeFilter, setActiveFilterRaw] = createSignal<DashboardFilter>("all")
  
  const setActiveFilter = setActiveFilterRaw

  const fetchData = async () => {
    setLoading(true)
    setError(undefined)
    
    const program = Effect.gen(function*() {
      const api = yield* ApiClient
      return yield* api.rpc.todos_snapshot()
    }).pipe(Effect.provide(ApiClient.layer))
    
    try {
      const data = await Effect.runPromise(program)
      setSnapshot(() => data)
    } catch (err) {
      setError(() => err instanceof Error ? err : new Error(String(err)))
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
    refetch: fetchData,
    activeFilter,
    setActiveFilter
  }

  const Provider = DashboardContext as unknown as (props: { value: DashboardContextValue; children: JSX.Element }) => JSX.Element

  return (
    <Provider value={value}>
      {props.children}
    </Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return ctx
}

export function useDashboardSnapshot(): Accessor<TodoDashboardSnapshot | undefined> {
  const { snapshot } = useDashboard()
  return snapshot
}

export function useDashboardStats(): Accessor<TodoStats | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.stats
}

export function useDashboardGroups(): Accessor<ReadonlyArray<TodoGroup> | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.groups
}

export function useDashboardTodos(): Accessor<ReadonlyArray<Todo> | undefined> {
  const { snapshot } = useDashboard()
  return () => snapshot()?.todos
}

export function useDashboardFilter(): { activeFilter: Accessor<DashboardFilter>, setActiveFilter: (filter: DashboardFilter) => void } {
  const { activeFilter, setActiveFilter } = useDashboard()
  return { activeFilter, setActiveFilter }
}

// Re-export API utilities
export { runApi, toError, isRpcError, isBusinessError, isNetworkError, createErrorMessage, logError } from "../../api/api-client"
export { TodoDashboardSnapshotSchema, TodoStatsSchema, TodoGroupSchema, TodoSchema } from "../../atoms"
