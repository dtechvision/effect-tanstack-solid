import type { ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type StackGap = "2xs" | "xs" | "s" | "m" | "l" | "xl"

const gapClass: Record<StackGap, string> = {
  "2xs": "ds-gap-2xs",
  xs: "ds-gap-xs",
  s: "ds-gap-s",
  m: "ds-gap-m",
  l: "ds-gap-l",
  xl: "ds-gap-xl"
}

type StackProps = ParentProps<{
  readonly gap?: StackGap
}>

export function Stack(props: StackProps) {
  return <div class={cx("ds-stack", gapClass[props.gap ?? "m"])}>{props.children}</div>
}
