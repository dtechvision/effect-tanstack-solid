import type { ParentProps } from "solid-js"
import { Surface } from "../primitives/Surface"

type CardProps = ParentProps<{
  readonly tone?: "default" | "subtle" | "accent" | "danger"
  readonly as?: "div" | "section" | "article"
}>

export function Card(props: CardProps) {
  return <Surface tone={props.tone} as={props.as}>{props.children}</Surface>
}
