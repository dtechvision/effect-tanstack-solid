import type { ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type TextTone = "body" | "muted" | "label" | "caption" | "danger"

type TextProps = ParentProps<{
  readonly tone?: TextTone
}>

export function Text(props: TextProps) {
  return <p class={cx("ds-text", `ds-text-${props.tone ?? "body"}`)}>{props.children}</p>
}
