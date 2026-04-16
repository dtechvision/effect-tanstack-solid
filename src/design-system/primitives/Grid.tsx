import type { JSX, ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type GridLayout = "stats" | "dashboard" | "form"

const layoutClass: Record<GridLayout, string> = {
  stats: "ds-grid-stats",
  dashboard: "ds-grid-dashboard",
  form: "ds-grid-form"
}

type GridProps = ParentProps<{
  readonly layout: GridLayout
}>

export function Grid(props: GridProps) {
  const className = cx("ds-grid", layoutClass[props.layout])
  return <div class={className}>{props.children}</div>
}
