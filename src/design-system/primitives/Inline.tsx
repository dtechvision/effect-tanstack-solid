import type { ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type InlineGap = "2xs" | "xs" | "s" | "m" | "l"
type InlineAlign = "start" | "center" | "between" | "end"

const gapClass: Record<InlineGap, string> = {
  "2xs": "ds-gap-2xs",
  xs: "ds-gap-xs",
  s: "ds-gap-s",
  m: "ds-gap-m",
  l: "ds-gap-l"
}

const alignClass: Record<InlineAlign, string> = {
  start: "ds-inline-start",
  center: "ds-inline-center",
  between: "ds-inline-between",
  end: "ds-inline-end"
}

type InlineProps = ParentProps<{
  readonly gap?: InlineGap
  readonly align?: InlineAlign
  readonly wrap?: boolean
}>

export function Inline(props: InlineProps) {
  return (
    <div
      class={cx(
        "ds-inline",
        gapClass[props.gap ?? "s"],
        alignClass[props.align ?? "start"],
        props.wrap ? "ds-inline-wrap" : ""
      )}
    >
      {props.children}
    </div>
  )
}
