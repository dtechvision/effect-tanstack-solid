/**
 * Dashboard context - Effect-native reactive state.
 */
import { createContext, useContext, type JSX, type Accessor } from "solid-js"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import type { TodoDashboardSnapshot, TodoStats, TodoGroup, Todo, CreateTodoInput, UpdateTodoInput } from "../../api/todo-schema"
import { useAtom, useAtomRefresh, useAtomInitialValues, useAtomValue } from "@effect/atom-solid"
import * as Atoms from "../../atoms"
import type { DashboardFilter } from "./dashboard-filters"

export const createTodo = Atoms.createTodo
export const updateTodo = Atoms.updateTodo  
export const deleteTodo = Atoms.deleteTodo

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
  // Pre-seed with Initial state to prevent null before atom mounts.
  // useAtomValue initializes to null internally; AsyncResult guards crash on null.
  useAtomInitialValues([[Atoms.dashboardSnapshotAtom, AsyncResult.initial(true)]])
  
  const snapshotResult = useAtomValue(() => Atoms.dashboardSnapshotAtom)
  const [filterValue, setFilter] = useAtom(() => Atoms.activeFilterAtom)
  const refreshSnapshot = useAtomRefresh(() => Atoms.dashboardSnapshotAtom)
  
  const loading = () => AsyncResult.isWaiting(snapshotResult())
  const error = () => {
    const s = snapshotResult()
    return AsyncResult.isFailure(s) ? new Error(String(s.cause)) : undefined
  }
  const getSnapshot = () => {
    const s = snapshotResult()
    return AsyncResult.isSuccess(s) ? s.value : undefined
  }

  const value: DashboardContextValue = {
    snapshot: getSnapshot,
    loading,
    error,
    refetch: refreshSnapshot,
    activeFilter: filterValue,
    setActiveFilter: setFilter
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
