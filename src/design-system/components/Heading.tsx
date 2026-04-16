import type { ParentProps } from "solid-js"
import { Dynamic } from "@solidjs/web"
import { cx } from "../foundation/classes"

type HeadingTone = "page" | "section" | "card"

type HeadingProps = ParentProps<{
  readonly as?: "h1" | "h2" | "h3" | "h4"
  readonly tone?: HeadingTone
}>

export function Heading(props: HeadingProps) {
  return (
    <Dynamic
      component={props.as ?? "h2"}
      class={cx("ds-heading", `ds-heading-${props.tone ?? "section"}`)}
    >
      {props.children}
    </Dynamic>
  )
}
