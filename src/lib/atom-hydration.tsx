import type * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { createContext, JSX, onCleanup, useContext } from "solid-js"
import type { DehydratedAtom } from "./atom-utils"

/**
 * Schedules a task for the next tick.
 */
export function scheduleTask(f: () => void): () => void {
  const handle = setTimeout(f, 0) as unknown as number
  return () => clearTimeout(handle)
}

// Create the default registry
const defaultRegistry = AtomRegistry.make({
  scheduleTask,
  defaultIdleTTL: 400,
})

/**
 * Context for the atom registry.
 * In SolidJS, the context object itself is used as a Provider component.
 */
export const RegistryContext = createContext<AtomRegistry.AtomRegistry>(defaultRegistry)

/**
 * Provider component for the atom registry.
 */
export function RegistryProvider(props: {
  readonly children?: JSX.Element
  readonly initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => () => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}) {
  const registry = AtomRegistry.make({
    scheduleTask: props.scheduleTask ?? scheduleTask,
    initialValues: props.initialValues,
    timeoutResolution: props.timeoutResolution,
    defaultIdleTTL: props.defaultIdleTTL,
  })

  onCleanup(() => {
    setTimeout(() => {
      registry.dispose()
    }, 500)
  })

  // In SolidJS, createContext returns a component that can be used directly
  const Provider = RegistryContext as unknown as (props: { value: AtomRegistry.AtomRegistry; children: JSX.Element }) => JSX.Element

  return (
    <Provider value={registry}>
      {props.children}
    </Provider>
  )
}

/**
 * Hook to access the atom registry.
 */
export function useRegistry(): AtomRegistry.AtomRegistry {
  const registry = useContext(RegistryContext)
  if (registry === undefined) {
    throw new Error("Missing RegistryProvider")
  }
  return registry
}

/**
 * Props for the HydrationBoundary component.
 */
export type HydrationBoundaryProps = {
  readonly children: JSX.Element
  readonly state?: Iterable<DehydratedAtom> | undefined
}

/**
 * Hydrates serializable atoms into the current registry before rendering children.
 *
 * @param props - Hydration boundary props.
 * @param props.children - Content to render after hydration.
 * @param props.state - Dehydrated atom payloads.
 * @returns The hydrated subtree.
 */
export function HydrationBoundary(props: HydrationBoundaryProps) {
  const registry = useContext(RegistryContext)

  // Hydrate on mount
  if (props.state) {
    for (const dehydratedAtom of props.state) {
      registry.setSerializable(dehydratedAtom.key, dehydratedAtom.value)
    }
  }

  return <>{props.children}</>
}
