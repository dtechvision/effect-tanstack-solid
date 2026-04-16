import type { ParentProps, JSX } from "solid-js"
import { Dynamic } from "@solidjs/web"
import { cx } from "../foundation/classes"

type SurfaceTone = "default" | "subtle" | "accent" | "danger"

const toneClass: Record<SurfaceTone, string> = {
  default: "ds-surface-default",
  subtle: "ds-surface-subtle",
  accent: "ds-surface-accent",
  danger: "ds-surface-danger"
}

type SurfaceProps = ParentProps<{
  readonly tone?: SurfaceTone
  readonly as?: "div" | "section" | "article"
}>

export function Surface(props: SurfaceProps) {
  return (
    <Dynamic
      component={props.as ?? "div"}
      class={cx("ds-surface", toneClass[props.tone ?? "default"])}
    >
      {props.children}
    </Dynamic>
  )
}
