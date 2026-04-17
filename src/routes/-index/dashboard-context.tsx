/**
 * Dashboard context - Effect-native reactive state.
 * 
 * Uses Effect atoms for both server data and local UI state.
 */
import { createContext, useContext, type JSX, type Accessor } from "solid-js"
import * as Effect from "effect/Effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import type { TodoDashboardSnapshot, TodoStats, TodoGroup, Todo, CreateTodoInput, UpdateTodoInput } from "../../api/todo-schema"
import { useAtom, useAtomRefresh, useAtomValue } from "@effect/atom-solid"
import * as Atoms from "../../atoms"
import type { DashboardFilter } from "./dashboard-filters"

// Re-export actions
export const createTodo = Atoms.createTodo
export const updateTodo = Atoms.updateTodo  
export const deleteTodo = Atoms.deleteTodo

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
  // dashboardSnapshotAtom is read-only (runtime.atom creates AsyncResult atoms)
  const snapshotResult = useAtomValue(() => Atoms.dashboardSnapshotAtom)
  
  // activeFilterAtom is writable (Atom.make creates writable atoms)
  const [filterValue, setFilter] = useAtom(() => Atoms.activeFilterAtom)
  
  // Refresh function for the snapshot
  const refreshSnapshot = useAtomRefresh(() => Atoms.dashboardSnapshotAtom)
  
  // Derive loading and error states from Effect AsyncResult
  const loading = () => {
    const s = snapshotResult()
    return AsyncResult.isWaiting(s)
  }
  
  const error = () => {
    const s = snapshotResult()
    if (AsyncResult.isFailure(s)) {
      return new Error(String(s.cause))
    }
    return undefined
  }
  
  // Get raw snapshot value on success
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
