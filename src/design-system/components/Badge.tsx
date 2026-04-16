import type { ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type BadgeTone = "neutral" | "accent" | "danger" | "success"

type BadgeProps = ParentProps<{
  readonly tone?: BadgeTone
}>

export function Badge(props: BadgeProps) {
  return <span class={cx("ds-badge", `ds-badge-${props.tone ?? "neutral"}`)}>{props.children}</span>
}
